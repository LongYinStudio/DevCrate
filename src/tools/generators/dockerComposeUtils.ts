import { parseConfig, DEFAULT_CONVERT_OPTIONS } from '../converters/configConverterUtils';

export type RestartPolicy = '' | 'no' | 'always' | 'on-failure' | 'unless-stopped';
export type PullPolicy = '' | 'always' | 'never' | 'missing' | 'build';
export type DependsCondition =
  | 'service_started'
  | 'service_healthy'
  | 'service_completed_successfully';

export interface ComposePortMapping {
  host: string;
  container: string;
  protocol: 'tcp' | 'udp';
  hostIp: string;
}

export interface ComposeVolumeMount {
  source: string;
  target: string;
  mode: '' | 'ro' | 'rw';
}

export interface ComposeKeyValue {
  key: string;
  value: string;
}

export interface ComposeDependsOn {
  service: string;
  condition: DependsCondition;
}

export interface ComposeHealthcheck {
  enabled: boolean;
  test: string;
  interval: string;
  timeout: string;
  retries: number;
  startPeriod: string;
}

export interface ComposeService {
  uid: string;
  name: string;
  image: string;
  buildEnabled: boolean;
  buildContext: string;
  buildDockerfile: string;
  buildTarget: string;
  containerName: string;
  hostname: string;
  platform: string;
  restart: RestartPolicy;
  pullPolicy: PullPolicy;
  command: string;
  entrypoint: string;
  workingDir: string;
  user: string;
  init: boolean;
  tty: boolean;
  stdinOpen: boolean;
  privileged: boolean;
  readOnly: boolean;
  ports: ComposePortMapping[];
  expose: string[];
  networkMode: string;
  networks: string[];
  extraHosts: string[];
  dns: string[];
  volumes: ComposeVolumeMount[];
  tmpfs: string[];
  environment: ComposeKeyValue[];
  envFile: string[];
  dependsOn: ComposeDependsOn[];
  healthcheck: ComposeHealthcheck;
  cpus: string;
  memory: string;
  memReservation: string;
  shmSize: string;
  loggingDriver: string;
  loggingMaxSize: string;
  loggingMaxFile: string;
  capAdd: string[];
  capDrop: string[];
  labels: ComposeKeyValue[];
  profiles: string[];
}

export interface ComposeTopNetwork {
  name: string;
  driver: string;
  external: boolean;
  subnet: string;
}

export interface ComposeTopVolume {
  name: string;
  driver: string;
  external: boolean;
}

export interface ComposeConfig {
  projectName: string;
  legacyVersion: string;
  services: ComposeService[];
  networks: ComposeTopNetwork[];
  volumes: ComposeTopVolume[];
}

export interface ComposeFormatOptions {
  indentSize: 2 | 4;
  includeHeaderComment: boolean;
}

export interface ComposeLintIssue {
  level: 'error' | 'warning' | 'info';
  code: string;
  service?: string;
  messageZh: string;
  messageEn: string;
  fixable?: 'declare-missing';
}

export interface DockerRunParseResult {
  services: ComposeService[];
  networks: ComposeTopNetwork[];
  volumes: ComposeTopVolume[];
  notes: string[];
  warnings: string[];
}

let uidCounter = 1;
export function nextComposeUid(prefix = 'svc'): string {
  return `${prefix}_${Date.now().toString(36)}_${uidCounter++}`;
}

export function createEmptyService(partial: Partial<ComposeService> = {}): ComposeService {
  return {
    uid: nextComposeUid('svc'),
    name: partial.name ?? 'app',
    image: partial.image ?? 'nginx:alpine',
    buildEnabled: partial.buildEnabled ?? false,
    buildContext: partial.buildContext ?? '.',
    buildDockerfile: partial.buildDockerfile ?? 'Dockerfile',
    buildTarget: partial.buildTarget ?? '',
    containerName: partial.containerName ?? '',
    hostname: partial.hostname ?? '',
    platform: partial.platform ?? '',
    restart: partial.restart ?? 'unless-stopped',
    pullPolicy: partial.pullPolicy ?? '',
    command: partial.command ?? '',
    entrypoint: partial.entrypoint ?? '',
    workingDir: partial.workingDir ?? '',
    user: partial.user ?? '',
    init: partial.init ?? false,
    tty: partial.tty ?? false,
    stdinOpen: partial.stdinOpen ?? false,
    privileged: partial.privileged ?? false,
    readOnly: partial.readOnly ?? false,
    ports: partial.ports ? partial.ports.map(p => ({ ...p })) : [],
    expose: partial.expose ? [...partial.expose] : [],
    networkMode: partial.networkMode ?? '',
    networks: partial.networks ? [...partial.networks] : [],
    extraHosts: partial.extraHosts ? [...partial.extraHosts] : [],
    dns: partial.dns ? [...partial.dns] : [],
    volumes: partial.volumes ? partial.volumes.map(v => ({ ...v })) : [],
    tmpfs: partial.tmpfs ? [...partial.tmpfs] : [],
    environment: partial.environment ? partial.environment.map(e => ({ ...e })) : [],
    envFile: partial.envFile ? [...partial.envFile] : [],
    dependsOn: partial.dependsOn ? partial.dependsOn.map(d => ({ ...d })) : [],
    healthcheck: partial.healthcheck
      ? { ...partial.healthcheck }
      : {
          enabled: false,
          test: '',
          interval: '10s',
          timeout: '5s',
          retries: 5,
          startPeriod: '',
        },
    cpus: partial.cpus ?? '',
    memory: partial.memory ?? '',
    memReservation: partial.memReservation ?? '',
    shmSize: partial.shmSize ?? '',
    loggingDriver: partial.loggingDriver ?? '',
    loggingMaxSize: partial.loggingMaxSize ?? '',
    loggingMaxFile: partial.loggingMaxFile ?? '',
    capAdd: partial.capAdd ? [...partial.capAdd] : [],
    capDrop: partial.capDrop ? [...partial.capDrop] : [],
    labels: partial.labels ? partial.labels.map(l => ({ ...l })) : [],
    profiles: partial.profiles ? [...partial.profiles] : [],
  };
}

export function cloneComposeService(svc: ComposeService, newName?: string): ComposeService {
  return createEmptyService({
    ...svc,
    uid: nextComposeUid('svc'),
    name: newName ?? `${svc.name}-copy`,
  });
}

// ==================== YAML 序列化辅助 ====================

