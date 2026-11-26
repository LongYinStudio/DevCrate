export type SystemdTimerScope = 'system' | 'user';

export interface SystemdTimerConfig {
  unitName: string;
  scope: SystemdTimerScope;
  description: string;
  documentation: string;
  targetUnit: string;
  onCalendars: string[];
  onActiveSec: string;
  onBootSec: string;
  onStartupSec: string;
  onUnitActiveSec: string;
  onUnitInactiveSec: string;
  accuracySec: string;
  randomizedDelaySec: string;
  fixedRandomDelay: boolean;
  persistent: boolean;
  wakeSystem: boolean;
  remainAfterElapse: boolean;
  onClockChange: boolean;
  onTimezoneChange: boolean;
  wantedBy: string[];
  /** Companion .service stub fields */
  serviceExecStart: string;
  serviceUser: string;
  serviceWorkingDir: string;
}

export interface SystemdTimerIssue {
  level: 'error' | 'warning' | 'info';
  code: string;
  messageZh: string;
  messageEn: string;
  fixable?: 'add-timers-target' | 'disable-persistent';
}

export interface SystemdTimerCommandItem {
  id: string;
  labelZh: string;
  labelEn: string;
  command: string;
}

export interface CalendarPredictionResult {
  valid: boolean;
  raw: string;
  normalized: string;
  isUtc: boolean;
  errorZh?: string;
  errorEn?: string;
  nextRuns: Date[];
}

export function createEmptySystemdTimer(
  overrides: Partial<SystemdTimerConfig> = {}
): SystemdTimerConfig {
  return {
    unitName: 'backup-job.timer',
    scope: 'system',
    description: 'Scheduled Backup Timer',
    documentation: '',
    targetUnit: '',
    onCalendars: ['*-*-* 03:00:00'],
    onActiveSec: '',
    onBootSec: '',
    onStartupSec: '',
    onUnitActiveSec: '',
    onUnitInactiveSec: '',
    accuracySec: '1min',
    randomizedDelaySec: '',
    fixedRandomDelay: false,
    persistent: true,
    wakeSystem: false,
    remainAfterElapse: true,
    onClockChange: false,
    onTimezoneChange: false,
    wantedBy: ['timers.target'],
    serviceExecStart: '/usr/local/bin/backup.sh',
    serviceUser: '',
    serviceWorkingDir: '',
    ...overrides,
  };
}

export function normalizeTimerFilename(name: string): string {
  const trimmed = name.trim() || 'custom-job.timer';
  return trimmed.endsWith('.timer') ? trimmed : `${trimmed.replace(/\.service$/, '')}.timer`;
}

export function resolveTargetServiceName(config: SystemdTimerConfig): string {
  const explicit = config.targetUnit.trim();
  if (explicit) return explicit;
  const timerName = normalizeTimerFilename(config.unitName);
  return timerName.replace(/\.timer$/, '.service');
}

export function getTimerInstallPath(config: SystemdTimerConfig): string {
  const file = normalizeTimerFilename(config.unitName);
  return config.scope === 'user'
    ? `~/.config/systemd/user/${file}`
    : `/etc/systemd/system/${file}`;
}

export function getServiceStubPath(config: SystemdTimerConfig): string {
  const svc = resolveTargetServiceName(config);
  return config.scope === 'user'
    ? `~/.config/systemd/user/${svc}`
    : `/etc/systemd/system/${svc}`;
}

const TIMESPAN_REGEX =
  /^\s*(\d+(?:\.\d+)?\s*(?:us|µs|usec|ms|msec|s|sec|second|seconds|m|min|minute|minutes|h|hr|hour|hours|d|day|days|w|week|weeks|month|months|y|year|years)\s*)+$/i;

export function isValidSystemdTimespan(val: string): boolean {
  const trimmed = val.trim();
  if (!trimmed) return true;
  if (/^\d+$/.test(trimmed)) return true; // bare integer = seconds in systemd
  return TIMESPAN_REGEX.test(trimmed);
}

// ==================== OnCalendar Parser & Next-N Predictor ====================

