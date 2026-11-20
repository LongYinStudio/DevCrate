export type SshBoolOpt = '' | 'yes' | 'no';
export type SshAddKeysOpt = '' | 'yes' | 'no' | 'ask' | 'confirm';
export type SshStrictHostOpt = '' | 'yes' | 'no' | 'accept-new' | 'ask';
export type SshControlMasterOpt = '' | 'auto' | 'yes' | 'no' | 'ask' | 'autoask';
export type SshGatewayPortsOpt = '' | 'yes' | 'no' | 'clientspecified';
export type SshRequestTtyOpt = '' | 'yes' | 'no' | 'force' | 'auto';

export interface SshForwardRule {
  bindAddress: string;
  bindPort: string;
  targetHost: string;
  targetPort: string;
}

export interface SshDynamicForwardRule {
  bindAddress: string;
  port: string;
}

export interface SshKeyValue {
  key: string;
  value: string;
}

export interface SshHostEntry {
  uid: string;
  alias: string;
  comment: string;
  disabled: boolean;
  hostName: string;
  user: string;
  port: string;
  identityFiles: string[];
  identitiesOnly: boolean;
  preferredAuthentications: string;
  proxyJump: string;
  proxyCommand: string;
  localForwards: SshForwardRule[];
  remoteForwards: SshForwardRule[];
  dynamicForwards: SshDynamicForwardRule[];
  gatewayPorts: SshGatewayPortsOpt;
  forwardAgent: SshBoolOpt;
  addKeysToAgent: SshAddKeysOpt;
  useKeychain: boolean;
  serverAliveInterval: string;
  serverAliveCountMax: string;
  tcpKeepAlive: SshBoolOpt;
  compression: SshBoolOpt;
  strictHostKeyChecking: SshStrictHostOpt;
  userKnownHostsFile: string;
  controlMaster: SshControlMasterOpt;
  controlPath: string;
  controlPersist: string;
  remoteCommand: string;
  requestTty: SshRequestTtyOpt;
  setEnv: SshKeyValue[];
  extraDirectives: SshKeyValue[];
}

export interface SshConfigDocument {
  topIncludes: string[];
  hosts: SshHostEntry[];
}

export interface SshFormatOptions {
  indentSize: 2 | 4;
  includeHeaderComment: boolean;
  includeDisabledAsComments: boolean;
}

export interface SshLintIssue {
  level: 'error' | 'warning' | 'info';
  code: string;
  alias?: string;
  messageZh: string;
  messageEn: string;
  fixable?: 'move-wildcard-bottom';
}

export interface SshCliCommands {
  sshAlias: string;
  sshStandalone: string;
  sshTunnelOnly: string;
  scpUpload: string;
  rsyncSync: string;
  sshCopyId: string;
  sshKeygen: string;
}

let sshUidSeq = 1;
export function nextSshUid(prefix = 'host'): string {
  return `${prefix}_${Date.now().toString(36)}_${sshUidSeq++}`;
}

export function createEmptyHost(partial: Partial<SshHostEntry> = {}): SshHostEntry {
  return {
    uid: nextSshUid('host'),
    alias: partial.alias ?? 'my-server',
    comment: partial.comment ?? '',
    disabled: partial.disabled ?? false,
    hostName: partial.hostName ?? '',
    user: partial.user ?? '',
    port: partial.port ?? '',
    identityFiles: partial.identityFiles ? [...partial.identityFiles] : [],
    identitiesOnly: partial.identitiesOnly ?? false,
    preferredAuthentications: partial.preferredAuthentications ?? '',
    proxyJump: partial.proxyJump ?? '',
    proxyCommand: partial.proxyCommand ?? '',
    localForwards: partial.localForwards
      ? partial.localForwards.map(r => ({ ...r }))
      : [],
    remoteForwards: partial.remoteForwards
      ? partial.remoteForwards.map(r => ({ ...r }))
      : [],
    dynamicForwards: partial.dynamicForwards
      ? partial.dynamicForwards.map(r => ({ ...r }))
      : [],
    gatewayPorts: partial.gatewayPorts ?? '',
    forwardAgent: partial.forwardAgent ?? '',
    addKeysToAgent: partial.addKeysToAgent ?? '',
    useKeychain: partial.useKeychain ?? false,
    serverAliveInterval: partial.serverAliveInterval ?? '',
    serverAliveCountMax: partial.serverAliveCountMax ?? '',
    tcpKeepAlive: partial.tcpKeepAlive ?? '',
    compression: partial.compression ?? '',
    strictHostKeyChecking: partial.strictHostKeyChecking ?? '',
    userKnownHostsFile: partial.userKnownHostsFile ?? '',
    controlMaster: partial.controlMaster ?? '',
    controlPath: partial.controlPath ?? '',
    controlPersist: partial.controlPersist ?? '',
    remoteCommand: partial.remoteCommand ?? '',
    requestTty: partial.requestTty ?? '',
    setEnv: partial.setEnv ? partial.setEnv.map(e => ({ ...e })) : [],
    extraDirectives: partial.extraDirectives
      ? partial.extraDirectives.map(d => ({ ...d }))
      : [],
  };
}