function needsYamlQuotes(str: string): boolean {
  if (str === '') return true;
  if (/^\s|\s$/.test(str)) return true;
  if (/^(true|false|yes|no|on|off|null|~)$/i.test(str)) return true;
  if (/^[-+]?(\d+\.?\d*|\.\d+)([eE][-+]?\d+)?$/.test(str)) return true;
  if (/[:#\[\]{},&*!|>'"%@`?]/.test(str)) return true;
  if (/^\d+:/.test(str)) return true; // ports like 8080:80
  return false;
}

function formatYamlScalar(value: string): string {
  if (needsYamlQuotes(value)) {
    return `'${value.replace(/'/g, "''")}'`;
  }
  return value;
}

function formatYamlKey(key: string): string {
  if (/^[A-Za-z_][A-Za-z0-9_-]*$/.test(key)) return key;
  return formatYamlScalar(key);
}

function padIndent(level: number, indentSize: 2 | 4): string {
  return ' '.repeat(level * indentSize);
}

function formatPortString(p: ComposePortMapping): string {
  const proto = p.protocol === 'udp' ? '/udp' : '';
  const container = p.container.trim();
  const host = p.host.trim();
  const hostIp = p.hostIp.trim();
  if (!host) return `${container}${proto}`;
  const prefix = hostIp ? `${hostIp}:` : '';
  return `${prefix}${host}:${container}${proto}`;
}

function formatVolumeString(v: ComposeVolumeMount): string {
  const src = v.source.trim();
  const tgt = v.target.trim();
  if (!src && !tgt) return '';
  const base = src ? `${src}:${tgt}` : tgt;
  return v.mode ? `${base}:${v.mode}` : base;
}

function isNamedVolumeSource(source: string): boolean {
  const s = source.trim();
  if (!s) return false;
  if (s.startsWith('.') || s.startsWith('/') || s.startsWith('~') || s.startsWith('$')) {
    return false;
  }
  if (/^[A-Za-z]:[\\/]/.test(s)) return false; // Windows path
  return true;
}

/**
 * 将 ComposeConfig 序列化为规范的 compose.yml
 */
export function generateComposeYaml(
  config: ComposeConfig,
  options: ComposeFormatOptions = { indentSize: 2, includeHeaderComment: true }
): string {
  const lines: string[] = [];
  const indent = (lvl: number) => padIndent(lvl, options.indentSize);

  if (options.includeHeaderComment) {
    lines.push('# Generated by DevCrate Docker Compose Generator');
  }

  if (config.legacyVersion.trim()) {
    lines.push(`version: ${formatYamlScalar(config.legacyVersion.trim())}`);
  }
  if (config.projectName.trim()) {
    lines.push(`name: ${formatYamlScalar(config.projectName.trim())}`);
  }

  lines.push('services:');
  if (config.services.length === 0) {
    lines.push(`${indent(1)}# No services configured`);
  }

  for (const svc of config.services) {
    const svcName = svc.name.trim() || 'service';
    lines.push(`${indent(1)}${formatYamlKey(svcName)}:`);

    if (svc.buildEnabled) {
      const ctx = svc.buildContext.trim() || '.';
      const df = svc.buildDockerfile.trim();
      const target = svc.buildTarget.trim();
      if ((!df || df === 'Dockerfile') && !target) {
        lines.push(`${indent(2)}build: ${formatYamlScalar(ctx)}`);
      } else {
        lines.push(`${indent(2)}build:`);
        lines.push(`${indent(3)}context: ${formatYamlScalar(ctx)}`);
        if (df) lines.push(`${indent(3)}dockerfile: ${formatYamlScalar(df)}`);
        if (target) lines.push(`${indent(3)}target: ${formatYamlScalar(target)}`);
      }
    }

    if (svc.image.trim()) {
      lines.push(`${indent(2)}image: ${formatYamlScalar(svc.image.trim())}`);
    }
    if (svc.containerName.trim()) {
      lines.push(`${indent(2)}container_name: ${formatYamlScalar(svc.containerName.trim())}`);
    }
    if (svc.hostname.trim()) {
      lines.push(`${indent(2)}hostname: ${formatYamlScalar(svc.hostname.trim())}`);
    }
    if (svc.platform.trim()) {
      lines.push(`${indent(2)}platform: ${formatYamlScalar(svc.platform.trim())}`);
    }
    if (svc.pullPolicy) {
      lines.push(`${indent(2)}pull_policy: ${svc.pullPolicy}`);
    }
    if (svc.restart) {
      lines.push(`${indent(2)}restart: ${svc.restart}`);
    }
    if (svc.entrypoint.trim()) {
      lines.push(`${indent(2)}entrypoint: ${formatYamlScalar(svc.entrypoint.trim())}`);
    }
    if (svc.command.trim()) {
      lines.push(`${indent(2)}command: ${formatYamlScalar(svc.command.trim())}`);
    }
    if (svc.workingDir.trim()) {
      lines.push(`${indent(2)}working_dir: ${formatYamlScalar(svc.workingDir.trim())}`);
    }
    if (svc.user.trim()) {
      lines.push(`${indent(2)}user: ${formatYamlScalar(svc.user.trim())}`);
    }
    if (svc.init) lines.push(`${indent(2)}init: true`);
    if (svc.stdinOpen) lines.push(`${indent(2)}stdin_open: true`);
    if (svc.tty) lines.push(`${indent(2)}tty: true`);
    if (svc.privileged) lines.push(`${indent(2)}privileged: true`);
    if (svc.readOnly) lines.push(`${indent(2)}read_only: true`);
    if (svc.shmSize.trim()) {
      lines.push(`${indent(2)}shm_size: ${formatYamlScalar(svc.shmSize.trim())}`);
    }

    const validPorts = svc.ports.filter(p => p.container.trim());
    if (validPorts.length > 0) {
      lines.push(`${indent(2)}ports:`);
      for (const p of validPorts) {
        lines.push(`${indent(3)}- ${formatYamlScalar(formatPortString(p))}`);
      }
    }

    const validExpose = svc.expose.map(s => s.trim()).filter(Boolean);
    if (validExpose.length > 0) {
      lines.push(`${indent(2)}expose:`);
      for (const ex of validExpose) {
        lines.push(`${indent(3)}- ${formatYamlScalar(ex)}`);
      }
    }

    const validEnv = svc.environment.filter(e => e.key.trim());
    if (validEnv.length > 0) {
      lines.push(`${indent(2)}environment:`);
      for (const e of validEnv) {
        lines.push(
          `${indent(3)}${formatYamlKey(e.key.trim())}: ${formatYamlScalar(e.value)}`
        );
      }
    }

    const validEnvFile = svc.envFile.map(s => s.trim()).filter(Boolean);
    if (validEnvFile.length > 0) {
      lines.push(`${indent(2)}env_file:`);
      for (const ef of validEnvFile) {
        lines.push(`${indent(3)}- ${formatYamlScalar(ef)}`);
      }
    }

    const validVols = svc.volumes.filter(v => v.target.trim());
    if (validVols.length > 0) {
      lines.push(`${indent(2)}volumes:`);
      for (const v of validVols) {
        lines.push(`${indent(3)}- ${formatYamlScalar(formatVolumeString(v))}`);
      }
    }

    const validTmpfs = svc.tmpfs.map(s => s.trim()).filter(Boolean);
    if (validTmpfs.length > 0) {
      lines.push(`${indent(2)}tmpfs:`);
      for (const tp of validTmpfs) {
        lines.push(`${indent(3)}- ${formatYamlScalar(tp)}`);
      }
    }

    if (svc.networkMode.trim()) {
      lines.push(`${indent(2)}network_mode: ${formatYamlScalar(svc.networkMode.trim())}`);
    } else if (svc.networks.length > 0) {
      const validNets = svc.networks.map(s => s.trim()).filter(Boolean);
      if (validNets.length > 0) {
        lines.push(`${indent(2)}networks:`);
        for (const n of validNets) {
          lines.push(`${indent(3)}- ${formatYamlKey(n)}`);
        }
      }
    }

    const validExtraHosts = svc.extraHosts.map(s => s.trim()).filter(Boolean);
    if (validExtraHosts.length > 0) {
      lines.push(`${indent(2)}extra_hosts:`);
      for (const eh of validExtraHosts) {
        lines.push(`${indent(3)}- ${formatYamlScalar(eh)}`);
      }
    }

    const validDns = svc.dns.map(s => s.trim()).filter(Boolean);
    if (validDns.length > 0) {
      lines.push(`${indent(2)}dns:`);
      for (const d of validDns) {
        lines.push(`${indent(3)}- ${formatYamlScalar(d)}`);
      }
    }

    const validDeps = svc.dependsOn.filter(d => d.service.trim());
    if (validDeps.length > 0) {
      const allSimple = validDeps.every(d => d.condition === 'service_started');
      lines.push(`${indent(2)}depends_on:`);
      if (allSimple) {
        for (const d of validDeps) {
          lines.push(`${indent(3)}- ${formatYamlKey(d.service.trim())}`);
        }
      } else {
        for (const d of validDeps) {
          lines.push(`${indent(3)}${formatYamlKey(d.service.trim())}:`);
          lines.push(`${indent(4)}condition: ${d.condition}`);
        }
      }
    }

    if (svc.healthcheck.enabled && svc.healthcheck.test.trim()) {
      lines.push(`${indent(2)}healthcheck:`);
      const testVal = svc.healthcheck.test.trim();
      if (testVal.startsWith('[')) {
        lines.push(`${indent(3)}test: ${testVal}`);
      } else {
        lines.push(`${indent(3)}test: ["CMD-SHELL", ${JSON.stringify(testVal)}]`);
      }
      if (svc.healthcheck.interval.trim()) {
        lines.push(`${indent(3)}interval: ${svc.healthcheck.interval.trim()}`);
      }
      if (svc.healthcheck.timeout.trim()) {
        lines.push(`${indent(3)}timeout: ${svc.healthcheck.timeout.trim()}`);
      }
      if (svc.healthcheck.retries > 0) {
        lines.push(`${indent(3)}retries: ${svc.healthcheck.retries}`);
      }
      if (svc.healthcheck.startPeriod.trim()) {
        lines.push(`${indent(3)}start_period: ${svc.healthcheck.startPeriod.trim()}`);
      }
    }

    if (svc.cpus.trim() || svc.memory.trim() || svc.memReservation.trim()) {
      lines.push(`${indent(2)}deploy:`);
      lines.push(`${indent(3)}resources:`);
      if (svc.cpus.trim() || svc.memory.trim()) {
        lines.push(`${indent(4)}limits:`);
        if (svc.cpus.trim()) {
          lines.push(`${indent(5)}cpus: ${formatYamlScalar(svc.cpus.trim())}`);
        }
        if (svc.memory.trim()) {
          lines.push(`${indent(5)}memory: ${formatYamlScalar(svc.memory.trim())}`);
        }
      }
      if (svc.memReservation.trim()) {
        lines.push(`${indent(4)}reservations:`);
        lines.push(`${indent(5)}memory: ${formatYamlScalar(svc.memReservation.trim())}`);
      }
    }

    if (svc.loggingDriver.trim() || svc.loggingMaxSize.trim() || svc.loggingMaxFile.trim()) {
      lines.push(`${indent(2)}logging:`);
      lines.push(`${indent(3)}driver: ${formatYamlScalar(svc.loggingDriver.trim() || 'json-file')}`);
      if (svc.loggingMaxSize.trim() || svc.loggingMaxFile.trim()) {
        lines.push(`${indent(3)}options:`);
        if (svc.loggingMaxSize.trim()) {
          lines.push(`${indent(4)}max-size: ${formatYamlScalar(svc.loggingMaxSize.trim())}`);
        }
        if (svc.loggingMaxFile.trim()) {
          lines.push(`${indent(4)}max-file: ${formatYamlScalar(svc.loggingMaxFile.trim())}`);
        }
      }
    }

    if (svc.capAdd.length > 0) {
      lines.push(`${indent(2)}cap_add:`);
      for (const c of svc.capAdd.filter(Boolean)) {
        lines.push(`${indent(3)}- ${formatYamlScalar(c)}`);
      }
    }
    if (svc.capDrop.length > 0) {
      lines.push(`${indent(2)}cap_drop:`);
      for (const c of svc.capDrop.filter(Boolean)) {
        lines.push(`${indent(3)}- ${formatYamlScalar(c)}`);
      }
    }

    const validLabels = svc.labels.filter(l => l.key.trim());
    if (validLabels.length > 0) {
      lines.push(`${indent(2)}labels:`);
      for (const l of validLabels) {
        lines.push(`${indent(3)}${formatYamlKey(l.key.trim())}: ${formatYamlScalar(l.value)}`);
      }
    }

    const validProfiles = svc.profiles.map(s => s.trim()).filter(Boolean);
    if (validProfiles.length > 0) {
      lines.push(`${indent(2)}profiles:`);
      for (const prof of validProfiles) {
        lines.push(`${indent(3)}- ${formatYamlScalar(prof)}`);
      }
    }
  }

  // Top-level networks
  const validNetworks = config.networks.filter(n => n.name.trim());
  if (validNetworks.length > 0) {
    lines.push('');
    lines.push('networks:');
    for (const net of validNetworks) {
      const key = formatYamlKey(net.name.trim());
      if (!net.driver && !net.external && !net.subnet) {
        lines.push(`${indent(1)}${key}:`);
      } else {
        lines.push(`${indent(1)}${key}:`);
        if (net.external) {
          lines.push(`${indent(2)}external: true`);
        } else {
          if (net.driver) lines.push(`${indent(2)}driver: ${formatYamlScalar(net.driver)}`);
          if (net.subnet.trim()) {
            lines.push(`${indent(2)}ipam:`);
            lines.push(`${indent(3)}config:`);
            lines.push(`${indent(4)}- subnet: ${formatYamlScalar(net.subnet.trim())}`);
          }
        }
      }
    }
  }

  // Top-level volumes
  const validVolumes = config.volumes.filter(v => v.name.trim());
  if (validVolumes.length > 0) {
    lines.push('');
    lines.push('volumes:');
    for (const vol of validVolumes) {
      const key = formatYamlKey(vol.name.trim());
      if (!vol.driver && !vol.external) {
        lines.push(`${indent(1)}${key}:`);
      } else {
        lines.push(`${indent(1)}${key}:`);
        if (vol.external) {
          lines.push(`${indent(2)}external: true`);
        } else if (vol.driver) {
          lines.push(`${indent(2)}driver: ${formatYamlScalar(vol.driver)}`);
        }
      }
    }
  }

  return `${lines.join('\n')}\n`;
}

// ==================== docker run 命令解析 (docker run -> Compose) ====================

function splitShellCommands(raw: string): string[][] {
  // Remove backslash-newline continuations first
  const joined = raw.replace(/\\\r?\n/g, ' ');
  const commands: string[][] = [];
  let current: string[] = [];
  let token = '';
  let inToken = false;
  let quote: '"' | "'" | null = null;

  const pushToken = () => {
    if (inToken) {
      current.push(token);
      token = '';
      inToken = false;
    }
  };
  const pushCommand = () => {
    pushToken();
    if (current.length > 0) {
      commands.push(current);
      current = [];
    }
  };

  for (let i = 0; i < joined.length; i++) {
    const ch = joined[i];
    if (quote) {
      if (ch === quote) {
        quote = null;
      } else if (quote === '"' && ch === '\\' && i + 1 < joined.length) {
        token += joined[++i];
      } else {
        token += ch;
      }
      inToken = true;
      continue;
    }

    if (ch === '#') {
      // Skip comment until newline
      while (i < joined.length && joined[i] !== '\n') i++;
      pushCommand();
      continue;
    }
    if (ch === '"' || ch === "'") {
      quote = ch;
      inToken = true;
      continue;
    }
    if (ch === '\\' && i + 1 < joined.length) {
      token += joined[++i];
      inToken = true;
      continue;
    }
    if (ch === '\n' || ch === ';') {
      pushCommand();
      continue;
    }
    if (ch === '&' && joined[i + 1] === '&') {
      i++;
      pushCommand();
      continue;
    }
    if (/\s/.test(ch)) {
      pushToken();
      continue;
    }
    token += ch;
    inToken = true;
  }
  pushCommand();
  return commands;
}

function parsePortSpec(raw: string): ComposePortMapping | null {
  let clean = raw.trim();
  if (!clean) return null;
  let protocol: 'tcp' | 'udp' = 'tcp';
  const protoMatch = clean.match(/\/(tcp|udp)$/i);
  if (protoMatch) {
    protocol = protoMatch[1].toLowerCase() as 'tcp' | 'udp';
    clean = clean.slice(0, -protoMatch[0].length);
  }
  const parts = clean.split(':');
  if (parts.length === 1) {
    return { hostIp: '', host: parts[0], container: parts[0], protocol };
  }
  if (parts.length === 2) {
    return { hostIp: '', host: parts[0], container: parts[1], protocol };
  }
  return {
    hostIp: parts.slice(0, parts.length - 2).join(':'),
    host: parts[parts.length - 2],
    container: parts[parts.length - 1],
    protocol,
  };
}

function parseVolumeSpec(raw: string): ComposeVolumeMount | null {
  const clean = raw.trim();
  if (!clean) return null;

  // Handle Windows drive prefix like C:\path:/app or C:/path:/app:ro
  let drivePrefix = '';
  let rest = clean;
  if (/^[A-Za-z]:[\\/]/.test(clean)) {
    drivePrefix = clean.slice(0, 2);
    rest = clean.slice(2);
  }

  const parts = rest.split(':');
  if (parts.length === 1) {
    return { source: '', target: drivePrefix + parts[0], mode: '' };
  }
  const last = parts[parts.length - 1];
  if (parts.length >= 3 && (last === 'ro' || last === 'rw')) {
    return {
      source: drivePrefix + parts.slice(0, parts.length - 2).join(':'),
      target: parts[parts.length - 2],
      mode: last,
    };
  }
  return {
    source: drivePrefix + parts.slice(0, parts.length - 1).join(':'),
    target: parts[parts.length - 1],
    mode: '',
  };
}

function parseMountFlag(raw: string): ComposeVolumeMount | null {
  const kv = new Map<string, string>();
  for (const part of raw.split(',')) {
    const eq = part.indexOf('=');
    if (eq > 0) {
      kv.set(part.slice(0, eq).trim().toLowerCase(), part.slice(eq + 1).trim());
    } else if (part.trim().toLowerCase() === 'readonly' || part.trim().toLowerCase() === 'ro') {
      kv.set('readonly', 'true');
    }
  }
  const target = kv.get('dst') || kv.get('destination') || kv.get('target') || '';
  if (!target) return null;
  const source = kv.get('src') || kv.get('source') || '';
  const ro = kv.get('readonly') === 'true' || kv.get('ro') === 'true';
  return { source, target, mode: ro ? 'ro' : '' };
}

function deriveServiceName(image: string, containerName: string, used: Set<string>): string {
  let base = (containerName || image || 'app')
    .split('@')[0]
    .split(':')[0]
    .split('/')
    .pop() || 'app';
  base = base.toLowerCase().replace(/[^a-z0-9_-]+/g, '-').replace(/^-+|-+$/g, '');
  if (!base) base = 'app';
  let candidate = base;
  let idx = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${idx++}`;
  }
  used.add(candidate);
  return candidate;
}

const DOCKER_RUN_VALUE_FLAGS = new Set([
  '--name',
  '-p', '--publish',
  '--expose',
  '-v', '--volume',
  '--mount',
  '--tmpfs',
  '-e', '--env',
  '--env-file',
  '--network', '--net',
  '--restart',
  '-w', '--workdir',
  '-u', '--user',
  '-h', '--hostname',
  '--platform',
  '--entrypoint',
  '--pull',
  '--shm-size',
  '--cpus',
  '-m', '--memory',
  '--memory-reservation',
  '--add-host',
  '--dns',
  '--cap-add',
  '--cap-drop',
  '-l', '--label',
  '--log-driver',
  '--log-opt',
  '--health-cmd',
  '--health-interval',
  '--health-timeout',
  '--health-retries',
  '--health-start-period',
  '--pid',
  '--ipc',
  '--ulimit',
  '--device',
  '--gpus',
]);

/**
 * 解析一条或多条 `docker run` CLI 命令为 Compose 服务、网络与数据卷定义
 */
export function parseDockerRunCommand(input: string): DockerRunParseResult {
  const cmdGroups = splitShellCommands(input);
  const services: ComposeService[] = [];
  const networkNames = new Set<string>();
  const volumeNames = new Set<string>();
  const usedServiceNames = new Set<string>();
  const notes: string[] = [];
  const warnings: string[] = [];

  for (const tokens of cmdGroups) {
    let idx = 0;
    if (tokens[idx] === 'sudo') idx++;
    if (tokens[idx] === 'docker' || tokens[idx] === 'podman') idx++;
    if (tokens[idx] === 'container') idx++;
    if (tokens[idx] === 'run') idx++;

    if (idx >= tokens.length) continue;

    const svc = createEmptyService({ restart: '' });
    let image = '';
    const cmdArgs: string[] = [];
    let hasImage = false;

    for (let i = idx; i < tokens.length; i++) {
      const tok = tokens[i];
      if (hasImage) {
        cmdArgs.push(tok);
        continue;
      }

      if (tok === '--') {
        if (i + 1 < tokens.length) {
          image = tokens[++i];
          hasImage = true;
          cmdArgs.push(...tokens.slice(i + 1));
        }
        break;
      }

      if (!tok.startsWith('-') || tok === '-') {
        image = tok;
        hasImage = true;
        continue;
      }

      // Split --flag=value
      let flag = tok;
      let inlineValue: string | null = null;
      const eqPos = tok.indexOf('=');
      if (eqPos > 0) {
        flag = tok.slice(0, eqPos);
        inlineValue = tok.slice(eqPos + 1);
      }

      // Combined short boolean flags like -itd, -dit
      if (/^-[ditP]{2,}$/.test(flag) && inlineValue === null) {
        if (flag.includes('i')) svc.stdinOpen = true;
        if (flag.includes('t')) svc.tty = true;
        continue;
      }

      const consumeValue = (): string => {
        if (inlineValue !== null) return inlineValue;
        if (i + 1 < tokens.length) return tokens[++i];
        return '';
      };

      switch (flag) {
        case '-d':
        case '--detach':
          break;
        case '-i':
        case '--interactive':
          svc.stdinOpen = true;
          break;
        case '-t':
        case '--tty':
          svc.tty = true;
          break;
        case '--init':
          svc.init = true;
          break;
        case '--rm':
          notes.push('Skipped --rm (docker-compose manages container lifecycle separately).');
          break;
        case '--privileged':
          svc.privileged = true;
          break;
        case '--read-only':
          svc.readOnly = true;
          break;
        case '--name':
          svc.containerName = consumeValue();
          break;
        case '-p':
        case '--publish': {
          const parsed = parsePortSpec(consumeValue());
          if (parsed) svc.ports.push(parsed);
          break;
        }
        case '--expose': {
          const v = consumeValue();
          if (v) svc.expose.push(v);
          break;
        }
        case '-v':
        case '--volume': {
          const parsed = parseVolumeSpec(consumeValue());
          if (parsed) {
            svc.volumes.push(parsed);
            if (isNamedVolumeSource(parsed.source)) {
              volumeNames.add(parsed.source);
            }
          }
          break;
        }
        case '--mount': {
          const parsed = parseMountFlag(consumeValue());
          if (parsed) {
            svc.volumes.push(parsed);
            if (isNamedVolumeSource(parsed.source)) {
              volumeNames.add(parsed.source);
            }
          }
          break;
        }
        case '--tmpfs': {
          const v = consumeValue();
          if (v) svc.tmpfs.push(v);
          break;
        }
        case '-e':
        case '--env': {
          const v = consumeValue();
          const eq = v.indexOf('=');
          if (eq >= 0) {
            svc.environment.push({ key: v.slice(0, eq), value: v.slice(eq + 1) });
          } else if (v) {
            svc.environment.push({ key: v, value: `\${${v}}` });
          }
          break;
        }
        case '--env-file': {
          const v = consumeValue();
          if (v) svc.envFile.push(v);
          break;
        }
        case '--network':
        case '--net': {
          const v = consumeValue().trim();
          if (v === 'host' || v === 'bridge' || v === 'none' || v.startsWith('container:')) {
            svc.networkMode = v;
          } else if (v) {
            svc.networks.push(v);
            networkNames.add(v);
          }
          break;
        }
        case '--restart': {
          const v = consumeValue().trim();
          if (v.startsWith('on-failure')) svc.restart = 'on-failure';
          else if (v === 'no' || v === 'always' || v === 'unless-stopped') svc.restart = v;
          break;
        }
        case '-w':
        case '--workdir':
          svc.workingDir = consumeValue();
          break;
        case '-u':
        case '--user':
          svc.user = consumeValue();
          break;
        case '-h':
        case '--hostname':
          svc.hostname = consumeValue();
          break;
        case '--platform':
          svc.platform = consumeValue();
          break;
        case '--entrypoint':
          svc.entrypoint = consumeValue();
          break;
        case '--pull': {
          const v = consumeValue().trim();
          if (v === 'always' || v === 'never' || v === 'missing' || v === 'build') {
            svc.pullPolicy = v;
          }
          break;
        }
        case '--shm-size':
          svc.shmSize = consumeValue();
          break;
        case '--cpus':
          svc.cpus = consumeValue();
          break;
        case '-m':
        case '--memory':
          svc.memory = consumeValue();
          break;
        case '--memory-reservation':
          svc.memReservation = consumeValue();
          break;
        case '--add-host': {
          const v = consumeValue();
          if (v) svc.extraHosts.push(v);
          break;
        }
        case '--dns': {
          const v = consumeValue();
          if (v) svc.dns.push(v);
          break;
        }
        case '--cap-add': {
          const v = consumeValue();
          if (v) svc.capAdd.push(v);
          break;
        }
        case '--cap-drop': {
          const v = consumeValue();
          if (v) svc.capDrop.push(v);
          break;
        }
        case '-l':
        case '--label': {
          const v = consumeValue();
          const eq = v.indexOf('=');
          if (eq >= 0) {
            svc.labels.push({ key: v.slice(0, eq), value: v.slice(eq + 1) });
          } else if (v) {
            svc.labels.push({ key: v, value: '' });
          }
          break;
        }
        case '--log-driver':
          svc.loggingDriver = consumeValue();
          break;
        case '--log-opt': {
          const v = consumeValue();
          const eq = v.indexOf('=');
          if (eq > 0) {
            const k = v.slice(0, eq).trim();
            const val = v.slice(eq + 1).trim();
            if (k === 'max-size') svc.loggingMaxSize = val;
            else if (k === 'max-file') svc.loggingMaxFile = val;
          }
          break;
        }
        case '--health-cmd':
          svc.healthcheck.enabled = true;
          svc.healthcheck.test = consumeValue();
          break;
        case '--health-interval':
          svc.healthcheck.enabled = true;
          svc.healthcheck.interval = consumeValue();
          break;
        case '--health-timeout':
          svc.healthcheck.enabled = true;
          svc.healthcheck.timeout = consumeValue();
          break;
        case '--health-retries':
          svc.healthcheck.enabled = true;
          svc.healthcheck.retries = Number(consumeValue()) || 3;
          break;
        case '--health-start-period':
          svc.healthcheck.enabled = true;
          svc.healthcheck.startPeriod = consumeValue();
          break;
        default: {
          if (DOCKER_RUN_VALUE_FLAGS.has(flag) && inlineValue === null && i + 1 < tokens.length) {
            const skippedVal = tokens[++i];
            warnings.push(`Unsupported option ignored: ${flag} ${skippedVal}`);
          } else {
            warnings.push(`Unsupported flag ignored: ${tok}`);
          }
          break;
        }
      }
    }

    if (!image) continue;
    svc.image = image;
    svc.name = deriveServiceName(image, svc.containerName, usedServiceNames);
    if (cmdArgs.length > 0) {
      svc.command = cmdArgs
        .map(a => (/[\s"'$`\\]/.test(a) ? JSON.stringify(a) : a))
        .join(' ');
    }
    services.push(svc);
  }

  return {
    services,
    networks: Array.from(networkNames).map(name => ({
      name,
      driver: 'bridge',
      external: false,
      subnet: '',
    })),
    volumes: Array.from(volumeNames).map(name => ({
      name,
      driver: '',
      external: false,
    })),
    notes: Array.from(new Set(notes)),
    warnings: Array.from(new Set(warnings)),
  };
}

