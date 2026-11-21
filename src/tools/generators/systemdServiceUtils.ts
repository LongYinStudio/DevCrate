export type SystemdScope = 'system' | 'user';
export type SystemdServiceType = 'simple' | 'exec' | 'forking' | 'oneshot' | 'notify' | 'idle';
export type SystemdRestartPolicy =
  | 'no'
  | 'on-success'
  | 'on-failure'
  | 'on-abnormal'
  | 'on-watchdog'
  | 'on-abort'
  | 'always';
export type SystemdKillMode = '' | 'control-group' | 'mixed' | 'process' | 'none';
export type SystemdProtectSystem = '' | 'true' | 'full' | 'strict';
export type SystemdProtectHome = '' | 'true' | 'read-only' | 'tmpfs';

export interface SystemdEnvPair {
  key: string;
  value: string;
}

export interface SystemdUnitConfig {
  unitName: string;
  scope: SystemdScope;
  description: string;
  documentation: string;
  // [Unit]
  after: string[];
  wants: string[];
  requires: string[];
  bindsTo: string[];
  startLimitIntervalSec: string;
  startLimitBurst: string;
  // [Service] Execution
  type: SystemdServiceType;
  remainAfterExit: boolean;
  execStart: string;
  execStartPre: string[];
  execStartPost: string[];
  execReload: string;
  execStop: string;
  pidFile: string;
  workingDirectory: string;
  user: string;
  group: string;
  umask: string;
  // [Service] Restart & Signals
  restart: SystemdRestartPolicy;
  restartSec: string;
  timeoutStartSec: string;
  timeoutStopSec: string;
  killMode: SystemdKillMode;
  killSignal: string;
  successExitStatus: string;
  // [Service] Environment & Logging
  environments: SystemdEnvPair[];
  environmentFiles: string[];
  syslogIdentifier: string;
  standardOutput: string;
  standardError: string;
  // [Service] Limits & Sandboxing
  limitNOFILE: string;
  limitNPROC: string;
  memoryMax: string;
  memoryHigh: string;
  cpuQuota: string;
  tasksMax: string;
  noNewPrivileges: boolean;
  privateTmp: boolean;
  protectSystem: SystemdProtectSystem;
  protectHome: SystemdProtectHome;
  readWritePaths: string[];
  ambientCapabilities: string;
  // [Install]
  wantedBy: string[];
  requiredBy: string[];
  alias: string;
}

export interface SystemdFormatOptions {
  includeHeaderComment: boolean;
}

export interface SystemdLintIssue {
  level: 'error' | 'warning' | 'info';
  code: string;
  messageZh: string;
  messageEn: string;
  fixable?: 'fix-user-scope';
}

export interface SystemdCommands {
  unitFilename: string;
  installPath: string;
  deployOneLiner: string;
  reloadAndEnable: string;
  statusCmd: string;
  restartCmd: string;
  stopCmd: string;
  logsFollow: string;
  logsErrors: string;
  analyzeVerify: string;
  lingerHint: string;
}

