export type FirewallEngine = 'ufw' | 'firewalld' | 'iptables';
export type FirewallRuleKind = 'port' | 'whitelist' | 'ratelimit' | 'forward';
export type FirewallAction = 'allow' | 'deny' | 'reject';
export type FirewallProtocol = 'tcp' | 'udp' | 'both';
export type RateUnit = 'sec' | 'min' | 'hour';
export type IpFamily = 'any' | 'ipv4' | 'ipv6';

export interface FirewallRule {
  id: string;
  enabled: boolean;
  kind: FirewallRuleKind;
  action: FirewallAction;
  protocol: FirewallProtocol;
  /** Port or range: e.g. "22", "80", "8000:8100" or "8000-8100" */
  port: string;
  /** Optional IPv4/IPv6 address or CIDR */
  source: string;
  /** Target port for 'forward' rules */
  toPort: string;
  /** Optional target IP for 'forward' rules (blank = local redirect) */
  toAddr: string;
  /** Optional inbound interface (e.g. eth0) */
  iface: string;
  /** Rate limit count */
  rateCount: number;
  /** Rate limit window unit */
  rateUnit: RateUnit;
  /** Rate limit burst (for iptables / advanced) */
  rateBurst: number;
  comment: string;
}

export interface FirewallConfig {
  engine: FirewallEngine;
  defaultIncoming: 'drop' | 'reject' | 'allow';
  defaultOutgoing: 'allow' | 'drop';
  zone: string;
  defaultIface: string;
  sshPort: number;
  allowLoopback: boolean;
  allowEstablished: boolean;
  allowPing: boolean;
  includeComments: boolean;
  includeRollbackHint: boolean;
  rules: FirewallRule[];
}

export interface FirewallAuditIssue {
  level: 'error' | 'warning' | 'info';
  code: string;
  ruleId?: string;
  messageZh: string;
  messageEn: string;
  fixable?: 'allow-ssh';
}

export interface FirewallCommandItem {
  id: string;
  labelZh: string;
  labelEn: string;
  command: string;
}

let ruleSeq = 1;
export function createRuleId(): string {
  return `fw-rule-${Date.now()}-${ruleSeq++}`;
}

export function createEmptyRule(kind: FirewallRuleKind = 'port'): FirewallRule {
  const base: FirewallRule = {
    id: createRuleId(),
    enabled: true,
    kind,
    action: 'allow',
    protocol: 'tcp',
    port: kind === 'whitelist' ? '' : kind === 'ratelimit' ? '22' : '8080',
    source: kind === 'whitelist' ? '10.0.0.0/8' : '',
    toPort: kind === 'forward' ? '8080' : '',
    toAddr: '',
    iface: '',
    rateCount: 6,
    rateUnit: 'min',
    rateBurst: 10,
    comment: '',
  };
  if (kind === 'forward') {
    base.port = '80';
  }
  return base;
}

const IPV4_PART = '(25[0-5]|2[0-4]\\d|1\\d\\d|[1-9]?\\d)';
const IPV4_REGEX = new RegExp(`^${IPV4_PART}(\\.${IPV4_PART}){3}$`);

export function detectIpFamily(raw: string): IpFamily | 'invalid' {
  const value = raw.trim();
  if (!value) return 'any';

  const slashIdx = value.indexOf('/');
  const ip = slashIdx >= 0 ? value.slice(0, slashIdx) : value;
  const prefixStr = slashIdx >= 0 ? value.slice(slashIdx + 1) : null;

  if (IPV4_REGEX.test(ip)) {
    if (prefixStr === null) return 'ipv4';
    if (!/^\d+$/.test(prefixStr)) return 'invalid';
    const prefix = Number(prefixStr);
    return prefix >= 0 && prefix <= 32 ? 'ipv4' : 'invalid';
  }

  // Pragmatic IPv6 check supporting :: compression
  if (ip.includes(':') && /^[0-9a-fA-F:]+$/.test(ip)) {
    const doubleColonCount = (ip.match(/::/g) || []).length;
    if (doubleColonCount > 1) return 'invalid';
    const groups = ip.split(':').filter((g) => g.length > 0);
    if (groups.some((g) => g.length > 4)) return 'invalid';
    if (doubleColonCount === 0 && ip.split(':').length !== 8) return 'invalid';
    if (doubleColonCount === 1 && groups.length > 7) return 'invalid';
    if (prefixStr === null) return 'ipv6';
    if (!/^\d+$/.test(prefixStr)) return 'invalid';
    const prefix = Number(prefixStr);
    return prefix >= 0 && prefix <= 128 ? 'ipv6' : 'invalid';
  }

  return 'invalid';
}

export interface ParsedPortSpec {
  valid: boolean;
  isEmpty: boolean;
  isRange: boolean;
  start: number;
  end: number;
}