export function cloneSshHost(host: SshHostEntry, newAlias?: string): SshHostEntry {
  return createEmptyHost({
    ...host,
    uid: nextSshUid('host'),
    alias: newAlias ?? `${host.alias}-copy`,
  });
}

// ==================== 格式化与生成 ~/.ssh/config ====================

function formatSshValue(val: string): string {
  const trimmed = val.trim();
  if (!trimmed) return '';
  if (/\s/.test(trimmed) && !/^".*"$/.test(trimmed)) {
    return `"${trimmed.replace(/"/g, '\\"')}"`;
  }
  return trimmed;
}

function formatForwardSpec(rule: SshForwardRule): string {
  const bindPort = rule.bindPort.trim();
  const targetHost = rule.targetHost.trim() || '127.0.0.1';
  const targetPort = rule.targetPort.trim();
  if (!bindPort || !targetPort) return '';
  const bindAddr = rule.bindAddress.trim();
  const left = bindAddr ? `${bindAddr}:${bindPort}` : bindPort;
  return `${left} ${targetHost}:${targetPort}`;
}

function formatDynamicSpec(rule: SshDynamicForwardRule): string {
  const port = rule.port.trim();
  if (!port) return '';
  const bindAddr = rule.bindAddress.trim();
  return bindAddr ? `${bindAddr}:${port}` : port;
}

