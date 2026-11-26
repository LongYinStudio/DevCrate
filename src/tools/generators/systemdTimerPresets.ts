import { createEmptySystemdTimer, type SystemdTimerConfig } from './systemdTimerUtils';

export interface SystemdTimerPreset {
  id: string;
  nameKey: string;
  descKey: string;
  build: () => SystemdTimerConfig;
}

export interface QuickCalendarExpression {
  labelZh: string;
  labelEn: string;
  expr: string;
}

export const QUICK_CALENDAR_EXPRESSIONS: QuickCalendarExpression[] = [
  { labelZh: '每 5 分钟', labelEn: 'Every 5 min', expr: '*-*-* *:0/5:00' },
  { labelZh: '每 15 分钟', labelEn: 'Every 15 min', expr: '*-*-* *:0/15:00' },
  { labelZh: '每小时整点', labelEn: 'Hourly', expr: 'hourly' },
  { labelZh: '每天 03:00', labelEn: 'Daily 03:00', expr: '*-*-* 03:00:00' },
  { labelZh: '工作日 09:30', labelEn: 'Weekdays 09:30', expr: 'Mon..Fri *-*-* 09:30:00' },
  { labelZh: '每周一零点', labelEn: 'Weekly (Mon)', expr: 'weekly' },
  { labelZh: '每月 1 日 02:00', labelEn: '1st of Month', expr: '*-*-01 02:00:00' },
  { labelZh: '每月最后一天 23:30', labelEn: 'Last Day of Month', expr: '*-*-~01 23:30:00' },
];

export const SYSTEMD_TIMER_PRESETS: SystemdTimerPreset[] = [
  {
    id: 'db-backup',
    nameKey: 'tools.systemdTimer.presets.dbBackup',
    descKey: 'tools.systemdTimer.presets.dbBackupDesc',
    build: () =>
      createEmptySystemdTimer({
        unitName: 'pg-backup.timer',
        scope: 'system',
        description: 'Nightly PostgreSQL Database Backup Timer',
        onCalendars: ['*-*-* 03:00:00'],
        accuracySec: '1min',
        randomizedDelaySec: '10m',
        persistent: true,
        serviceExecStart: '/usr/local/bin/pg-backup.sh',
        serviceUser: 'postgres',
        serviceWorkingDir: '/var/backups/postgres',
      }),
  },
  {
    id: 'health-check',
    nameKey: 'tools.systemdTimer.presets.healthCheck',
    descKey: 'tools.systemdTimer.presets.healthCheckDesc',
    build: () =>
      createEmptySystemdTimer({
        unitName: 'service-healthcheck.timer',
        scope: 'system',
        description: 'Run Healthcheck & Cert Renewal Every 15 Minutes',
        onCalendars: ['*-*-* *:0/15:00'],
        accuracySec: '10s',
        randomizedDelaySec: '30s',
        persistent: true,
        serviceExecStart: '/usr/local/bin/healthcheck.sh',
      }),
  },
  {
    id: 'workday-sync',
    nameKey: 'tools.systemdTimer.presets.workdaySync',
    descKey: 'tools.systemdTimer.presets.workdaySyncDesc',
    build: () =>
      createEmptySystemdTimer({
        unitName: 'report-sync.timer',
        scope: 'system',
        description: 'Weekday Business Report Sync (Mon-Fri 09:30 & 18:30)',
        onCalendars: ['Mon..Fri *-*-* 09:30:00', 'Mon..Fri *-*-* 18:30:00'],
        accuracySec: '1min',
        randomizedDelaySec: '2m',
        persistent: true,
        serviceExecStart: '/usr/bin/python3 /opt/reports/sync.py',
        serviceWorkingDir: '/opt/reports',
      }),
  },
  {
    id: 'monotonic-loop',
    nameKey: 'tools.systemdTimer.presets.monotonicLoop',
    descKey: 'tools.systemdTimer.presets.monotonicLoopDesc',
    build: () =>
      createEmptySystemdTimer({
        unitName: 'queue-drain.timer',
        scope: 'system',
        description: 'Monotonic Queue Drain (2m after boot, 30m after finish)',
        onCalendars: [],
        onBootSec: '2min',
        onUnitInactiveSec: '30min',
        accuracySec: '15s',
        persistent: false,
        serviceExecStart: '/usr/local/bin/drain-queue',
      }),
  },
  {
    id: 'user-cleanup',
    nameKey: 'tools.systemdTimer.presets.userCleanup',
    descKey: 'tools.systemdTimer.presets.userCleanupDesc',
    build: () =>
      createEmptySystemdTimer({
        unitName: 'cache-cleanup.timer',
        scope: 'user',
        description: 'Weekly User Cache Cleanup',
        onCalendars: ['weekly'],
        accuracySec: '5min',
        randomizedDelaySec: '15m',
        persistent: true,
        serviceExecStart: '/usr/bin/find %h/.cache -mtime +14 -delete',
      }),
  },
];