// ==================== Compose -> docker run CLI 生成 ====================

function shellQuote(val: string): string {
  if (/^[A-Za-z0-9_./:=+-]+$/.test(val)) return val;
  return `'${val.replace(/'/g, `'\\''`)}'`;
}

export function serviceToDockerRun(svc: ComposeService, multiline = true): string {
  const args: string[] = ['docker run -d'];

  const name = svc.containerName.trim() || svc.name.trim();
  if (name) args.push(`--name ${shellQuote(name)}`);
  if (svc.hostname.trim()) args.push(`--hostname ${shellQuote(svc.hostname.trim())}`);
  if (svc.platform.trim()) args.push(`--platform ${shellQuote(svc.platform.trim())}`);
  if (svc.restart) args.push(`--restart ${svc.restart}`);
  if (svc.pullPolicy && svc.pullPolicy !== 'build') {
    args.push(`--pull ${svc.pullPolicy}`);
  }
  if (svc.init) args.push('--init');
  if (svc.stdinOpen) args.push('-i');
  if (svc.tty) args.push('-t');
  if (svc.privileged) args.push('--privileged');
  if (svc.readOnly) args.push('--read-only');
  if (svc.shmSize.trim()) args.push(`--shm-size ${shellQuote(svc.shmSize.trim())}`);
  if (svc.workingDir.trim()) args.push(`-w ${shellQuote(svc.workingDir.trim())}`);
  if (svc.user.trim()) args.push(`-u ${shellQuote(svc.user.trim())}`);
  if (svc.entrypoint.trim()) args.push(`--entrypoint ${shellQuote(svc.entrypoint.trim())}`);

  if (svc.networkMode.trim()) {
    args.push(`--network ${shellQuote(svc.networkMode.trim())}`);
  } else if (svc.networks.length > 0 && svc.networks[0].trim()) {
    args.push(`--network ${shellQuote(svc.networks[0].trim())}`);
  }

  for (const p of svc.ports) {
    if (p.container.trim()) {
      args.push(`-p ${shellQuote(formatPortString(p))}`);
    }
  }
  for (const ex of svc.expose) {
    if (ex.trim()) args.push(`--expose ${shellQuote(ex.trim())}`);
  }
  for (const v of svc.volumes) {
    if (v.target.trim()) {
      args.push(`-v ${shellQuote(formatVolumeString(v))}`);
    }
  }
  for (const tp of svc.tmpfs) {
    if (tp.trim()) args.push(`--tmpfs ${shellQuote(tp.trim())}`);
  }
  for (const e of svc.environment) {
    if (e.key.trim()) {
      args.push(`-e ${shellQuote(`${e.key.trim()}=${e.value}`)}`);
    }
  }
  for (const ef of svc.envFile) {
    if (ef.trim()) args.push(`--env-file ${shellQuote(ef.trim())}`);
  }
  for (const eh of svc.extraHosts) {
    if (eh.trim()) args.push(`--add-host ${shellQuote(eh.trim())}`);
  }
  for (const d of svc.dns) {
    if (d.trim()) args.push(`--dns ${shellQuote(d.trim())}`);
  }
  if (svc.cpus.trim()) args.push(`--cpus ${shellQuote(svc.cpus.trim())}`);
  if (svc.memory.trim()) args.push(`-m ${shellQuote(svc.memory.trim())}`);
  if (svc.memReservation.trim()) {
    args.push(`--memory-reservation ${shellQuote(svc.memReservation.trim())}`);
  }
  if (svc.loggingDriver.trim()) {
    args.push(`--log-driver ${shellQuote(svc.loggingDriver.trim())}`);
  }
  if (svc.loggingMaxSize.trim()) {
    args.push(`--log-opt max-size=${shellQuote(svc.loggingMaxSize.trim())}`);
  }
  if (svc.loggingMaxFile.trim()) {
    args.push(`--log-opt max-file=${shellQuote(svc.loggingMaxFile.trim())}`);
  }
  for (const c of svc.capAdd) {
    if (c.trim()) args.push(`--cap-add ${shellQuote(c.trim())}`);
  }
  for (const c of svc.capDrop) {
    if (c.trim()) args.push(`--cap-drop ${shellQuote(c.trim())}`);
  }
  for (const l of svc.labels) {
    if (l.key.trim()) args.push(`-l ${shellQuote(`${l.key.trim()}=${l.value}`)}`);
  }
  if (svc.healthcheck.enabled && svc.healthcheck.test.trim()) {
    args.push(`--health-cmd ${shellQuote(svc.healthcheck.test.trim())}`);
    if (svc.healthcheck.interval.trim()) {
      args.push(`--health-interval ${shellQuote(svc.healthcheck.interval.trim())}`);
    }
    if (svc.healthcheck.timeout.trim()) {
      args.push(`--health-timeout ${shellQuote(svc.healthcheck.timeout.trim())}`);
    }
    if (svc.healthcheck.retries > 0) {
      args.push(`--health-retries ${svc.healthcheck.retries}`);
    }
    if (svc.healthcheck.startPeriod.trim()) {
      args.push(`--health-start-period ${shellQuote(svc.healthcheck.startPeriod.trim())}`);
    }
  }

  const image = svc.image.trim() || `${svc.name || 'app'}:latest`;
  args.push(shellQuote(image));
  if (svc.command.trim()) {
    args.push(svc.command.trim());
  }

  return multiline ? args.join(' \\\n  ') : args.join(' ');
}

export function generateDockerRunCommands(config: ComposeConfig, multiline = true): string {
  if (config.services.length === 0) return '# No services configured';
  return config.services
    .map(svc => `# Service: ${svc.name}\n${serviceToDockerRun(svc, multiline)}`)
    .join('\n\n');
}