export function generateSshConfig(
  doc: SshConfigDocument,
  options: SshFormatOptions = {
    indentSize: 2,
    includeHeaderComment: true,
    includeDisabledAsComments: true,
  }
): string {
  const lines: string[] = [];
  const indent = ' '.repeat(options.indentSize);

  if (options.includeHeaderComment) {
    lines.push('# Generated by DevCrate SSH Config Generator (~/.ssh/config)');
    lines.push('# Permissions recommended: chmod 700 ~/.ssh && chmod 600 ~/.ssh/config');
    lines.push('');
  }

  const includes = doc.topIncludes.map(s => s.trim()).filter(Boolean);
  if (includes.length > 0) {
    for (const inc of includes) {
      lines.push(`Include ${formatSshValue(inc)}`);
    }
    lines.push('');
  }

  for (const host of doc.hosts) {
    if (host.disabled && !options.includeDisabledAsComments) continue;

    const blockLines: string[] = [];
    if (host.comment.trim()) {
      for (const cLine of host.comment.trim().split('\n')) {
        blockLines.push(`# ${cLine.replace(/^#\s*/, '')}`);
      }
    }

    const alias = host.alias.trim() || '*';
    blockLines.push(`Host ${alias}`);

    const pushOpt = (key: string, val: string, quoteSpaces = true) => {
      const trimmed = val.trim();
      if (!trimmed) return;
      blockLines.push(`${indent}${key} ${quoteSpaces ? formatSshValue(trimmed) : trimmed}`);
    };

    pushOpt('HostName', host.hostName);
    pushOpt('User', host.user);
    pushOpt('Port', host.port, false);

    for (const idFile of host.identityFiles) {
      pushOpt('IdentityFile', idFile);
    }
    if (host.identitiesOnly) {
      pushOpt('IdentitiesOnly', 'yes', false);
    }
    pushOpt('PreferredAuthentications', host.preferredAuthentications, false);

    pushOpt('ProxyJump', host.proxyJump, false);
    pushOpt('ProxyCommand', host.proxyCommand, false);

    for (const lf of host.localForwards) {
      const spec = formatForwardSpec(lf);
      if (spec) blockLines.push(`${indent}LocalForward ${spec}`);
    }
    for (const rf of host.remoteForwards) {
      const spec = formatForwardSpec(rf);
      if (spec) blockLines.push(`${indent}RemoteForward ${spec}`);
    }
    for (const df of host.dynamicForwards) {
      const spec = formatDynamicSpec(df);
      if (spec) blockLines.push(`${indent}DynamicForward ${spec}`);
    }
    pushOpt('GatewayPorts', host.gatewayPorts, false);

    pushOpt('ForwardAgent', host.forwardAgent, false);
    pushOpt('AddKeysToAgent', host.addKeysToAgent, false);
    if (host.useKeychain) {
      pushOpt('IgnoreUnknown', 'UseKeychain', false);
      pushOpt('UseKeychain', 'yes', false);
    }
    pushOpt('ServerAliveInterval', host.serverAliveInterval, false);
    pushOpt('ServerAliveCountMax', host.serverAliveCountMax, false);
    pushOpt('TCPKeepAlive', host.tcpKeepAlive, false);
    pushOpt('Compression', host.compression, false);
    pushOpt('StrictHostKeyChecking', host.strictHostKeyChecking, false);
    pushOpt('UserKnownHostsFile', host.userKnownHostsFile);

    pushOpt('ControlMaster', host.controlMaster, false);
    pushOpt('ControlPath', host.controlPath);
    pushOpt('ControlPersist', host.controlPersist, false);

    pushOpt('RequestTTY', host.requestTty, false);
    pushOpt('RemoteCommand', host.remoteCommand, false);

    for (const env of host.setEnv) {
      if (env.key.trim()) {
        blockLines.push(`${indent}SetEnv ${env.key.trim()}=${formatSshValue(env.value)}`);
      }
    }
    for (const extra of host.extraDirectives) {
      if (extra.key.trim() && extra.value.trim()) {
        blockLines.push(`${indent}${extra.key.trim()} ${extra.value.trim()}`);
      }
    }

    if (host.disabled) {
      for (const bl of blockLines) {
        lines.push(bl.startsWith('#') ? bl : `# ${bl}`);
      }
    } else {
      lines.push(...blockLines);
    }
    lines.push('');
  }

  return `${lines.join('\n').trimEnd()}\n`;
}

// ==================== 解析现有 ~/.ssh/config ====================

function stripOuterQuotes(val: string): string {
  const t = val.trim();
  if (
    (t.startsWith('"') && t.endsWith('"')) ||
    (t.startsWith("'") && t.endsWith("'"))
  ) {
    return t.slice(1, -1);
  }
  return t;
}

function parseForwardPair(rawVal: string): SshForwardRule | null {
  const parts = rawVal.trim().split(/\s+/);
  if (parts.length < 2) return null;
  const left = parts[0];
  const right = parts[1];

  const splitAddrPort = (spec: string): { addr: string; port: string } => {
    const lastColon = spec.lastIndexOf(':');
    if (lastColon < 0) return { addr: '', port: spec };
    return {
      addr: spec.slice(0, lastColon).replace(/^\[|\]$/g, ''),
      port: spec.slice(lastColon + 1),
    };
  };

  const l = splitAddrPort(left);
  const r = splitAddrPort(right);
  return {
    bindAddress: l.addr,
    bindPort: l.port,
    targetHost: r.addr || '127.0.0.1',
    targetPort: r.port,
  };
}

function parseDynamicSpec(rawVal: string): SshDynamicForwardRule | null {
  const clean = rawVal.trim().split(/\s+/)[0];
  if (!clean) return null;
  const lastColon = clean.lastIndexOf(':');
  if (lastColon < 0) return { bindAddress: '', port: clean };
  return {
    bindAddress: clean.slice(0, lastColon).replace(/^\[|\]$/g, ''),
    port: clean.slice(lastColon + 1),
  };
}

function splitDirective(line: string): { key: string; value: string } | null {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return null;

  // Strip trailing inline comments outside quotes
  let inQuote: '"' | "'" | null = null;
  let clean = '';
  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (inQuote) {
      if (ch === inQuote) inQuote = null;
      clean += ch;
    } else if (ch === '"' || ch === "'") {
      inQuote = ch;
      clean += ch;
    } else if (ch === '#') {
      break;
    } else {
      clean += ch;
    }
  }
  clean = clean.trim();
  if (!clean) return null;

  const match = clean.match(/^([^\s=]+)\s*(?:=|\s+)\s*(.+)$/);
  if (!match) return null;
  return { key: match[1].trim(), value: match[2].trim() };
}