const SHORTHAND_MAP: Record<string, string> = {
  minutely: '*-*-* *:*:00',
  hourly: '*-*-* *:00:00',
  daily: '*-*-* 00:00:00',
  monthly: '*-*-01 00:00:00',
  weekly: 'Mon *-*-* 00:00:00',
  yearly: '*-01-01 00:00:00',
  annually: '*-01-01 00:00:00',
  quarterly: '*-01,04,07,10-01 00:00:00',
  semiannually: '*-01,07-01 00:00:00',
  'semi-annually': '*-01,07-01 00:00:00',
};

const DOW_MAP: Record<string, number> = {
  sun: 0,
  sunday: 0,
  mon: 1,
  monday: 1,
  tue: 2,
  tuesday: 2,
  wed: 3,
  wednesday: 3,
  thu: 4,
  thursday: 4,
  fri: 5,
  friday: 5,
  sat: 6,
  saturday: 6,
};

interface FieldMatcher {
  any: boolean;
  values: Set<number>;
  fromEndValues: Set<number>; // for ~DD end-of-month offsets
}

function parseNumericField(
  expr: string,
  min: number,
  max: number,
  allowFromEnd = false
): FieldMatcher | null {
  const trimmed = expr.trim();
  if (!trimmed || trimmed === '*') {
    return { any: true, values: new Set(), fromEndValues: new Set() };
  }

  const values = new Set<number>();
  const fromEndValues = new Set<number>();
  const parts = trimmed.split(',');

  for (const rawPart of parts) {
    const part = rawPart.trim();
    if (!part) return null;

    if (allowFromEnd && part.startsWith('~')) {
      const rest = part.slice(1);
      if (!/^\d+$/.test(rest)) return null;
      const offset = Number(rest);
      if (offset < 1 || offset > 31) return null;
      fromEndValues.add(offset);
      continue;
    }

    const slashIdx = part.indexOf('/');
    const rangeExpr = slashIdx >= 0 ? part.slice(0, slashIdx) : part;
    const stepStr = slashIdx >= 0 ? part.slice(slashIdx + 1) : null;

    let step = 1;
    if (stepStr !== null) {
      if (!/^\d+$/.test(stepStr)) return null;
      step = Number(stepStr);
      if (step <= 0) return null;
    }

    let start: number;
    let end: number;

    if (rangeExpr === '*') {
      start = min;
      end = max;
    } else if (rangeExpr.includes('..')) {
      const bounds = rangeExpr.split('..');
      if (bounds.length !== 2 || !/^\d+$/.test(bounds[0]) || !/^\d+$/.test(bounds[1])) {
        return null;
      }
      start = Number(bounds[0]);
      end = Number(bounds[1]);
      if (start < min || end > max || start > end) return null;
    } else {
      if (!/^\d+$/.test(rangeExpr)) return null;
      start = Number(rangeExpr);
      if (start < min || start > max) return null;
      end = stepStr !== null ? max : start;
    }

    for (let v = start; v <= end; v += step) {
      values.add(v);
    }
  }

  if (values.size === 0 && fromEndValues.size === 0) return null;
  return { any: false, values, fromEndValues };
}

function parseDowToken(token: string): Set<number> | null {
  const allowed = new Set<number>();
  const parts = token.split(',');
  for (const rawPart of parts) {
    const part = rawPart.trim().toLowerCase();
    if (!part) return null;
    if (part.includes('..')) {
      const bounds = part.split('..');
      if (bounds.length !== 2) return null;
      const a = DOW_MAP[bounds[0].trim()];
      const b = DOW_MAP[bounds[1].trim()];
      if (a === undefined || b === undefined) return null;
      // Handle wraparound ranges like Fri..Mon or Mon..Fri
      let cur = a;
      for (let guard = 0; guard < 7; guard++) {
        allowed.add(cur);
        if (cur === b) break;
        cur = (cur + 1) % 7;
      }
    } else {
      const v = DOW_MAP[part];
      if (v === undefined) return null;
      allowed.add(v);
    }
  }
  return allowed.size > 0 ? allowed : null;
}