// ==================== compose.yml 反解导入 ====================

function asStringArray(val: unknown): string[] {
  if (Array.isArray(val)) return val.map(v => String(v ?? '')).filter(Boolean);
  if (typeof val === 'string' && val.trim()) return [val.trim()];
  return [];
}

function parseEnvEntries(val: unknown): ComposeKeyValue[] {
  if (Array.isArray(val)) {
    return val.map(item => {
      const str = String(item ?? '');
      const eq = str.indexOf('=');
      return eq >= 0
        ? { key: str.slice(0, eq).trim(), value: str.slice(eq + 1) }
        : { key: str.trim(), value: '' };
    });
  }
  if (val && typeof val === 'object') {
    return Object.entries(val as Record<string, unknown>).map(([k, v]) => ({
      key: k,
      value: v === null || v === undefined ? '' : String(v),
    }));
  }
  return [];
}

export function parseComposeYaml(yamlText: string): ComposeConfig {
  const parsed = parseConfig(yamlText, 'yaml', DEFAULT_CONVERT_OPTIONS);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('YAML root must be an object with "services"');
  }
  const root = parsed as Record<string, unknown>;
  const rawServices = root.services;
  if (!rawServices || typeof rawServices !== 'object' || Array.isArray(rawServices)) {
    throw new Error('Missing or invalid "services" mapping');
  }

  const services: ComposeService[] = [];
  for (const [name, rawVal] of Object.entries(rawServices as Record<string, unknown>)) {
    const obj = (rawVal && typeof rawVal === 'object' ? rawVal : {}) as Record<string, unknown>;

    // Build
    let buildEnabled = false;
    let buildContext = '.';
    let buildDockerfile = 'Dockerfile';
    let buildTarget = '';
    if (typeof obj.build === 'string') {
      buildEnabled = true;
      buildContext = obj.build;
    } else if (obj.build && typeof obj.build === 'object') {
      buildEnabled = true;
      const b = obj.build as Record<string, unknown>;
      buildContext = String(b.context ?? '.');
      buildDockerfile = String(b.dockerfile ?? 'Dockerfile');
      buildTarget = String(b.target ?? '');
    }

    // Ports
    const ports: ComposePortMapping[] = [];
    if (Array.isArray(obj.ports)) {
      for (const item of obj.ports) {
        if (typeof item === 'string' || typeof item === 'number') {
          const p = parsePortSpec(String(item));
          if (p) ports.push(p);
        } else if (item && typeof item === 'object') {
          const po = item as Record<string, unknown>;
          ports.push({
            hostIp: String(po.host_ip ?? ''),
            host: String(po.published ?? ''),
            container: String(po.target ?? ''),
            protocol: String(po.protocol ?? 'tcp').toLowerCase() === 'udp' ? 'udp' : 'tcp',
          });
        }
      }
    }

    // Volumes
    const volumes: ComposeVolumeMount[] = [];
    if (Array.isArray(obj.volumes)) {
      for (const item of obj.volumes) {
        if (typeof item === 'string') {
          const v = parseVolumeSpec(item);
          if (v) volumes.push(v);
        } else if (item && typeof item === 'object') {
          const vo = item as Record<string, unknown>;
          volumes.push({
            source: String(vo.source ?? ''),
            target: String(vo.target ?? ''),
            mode: vo.read_only ? 'ro' : '',
          });
        }
      }
    }

    // Networks
    let networks: string[] = [];
    if (Array.isArray(obj.networks)) {
      networks = obj.networks.map(String);
    } else if (obj.networks && typeof obj.networks === 'object') {
      networks = Object.keys(obj.networks as Record<string, unknown>);
    }

    // Depends On
    const dependsOn: ComposeDependsOn[] = [];
    if (Array.isArray(obj.depends_on)) {
      for (const dep of obj.depends_on) {
        dependsOn.push({ service: String(dep), condition: 'service_started' });
      }
    } else if (obj.depends_on && typeof obj.depends_on === 'object') {
      for (const [depName, depCfg] of Object.entries(obj.depends_on as Record<string, unknown>)) {
        const cond =
          depCfg && typeof depCfg === 'object'
            ? String((depCfg as Record<string, unknown>).condition ?? 'service_started')
            : 'service_started';
        const validCond: DependsCondition =
          cond === 'service_healthy' || cond === 'service_completed_successfully'
            ? cond
            : 'service_started';
        dependsOn.push({ service: depName, condition: validCond });
      }
    }

    // Healthcheck
    const hcObj =
      obj.healthcheck && typeof obj.healthcheck === 'object'
        ? (obj.healthcheck as Record<string, unknown>)
        : null;
    let hcTest = '';
    if (hcObj?.test) {
      if (Array.isArray(hcObj.test)) {
        const arr = hcObj.test.map(String);
        if (arr[0] === 'CMD-SHELL' && arr.length === 2) hcTest = arr[1];
        else hcTest = JSON.stringify(arr);
      } else {
        hcTest = String(hcObj.test);
      }
    }

    // Deploy resources
    const deploy = (obj.deploy as Record<string, unknown> | undefined)?.resources as
      | Record<string, unknown>
      | undefined;
    const limits = deploy?.limits as Record<string, unknown> | undefined;
    const reservations = deploy?.reservations as Record<string, unknown> | undefined;

    // Logging
    const logging = obj.logging as Record<string, unknown> | undefined;
    const logOpts = logging?.options as Record<string, unknown> | undefined;

    const command = Array.isArray(obj.command)
      ? obj.command.map(String).join(' ')
      : obj.command !== undefined
        ? String(obj.command)
        : '';

    const entrypoint = Array.isArray(obj.entrypoint)
      ? obj.entrypoint.map(String).join(' ')
      : obj.entrypoint !== undefined
        ? String(obj.entrypoint)
        : '';

    const restartRaw = String(obj.restart ?? '');
    const restart: RestartPolicy =
      restartRaw === 'no' ||
      restartRaw === 'always' ||
      restartRaw === 'on-failure' ||
      restartRaw === 'unless-stopped'
        ? restartRaw
        : '';

    const pullRaw = String(obj.pull_policy ?? '');
    const pullPolicy: PullPolicy =
      pullRaw === 'always' ||
      pullRaw === 'never' ||
      pullRaw === 'missing' ||
      pullRaw === 'build'
        ? pullRaw
        : '';

    services.push(
      createEmptyService({
        name,
        image: String(obj.image ?? ''),
        buildEnabled,
        buildContext,
        buildDockerfile,
        buildTarget,
        containerName: String(obj.container_name ?? ''),
        hostname: String(obj.hostname ?? ''),
        platform: String(obj.platform ?? ''),
        restart,
        pullPolicy,
        command,
        entrypoint,
        workingDir: String(obj.working_dir ?? ''),
        user: String(obj.user ?? ''),
        init: Boolean(obj.init ?? false),
        tty: Boolean(obj.tty ?? false),
        stdinOpen: Boolean(obj.stdin_open ?? false),
        privileged: Boolean(obj.privileged ?? false),
        readOnly: Boolean(obj.read_only ?? false),
        ports,
        expose: asStringArray(obj.expose),
        networkMode: String(obj.network_mode ?? ''),
        networks,
        extraHosts: asStringArray(obj.extra_hosts),
        dns: asStringArray(obj.dns),
        volumes,
        tmpfs: asStringArray(obj.tmpfs),
        environment: parseEnvEntries(obj.environment),
        envFile: asStringArray(obj.env_file),
        dependsOn,
        healthcheck: {
          enabled: Boolean(hcObj && !hcObj.disable && hcTest),
          test: hcTest,
          interval: String(hcObj?.interval ?? '10s'),
          timeout: String(hcObj?.timeout ?? '5s'),
          retries: Number(hcObj?.retries ?? 5) || 5,
          startPeriod: String(hcObj?.start_period ?? ''),
        },
        cpus: limits?.cpus !== undefined ? String(limits.cpus) : '',
        memory: limits?.memory !== undefined ? String(limits.memory) : '',
        memReservation: reservations?.memory !== undefined ? String(reservations.memory) : '',
        shmSize: String(obj.shm_size ?? ''),
        loggingDriver: String(logging?.driver ?? ''),
        loggingMaxSize: String(logOpts?.['max-size'] ?? ''),
        loggingMaxFile: String(logOpts?.['max-file'] ?? ''),
        capAdd: asStringArray(obj.cap_add),
        capDrop: asStringArray(obj.cap_drop),
        labels: parseEnvEntries(obj.labels),
        profiles: asStringArray(obj.profiles),
      })
    );
  }

  const networks: ComposeTopNetwork[] = [];
  if (root.networks && typeof root.networks === 'object' && !Array.isArray(root.networks)) {
    for (const [netName, netVal] of Object.entries(root.networks as Record<string, unknown>)) {
      const no = (netVal && typeof netVal === 'object' ? netVal : {}) as Record<string, unknown>;
      const ipamCfg = ((no.ipam as Record<string, unknown> | undefined)?.config as unknown[]) ?? [];
      const firstSubnet =
        ipamCfg[0] && typeof ipamCfg[0] === 'object'
          ? String((ipamCfg[0] as Record<string, unknown>).subnet ?? '')
          : '';
      networks.push({
        name: netName,
        driver: String(no.driver ?? 'bridge'),
        external: Boolean(no.external ?? false),
        subnet: firstSubnet,
      });
    }
  }

  const volumes: ComposeTopVolume[] = [];
  if (root.volumes && typeof root.volumes === 'object' && !Array.isArray(root.volumes)) {
    for (const [volName, volVal] of Object.entries(root.volumes as Record<string, unknown>)) {
      const vo = (volVal && typeof volVal === 'object' ? volVal : {}) as Record<string, unknown>;
      volumes.push({
        name: volName,
        driver: String(vo.driver ?? ''),
        external: Boolean(vo.external ?? false),
      });
    }
  }

  return {
    projectName: typeof root.name === 'string' ? root.name : '',
    legacyVersion: typeof root.version === 'string' ? root.version : '',
    services,
    networks,
    volumes,
  };
}