export function parseSshConfig(rawText: string): SshConfigDocument {
  const topIncludes: string[] = [];
  const hosts: SshHostEntry[] = [];
  let current: SshHostEntry | null = null;
  let pendingComments: string[] = [];

  for (const rawLine of rawText.split(/\r?\n/)) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      if (!current) pendingComments = [];
      continue;
    }
    if (trimmed.startsWith('#')) {
      const commentText = trimmed.replace(/^#+\s?/, '');
      if (
        !commentText.startsWith('Generated by DevCrate') &&
        !commentText.startsWith('Permissions recommended:')
      ) {
        pendingComments.push(commentText);
      }
      continue;
    }

    const kv = splitDirective(rawLine);
    if (!kv) continue;
    const keyLower = kv.key.toLowerCase();
    const val = stripOuterQuotes(kv.value);

    if (keyLower === 'include' && !current) {
      topIncludes.push(val);
      pendingComments = [];
      continue;
    }

    if (keyLower === 'host') {
      current = createEmptyHost({
        alias: kv.value.trim(),
        comment: pendingComments.join('\n'),
      });
      pendingComments = [];
      hosts.push(current);
      continue;
    }

    if (!current) {
      current = createEmptyHost({ alias: '*', comment: pendingComments.join('\n') });
      pendingComments = [];
      hosts.push(current);
    }

    pendingComments = [];

    switch (keyLower) {
      case 'hostname':
        current.hostName = val;
        break;
      case 'user':
        current.user = val;
        break;
      case 'port':
        current.port = val;
        break;
      case 'identityfile':
        current.identityFiles.push(val);
        break;
      case 'identitiesonly':
        current.identitiesOnly = val.toLowerCase() === 'yes';
        break;
      case 'preferredauthentications':
        current.preferredAuthentications = val;
        break;
      case 'proxyjump':
        current.proxyJump = val;
        break;
      case 'proxycommand':
        current.proxyCommand = kv.value.trim();
        break;
      case 'localforward': {
        const parsed = parseForwardPair(kv.value);
        if (parsed) current.localForwards.push(parsed);
        break;
      }
      case 'remoteforward': {
        const parsed = parseForwardPair(kv.value);
        if (parsed) current.remoteForwards.push(parsed);
        break;
      }
      case 'dynamicforward': {
        const parsed = parseDynamicSpec(kv.value);
        if (parsed) current.dynamicForwards.push(parsed);
        break;
      }
      case 'gatewayports':
        if (['yes', 'no', 'clientspecified'].includes(val.toLowerCase())) {
          current.gatewayPorts = val.toLowerCase() as SshGatewayPortsOpt;
        }
        break;
      case 'forwardagent':
        if (val.toLowerCase() === 'yes' || val.toLowerCase() === 'no') {
          current.forwardAgent = val.toLowerCase() as SshBoolOpt;
        }
        break;
      case 'addkeystoagent':
        if (['yes', 'no', 'ask', 'confirm'].includes(val.toLowerCase())) {
          current.addKeysToAgent = val.toLowerCase() as SshAddKeysOpt;
        }
        break;
      case 'usekeychain':
        current.useKeychain = val.toLowerCase() === 'yes';
        break;
      case 'ignoreunknown':
        if (val.toLowerCase() !== 'usekeychain') {
          current.extraDirectives.push({ key: kv.key, value: kv.value.trim() });
        }
        break;
      case 'serveraliveinterval':
        current.serverAliveInterval = val;
        break;
      case 'serveralivecountmax':
        current.serverAliveCountMax = val;
        break;
      case 'tcpkeepalive':
        if (val.toLowerCase() === 'yes' || val.toLowerCase() === 'no') {
          current.tcpKeepAlive = val.toLowerCase() as SshBoolOpt;
        }
        break;
      case 'compression':
        if (val.toLowerCase() === 'yes' || val.toLowerCase() === 'no') {
          current.compression = val.toLowerCase() as SshBoolOpt;
        }
        break;
      case 'stricthostkeychecking':
        if (['yes', 'no', 'accept-new', 'ask'].includes(val.toLowerCase())) {
          current.strictHostKeyChecking = val.toLowerCase() as SshStrictHostOpt;
        }
        break;
      case 'userknownhostsfile':
        current.userKnownHostsFile = val;
        break;
      case 'controlmaster':
        if (['auto', 'yes', 'no', 'ask', 'autoask'].includes(val.toLowerCase())) {
          current.controlMaster = val.toLowerCase() as SshControlMasterOpt;
        }
        break;
      case 'controlpath':
        current.controlPath = val;
        break;
      case 'controlpersist':
        current.controlPersist = val;
        break;
      case 'remotecommand':
        current.remoteCommand = kv.value.trim();
        break;
      case 'requesttty':
        if (['yes', 'no', 'force', 'auto'].includes(val.toLowerCase())) {
          current.requestTty = val.toLowerCase() as SshRequestTtyOpt;
        }
        break;
      case 'setenv': {
        const eq = kv.value.indexOf('=');
        if (eq > 0) {
          current.setEnv.push({
            key: kv.value.slice(0, eq).trim(),
            value: stripOuterQuotes(kv.value.slice(eq + 1)),
          });
        }
        break;
      }
      default:
        current.extraDirectives.push({ key: kv.key, value: kv.value.trim() });
        break;
    }
  }

  return { topIncludes, hosts };
}