function isDowToken(token: string): boolean {
  const first = token.split(',')[0].split('..')[0].trim().toLowerCase();
  return DOW_MAP[first] !== undefined;
}

function getSortedArray(matcher: FieldMatcher, min: number, max: number): number[] {
  if (matcher.any) {
    const arr: number[] = [];
    for (let i = min; i <= max; i++) arr.push(i);
    return arr;
  }
  return Array.from(matcher.values).sort((a, b) => a - b);
}

function daysInMonth(year: number, month1Based: number): number {
  return new Date(Date.UTC(year, month1Based, 0)).getUTCDate();
}

export function predictOnCalendar(
  rawExpr: string,
  count = 10,
  fromDate: Date = new Date()
): CalendarPredictionResult {
  const raw = rawExpr.trim();
  if (!raw) {
    return {
      valid: false,
      raw: rawExpr,
      normalized: '',
      isUtc: false,
      errorZh: 'OnCalendar 表达式不能为空',
      errorEn: 'OnCalendar expression cannot be empty',
      nextRuns: [],
    };
  }

  let expr = raw;
  let isUtc = false;

  // Check optional trailing timezone token (UTC / Local)
  const rawTokens = expr.split(/\s+/);
  const lastToken = rawTokens[rawTokens.length - 1];
  if (rawTokens.length > 1 && /^(UTC|GMT|Local)$/i.test(lastToken)) {
    isUtc = /^(UTC|GMT)$/i.test(lastToken);
    rawTokens.pop();
    expr = rawTokens.join(' ');
  }

  const shorthand = SHORTHAND_MAP[expr.toLowerCase()];
  if (shorthand) {
    expr = shorthand;
  }

  const tokens = expr.split(/\s+/);
  if (tokens.length > 3) {
    return {
      valid: false,
      raw,
      normalized: '',
      isUtc,
      errorZh: '表达式段数过多，格式应为 [星期] [年-月-日] [时:分:秒]',
      errorEn: 'Too many tokens; expected [DayOfWeek] [YYYY-MM-DD] [HH:MM:SS]',
      nextRuns: [],
    };
  }

  let dowSet: Set<number> | null = null;
  let dateToken = '*-*-*';
  let timeToken = '00:00:00';

  let idx = 0;
  if (idx < tokens.length && isDowToken(tokens[idx])) {
    dowSet = parseDowToken(tokens[idx]);
    if (!dowSet) {
      return {
        valid: false,
        raw,
        normalized: '',
        isUtc,
        errorZh: `无效的星期表达式 "${tokens[idx]}"`,
        errorEn: `Invalid weekday expression "${tokens[idx]}"`,
        nextRuns: [],
      };
    }
    idx++;
  }

  let sawDate = false;
  let sawTime = false;
  for (; idx < tokens.length; idx++) {
    const tok = tokens[idx];
    if (tok.includes('-') && !sawDate && !sawTime) {
      dateToken = tok;
      sawDate = true;
    } else if (tok.includes(':') && !sawTime) {
      timeToken = tok;
      sawTime = true;
    } else {
      return {
        valid: false,
        raw,
        normalized: '',
        isUtc,
        errorZh: `无法识别的字段 "${tok}"`,
        errorEn: `Unrecognized token "${tok}"`,
        nextRuns: [],
      };
    }
  }

  const dateParts = dateToken.split('-');
  if (dateParts.length !== 3) {
    return {
      valid: false,
      raw,
      normalized: '',
      isUtc,
      errorZh: `日期部分应包含年-月-日三段，如 *-*-01`,
      errorEn: `Date part must have 3 segments (YYYY-MM-DD), e.g. *-*-01`,
      nextRuns: [],
    };
  }

  const baseYear = isUtc ? fromDate.getUTCFullYear() : fromDate.getFullYear();
  const yearMatcher = parseNumericField(dateParts[0], 1970, baseYear + 50);
  const monthMatcher = parseNumericField(dateParts[1], 1, 12);
  const dayMatcher = parseNumericField(dateParts[2], 1, 31, true);

  if (!yearMatcher || !monthMatcher || !dayMatcher) {
    return {
      valid: false,
      raw,
      normalized: '',
      isUtc,
      errorZh: `日期取值范围无效 "${dateToken}"`,
      errorEn: `Invalid date field values in "${dateToken}"`,
      nextRuns: [],
    };
  }

  const timeParts = timeToken.split(':');
  if (timeParts.length < 2 || timeParts.length > 3) {
    return {
      valid: false,
      raw,
      normalized: '',
      isUtc,
      errorZh: `时间部分应为 HH:MM 或 HH:MM:SS`,
      errorEn: `Time part must be HH:MM or HH:MM:SS`,
      nextRuns: [],
    };
  }

  const hourMatcher = parseNumericField(timeParts[0], 0, 23);
  const minuteMatcher = parseNumericField(timeParts[1], 0, 59);
  const secondMatcher = parseNumericField(timeParts[2] ?? '00', 0, 59);

  if (!hourMatcher || !minuteMatcher || !secondMatcher) {
    return {
      valid: false,
      raw,
      normalized: '',
      isUtc,
      errorZh: `时间取值超出范围 "${timeToken}"`,
      errorEn: `Invalid time values in "${timeToken}"`,
      nextRuns: [],
    };
  }

  const hours = getSortedArray(hourMatcher, 0, 23);
  const minutes = getSortedArray(minuteMatcher, 0, 59);
  const seconds = getSortedArray(secondMatcher, 0, 59);

  // Start strictly after fromDate (+1s rounded)
  const startTime = new Date(fromDate.getTime() + 1000);
  startTime.setMilliseconds(0);

  const startY = isUtc ? startTime.getUTCFullYear() : startTime.getFullYear();
  const startM = (isUtc ? startTime.getUTCMonth() : startTime.getMonth()) + 1;
  const startD = isUtc ? startTime.getUTCDate() : startTime.getDate();
  const startH = isUtc ? startTime.getUTCHours() : startTime.getHours();
  const startMin = isUtc ? startTime.getUTCMinutes() : startTime.getMinutes();
  const startS = isUtc ? startTime.getUTCSeconds() : startTime.getSeconds();

  const maxYear = Math.min(baseYear + 20, 2100);
  const candidateYears = yearMatcher.any
    ? Array.from({ length: maxYear - startY + 1 }, (_, k) => startY + k)
    : Array.from(yearMatcher.values)
        .filter((y) => y >= startY && y <= maxYear)
        .sort((a, b) => a - b);

  const months = getSortedArray(monthMatcher, 1, 12);
  const results: Date[] = [];

  outer: for (const y of candidateYears) {
    for (const m of months) {
      if (y === startY && m < startM) continue;

      const dim = daysInMonth(y, m);
      const daySet = new Set<number>();
      if (dayMatcher.any) {
        for (let d = 1; d <= dim; d++) daySet.add(d);
      } else {
        for (const d of dayMatcher.values) {
          if (d >= 1 && d <= dim) daySet.add(d);
        }
        for (const offset of dayMatcher.fromEndValues) {
          const targetDay = dim - offset + 1;
          if (targetDay >= 1 && targetDay <= dim) daySet.add(targetDay);
        }
      }

      const validDays = Array.from(daySet).sort((a, b) => a - b);
      for (const d of validDays) {
        const isToday = y === startY && m === startM && d === startD;
        if (y === startY && m === startM && d < startD) continue;

        if (dowSet) {
          const weekday = isUtc
            ? new Date(Date.UTC(y, m - 1, d)).getUTCDay()
            : new Date(y, m - 1, d).getDay();
          if (!dowSet.has(weekday)) continue;
        }

        for (const h of hours) {
          if (isToday && h < startH) continue;
          const isCurrentHour = isToday && h === startH;

          for (const min of minutes) {
            if (isCurrentHour && min < startMin) continue;
            const isCurrentMin = isCurrentHour && min === startMin;

            for (const sec of seconds) {
              if (isCurrentMin && sec < startS) continue;
              const dt = isUtc
                ? new Date(Date.UTC(y, m - 1, d, h, min, sec))
                : new Date(y, m - 1, d, h, min, sec);

              if (dt.getTime() >= startTime.getTime()) {
                results.push(dt);
                if (results.length >= count) break outer;
              }
            }
          }
        }
      }
    }
  }

  return {
    valid: true,
    raw,
    normalized: `${expr}${isUtc ? ' UTC' : ''}`,
    isUtc,
    nextRuns: results,
  };
}