export function createEmptySystemdUnit(
  partial: Partial<SystemdUnitConfig> = {}
): SystemdUnitConfig {
  return {
    unitName: partial.unitName ?? 'myapp.service',
    scope: partial.scope ?? 'system',
    description: partial.description ?? 'My Application Service',
    documentation: partial.documentation ?? '',
    after: partial.after ? [...partial.after] : ['network-online.target'],
    wants: partial.wants ? [...partial.wants] : ['network-online.target'],
    requires: partial.requires ? [...partial.requires] : [],
    bindsTo: partial.bindsTo ? [...partial.bindsTo] : [],
    startLimitIntervalSec: partial.startLimitIntervalSec ?? '',
    startLimitBurst: partial.startLimitBurst ?? '',
    type: partial.type ?? 'simple',
    remainAfterExit: partial.remainAfterExit ?? false,
    execStart: partial.execStart ?? '/usr/bin/node /opt/myapp/dist/server.js',
    execStartPre: partial.execStartPre ? [...partial.execStartPre] : [],
    execStartPost: partial.execStartPost ? [...partial.execStartPost] : [],
    execReload: partial.execReload ?? '',
    execStop: partial.execStop ?? '',
    pidFile: partial.pidFile ?? '',
    workingDirectory: partial.workingDirectory ?? '/opt/myapp',
    user: partial.user ?? 'www-data',
    group: partial.group ?? 'www-data',
    umask: partial.umask ?? '',
    restart: partial.restart ?? 'on-failure',
    restartSec: partial.restartSec ?? '5s',
    timeoutStartSec: partial.timeoutStartSec ?? '',
    timeoutStopSec: partial.timeoutStopSec ?? '30s',
    killMode: partial.killMode ?? '',
    killSignal: partial.killSignal ?? '',
    successExitStatus: partial.successExitStatus ?? '',
    environments: partial.environments
      ? partial.environments.map(e => ({ ...e }))
      : [],
    environmentFiles: partial.environmentFiles ? [...partial.environmentFiles] : [],
    syslogIdentifier: partial.syslogIdentifier ?? '',
    standardOutput: partial.standardOutput ?? '',
    standardError: partial.standardError ?? '',
    limitNOFILE: partial.limitNOFILE ?? '',
    limitNPROC: partial.limitNPROC ?? '',
    memoryMax: partial.memoryMax ?? '',
    memoryHigh: partial.memoryHigh ?? '',
    cpuQuota: partial.cpuQuota ?? '',
    tasksMax: partial.tasksMax ?? '',
    noNewPrivileges: partial.noNewPrivileges ?? false,
    privateTmp: partial.privateTmp ?? false,
    protectSystem: partial.protectSystem ?? '',
    protectHome: partial.protectHome ?? '',
    readWritePaths: partial.readWritePaths ? [...partial.readWritePaths] : [],
    ambientCapabilities: partial.ambientCapabilities ?? '',
    wantedBy: partial.wantedBy ? [...partial.wantedBy] : ['multi-user.target'],
    requiredBy: partial.requiredBy ? [...partial.requiredBy] : [],
    alias: partial.alias ?? '',
  };
}

export function normalizeUnitFilename(rawName: string): string {
  const clean = rawName.trim().replace(/[^A-Za-z0-9_.@-]+/g, '-').replace(/^-+/, '');
  if (!clean) return 'myapp.service';
  return clean.endsWith('.service') ? clean : `${clean}.service`;
}

export function getUnitInstallPath(config: SystemdUnitConfig): string {
  const filename = normalizeUnitFilename(config.unitName);
  return config.scope === 'user'
    ? `~/.config/systemd/user/${filename}`
    : `/etc/systemd/system/${filename}`;
}

function formatEnvLine(key: string, value: string): string {
  const cleanVal = value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  return `Environment="${key.trim()}=${cleanVal}"`;
}

/**
 * 序列化生成规范的 systemd .service 单元文件文本
 */