// ==================== 命令行生成 (ssh / tunnel / scp / rsync / ssh-copy-id) ====================

function quoteCliArg(val: string): string {
  if (/^[A-Za-z0-9_./:=+@%-]+$/.test(val)) return val;
  return `'${val.replace(/'/g, `'\\''`)}'`;
}

function resolvePrimaryAlias(host: SshHostEntry): string {
  const first = host.alias.trim().split(/\s+/)[0] || 'server';
  return first === '*' ? 'my-server' : first;
}

function buildInlineForwardFlags(host: SshHostEntry): string[] {
  const flags: string[] = [];
  for (const lf of host.localForwards) {
    if (!lf.bindPort.trim() || !lf.targetPort.trim()) continue;
    const bind = lf.bindAddress.trim()
      ? `${lf.bindAddress.trim()}:${lf.bindPort.trim()}`
      : lf.bindPort.trim();
    const tgt = `${lf.targetHost.trim() || '127.0.0.1'}:${lf.targetPort.trim()}`;
    flags.push(`-L ${bind}:${tgt}`);
  }
  for (const rf of host.remoteForwards) {
    if (!rf.bindPort.trim() || !rf.targetPort.trim()) continue;
    const bind = rf.bindAddress.trim()
      ? `${rf.bindAddress.trim()}:${rf.bindPort.trim()}`
      : rf.bindPort.trim();
    const tgt = `${rf.targetHost.trim() || '127.0.0.1'}:${rf.targetPort.trim()}`;
    flags.push(`-R ${bind}:${tgt}`);
  }
  for (const df of host.dynamicForwards) {
    if (!df.port.trim()) continue;
    const spec = df.bindAddress.trim()
      ? `${df.bindAddress.trim()}:${df.port.trim()}`
      : df.port.trim();
    flags.push(`-D ${spec}`);
  }
  return flags;
}

export function generateSshCliCommands(host: SshHostEntry): SshCliCommands {
  const alias = resolvePrimaryAlias(host);
  const targetHost = host.hostName.trim() || alias;
  const userPrefix = host.user.trim() ? `${host.user.trim()}@` : '';
  const destination = `${userPrefix}${targetHost}`;

  const standaloneFlags: string[] = ['ssh'];
  if (host.port.trim() && host.port.trim() !== '22') {
    standaloneFlags.push(`-p ${host.port.trim()}`);
  }
  if (host.identityFiles.length > 0 && host.identityFiles[0].trim()) {
    standaloneFlags.push(`-i ${quoteCliArg(host.identityFiles[0].trim())}`);
  }
  if (host.proxyJump.trim()) {
    standaloneFlags.push(`-J ${quoteCliArg(host.proxyJump.trim())}`);
  }
  if (host.forwardAgent === 'yes') {
    standaloneFlags.push('-A');
  }
  if (host.compression === 'yes') {
    standaloneFlags.push('-C');
  }

  const fwdFlags = buildInlineForwardFlags(host);
  standaloneFlags.push(...fwdFlags);

  if (host.serverAliveInterval.trim()) {
    standaloneFlags.push(`-o ServerAliveInterval=${host.serverAliveInterval.trim()}`);
  }
  if (host.strictHostKeyChecking) {
    standaloneFlags.push(`-o StrictHostKeyChecking=${host.strictHostKeyChecking}`);
  }
  standaloneFlags.push(destination);

  const hasForwards = fwdFlags.length > 0;
  const tunnelFlags = ['ssh', '-N'];
  if (hasForwards) {
    tunnelFlags.push(...fwdFlags);
  } else {
    tunnelFlags.push('-L 15432:127.0.0.1:5432');
  }
  if (host.port.trim() && host.port.trim() !== '22' && !host.hostName.trim()) {
    tunnelFlags.push(`-p ${host.port.trim()}`);
  }
  tunnelFlags.push(alias);

  const keyFile = host.identityFiles[0]?.trim() || '~/.ssh/id_ed25519';
  const pubKeyFile = keyFile.endsWith('.pub') ? keyFile : `${keyFile}.pub`;

  return {
    sshAlias: `ssh ${alias}`,
    sshStandalone: standaloneFlags.join(' '),
    sshTunnelOnly: tunnelFlags.join(' '),
    scpUpload: `scp -r ./dist ${alias}:/var/www/app`,
    rsyncSync: `rsync -avz --progress ./dist/ ${alias}:/var/www/app/`,
    sshCopyId: `ssh-copy-id -i ${quoteCliArg(pubKeyFile)} ${alias}`,
    sshKeygen: `ssh-keygen -t ed25519 -C "${host.user.trim() || 'dev'}@${alias}" -f ${quoteCliArg(keyFile)}`,
  };
}

// ==================== 静态校验与一键修复 ====================

export function lintSshConfig(doc: SshConfigDocument): SshLintIssue[] {
  const issues: SshLintIssue[] = [];
  const activeHosts = doc.hosts.filter(h => !h.disabled);
  const seenAliases = new Map<string, number>();

  // 1. Check wildcard Host * position (OpenSSH first-match-wins!)
  let wildcardIndex = -1;
  activeHosts.forEach((h, idx) => {
    const tokens = h.alias.trim().split(/\s+/);
    if (tokens.includes('*') && wildcardIndex === -1) {
      wildcardIndex = idx;
    }
  });
  if (wildcardIndex !== -1 && wildcardIndex < activeHosts.length - 1) {
    issues.push({
      level: 'warning',
      code: 'wildcard-not-last',
      alias: activeHosts[wildcardIndex].alias,
      fixable: 'move-wildcard-bottom',
      messageZh:
        'OpenSSH 按自上而下「首次匹配生效」原则解析配置，建议将通用通配块 "Host *" 移至文件末尾，以免覆盖下方主机参数。',
      messageEn:
        'OpenSSH uses first-match-wins ordering. Move "Host *" to the bottom so specific host rules take precedence.',
    });
  }

  // Build known concrete aliases for ProxyJump validation
  const knownAliases = new Set<string>();
  for (const h of activeHosts) {
    for (const tok of h.alias.trim().split(/\s+/)) {
      if (tok && tok !== '*') knownAliases.add(tok);
    }
  }

  for (const h of activeHosts) {
    const alias = h.alias.trim();
    if (!alias) {
      issues.push({
        level: 'error',
        code: 'empty-alias',
        messageZh: '存在空的 Host 别名，请填写主机别名（如 prod-web 或 *）',
        messageEn: 'A host entry has an empty Host alias.',
      });
      continue;
    }

    seenAliases.set(alias, (seenAliases.get(alias) ?? 0) + 1);

    const isWildcard = /[*?]/.test(alias);
    if (!isWildcard && !h.hostName.trim() && !h.proxyCommand.trim()) {
      issues.push({
        level: 'info',
        code: 'missing-hostname',
        alias,
        messageZh: `主机 "${alias}" 未填写 HostName，SSH 将直接把 "${alias}" 作为连接域名`,
        messageEn: `Host "${alias}" has no HostName; SSH will connect directly to "${alias}" as a hostname.`,
      });
    }

    if (h.port.trim()) {
      const pNum = Number(h.port.trim());
      if (!Number.isInteger(pNum) || pNum < 1 || pNum > 65535) {
        issues.push({
          level: 'error',
          code: 'invalid-port',
          alias,
          messageZh: `主机 "${alias}" 的 Port "${h.port}" 无效（需为 1~65535 整数）`,
          messageEn: `Host "${alias}" has an invalid Port "${h.port}" (must be 1–65535).`,
        });
      }
    }

    // ProxyJump checks
    if (h.proxyJump.trim()) {
      const hops = h.proxyJump
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);
      for (const hop of hops) {
        if (hop === alias) {
          issues.push({
            level: 'error',
            code: 'self-proxyjump',
            alias,
            messageZh: `主机 "${alias}" 的 ProxyJump 不能指向自身`,
            messageEn: `Host "${alias}" has ProxyJump pointing to itself.`,
          });
        } else if (
          !hop.includes('@') &&
          !hop.includes(':') &&
          !hop.includes('.') &&
          !knownAliases.has(hop)
        ) {
          issues.push({
            level: 'warning',
            code: 'unknown-proxyjump',
            alias,
            messageZh: `主机 "${alias}" 的 ProxyJump 引用了未在当前配置中定义的别名 "${hop}"`,
            messageEn: `Host "${alias}" references unknown ProxyJump alias "${hop}".`,
          });
        }
      }
    }

    // LocalForward bind port conflict within same host
    const localBindKeys = new Set<string>();
    for (const lf of h.localForwards) {
      if (!lf.bindPort.trim()) continue;
      const key = `${lf.bindAddress.trim() || '127.0.0.1'}:${lf.bindPort.trim()}`;
      if (localBindKeys.has(key)) {
        issues.push({
          level: 'error',
          code: 'duplicate-local-forward',
          alias,
          messageZh: `主机 "${alias}" 存在重复的本地转发监听端口 ${key}`,
          messageEn: `Host "${alias}" defines duplicate LocalForward bind port ${key}.`,
        });
      }
      localBindKeys.add(key);
    }

    if (h.strictHostKeyChecking === 'no') {
      issues.push({
        level: 'warning',
        code: 'strict-host-key-no',
        alias,
        messageZh: `主机 "${alias}" 设置了 StrictHostKeyChecking no（易受中间人攻击），建议改为 accept-new`,
        messageEn: `Host "${alias}" disables StrictHostKeyChecking ("no"); consider "accept-new" instead.`,
      });
    }

    if (h.forwardAgent === 'yes') {
      issues.push({
        level: 'info',
        code: 'forward-agent-warning',
        alias,
        messageZh: `主机 "${alias}" 启用了 ForwardAgent yes，仅在可信服务器上使用（跳板机场景优先使用 ProxyJump）`,
        messageEn: `Host "${alias}" enables ForwardAgent yes; prefer ProxyJump over agent forwarding on untrusted jump hosts.`,
      });
    }

    if (h.controlMaster && h.controlMaster !== 'no' && !h.controlPath.trim()) {
      issues.push({
        level: 'warning',
        code: 'controlmaster-no-path',
        alias,
        messageZh: `主机 "${alias}" 启用了 ControlMaster 但未指定 ControlPath，连接复用将无法生效`,
        messageEn: `Host "${alias}" enables ControlMaster without ControlPath; multiplexing will not work.`,
      });
    }
  }

  for (const [alias, count] of seenAliases.entries()) {
    if (count > 1) {
      issues.push({
        level: 'warning',
        code: 'duplicate-alias',
        alias,
        messageZh: `存在多个同名 Host "${alias}" 配置块，OpenSSH 将合并且以靠前配置优先`,
        messageEn: `Duplicate Host "${alias}" blocks found; OpenSSH prioritizes earlier declarations.`,
      });
    }
  }

  return issues;
}

export function moveWildcardHostsToBottom(doc: SshConfigDocument): number {
  const normal: SshHostEntry[] = [];
  const wildcards: SshHostEntry[] = [];
  for (const h of doc.hosts) {
    if (h.alias.trim().split(/\s+/).includes('*')) {
      wildcards.push(h);
    } else {
      normal.push(h);
    }
  }
  if (wildcards.length === 0) return 0;
  doc.hosts = [...normal, ...wildcards];
  return wildcards.length;
}