export function parsePortSpec(raw: string): ParsedPortSpec {
  const value = raw.trim();
  if (!value) {
    return { valid: false, isEmpty: true, isRange: false, start: 0, end: 0 };
  }

  const singleMatch = /^(\d+)$/.exec(value);
  if (singleMatch) {
    const p = Number(singleMatch[1]);
    const valid = Number.isInteger(p) && p >= 1 && p <= 65535;
    return { valid, isEmpty: false, isRange: false, start: p, end: p };
  }

  const rangeMatch = /^(\d+)\s*[:-]\s*(\d+)$/.exec(value);
  if (rangeMatch) {
    const start = Number(rangeMatch[1]);
    const end = Number(rangeMatch[2]);
    const valid =
      Number.isInteger(start) &&
      Number.isInteger(end) &&
      start >= 1 &&
      end <= 65535 &&
      start < end;
    return { valid, isEmpty: false, isRange: true, start, end };
  }

  return { valid: false, isEmpty: false, isRange: false, start: 0, end: 0 };
}

function formatPortForEngine(spec: ParsedPortSpec, engine: FirewallEngine): string {
  if (!spec.valid) return '';
  if (!spec.isRange) return String(spec.start);
  return engine === 'firewalld'
    ? `${spec.start}-${spec.end}`
    : `${spec.start}:${spec.end}`;
}

function expandProtocols(proto: FirewallProtocol): ('tcp' | 'udp')[] {
  return proto === 'both' ? ['tcp', 'udp'] : [proto];
}

function ruleCoversPort(rule: FirewallRule, targetPort: number): boolean {
  if (!rule.enabled) return false;
  if (rule.kind === 'forward') return false;
  if (rule.protocol === 'udp') return false;

  const trimmedPort = rule.port.trim();
  if (!trimmedPort) {
    // Whitelist rule with empty port covers all ports
    return rule.kind === 'whitelist';
  }

  const parsed = parsePortSpec(trimmedPort);
  return parsed.valid && targetPort >= parsed.start && targetPort <= parsed.end;
}

export function isSshPortProtected(config: FirewallConfig): {
  protected: boolean;
  explicitlyBlocked: boolean;
  restrictedSourceOnly: boolean;
  hasAnyAllow: boolean;
} {
  const sshPort = Number(config.sshPort) || 22;
  const enabledRules = config.rules.filter((r) => r.enabled);

  const explicitlyBlocked = enabledRules.some(
    (r) =>
      (r.action === 'deny' || r.action === 'reject') &&
      ruleCoversPort(r, sshPort) &&
      !r.source.trim()
  );

  const allowRules = enabledRules.filter(
    (r) =>
      (r.action === 'allow' || r.kind === 'ratelimit') &&
      ruleCoversPort(r, sshPort)
  );

  const hasAnyAllow = allowRules.length > 0;
  const hasUnrestrictedAllow = allowRules.some((r) => !r.source.trim());
  const restrictedSourceOnly = hasAnyAllow && !hasUnrestrictedAllow;

  if (explicitlyBlocked) {
    return {
      protected: false,
      explicitlyBlocked: true,
      restrictedSourceOnly,
      hasAnyAllow,
    };
  }

  if (config.defaultIncoming === 'allow') {
    return {
      protected: true,
      explicitlyBlocked: false,
      restrictedSourceOnly: false,
      hasAnyAllow: true,
    };
  }

  return {
    protected: hasAnyAllow,
    explicitlyBlocked: false,
    restrictedSourceOnly,
    hasAnyAllow,
  };
}

export function ensureSshAllowRule(config: FirewallConfig): FirewallConfig {
  const sshPort = Math.min(65535, Math.max(1, Math.round(Number(config.sshPort) || 22)));
  const cleanedRules = config.rules.filter(
    (r) =>
      !(
        r.enabled &&
        (r.action === 'deny' || r.action === 'reject') &&
        ruleCoversPort(r, sshPort) &&
        !r.source.trim()
      )
  );

  const alreadyAllowed = cleanedRules.some(
    (r) => r.enabled && (r.action === 'allow' || r.kind === 'ratelimit') && ruleCoversPort(r, sshPort)
  );

  if (alreadyAllowed) {
    return { ...config, rules: cleanedRules };
  }

  const sshRule: FirewallRule = {
    id: createRuleId(),
    enabled: true,
    kind: 'port',
    action: 'allow',
    protocol: 'tcp',
    port: String(sshPort),
    source: '',
    toPort: '',
    toAddr: '',
    iface: '',
    rateCount: 6,
    rateUnit: 'min',
    rateBurst: 10,
    comment: 'Keep SSH access open',
  };

  return {
    ...config,
    rules: [sshRule, ...cleanedRules],
  };
}

const SENSITIVE_DB_PORTS = new Set([3306, 5432, 6379, 27017, 9200, 11211]);