export function predictMultipleCalendars(
  expressions: string[],
  count = 10,
  fromDate: Date = new Date()
): {
  perExpr: CalendarPredictionResult[];
  mergedRuns: Array<{ date: Date; source: string; isUtc: boolean }>;
} {
  const nonEmpty = expressions.map((e) => e.trim()).filter(Boolean);
  const perExpr = nonEmpty.map((e) => predictOnCalendar(e, count, fromDate));
  const merged: Array<{ date: Date; source: string; isUtc: boolean }> = [];

  for (const res of perExpr) {
    if (!res.valid) continue;
    for (const dt of res.nextRuns) {
      merged.push({ date: dt, source: res.raw, isUtc: res.isUtc });
    }
  }

  merged.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Deduplicate exact same timestamp
  const deduped: Array<{ date: Date; source: string; isUtc: boolean }> = [];
  for (const item of merged) {
    if (
      deduped.length === 0 ||
      deduped[deduped.length - 1].date.getTime() !== item.date.getTime()
    ) {
      deduped.push(item);
      if (deduped.length >= count) break;
    }
  }

  return { perExpr, mergedRuns: deduped };
}

// ==================== Cron -> Systemd OnCalendar Converter ====================

const CRON_DOW_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function convertCronFieldToSystemd(field: string, padWidth: number): string {
  if (field === '*') return '*';
  return field
    .split(',')
    .map((part) => {
      const trimmed = part.trim();
      if (trimmed.startsWith('*/')) {
        return `${'0'.repeat(padWidth)}/${trimmed.slice(2)}`;
      }
      return trimmed.replace('-', '..');
    })
    .join(',');
}