// ==================== .env 模板提取 ====================

export function generateDotEnv(config: ComposeConfig): string {
  const vars = new Map<string, string>();
  const varRegex = /\$\{([A-Za-z_][A-Za-z0-9_]*)(?::?-([^}]*))?\}/g;

  const scan = (str: string) => {
    let m: RegExpExecArray | null;
    while ((m = varRegex.exec(str)) !== null) {
      if (!vars.has(m[1])) {
        vars.set(m[1], m[2] ?? '');
      }
    }
  };

  for (const svc of config.services) {
    scan(svc.image);
    for (const e of svc.environment) {
      scan(e.value);
      if (!e.value.includes('${') && e.key.trim()) {
        // Also collect explicit env keys if not already present via interpolation
        if (!vars.has(e.key.trim())) {
          vars.set(e.key.trim(), e.value);
        }
      }
    }
    for (const p of svc.ports) {
      scan(p.host);
    }
  }

  if (vars.size === 0) {
    return '# No environment variables detected';
  }

  const lines = ['# Environment variables for Docker Compose'];
  for (const [k, v] of vars.entries()) {
    const quoted = /[\s#'"]/.test(v) ? `"${v.replace(/"/g, '\\"')}"` : v;
    lines.push(`${k}=${quoted}`);
  }
  return `${lines.join('\n')}\n`;
}