export function generateSystemdUnit(
  config: SystemdUnitConfig,
  options: SystemdFormatOptions = { includeHeaderComment: true }
): string {
  const lines: string[] = [];
  const installPath = getUnitInstallPath(config);

  if (options.includeHeaderComment) {
    lines.push(`# Generated by DevCrate Systemd Service Generator`);
    lines.push(`# Target path: ${installPath}`);
    lines.push('');
  }

  // [Unit]
  lines.push('[Unit]');
  if (config.description.trim()) {
    lines.push(`Description=${config.description.trim()}`);
  }
  if (config.documentation.trim()) {
    lines.push(`Documentation=${config.documentation.trim()}`);
  }
  if (config.after.length > 0) {
    lines.push(`After=${config.after.join(' ')}`);
  }
  if (config.wants.length > 0) {
    lines.push(`Wants=${config.wants.join(' ')}`);
  }
  if (config.requires.length > 0) {
    lines.push(`Requires=${config.requires.join(' ')}`);
  }
  if (config.bindsTo.length > 0) {
    lines.push(`BindsTo=${config.bindsTo.join(' ')}`);
  }
  if (config.startLimitIntervalSec.trim()) {
    lines.push(`StartLimitIntervalSec=${config.startLimitIntervalSec.trim()}`);
  }
  if (config.startLimitBurst.trim()) {
    lines.push(`StartLimitBurst=${config.startLimitBurst.trim()}`);
  }

  // [Service]
  lines.push('');
  lines.push('[Service]');
  lines.push(`Type=${config.type}`);
  if (config.remainAfterExit) {
    lines.push('RemainAfterExit=yes');
  }
  if (config.scope === 'system') {
    if (config.user.trim()) lines.push(`User=${config.user.trim()}`);
    if (config.group.trim()) lines.push(`Group=${config.group.trim()}`);
  }
  if (config.workingDirectory.trim()) {
    lines.push(`WorkingDirectory=${config.workingDirectory.trim()}`);
  }
  if (config.umask.trim()) {
    lines.push(`UMask=${config.umask.trim()}`);
  }
  if (config.pidFile.trim()) {
    lines.push(`PIDFile=${config.pidFile.trim()}`);
  }

  for (const pre of config.execStartPre) {
    if (pre.trim()) lines.push(`ExecStartPre=${pre.trim()}`);
  }
  if (config.execStart.trim()) {
    lines.push(`ExecStart=${config.execStart.trim()}`);
  }
  for (const post of config.execStartPost) {
    if (post.trim()) lines.push(`ExecStartPost=${post.trim()}`);
  }
  if (config.execReload.trim()) {
    lines.push(`ExecReload=${config.execReload.trim()}`);
  }
  if (config.execStop.trim()) {
    lines.push(`ExecStop=${config.execStop.trim()}`);
  }

  if (config.restart && config.restart !== 'no') {
    lines.push(`Restart=${config.restart}`);
    if (config.restartSec.trim()) {
      lines.push(`RestartSec=${config.restartSec.trim()}`);
    }
  } else if (config.restart === 'no') {
    lines.push('Restart=no');
  }

  if (config.timeoutStartSec.trim()) {
    lines.push(`TimeoutStartSec=${config.timeoutStartSec.trim()}`);
  }
  if (config.timeoutStopSec.trim()) {
    lines.push(`TimeoutStopSec=${config.timeoutStopSec.trim()}`);
  }
  if (config.killMode) {
    lines.push(`KillMode=${config.killMode}`);
  }
  if (config.killSignal.trim()) {
    lines.push(`KillSignal=${config.killSignal.trim()}`);
  }
  if (config.successExitStatus.trim()) {
    lines.push(`SuccessExitStatus=${config.successExitStatus.trim()}`);
  }

  for (const ef of config.environmentFiles) {
    if (ef.trim()) lines.push(`EnvironmentFile=${ef.trim()}`);
  }
  for (const env of config.environments) {
    if (env.key.trim()) {
      lines.push(formatEnvLine(env.key, env.value));
    }
  }

  if (config.syslogIdentifier.trim()) {
    lines.push(`SyslogIdentifier=${config.syslogIdentifier.trim()}`);
  }
  if (config.standardOutput.trim()) {
    lines.push(`StandardOutput=${config.standardOutput.trim()}`);
  }
  if (config.standardError.trim()) {
    lines.push(`StandardError=${config.standardError.trim()}`);
  }

  // Limits & Sandboxing
  if (config.limitNOFILE.trim()) lines.push(`LimitNOFILE=${config.limitNOFILE.trim()}`);
  if (config.limitNPROC.trim()) lines.push(`LimitNPROC=${config.limitNPROC.trim()}`);
  if (config.memoryHigh.trim()) lines.push(`MemoryHigh=${config.memoryHigh.trim()}`);
  if (config.memoryMax.trim()) lines.push(`MemoryMax=${config.memoryMax.trim()}`);
  if (config.cpuQuota.trim()) lines.push(`CPUQuota=${config.cpuQuota.trim()}`);
  if (config.tasksMax.trim()) lines.push(`TasksMax=${config.tasksMax.trim()}`);

  if (config.noNewPrivileges) lines.push('NoNewPrivileges=true');
  if (config.privateTmp) lines.push('PrivateTmp=true');
  if (config.protectSystem) lines.push(`ProtectSystem=${config.protectSystem}`);
  if (config.protectHome) lines.push(`ProtectHome=${config.protectHome}`);
  if (config.readWritePaths.length > 0) {
    lines.push(`ReadWritePaths=${config.readWritePaths.join(' ')}`);
  }
  if (config.ambientCapabilities.trim()) {
    lines.push(`AmbientCapabilities=${config.ambientCapabilities.trim()}`);
  }

  // [Install]
  const hasInstall =
    config.wantedBy.length > 0 ||
    config.requiredBy.length > 0 ||
    Boolean(config.alias.trim());
  if (hasInstall) {
    lines.push('');
    lines.push('[Install]');
    if (config.wantedBy.length > 0) {
      lines.push(`WantedBy=${config.wantedBy.join(' ')}`);
    }
    if (config.requiredBy.length > 0) {
      lines.push(`RequiredBy=${config.requiredBy.join(' ')}`);
    }
    if (config.alias.trim()) {
      lines.push(`Alias=${config.alias.trim()}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

// ==================== 现有 .service 文件导入解析 ====================

function splitTokens(val: string): string[] {
  return val
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function parseEnvironmentAssignment(rawVal: string): SystemdEnvPair[] {
  const results: SystemdEnvPair[] = [];
  const trimmed = rawVal.trim();
  if (!trimmed) return results;

  // Handle quoted "KEY=VAL" or multiple space-separated entries
  const regex = /"([^"\\]*(?:\\.[^"\\]*)*)"|'([^']*)'|(\S+)/g;
  let match: RegExpExecArray | null;
  while ((match = regex.exec(trimmed)) !== null) {
    const token =
      match[1] !== undefined
        ? match[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\')
        : match[2] !== undefined
          ? match[2]
          : match[3];
    const eq = token.indexOf('=');
    if (eq > 0) {
      results.push({
        key: token.slice(0, eq).trim(),
        value: token.slice(eq + 1),
      });
    }
  }
  return results;
}

export function parseSystemdUnit(
  rawText: string,
  filenameHint = 'imported.service'
): SystemdUnitConfig {
  const joined = rawText.replace(/\\\r?\n/g, ' ');
  const cfg = createEmptySystemdUnit({
    unitName: normalizeUnitFilename(filenameHint),
    description: '',
    after: [],
    wants: [],
    requires: [],
    bindsTo: [],
    execStart: '',
    workingDirectory: '',
    user: '',
    group: '',
    restart: 'no',
    restartSec: '',
    timeoutStopSec: '',
    wantedBy: [],
  });

  let section: 'unit' | 'service' | 'install' | '' = '';
  let seenDirective = false;

  for (const rawLine of joined.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;

    const secMatch = line.match(/^\[([A-Za-z]+)\]$/);
    if (secMatch) {
      const s = secMatch[1].toLowerCase();
      if (s === 'unit' || s === 'service' || s === 'install') {
        section = s;
      } else {
        section = '';
      }
      continue;
    }

    const eq = line.indexOf('=');
    if (eq <= 0) continue;
    seenDirective = true;

    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim();
    const keyLower = key.toLowerCase();

    if (section === 'unit') {
      switch (keyLower) {
        case 'description':
          cfg.description = val;
          break;
        case 'documentation':
          cfg.documentation = val;
          break;
        case 'after':
          cfg.after.push(...splitTokens(val));
          break;
        case 'wants':
          cfg.wants.push(...splitTokens(val));
          break;
        case 'requires':
          cfg.requires.push(...splitTokens(val));
          break;
        case 'bindsto':
          cfg.bindsTo.push(...splitTokens(val));
          break;
        case 'startlimitintervalsec':
          cfg.startLimitIntervalSec = val;
          break;
        case 'startlimitburst':
          cfg.startLimitBurst = val;
          break;
      }
    } else if (section === 'service') {
      switch (keyLower) {
        case 'type':
          if (['simple', 'exec', 'forking', 'oneshot', 'notify', 'idle'].includes(val)) {
            cfg.type = val as SystemdServiceType;
          }
          break;
        case 'remainafterexit':
          cfg.remainAfterExit = ['yes', 'true', '1'].includes(val.toLowerCase());
          break;
        case 'execstart':
          if (!val) cfg.execStart = '';
          else cfg.execStart = val;
          break;
        case 'execstartpre':
          if (val) cfg.execStartPre.push(val);
          break;
        case 'execstartpost':
          if (val) cfg.execStartPost.push(val);
          break;
        case 'execreload':
          cfg.execReload = val;
          break;
        case 'execstop':
          cfg.execStop = val;
          break;
        case 'pidfile':
          cfg.pidFile = val;
          break;
        case 'workingdirectory':
          cfg.workingDirectory = val;
          break;
        case 'user':
          cfg.user = val;
          break;
        case 'group':
          cfg.group = val;
          break;
        case 'umask':
          cfg.umask = val;
          break;
        case 'restart':
          if (
            [
              'no',
              'on-success',
              'on-failure',
              'on-abnormal',
              'on-watchdog',
              'on-abort',
              'always',
            ].includes(val)
          ) {
            cfg.restart = val as SystemdRestartPolicy;
          }
          break;
        case 'restartsec':
          cfg.restartSec = val;
          break;
        case 'timeoutstartsec':
          cfg.timeoutStartSec = val;
          break;
        case 'timeoutstopsec':
          cfg.timeoutStopSec = val;
          break;
        case 'killmode':
          if (['control-group', 'mixed', 'process', 'none'].includes(val)) {
            cfg.killMode = val as SystemdKillMode;
          }
          break;
        case 'killsignal':
          cfg.killSignal = val;
          break;
        case 'successexitstatus':
          cfg.successExitStatus = val;
          break;
        case 'environment':
          cfg.environments.push(...parseEnvironmentAssignment(val));
          break;
        case 'environmentfile':
          if (val) cfg.environmentFiles.push(val);
          break;
        case 'syslogidentifier':
          cfg.syslogIdentifier = val;
          break;
        case 'standardoutput':
          cfg.standardOutput = val;
          break;
        case 'standarderror':
          cfg.standardError = val;
          break;
        case 'limitnofile':
          cfg.limitNOFILE = val;
          break;
        case 'limitnproc':
          cfg.limitNPROC = val;
          break;
        case 'memorymax':
          cfg.memoryMax = val;
          break;
        case 'memoryhigh':
          cfg.memoryHigh = val;
          break;
        case 'cpuquota':
          cfg.cpuQuota = val;
          break;
        case 'tasksmax':
          cfg.tasksMax = val;
          break;
        case 'nonewprivileges':
          cfg.noNewPrivileges = ['yes', 'true', '1'].includes(val.toLowerCase());
          break;
        case 'privatetmp':
          cfg.privateTmp = ['yes', 'true', '1'].includes(val.toLowerCase());
          break;
        case 'protectsystem':
          if (['true', 'yes', 'full', 'strict'].includes(val.toLowerCase())) {
            cfg.protectSystem = val.toLowerCase() === 'yes' ? 'true' : (val.toLowerCase() as SystemdProtectSystem);
          }
          break;
        case 'protecthome':
          if (['true', 'yes', 'read-only', 'tmpfs'].includes(val.toLowerCase())) {
            cfg.protectHome = val.toLowerCase() === 'yes' ? 'true' : (val.toLowerCase() as SystemdProtectHome);
          }
          break;
        case 'readwritepaths':
          cfg.readWritePaths.push(...splitTokens(val));
          break;
        case 'ambientcapabilities':
          cfg.ambientCapabilities = val;
          break;
      }
    } else if (section === 'install') {
      switch (keyLower) {
        case 'wantedby':
          cfg.wantedBy.push(...splitTokens(val));
          break;
        case 'requiredby':
          cfg.requiredBy.push(...splitTokens(val));
          break;
        case 'alias':
          cfg.alias = val;
          break;
      }
    }
  }

  if (!seenDirective) {
    throw new Error('No valid [Unit] / [Service] / [Install] directives found');
  }

  if (cfg.wantedBy.includes('default.target') && !cfg.user) {
    cfg.scope = 'user';
  }
  return cfg;
}

// ==================== 配套 systemctl / journalctl 命令生成 ====================

export function generateSystemdCommands(
  config: SystemdUnitConfig,
  unitText: string
): SystemdCommands {
  const unitFilename = normalizeUnitFilename(config.unitName);
  const installPath = getUnitInstallPath(config);
  const isUser = config.scope === 'user';
  const sc = isUser ? 'systemctl --user' : 'sudo systemctl';
  const jc = isUser ? 'journalctl --user' : 'sudo journalctl';

  const deployOneLiner = isUser
    ? `mkdir -p ~/.config/systemd/user && cat <<'EOF' > ${installPath}\n${unitText.trimEnd()}\nEOF`
    : `sudo tee ${installPath} > /dev/null <<'EOF'\n${unitText.trimEnd()}\nEOF`;

  return {
    unitFilename,
    installPath,
    deployOneLiner,
    reloadAndEnable: `${sc} daemon-reload && ${sc} enable --now ${unitFilename}`,
    statusCmd: `${sc} status ${unitFilename}`,
    restartCmd: `${sc} restart ${unitFilename}`,
    stopCmd: `${sc} stop ${unitFilename}`,
    logsFollow: `${jc} -u ${unitFilename} -f -n 100`,
    logsErrors: `${jc} -u ${unitFilename} -p err --since today`,
    analyzeVerify: isUser
      ? `systemd-analyze --user verify ${installPath}`
      : `sudo systemd-analyze verify ${installPath}`,
    lingerHint: isUser ? `sudo loginctl enable-linger $USER` : '',
  };
}

// ==================== 静态校验与一键修复 ====================

export function lintSystemdUnit(config: SystemdUnitConfig): SystemdLintIssue[] {
  const issues: SystemdLintIssue[] = [];

  if (!config.execStart.trim()) {
    issues.push({
      level: 'error',
      code: 'empty-exec-start',
      messageZh: '缺少 ExecStart 启动命令，systemd 服务无法启动',
      messageEn: 'ExecStart is required for a systemd service.',
    });
  } else {
    const firstToken = config.execStart.trim().replace(/^[@!-]+/, '').split(/\s+/)[0];
    if (firstToken && !firstToken.startsWith('/') && !firstToken.startsWith('$')) {
      issues.push({
        level: 'error',
        code: 'relative-exec-start',
        messageZh: `ExecStart 的可执行文件 "${firstToken}" 必须使用绝对路径（如 /usr/bin/${firstToken}）`,
        messageEn: `ExecStart executable "${firstToken}" must be an absolute path (e.g. /usr/bin/${firstToken}).`,
      });
    }
  }

  if (
    config.workingDirectory.trim() &&
    !config.workingDirectory.trim().startsWith('/') &&
    !config.workingDirectory.trim().startsWith('~') &&
    !config.workingDirectory.trim().startsWith('%')
  ) {
    issues.push({
      level: 'warning',
      code: 'relative-workdir',
      messageZh: 'WorkingDirectory 建议使用绝对路径（如 /opt/myapp）或 systemd 说明符（如 %h/app）',
      messageEn: 'WorkingDirectory should be an absolute path (e.g. /opt/myapp) or systemd specifier.',
    });
  }

  if (config.type === 'forking' && !config.pidFile.trim()) {
    issues.push({
      level: 'warning',
      code: 'forking-no-pidfile',
      messageZh: 'Type=forking 建议配合 PIDFile= 指定主进程 PID 文件路径，以便 systemd 准确追踪守护进程',
      messageEn: 'Type=forking should specify PIDFile= so systemd can reliably track the daemon main PID.',
    });
  }

  if (config.type === 'oneshot' && config.restart === 'always') {
    issues.push({
      level: 'error',
      code: 'oneshot-restart-always',
      messageZh: 'Type=oneshot 不允许使用 Restart=always（请改用 Type=simple 或将 Restart 设为 no/on-failure）',
      messageEn: 'Type=oneshot does not allow Restart=always (use Type=simple or Restart=no).',
    });
  }

  if (config.scope === 'user') {
    if (config.wantedBy.includes('multi-user.target')) {
      issues.push({
        level: 'warning',
        code: 'user-scope-target',
        fixable: 'fix-user-scope',
        messageZh: '用户级服务 (--user) 不存在 multi-user.target，WantedBy 应使用 default.target',
        messageEn: 'User-level (--user) services must use WantedBy=default.target instead of multi-user.target.',
      });
    }
    if (config.user.trim() || config.group.trim()) {
      issues.push({
        level: 'info',
        code: 'user-scope-user-ignored',
        messageZh: '用户级服务 (--user) 以当前登录用户运行，已自动忽略 User/Group 字段',
        messageEn: 'User-level (--user) services run as the logged-in user; User/Group directives are omitted.',
      });
    }
  } else if (config.wantedBy.length === 0 && config.requiredBy.length === 0) {
    issues.push({
      level: 'info',
      code: 'no-install-target',
      messageZh: '未配置 [Install] WantedBy，执行 systemctl enable 时将无法创建开机自启软链接',
      messageEn: 'No [Install] WantedBy target set; "systemctl enable" will have no effect.',
    });
  }

  if (config.protectSystem === 'strict' && config.readWritePaths.length === 0) {
    issues.push({
      level: 'info',
      code: 'strict-protect-no-rw',
      messageZh: '已启用 ProtectSystem=strict（整个文件系统只读），若程序需写入本地日志或数据目录请补充 ReadWritePaths',
      messageEn: 'ProtectSystem=strict mounts the filesystem read-only; add ReadWritePaths if the app writes local data.',
    });
  }

  return issues;
}

export function fixUserScopeConfig(config: SystemdUnitConfig): boolean {
  if (config.scope !== 'user') return false;
  let changed = false;
  if (config.wantedBy.includes('multi-user.target')) {
    config.wantedBy = config.wantedBy.map(t =>
      t === 'multi-user.target' ? 'default.target' : t
    );
    changed = true;
  }
  return changed;
}