function convertCronDowToSystemd(dow: string): string {
  if (dow === '*' || dow === '?') return '';
  return dow
    .split(',')
    .map((part) => {
      const t = part.trim();
      const mapSingle = (tok: string) => {
        if (/^\d+$/.test(tok)) {
          const n = Number(tok);
          return CRON_DOW_NAMES[n] || tok;
        }
        return tok.charAt(0).toUpperCase() + tok.slice(1, 3).toLowerCase();
      };
      if (t.includes('-')) {
        const [a, b] = t.split('-');
        return `${mapSingle(a)}..${mapSingle(b)}`;
      }
      return mapSingle(t);
    })
    .join(',');
}

export function convertCronToOnCalendar(cronExpr: string): {
  ok: boolean;
  onCalendar?: string;
  errorZh?: string;
  errorEn?: string;
} {
  const trimmed = cronExpr.trim();
  const shorthandMap: Record<string, string> = {
    '@hourly': 'hourly',
    '@daily': 'daily',
    '@midnight': 'daily',
    '@weekly': 'weekly',
    '@monthly': 'monthly',
    '@yearly': 'yearly',
    '@annually': 'yearly',
  };
  if (shorthandMap[trimmed.toLowerCase()]) {
    return { ok: true, onCalendar: shorthandMap[trimmed.toLowerCase()] };
  }

  const parts = trimmed.split(/\s+/);
  if (parts.length !== 5) {
    return {
      ok: false,
      errorZh: '请输入标准 5 段式 Cron 表达式（分 时 日 月 周），如 */15 9-18 * * 1-5',
      errorEn: 'Enter a standard 5-field cron expression (min hour dom mon dow), e.g. */15 9-18 * * 1-5',
    };
  }

  const [min, hour, dom, mon, dow] = parts;
  const sysMin = convertCronFieldToSystemd(min, 2);
  const sysHour = convertCronFieldToSystemd(hour, 2);
  const sysDom = dom === '?' ? '*' : convertCronFieldToSystemd(dom, 2);
  const sysMon = convertCronFieldToSystemd(mon, 2);
  const sysDow = convertCronDowToSystemd(dow);

  const datePart = `*-${sysMon}-${sysDom}`;
  const timePart = `${sysHour}:${sysMin}:00`;
  return {
    ok: true,
    onCalendar: sysDow ? `${sysDow} ${datePart} ${timePart}` : `${datePart} ${timePart}`,
  };
}