export function auditFirewallConfig(config: FirewallConfig): FirewallAuditIssue[] {
  const issues: FirewallAuditIssue[] = [];
  const sshPort = Number(config.sshPort) || 22;

  if (!Number.isInteger(sshPort) || sshPort < 1 || sshPort > 65535) {
    issues.push({
      level: 'error',
      code: 'invalid-ssh-port',
      messageZh: 'SSH 保护端口必须是 1 - 65535 之间的整数。',
      messageEn: 'SSH guard port must be an integer between 1 and 65535.',
    });
  } else {
    const sshStatus = isSshPortProtected(config);
    if (sshStatus.explicitlyBlocked) {
      issues.push({
        level: 'error',
        code: 'ssh-blocked',
        fixable: 'allow-ssh',
        messageZh: `检测到全网拒绝 SSH 端口 (${sshPort}/tcp) 的规则，启用防火墙后将立即断开远程连接！`,
        messageEn: `A rule explicitly blocks SSH port ${sshPort}/tcp from all sources — enabling will lock you out!`,
      });
    } else if (!sshStatus.protected) {
      issues.push({
        level: 'error',
        code: 'ssh-lockout',
        fixable: 'allow-ssh',
        messageZh: `默认入站策略为 ${config.defaultIncoming.toUpperCase()}，但未检测到放行 SSH (${sshPort}/tcp) 的规则，应用后可能导致 SSH 断连失联！`,
        messageEn: `Default incoming policy is ${config.defaultIncoming.toUpperCase()} without an enabled rule for SSH (${sshPort}/tcp). You may lose remote access!`,
      });
    } else if (sshStatus.restrictedSourceOnly) {
      issues.push({
        level: 'info',
        code: 'ssh-source-restricted',
        messageZh: `SSH (${sshPort}/tcp) 仅对指定来源 IP/CIDR 放行，请确认你当前操作终端 IP 在白名单内。`,
        messageEn: `SSH (${sshPort}/tcp) is allowed only from specific source IP/CIDR(s). Confirm your client IP is included.`,
      });
    }
  }

  const enabledRules = config.rules.filter((r) => r.enabled);
  let hasForwardRule = false;
  let hasIpv6Source = false;

  for (const rule of enabledRules) {
    const ifaceClean = rule.iface.trim();
    if (ifaceClean && !/^[a-zA-Z0-9_.:-]+$/.test(ifaceClean)) {
      issues.push({
        level: 'error',
        code: 'invalid-iface',
        ruleId: rule.id,
        messageZh: `网卡名称 "${ifaceClean}" 包含非法字符。`,
        messageEn: `Interface name "${ifaceClean}" contains invalid characters.`,
      });
    }

    const srcFamily = detectIpFamily(rule.source);
    if (srcFamily === 'invalid') {
      issues.push({
        level: 'error',
        code: 'invalid-source',
        ruleId: rule.id,
        messageZh: `来源 IP/CIDR "${rule.source}" 格式无效（示例：192.168.1.0/24 或 2001:db8::/32）。`,
        messageEn: `Invalid source IP/CIDR "${rule.source}" (e.g. 192.168.1.0/24 or 2001:db8::/32).`,
      });
    } else if (srcFamily === 'ipv6') {
      hasIpv6Source = true;
    }

    if (rule.kind === 'whitelist' && !rule.source.trim()) {
      issues.push({
        level: 'error',
        code: 'empty-whitelist-source',
        ruleId: rule.id,
        messageZh: 'IP/CIDR 白名单规则必须填写来源 IP 或网段。',
        messageEn: 'Whitelist/block rule requires a source IP or CIDR.',
      });
    }

    if (rule.kind === 'whitelist') {
      if (rule.port.trim()) {
        const parsed = parsePortSpec(rule.port);
        if (!parsed.valid) {
          issues.push({
            level: 'error',
            code: 'invalid-port',
            ruleId: rule.id,
            messageZh: `端口 "${rule.port}" 无效，请填写 1-65535 或范围如 8000:8100。`,
            messageEn: `Invalid port "${rule.port}". Use 1-65535 or a range such as 8000:8100.`,
          });
        }
      }
    } else {
      const parsed = parsePortSpec(rule.port);
      if (!parsed.valid) {
        issues.push({
          level: 'error',
          code: 'invalid-port',
          ruleId: rule.id,
          messageZh: `端口 "${rule.port || '(空)'}" 无效，请填写 1-65535 或有效端口范围。`,
          messageEn: `Invalid port "${rule.port || '(empty)'}". Enter 1-65535 or a valid range.`,
        });
      } else if (
        rule.kind === 'port' &&
        rule.action === 'allow' &&
        !rule.source.trim() &&
        !parsed.isRange &&
        SENSITIVE_DB_PORTS.has(parsed.start)
      ) {
        issues.push({
          level: 'warning',
          code: 'public-db-port',
          ruleId: rule.id,
          messageZh: `数据库/缓存敏感端口 ${parsed.start} 对所有来源 (0.0.0.0/0) 开放，建议限定内网 IP/CIDR 白名单。`,
          messageEn: `Database/cache port ${parsed.start} is exposed to all sources. Consider restricting by source IP/CIDR.`,
        });
      }
    }

    if (rule.kind === 'ratelimit') {
      if (!Number.isFinite(rule.rateCount) || rule.rateCount <= 0) {
        issues.push({
          level: 'error',
          code: 'invalid-rate',
          ruleId: rule.id,
          messageZh: '限速阈值次数必须大于 0。',
          messageEn: 'Rate limit count must be greater than 0.',
        });
      }
      if (config.engine === 'ufw' && rule.protocol === 'both' && rule.source.trim()) {
        // valid, ufw handles proto any or split
      }
    }

    if (rule.kind === 'forward') {
      hasForwardRule = true;
      const toPortParsed = parsePortSpec(rule.toPort);
      if (!toPortParsed.valid || toPortParsed.isRange) {
        issues.push({
          level: 'error',
          code: 'invalid-forward-port',
          ruleId: rule.id,
          messageZh: `转发目标端口 "${rule.toPort || '(空)'}" 必须是 1-65535 的单个端口。`,
          messageEn: `Forward target port "${rule.toPort || '(empty)'}" must be a single port (1-65535).`,
        });
      }
      const toAddrTrimmed = rule.toAddr.trim();
      if (toAddrTrimmed) {
        const dstFamily = detectIpFamily(toAddrTrimmed);
        if (dstFamily === 'invalid' || toAddrTrimmed.includes('/')) {
          issues.push({
            level: 'error',
            code: 'invalid-forward-addr',
            ruleId: rule.id,
            messageZh: `转发目标 IP "${toAddrTrimmed}" 格式无效（不能带掩码）。`,
            messageEn: `Invalid forward target IP "${toAddrTrimmed}" (single IP without CIDR prefix).`,
          });
        }
      }
    }
  }

  if (hasForwardRule && config.engine === 'ufw') {
    issues.push({
      level: 'info',
      code: 'ufw-forward-note',
      messageZh: 'UFW 端口转发需配合内核 ip_forward=1 与 /etc/ufw/before.rules 的 *nat 表规则，脚本已附带完整片段。',
      messageEn: 'UFW port forwarding requires net.ipv4.ip_forward=1 and *nat rules in /etc/ufw/before.rules (included in output).',
    });
  }

  if (hasIpv6Source && config.engine === 'iptables') {
    issues.push({
      level: 'info',
      code: 'iptables-ipv6-note',
      messageZh: '检测到 IPv6 来源规则，iptables 模式下已自动对应生成 ip6tables 命令。',
      messageEn: 'IPv6 source CIDR detected — ip6tables commands are generated alongside iptables.',
    });
  }

  return issues;
}