// ==================== 静态校验与一键修复 ====================

export function lintComposeConfig(config: ComposeConfig): ComposeLintIssue[] {
  const issues: ComposeLintIssue[] = [];
  const serviceNames = new Map<string, number>();
  const declaredNetworks = new Set(config.networks.map(n => n.name.trim()).filter(Boolean));
  const declaredVolumes = new Set(config.volumes.map(v => v.name.trim()).filter(Boolean));
  const usedHostPorts = new Map<string, string>();

  for (const svc of config.services) {
    const sName = svc.name.trim();
    if (!sName) {
      issues.push({
        level: 'error',
        code: 'empty-service-name',
        messageZh: '存在未命名的服务，请填写有效的服务标识名',
        messageEn: 'A service has an empty name.',
      });
    } else {
      serviceNames.set(sName, (serviceNames.get(sName) ?? 0) + 1);
    }

    if (!svc.image.trim() && !svc.buildEnabled) {
      issues.push({
        level: 'error',
        code: 'missing-image-or-build',
        service: sName,
        messageZh: `服务 "${sName}" 未配置 image 且未启用 build`,
        messageEn: `Service "${sName}" has neither image nor build configured.`,
      });
    }

    if (svc.networkMode === 'host' && svc.ports.some(p => p.container.trim())) {
      issues.push({
        level: 'warning',
        code: 'host-network-ports',
        service: sName,
        messageZh: `服务 "${sName}" 使用了 network_mode: host，此时 ports 端口映射将被忽略`,
        messageEn: `Service "${sName}" uses network_mode: host, so ports mappings will be ignored.`,
      });
    }

    for (const p of svc.ports) {
      if (!p.host.trim() || !p.container.trim()) continue;
      const key = `${p.hostIp || '0.0.0.0'}:${p.host.trim()}/${p.protocol}`;
      const existing = usedHostPorts.get(key);
      if (existing && existing !== sName) {
        issues.push({
          level: 'error',
          code: 'port-conflict',
          service: sName,
          messageZh: `宿主机端口 ${key} 在服务 "${existing}" 与 "${sName}" 之间存在冲突`,
          messageEn: `Host port ${key} conflicts between "${existing}" and "${sName}".`,
        });
      } else {
        usedHostPorts.set(key, sName);
      }
    }

    for (const v of svc.volumes) {
      if (isNamedVolumeSource(v.source) && !declaredVolumes.has(v.source.trim())) {
        issues.push({
          level: 'warning',
          code: 'undeclared-volume',
          service: sName,
          fixable: 'declare-missing',
          messageZh: `服务 "${sName}" 引用了命名卷 "${v.source}"，但顶层 volumes 中尚未声明`,
          messageEn: `Service "${sName}" uses named volume "${v.source}" which is not declared in top-level volumes.`,
        });
      }
    }

    for (const net of svc.networks) {
      if (net.trim() && !declaredNetworks.has(net.trim())) {
        issues.push({
          level: 'warning',
          code: 'undeclared-network',
          service: sName,
          fixable: 'declare-missing',
          messageZh: `服务 "${sName}" 引用了网络 "${net}"，但顶层 networks 中尚未声明`,
          messageEn: `Service "${sName}" uses network "${net}" which is not declared in top-level networks.`,
        });
      }
    }

    if (svc.image.trim().endsWith(':latest')) {
      issues.push({
        level: 'info',
        code: 'latest-tag',
        service: sName,
        messageZh: `服务 "${sName}" 使用了 :latest 标签，生产环境建议锁定具体版本镜像`,
        messageEn: `Service "${sName}" uses :latest tag; pinning an explicit version is recommended for reproducibility.`,
      });
    }
  }

  for (const [name, count] of serviceNames.entries()) {
    if (count > 1) {
      issues.push({
        level: 'error',
        code: 'duplicate-service-name',
        service: name,
        messageZh: `存在重名服务 "${name}"，YAML 键名必须唯一`,
        messageEn: `Duplicate service name "${name}" found.`,
      });
    }
  }

  // Validate depends_on targets and cycles
  const validServiceSet = new Set(config.services.map(s => s.name.trim()).filter(Boolean));
  const depGraph = new Map<string, string[]>();
  for (const svc of config.services) {
    const sName = svc.name.trim();
    depGraph.set(sName, []);
    for (const dep of svc.dependsOn) {
      const target = dep.service.trim();
      if (!target) continue;
      if (!validServiceSet.has(target)) {
        issues.push({
          level: 'error',
          code: 'unknown-dependency',
          service: sName,
          messageZh: `服务 "${sName}" 依赖了不存在的服务 "${target}"`,
          messageEn: `Service "${sName}" depends on unknown service "${target}".`,
        });
      } else {
        depGraph.get(sName)!.push(target);
      }
    }
  }

  const visitState = new Map<string, number>(); // 1=visiting, 2=done
  const hasCycle = (node: string): boolean => {
    const st = visitState.get(node) ?? 0;
    if (st === 1) return true;
    if (st === 2) return false;
    visitState.set(node, 1);
    for (const next of depGraph.get(node) ?? []) {
      if (hasCycle(next)) return true;
    }
    visitState.set(node, 2);
    return false;
  };
  for (const name of depGraph.keys()) {
    if (hasCycle(name)) {
      issues.push({
        level: 'error',
        code: 'circular-depends-on',
        service: name,
        messageZh: `服务依赖链存在循环依赖（涉及 "${name}"）`,
        messageEn: `Circular dependency detected in depends_on involving "${name}".`,
      });
      break;
    }
  }

  return issues;
}

/**
 * 自动补全服务中引用但尚未声明的顶层 networks / volumes
 */
export function autoDeclareMissingResources(config: ComposeConfig): number {
  let added = 0;
  const netSet = new Set(config.networks.map(n => n.name.trim()));
  const volSet = new Set(config.volumes.map(v => v.name.trim()));

  for (const svc of config.services) {
    for (const n of svc.networks) {
      const name = n.trim();
      if (name && !netSet.has(name)) {
        netSet.add(name);
        config.networks.push({ name, driver: 'bridge', external: false, subnet: '' });
        added++;
      }
    }
    for (const v of svc.volumes) {
      if (isNamedVolumeSource(v.source)) {
        const name = v.source.trim();
        if (!volSet.has(name)) {
          volSet.add(name);
          config.volumes.push({ name, driver: '', external: false });
          added++;
        }
      }
    }
  }
  return added;
}