// ==================== .timer Generator & Diagnostics ====================

export function generateSystemdTimerUnit(
  config: SystemdTimerConfig,
  includeHeaderComment = true
): string {
  const lines: string[] = [];

  if (includeHeaderComment) {
    lines.push(`# Target path: ${getTimerInstallPath(config)}`);
    lines.push('# Generated by DevCrate - Systemd .timer Generator');
    lines.push('');
  }

  lines.push('[Unit]');
  if (config.description.trim()) {
    lines.push(`Description=${config.description.trim()}`);
  }
  if (config.documentation.trim()) {
    lines.push(`Documentation=${config.documentation.trim()}`);
  }
  lines.push('');

  lines.push('[Timer]');
  for (const cal of config.onCalendars) {
    const trimmed = cal.trim();
    if (trimmed) lines.push(`OnCalendar=${trimmed}`);
  }
  if (config.onActiveSec.trim()) lines.push(`OnActiveSec=${config.onActiveSec.trim()}`);
  if (config.onBootSec.trim()) lines.push(`OnBootSec=${config.onBootSec.trim()}`);
  if (config.onStartupSec.trim()) lines.push(`OnStartupSec=${config.onStartupSec.trim()}`);
  if (config.onUnitActiveSec.trim()) lines.push(`OnUnitActiveSec=${config.onUnitActiveSec.trim()}`);
  if (config.onUnitInactiveSec.trim()) lines.push(`OnUnitInactiveSec=${config.onUnitInactiveSec.trim()}`);

  if (config.targetUnit.trim()) {
    lines.push(`Unit=${config.targetUnit.trim()}`);
  }
  if (config.accuracySec.trim() && config.accuracySec.trim() !== '1min') {
    lines.push(`AccuracySec=${config.accuracySec.trim()}`);
  }
  if (config.randomizedDelaySec.trim()) {
    lines.push(`RandomizedDelaySec=${config.randomizedDelaySec.trim()}`);
  }
  if (config.fixedRandomDelay) {
    lines.push('FixedRandomDelay=true');
  }
  if (config.persistent) {
    lines.push('Persistent=true');
  }
  if (config.wakeSystem) {
    lines.push('WakeSystem=true');
  }
  if (!config.remainAfterElapse) {
    lines.push('RemainAfterElapse=false');
  }
  if (config.onClockChange) {
    lines.push('OnClockChange=true');
  }
  if (config.onTimezoneChange) {
    lines.push('OnTimezoneChange=true');
  }
  lines.push('');

  lines.push('[Install]');
  const wanted = config.wantedBy.map((w) => w.trim()).filter(Boolean);
  for (const w of wanted) {
    lines.push(`WantedBy=${w}`);
  }

  return `${lines.join('\n')}\n`;
}

export function generateCompanionServiceStub(config: SystemdTimerConfig): string {
  const svcName = resolveTargetServiceName(config);
  const lines: string[] = [
    `# Companion service unit: ${getServiceStubPath(config)}`,
    `# Triggered by ${normalizeTimerFilename(config.unitName)}`,
    '',
    '[Unit]',
    `Description=Worker for ${config.description.trim() || svcName}`,
    '',
    '[Service]',
    'Type=oneshot',
  ];

  if (config.scope === 'system' && config.serviceUser.trim()) {
    lines.push(`User=${config.serviceUser.trim()}`);
  }
  if (config.serviceWorkingDir.trim()) {
    lines.push(`WorkingDirectory=${config.serviceWorkingDir.trim()}`);
  }
  lines.push(`ExecStart=${config.serviceExecStart.trim() || '/usr/local/bin/job.sh'}`);
  lines.push('');
  return `${lines.join('\n')}\n`;
}