function sanitizeComment(raw: string): string {
  return raw.replace(/['"`\r\n]/g, ' ').trim();
}

function generateUfwScript(config: FirewallConfig): string {
  const lines: string[] = [];
  const enabledRules = config.rules.filter((r) => r.enabled);
  const forwardRules = enabledRules.filter((r) => r.kind === 'forward');
  const normalRules = enabledRules.filter((r) => r.kind !== 'forward');

  if (config.includeComments) {
    lines.push('#!/usr/bin/env bash');
    lines.push('# Generated by DevCrate - Linux Firewall Rule Generator (UFW)');
    lines.push(`# SSH Guard Port: ${config.sshPort}/tcp`);
    lines.push('');
  }

  lines.push('# 1. Set default baseline policies');
  lines.push(`sudo ufw default ${config.defaultIncoming} incoming`);
  lines.push(`sudo ufw default ${config.defaultOutgoing} outgoing`);
  lines.push('');

  if (normalRules.length > 0) {
    lines.push('# 2. Configure allow / block / whitelist / rate-limit rules');
  }

  for (const rule of normalRules) {
    const comment = sanitizeComment(rule.comment);
    const commentFlag = comment ? ` comment '${comment}'` : '';
    const iface = rule.iface.trim() || config.defaultIface.trim();
    const ifacePart = iface ? `in on ${iface} ` : '';
    const src = rule.source.trim();
    const verb =
      rule.kind === 'ratelimit'
        ? 'limit'
        : rule.action === 'allow'
          ? 'allow'
          : rule.action === 'deny'
            ? 'deny'
            : 'reject';

    if (rule.kind === 'whitelist') {
      if (!src) continue;
      const parsedPort = rule.port.trim() ? parsePortSpec(rule.port) : null;
      if (parsedPort && parsedPort.valid) {
        const portExpr = formatPortForEngine(parsedPort, 'ufw');
        if (rule.protocol === 'both') {
          for (const p of ['tcp', 'udp']) {
            lines.push(`sudo ufw ${verb} ${ifacePart}from ${src} to any port ${portExpr} proto ${p}${commentFlag}`.replace(/\s+/g, ' ').trim());
          }
        } else {
          lines.push(`sudo ufw ${verb} ${ifacePart}from ${src} to any port ${portExpr} proto ${rule.protocol}${commentFlag}`.replace(/\s+/g, ' ').trim());
        }
      } else {
        lines.push(`sudo ufw ${verb} ${ifacePart}from ${src}${commentFlag}`.replace(/\s+/g, ' ').trim());
      }
      continue;
    }

    const parsedPort = parsePortSpec(rule.port);
    if (!parsedPort.valid) continue;
    const portExpr = formatPortForEngine(parsedPort, 'ufw');

    if (rule.kind === 'ratelimit' && config.includeComments) {
      lines.push(`# Note: UFW 'limit' defaults to 6 connections / 30s (requested ${rule.rateCount}/${rule.rateUnit})`);
    }

    if (!src && !iface && !parsedPort.isRange) {
      if (rule.protocol === 'both') {
        lines.push(`sudo ufw ${verb} ${portExpr}/tcp${commentFlag}`);
        lines.push(`sudo ufw ${verb} ${portExpr}/udp${commentFlag}`);
      } else {
        lines.push(`sudo ufw ${verb} ${portExpr}/${rule.protocol}${commentFlag}`);
      }
    } else {
      const fromPart = src ? `from ${src} ` : 'from any ';
      for (const p of expandProtocols(rule.protocol)) {
        lines.push(`sudo ufw ${verb} ${ifacePart}${fromPart}to any port ${portExpr} proto ${p}${commentFlag}`.replace(/\s+/g, ' ').trim());
      }
    }
  }

  if (forwardRules.length > 0) {
    lines.push('');
    lines.push('# 3. Port Forwarding / NAT (requires kernel forwarding + /etc/ufw/before.rules)');
    lines.push('sudo sysctl -w net.ipv4.ip_forward=1');
    lines.push('# Ensure /etc/default/ufw has: DEFAULT_FORWARD_POLICY="ACCEPT"');

    for (const rule of forwardRules) {
      const parsedFrom = parsePortSpec(rule.port);
      const parsedTo = parsePortSpec(rule.toPort);
      if (!parsedFrom.valid || !parsedTo.valid) continue;
      const fromExpr = formatPortForEngine(parsedFrom, 'ufw');
      const toExpr = formatPortForEngine(parsedTo, 'ufw');
      const iface = rule.iface.trim() || config.defaultIface.trim() || 'eth0';
      const toAddr = rule.toAddr.trim();

      for (const p of expandProtocols(rule.protocol)) {
        if (toAddr) {
          lines.push(`sudo ufw route allow in on ${iface} proto ${p} to ${toAddr} port ${toExpr}`);
        } else {
          lines.push(`sudo ufw allow ${toExpr}/${p}`);
        }
      }

      if (config.includeComments) {
        lines.push('# Add inside *nat section of /etc/ufw/before.rules (before COMMIT):');
        for (const p of expandProtocols(rule.protocol)) {
          const srcFlag = rule.source.trim() ? `-s ${rule.source.trim()} ` : '';
          if (toAddr) {
            lines.push(`# -A PREROUTING -i ${iface} ${srcFlag}-p ${p} --dport ${fromExpr} -j DNAT --to-destination ${toAddr}:${toExpr}`);
            lines.push(`# -A POSTROUTING -d ${toAddr} -p ${p} --dport ${toExpr} -j MASQUERADE`);
          } else {
            lines.push(`# -A PREROUTING -i ${iface} ${srcFlag}-p ${p} --dport ${fromExpr} -j REDIRECT --to-port ${toExpr}`);
          }
        }
      }
    }
  }

  lines.push('');
  lines.push('# Enable UFW (run after confirming SSH port rule above!)');
  lines.push('sudo ufw --force enable');
  lines.push('sudo ufw status numbered');

  if (config.includeRollbackHint) {
    lines.push('');
    lines.push('# Remote VPS safety tip: schedule automatic disable in 2 mins while testing:');
    lines.push('# echo "sudo ufw disable" | at now + 2 minutes');
  }

  return lines.join('\n');
}

function generateFirewalldScript(config: FirewallConfig): string {
  const lines: string[] = [];
  const zone = config.zone.trim() || 'public';
  const enabledRules = config.rules.filter((r) => r.enabled);

  if (config.includeComments) {
    lines.push('#!/usr/bin/env bash');
    lines.push('# Generated by DevCrate - Linux Firewall Rule Generator (firewalld)');
    lines.push(`# Target Zone: ${zone} | SSH Guard Port: ${config.sshPort}/tcp`);
    lines.push('');
  }

  lines.push('sudo systemctl enable --now firewalld');

  if (config.defaultIncoming === 'drop') {
    lines.push(`sudo firewall-cmd --permanent --zone=${zone} --set-target=DROP`);
  } else if (config.defaultIncoming === 'reject') {
    lines.push(`sudo firewall-cmd --permanent --zone=${zone} --set-target=%%REJECT%%`);
  } else {
    lines.push(`sudo firewall-cmd --permanent --zone=${zone} --set-target=ACCEPT`);
  }

  if (config.defaultIface.trim()) {
    lines.push(`sudo firewall-cmd --permanent --zone=${zone} --change-interface=${config.defaultIface.trim()}`);
  }
  lines.push('');

  const firewalldUnitMap: Record<RateUnit, string> = {
    sec: 's',
    min: 'm',
    hour: 'h',
  };

  for (const rule of enabledRules) {
    const comment = sanitizeComment(rule.comment);
    if (comment && config.includeComments) {
      lines.push(`# ${comment}`);
    }

    const src = rule.source.trim();
    const srcFamily = detectIpFamily(src);
    const richFamily = srcFamily === 'ipv6' ? 'ipv6' : 'ipv4';
    const actionWord = rule.action === 'allow' ? 'accept' : rule.action === 'deny' ? 'drop' : 'reject';

    if (rule.kind === 'port') {
      const parsedPort = parsePortSpec(rule.port);
      if (!parsedPort.valid) continue;
      const portExpr = formatPortForEngine(parsedPort, 'firewalld');

      if (!src && rule.action === 'allow') {
        for (const p of expandProtocols(rule.protocol)) {
          lines.push(`sudo firewall-cmd --permanent --zone=${zone} --add-port=${portExpr}/${p}`);
        }
      } else {
        for (const p of expandProtocols(rule.protocol)) {
          const srcPart = src ? ` source address="${src}"` : '';
          lines.push(
            `sudo firewall-cmd --permanent --zone=${zone} --add-rich-rule='rule family="${richFamily}"${srcPart} port port="${portExpr}" protocol="${p}" ${actionWord}'`
          );
        }
      }
      continue;
    }

    if (rule.kind === 'whitelist') {
      if (!src) continue;
      const parsedPort = rule.port.trim() ? parsePortSpec(rule.port) : null;
      if (parsedPort && parsedPort.valid) {
        const portExpr = formatPortForEngine(parsedPort, 'firewalld');
        for (const p of expandProtocols(rule.protocol)) {
          lines.push(
            `sudo firewall-cmd --permanent --zone=${zone} --add-rich-rule='rule family="${richFamily}" source address="${src}" port port="${portExpr}" protocol="${p}" ${actionWord}'`
          );
        }
      } else {
        lines.push(
          `sudo firewall-cmd --permanent --zone=${zone} --add-rich-rule='rule family="${richFamily}" source address="${src}" ${actionWord}'`
        );
      }
      continue;
    }

    if (rule.kind === 'ratelimit') {
      const parsedPort = parsePortSpec(rule.port);
      if (!parsedPort.valid) continue;
      const portExpr = formatPortForEngine(parsedPort, 'firewalld');
      const limitVal = `${Math.max(1, Math.round(rule.rateCount))}/${firewalldUnitMap[rule.rateUnit]}`;
      const srcPart = src ? ` source address="${src}"` : '';
      for (const p of expandProtocols(rule.protocol)) {
        lines.push(
          `sudo firewall-cmd --permanent --zone=${zone} --add-rich-rule='rule family="${richFamily}"${srcPart} port port="${portExpr}" protocol="${p}" accept limit value="${limitVal}"'`
        );
      }
      continue;
    }

    if (rule.kind === 'forward') {
      const parsedFrom = parsePortSpec(rule.port);
      const parsedTo = parsePortSpec(rule.toPort);
      if (!parsedFrom.valid || !parsedTo.valid) continue;
      const fromExpr = formatPortForEngine(parsedFrom, 'firewalld');
      const toExpr = formatPortForEngine(parsedTo, 'firewalld');
      const toAddr = rule.toAddr.trim();

      if (toAddr) {
        lines.push(`sudo firewall-cmd --permanent --zone=${zone} --add-masquerade`);
      }
      for (const p of expandProtocols(rule.protocol)) {
        const toAddrFlag = toAddr ? `:toaddr=${toAddr}` : '';
        lines.push(
          `sudo firewall-cmd --permanent --zone=${zone} --add-forward-port=port=${fromExpr}:proto=${p}:toport=${toExpr}${toAddrFlag}`
        );
      }
    }
  }

  lines.push('');
  lines.push('# Reload firewalld to apply permanent rules');
  lines.push('sudo firewall-cmd --reload');
  lines.push(`sudo firewall-cmd --zone=${zone} --list-all`);

  if (config.includeRollbackHint) {
    lines.push('');
    lines.push('# Tip: Run without --permanent for temporary rules that reset on --reload / reboot');
  }

  return lines.join('\n');
}

function generateIptablesScript(config: FirewallConfig): string {
  const lines: string[] = [];
  const enabledRules = config.rules.filter((r) => r.enabled);
  const forwardRules = enabledRules.filter((r) => r.kind === 'forward');
  const filterRules = enabledRules.filter((r) => r.kind !== 'forward');

  if (config.includeComments) {
    lines.push('#!/usr/bin/env bash');
    lines.push('# Generated by DevCrate - Linux Firewall Rule Generator (iptables)');
    lines.push(`# SSH Guard Port: ${config.sshPort}/tcp`);
    lines.push('');
  }

  if (config.includeRollbackHint) {
    lines.push('# Save a backup before modifying rules:');
    lines.push('sudo iptables-save > /tmp/iptables.backup.$(date +%s)');
    lines.push('');
  }

  lines.push('# 1. Baseline stateful rules (loopback & existing connections)');
  if (config.allowLoopback) {
    lines.push('sudo iptables -A INPUT -i lo -j ACCEPT');
  }
  if (config.allowEstablished) {
    lines.push('sudo iptables -A INPUT -m conntrack --ctstate ESTABLISHED,RELATED -j ACCEPT');
  }
  if (config.allowPing) {
    lines.push('sudo iptables -A INPUT -p icmp --icmp-type echo-request -j ACCEPT');
  }

  const targetAction = (action: FirewallAction): string => {
    if (action === 'allow') return 'ACCEPT';
    if (action === 'deny') return 'DROP';
    return 'REJECT';
  };

  if (filterRules.length > 0) {
    lines.push('');
    lines.push('# 2. Port access, IP/CIDR whitelist & rate-limit rules');
  }

  for (const rule of filterRules) {
    const comment = sanitizeComment(rule.comment);
    const commentFlag = comment ? ` -m comment --comment "${comment}"` : '';
    const iface = rule.iface.trim() || config.defaultIface.trim();
    const ifaceFlag = iface ? ` -i ${iface}` : '';
    const src = rule.source.trim();
    const srcFamily = detectIpFamily(src);
    const bin = srcFamily === 'ipv6' ? 'ip6tables' : 'iptables';
    const srcFlag = src ? ` -s ${src}` : '';

    if (rule.kind === 'whitelist') {
      if (!src) continue;
      const parsedPort = rule.port.trim() ? parsePortSpec(rule.port) : null;
      const action = targetAction(rule.action);
      if (parsedPort && parsedPort.valid) {
        const portExpr = formatPortForEngine(parsedPort, 'iptables');
        for (const p of expandProtocols(rule.protocol)) {
          lines.push(`sudo ${bin} -A INPUT${ifaceFlag}${srcFlag} -p ${p} --dport ${portExpr} -j ${action}${commentFlag}`);
        }
      } else {
        lines.push(`sudo ${bin} -A INPUT${ifaceFlag}${srcFlag} -j ${action}${commentFlag}`);
      }
      continue;
    }

    const parsedPort = parsePortSpec(rule.port);
    if (!parsedPort.valid) continue;
    const portExpr = formatPortForEngine(parsedPort, 'iptables');

    if (rule.kind === 'port') {
      const action = targetAction(rule.action);
      for (const p of expandProtocols(rule.protocol)) {
        lines.push(`sudo ${bin} -A INPUT${ifaceFlag}${srcFlag} -p ${p} --dport ${portExpr} -j ${action}${commentFlag}`);
      }
      continue;
    }

    if (rule.kind === 'ratelimit') {
      const unitMap: Record<RateUnit, string> = {
        sec: 'sec',
        min: 'min',
        hour: 'hour',
      };
      const count = Math.max(1, Math.round(rule.rateCount));
      const burst = Math.max(count, Math.round(rule.rateBurst || count));
      for (const p of expandProtocols(rule.protocol)) {
        lines.push(
          `sudo ${bin} -A INPUT${ifaceFlag}${srcFlag} -p ${p} --dport ${portExpr} -m limit --limit ${count}/${unitMap[rule.rateUnit]} --limit-burst ${burst} -j ACCEPT${commentFlag}`
        );
      }
    }
  }

  if (forwardRules.length > 0) {
    lines.push('');
    lines.push('# 3. Port Forwarding / NAT (nat PREROUTING + FORWARD)');
    lines.push('sudo sysctl -w net.ipv4.ip_forward=1');

    for (const rule of forwardRules) {
      const parsedFrom = parsePortSpec(rule.port);
      const parsedTo = parsePortSpec(rule.toPort);
      if (!parsedFrom.valid || !parsedTo.valid) continue;
      const fromExpr = formatPortForEngine(parsedFrom, 'iptables');
      const toExpr = formatPortForEngine(parsedTo, 'iptables');
      const iface = rule.iface.trim() || config.defaultIface.trim();
      const ifaceFlag = iface ? ` -i ${iface}` : '';
      const src = rule.source.trim();
      const srcFlag = src ? ` -s ${src}` : '';
      const toAddr = rule.toAddr.trim();

      for (const p of expandProtocols(rule.protocol)) {
        if (toAddr) {
          lines.push(
            `sudo iptables -t nat -A PREROUTING${ifaceFlag}${srcFlag} -p ${p} --dport ${fromExpr} -j DNAT --to-destination ${toAddr}:${toExpr}`
          );
          lines.push(
            `sudo iptables -A FORWARD -p ${p} -d ${toAddr} --dport ${toExpr} -m conntrack --ctstate NEW,ESTABLISHED,RELATED -j ACCEPT`
          );
          lines.push(
            `sudo iptables -t nat -A POSTROUTING -d ${toAddr} -p ${p} --dport ${toExpr} -j MASQUERADE`
          );
        } else {
          lines.push(
            `sudo iptables -t nat -A PREROUTING${ifaceFlag}${srcFlag} -p ${p} --dport ${fromExpr} -j REDIRECT --to-port ${toExpr}`
          );
          lines.push(
            `sudo iptables -A INPUT -p ${p} --dport ${toExpr} -j ACCEPT`
          );
        }
      }
    }
  }

  lines.push('');
  lines.push('# 4. Default chain policies (apply AFTER allow rules above!)');
  if (config.defaultIncoming === 'drop') {
    lines.push('sudo iptables -P INPUT DROP');
  } else if (config.defaultIncoming === 'reject') {
    lines.push('sudo iptables -A INPUT -j REJECT --reject-with icmp-host-prohibited');
  } else {
    lines.push('sudo iptables -P INPUT ACCEPT');
  }
  lines.push(`sudo iptables -P OUTPUT ${config.defaultOutgoing === 'allow' ? 'ACCEPT' : 'DROP'}`);

  lines.push('');
  lines.push('# Persist rules (Debian/Ubuntu: netfilter-persistent | RHEL: iptables-save)');
  lines.push('sudo iptables -L -n -v --line-numbers');

  return lines.join('\n');
}

export function generateFirewallScript(config: FirewallConfig): string {
  if (config.engine === 'ufw') return generateUfwScript(config);
  if (config.engine === 'firewalld') return generateFirewalldScript(config);
  return generateIptablesScript(config);
}

export function getCompanionCommands(config: FirewallConfig): FirewallCommandItem[] {
  if (config.engine === 'ufw') {
    return [
      {
        id: 'ufw-status',
        labelZh: '查看带编号的当前规则与状态',
        labelEn: 'Inspect active UFW rules with index numbers',
        command: 'sudo ufw status numbered verbose',
      },
      {
        id: 'ufw-dryrun',
        labelZh: '查看最近规则删除方式（按编号）',
        labelEn: 'Delete a rule by number (after checking status numbered)',
        command: 'sudo ufw delete 1',
      },
      {
        id: 'ufw-reset',
        labelZh: '清空重置 UFW（谨慎使用）',
        labelEn: 'Reset UFW rules to clean defaults (use carefully)',
        command: 'sudo ufw reset',
      },
    ];
  }

  if (config.engine === 'firewalld') {
    const zone = config.zone.trim() || 'public';
    return [
      {
        id: 'fwd-state',
        labelZh: '查看当前激活区域与规则列表',
        labelEn: 'Inspect active zones and configured rules',
        command: `sudo firewall-cmd --zone=${zone} --list-all`,
      },
      {
        id: 'fwd-reload',
        labelZh: '重载永久规则使其立即生效',
        labelEn: 'Reload permanent rules into runtime',
        command: 'sudo firewall-cmd --reload',
      },
      {
        id: 'fwd-runtime-save',
        labelZh: '将临时规则固化为永久规则',
        labelEn: 'Save current runtime config to permanent',
        command: 'sudo firewall-cmd --runtime-to-permanent',
      },
    ];
  }

  return [
    {
      id: 'ipt-list',
      labelZh: '查看 INPUT / NAT 表规则与命中计数',
      labelEn: 'List filter & nat rules with packet counters',
      command: 'sudo iptables -L -n -v --line-numbers && sudo iptables -t nat -L -n -v',
    },
    {
      id: 'ipt-save',
      labelZh: '导出当前规则到本地持久化文件',
      labelEn: 'Persist iptables rules to disk',
      command: 'sudo sh -c "iptables-save > /etc/iptables/rules.v4"',
    },
    {
      id: 'ipt-flush',
      labelZh: '紧急恢复全放行（防断连救急）',
      labelEn: 'Emergency flush & set policies to ACCEPT',
      command: 'sudo iptables -P INPUT ACCEPT && sudo iptables -P FORWARD ACCEPT && sudo iptables -F',
    },
  ];
}