export function auditSystemdTimer(config: SystemdTimerConfig): SystemdTimerIssue[] {
  const issues: SystemdTimerIssue[] = [];
  const validCalendars = config.onCalendars.map((c) => c.trim()).filter(Boolean);
  const hasMonotonic = Boolean(
    config.onActiveSec.trim() ||
      config.onBootSec.trim() ||
      config.onStartupSec.trim() ||
      config.onUnitActiveSec.trim() ||
      config.onUnitInactiveSec.trim()
  );

  if (validCalendars.length === 0 && !hasMonotonic) {
    issues.push({
      level: 'error',
      code: 'no-trigger',
      messageZh: '至少需要配置一条 OnCalendar= 日历规则或 On*Sec= 单调时间触发器。',
      messageEn: 'At least one OnCalendar= expression or On*Sec= monotonic trigger is required.',
    });
  }

  for (const cal of validCalendars) {
    const res = predictOnCalendar(cal, 1);
    if (!res.valid) {
      issues.push({
        level: 'error',
        code: 'invalid-calendar',
        messageZh: `OnCalendar="${cal}" 语法无效：${res.errorZh}`,
        messageEn: `Invalid OnCalendar="${cal}": ${res.errorEn}`,
      });
    } else if (res.nextRuns.length === 0) {
      issues.push({
        level: 'warning',
        code: 'calendar-never-fires',
        messageZh: `OnCalendar="${cal}" 在未来 20 年内未匹配到任何触发时刻（可能是过去年份或不可能的日期如 2月30日）。`,
        messageEn: `OnCalendar="${cal}" does not match any date in the next 20 years.`,
      });
    }
  }

  const timespanFields: Array<[string, string]> = [
    ['OnActiveSec', config.onActiveSec],
    ['OnBootSec', config.onBootSec],
    ['OnStartupSec', config.onStartupSec],
    ['OnUnitActiveSec', config.onUnitActiveSec],
    ['OnUnitInactiveSec', config.onUnitInactiveSec],
    ['AccuracySec', config.accuracySec],
    ['RandomizedDelaySec', config.randomizedDelaySec],
  ];
  for (const [key, val] of timespanFields) {
    if (val.trim() && !isValidSystemdTimespan(val)) {
      issues.push({
        level: 'error',
        code: 'invalid-timespan',
        messageZh: `${key}="${val}" 时间跨度格式无效（示例：30s、5min、2h、1d）。`,
        messageEn: `Invalid timespan in ${key}="${val}" (e.g. 30s, 5min, 2h, 1d).`,
      });
    }
  }

  if (config.persistent && validCalendars.length === 0) {
    issues.push({
      level: 'warning',
      code: 'persistent-without-calendar',
      fixable: 'disable-persistent',
      messageZh: 'Persistent=true 仅对 OnCalendar= 日历定时器有效，当前未设置 OnCalendar，建议关闭。',
      messageEn: 'Persistent=true only applies to OnCalendar= timers and has no effect on monotonic timers.',
    });
  }

  if (config.wantedBy.map((w) => w.trim()).filter(Boolean).length === 0) {
    issues.push({
      level: 'warning',
      code: 'missing-wantedby',
      fixable: 'add-timers-target',
      messageZh: '未设置 WantedBy=timers.target，执行 systemctl enable 时将无法开机自动激活定时器。',
      messageEn: 'Missing WantedBy=timers.target — systemctl enable will not auto-activate this timer.',
    });
  }

  if (config.targetUnit.trim() && !config.targetUnit.trim().endsWith('.service')) {
    issues.push({
      level: 'info',
      code: 'target-not-service',
      messageZh: `当前关联单元 Unit=${config.targetUnit.trim()} 不是 .service 后缀，请确认目标单元真实存在。`,
      messageEn: `Target Unit=${config.targetUnit.trim()} does not end with .service — confirm it exists.`,
    });
  }

  return issues;
}

export function parseSystemdTimer(raw: string): SystemdTimerConfig {
  const result = createEmptySystemdTimer({
    onCalendars: [],
    wantedBy: [],
    persistent: false,
    remainAfterElapse: true,
  });

  let section = '';
  for (const rawLine of raw.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#') || line.startsWith(';')) continue;
    const secMatch = /^\[(.+)\]$/.exec(line);
    if (secMatch) {
      section = secMatch[1].trim();
      continue;
    }
    const eqIdx = line.indexOf('=');
    if (eqIdx <= 0) continue;
    const key = line.slice(0, eqIdx).trim();
    const val = line.slice(eqIdx + 1).trim();

    if (section === 'Unit') {
      if (key === 'Description') result.description = val;
      else if (key === 'Documentation') result.documentation = val;
    } else if (section === 'Timer') {
      if (key === 'OnCalendar' && val) result.onCalendars.push(val);
      else if (key === 'OnActiveSec') result.onActiveSec = val;
      else if (key === 'OnBootSec') result.onBootSec = val;
      else if (key === 'OnStartupSec') result.onStartupSec = val;
      else if (key === 'OnUnitActiveSec') result.onUnitActiveSec = val;
      else if (key === 'OnUnitInactiveSec') result.onUnitInactiveSec = val;
      else if (key === 'Unit') result.targetUnit = val;
      else if (key === 'AccuracySec') result.accuracySec = val;
      else if (key === 'RandomizedDelaySec') result.randomizedDelaySec = val;
      else if (key === 'FixedRandomDelay') result.fixedRandomDelay = /^(true|yes|1)$/i.test(val);
      else if (key === 'Persistent') result.persistent = /^(true|yes|1)$/i.test(val);
      else if (key === 'WakeSystem') result.wakeSystem = /^(true|yes|1)$/i.test(val);
      else if (key === 'RemainAfterElapse') result.remainAfterElapse = !/^(false|no|0)$/i.test(val);
      else if (key === 'OnClockChange') result.onClockChange = /^(true|yes|1)$/i.test(val);
      else if (key === 'OnTimezoneChange') result.onTimezoneChange = /^(true|yes|1)$/i.test(val);
    } else if (section === 'Install') {
      if (key === 'WantedBy' && val) {
        result.wantedBy.push(...val.split(/\s+/).filter(Boolean));
      }
    }
  }

  if (result.wantedBy.length === 0) {
    result.wantedBy = ['timers.target'];
  }
  return result;
}

export function generateTimerCommands(config: SystemdTimerConfig): SystemdTimerCommandItem[] {
  const timerName = normalizeTimerFilename(config.unitName);
  const serviceName = resolveTargetServiceName(config);
  const sudo = config.scope === 'user' ? '' : 'sudo ';
  const ctl = config.scope === 'user' ? 'systemctl --user' : 'systemctl';
  const jctl = config.scope === 'user' ? 'journalctl --user' : 'journalctl';
  const firstCal = config.onCalendars.map((c) => c.trim()).find(Boolean);

  const items: SystemdTimerCommandItem[] = [
    {
      id: 'reload-enable',
      labelZh: '重载配置并启用定时器（立即激活）',
      labelEn: 'Reload systemd daemon and enable + start timer',
      command: `${sudo}${ctl} daemon-reload && ${sudo}${ctl} enable --now ${timerName}`,
    },
    {
      id: 'list-timers',
      labelZh: '查看所有定时器下次触发时间与上次执行结果',
      labelEn: 'Inspect next trigger & last execution with list-timers',
      command: `${ctl} list-timers ${timerName} --all`,
    },
    {
      id: 'trigger-now',
      labelZh: '手动立即测试运行一次关联 .service',
      labelEn: 'Manually trigger associated .service once',
      command: `${sudo}${ctl} start ${serviceName} && ${jctl} -u ${serviceName} -n 50 --no-pager`,
    },
  ];

  if (firstCal) {
    items.push({
      id: 'analyze-cal',
      labelZh: '在服务器上用 systemd-analyze 校验日历语法',
      labelEn: 'Verify OnCalendar expression natively via systemd-analyze',
      command: `systemd-analyze calendar --iterations=5 '${firstCal.replace(/'/g, "'\\''")}'`,
    });
  }

  return items;
}
