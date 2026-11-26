<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  AlertCircle,
  AlertTriangle,
  ArrowRightLeft,
  CalendarClock,
  Check,
  CheckCircle2,
  Clock,
  FileDown,
  Info,
  Play,
  Plus,
  RotateCcw,
  Sliders,
  Sparkles,
  Terminal,
  Timer,
  Trash2,
  Upload,
  Wrench,
  X,
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import { downloadFile } from '../../utils/download';
import { QUICK_CALENDAR_EXPRESSIONS, SYSTEMD_TIMER_PRESETS } from './systemdTimerPresets';
import {
  auditSystemdTimer,
  convertCronToOnCalendar,
  generateCompanionServiceStub,
  generateSystemdTimerUnit,
  generateTimerCommands,
  getServiceStubPath,
  getTimerInstallPath,
  isValidSystemdTimespan,
  normalizeTimerFilename,
  parseSystemdTimer,
  predictMultipleCalendars,
  predictOnCalendar,
  resolveTargetServiceName,
  type SystemdTimerConfig,
  type SystemdTimerScope,
} from './systemdTimerUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// ==================== 核心状态 ====================
const activePresetId = ref(SYSTEMD_TIMER_PRESETS[0].id);
const config = ref<SystemdTimerConfig>(SYSTEMD_TIMER_PRESETS[0].build());

const leftTab = ref<'calendar' | 'monotonic' | 'service'>('calendar');
const outputTab = ref<'timer' | 'service'>('timer');
const includeHeaderComment = ref(true);
const showDiagnostics = ref(true);
const showCommands = ref(true);

const cronInput = ref('*/15 9-18 * * 1-5');
const cronConvertError = ref('');
const forecastAnchor = ref<Date>(new Date());

const showImportModal = ref(false);
const importText = ref('');
const importError = ref('');
const importFileRef = ref<HTMLInputElement | null>(null);

const isDownloaded = ref(false);
const toastMessage = ref('');

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = '';
  }, 2800);
}

// ==================== 派生数据 ====================
const timerFilename = computed(() => normalizeTimerFilename(config.value.unitName));
const serviceFilename = computed(() => resolveTargetServiceName(config.value));
const installPath = computed(() => getTimerInstallPath(config.value));
const serviceInstallPath = computed(() => getServiceStubPath(config.value));

const generatedTimer = computed(() =>
  generateSystemdTimerUnit(config.value, includeHeaderComment.value)
);
const generatedServiceStub = computed(() => generateCompanionServiceStub(config.value));
const activeOutputContent = computed(() =>
  outputTab.value === 'timer' ? generatedTimer.value : generatedServiceStub.value
);
const activeOutputFilename = computed(() =>
  outputTab.value === 'timer' ? timerFilename.value : serviceFilename.value
);

const companionCommands = computed(() => generateTimerCommands(config.value));
const diagnostics = computed(() => auditSystemdTimer(config.value));
const errorCount = computed(() => diagnostics.value.filter((d) => d.level === 'error').length);
const warningCount = computed(() => diagnostics.value.filter((d) => d.level === 'warning').length);

const calendarPredictions = computed(() =>
  predictMultipleCalendars(config.value.onCalendars, 10, forecastAnchor.value)
);

function checkSingleCalendar(expr: string) {
  if (!expr.trim()) return null;
  return predictOnCalendar(expr, 1, forecastAnchor.value);
}

// ==================== 操作函数 ====================
function applyPreset(presetId: string) {
  const found = SYSTEMD_TIMER_PRESETS.find((p) => p.id === presetId);
  if (!found) return;
  activePresetId.value = presetId;
  config.value = found.build();
  forecastAnchor.value = new Date();
}

function handleReset() {
  applyPreset(activePresetId.value);
}

function switchScope(scope: SystemdTimerScope) {
  config.value.scope = scope;
}

function addCalendarRow(expr = '*-*-* 04:00:00') {
  config.value.onCalendars.push(expr);
  forecastAnchor.value = new Date();
}

function removeCalendarRow(idx: number) {
  config.value.onCalendars.splice(idx, 1);
}

function applyQuickCalendar(expr: string) {
  if (config.value.onCalendars.length === 0) {
    config.value.onCalendars.push(expr);
  } else {
    config.value.onCalendars[config.value.onCalendars.length - 1] = expr;
  }
  forecastAnchor.value = new Date();
}

function handleConvertCron() {
  cronConvertError.value = '';
  const res = convertCronToOnCalendar(cronInput.value);
  if (!res.ok || !res.onCalendar) {
    cronConvertError.value = isZh.value ? (res.errorZh || '') : (res.errorEn || '');
    return;
  }
  if (config.value.onCalendars.length === 1 && !config.value.onCalendars[0].trim()) {
    config.value.onCalendars[0] = res.onCalendar;
  } else {
    config.value.onCalendars.push(res.onCalendar);
  }
  forecastAnchor.value = new Date();
  showToast(t('tools.systemdTimer.cronConvertedToast', { expr: res.onCalendar }));
}

function applyFix(fixable: 'add-timers-target' | 'disable-persistent') {
  if (fixable === 'add-timers-target') {
    if (!config.value.wantedBy.includes('timers.target')) {
      config.value.wantedBy.push('timers.target');
    }
  } else if (fixable === 'disable-persistent') {
    config.value.persistent = false;
  }
}

async function handleDownload() {
  await downloadFile(activeOutputContent.value, activeOutputFilename.value, 'text/plain;charset=utf-8');
  isDownloaded.value = true;
  showToast(t('tools.systemdTimer.downloadedNotice', { filename: activeOutputFilename.value }));
  setTimeout(() => {
    isDownloaded.value = false;
  }, 1800);
}

function openImportModal() {
  importText.value = '';
  importError.value = '';
  showImportModal.value = true;
}

function onImportFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    importText.value = String(reader.result || '');
  };
  reader.readAsText(file);
  input.value = '';
}

function confirmImport() {
  if (!importText.value.trim()) {
    importError.value = isZh.value ? '请粘贴或选择 .timer 文件内容' : 'Paste or choose a .timer file first';
    return;
  }
  const parsed = parseSystemdTimer(importText.value);
  config.value = parsed;
  showImportModal.value = false;
  forecastAnchor.value = new Date();
  showToast(t('tools.systemdTimer.importedToast', { name: timerFilename.value }));
}

function formatDateTime(dt: Date, isUtc: boolean): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = isUtc ? dt.getUTCFullYear() : dt.getFullYear();
  const m = (isUtc ? dt.getUTCMonth() : dt.getMonth()) + 1;
  const d = isUtc ? dt.getUTCDate() : dt.getDate();
  const h = isUtc ? dt.getUTCHours() : dt.getHours();
  const min = isUtc ? dt.getUTCMinutes() : dt.getMinutes();
  const s = isUtc ? dt.getUTCSeconds() : dt.getSeconds();
  const weekdayIdx = isUtc ? dt.getUTCDay() : dt.getDay();
  const weekdaysZh = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekdaysEn = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const wd = isZh.value ? weekdaysZh[weekdayIdx] : weekdaysEn[weekdayIdx];
  return `${y}-${pad(m)}-${pad(d)} ${pad(h)}:${pad(min)}:${pad(s)} (${wd})`;
}

function formatRelative(dt: Date): string {
  const diffSec = Math.max(0, Math.round((dt.getTime() - forecastAnchor.value.getTime()) / 1000));
  if (diffSec < 60) return isZh.value ? `${diffSec} 秒后` : `in ${diffSec}s`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return isZh.value ? `${diffMin} 分钟后` : `in ${diffMin}m`;
  const diffHr = Math.floor(diffMin / 60);
  const remMin = diffMin % 60;
  if (diffHr < 24) {
    return isZh.value
      ? `${diffHr} 小时${remMin > 0 ? ` ${remMin} 分` : ''}后`
      : `in ${diffHr}h${remMin > 0 ? ` ${remMin}m` : ''}`;
  }
  const diffDays = Math.floor(diffHr / 24);
  const remHr = diffHr % 24;
  return isZh.value
    ? `${diffDays} 天${remHr > 0 ? ` ${remHr} 小时` : ''}后`
    : `in ${diffDays}d${remHr > 0 ? ` ${remHr}h` : ''}`;
}
</script>

<template>
  <ToolContainer
    toolId="systemd-timer"
    nameKey="tools.systemdTimer.name"
    descKey="tools.systemdTimer.desc"
    :icon="Timer"
    :wide="true"
    :fullHeight="true"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          @click="openImportModal"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          <Upload class="w-3.5 h-3.5 shrink-0" />
          <span>{{ t('tools.systemdTimer.importBtn') }}</span>
        </button>

        <button
          type="button"
          @click="handleDownload"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
        >
          <component :is="isDownloaded ? Check : FileDown" class="w-3.5 h-3.5 shrink-0" />
          <span>{{ t('tools.systemdTimer.downloadBtn', { ext: outputTab === 'timer' ? '.timer' : '.service' }) }}</span>
        </button>

        <button
          type="button"
          @click="handleReset"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
          :title="t('common.reset')"
        >
          <RotateCcw class="w-3.5 h-3.5 shrink-0" />
          <span class="hidden sm:inline">{{ t('common.reset') }}</span>
        </button>
      </div>
    </template>

    <!-- Toast 提示 -->
    <div
      v-if="toastMessage"
      class="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2 shrink-0"
    >
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- 顶部预设栏 -->
    <div class="flex flex-wrap items-center gap-1.5 shrink-0">
      <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1 mr-1 whitespace-nowrap">
        <Sparkles class="w-3.5 h-3.5 text-amber-500 shrink-0" />
        <span>{{ t('tools.systemdTimer.presetsLabel') }}:</span>
      </span>
      <button
        v-for="preset in SYSTEMD_TIMER_PRESETS"
        :key="preset.id"
        type="button"
        @click="applyPreset(preset.id)"
        class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap"
        :class="activePresetId === preset.id
          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
          : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'"
        :title="t(preset.descKey)"
      >
        {{ t(preset.nameKey) }}
      </button>
    </div>

    <!-- 主工作区 -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-3.5 xl:flex-1 xl:min-h-0">
      <!-- 左侧：可视化配置与触发时间预测 -->
      <div class="xl:col-span-7 flex flex-col gap-3 xl:min-h-0 xl:overflow-y-auto pr-0.5">
        <!-- 基础单元元数据卡 -->
        <div class="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-4 space-y-3 text-xs shrink-0">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
            <div class="min-w-0">
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                {{ t('tools.systemdTimer.unitNameLabel') }}
              </label>
              <input
                v-model="config.unitName"
                type="text"
                placeholder="backup-job.timer"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div class="min-w-0">
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                {{ t('tools.systemdTimer.scopeLabel') }}
              </label>
              <div class="grid grid-cols-2 rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700">
                <button
                  type="button"
                  @click="switchScope('system')"
                  class="py-1 rounded-md font-medium cursor-pointer transition-colors whitespace-nowrap"
                  :class="config.scope === 'system' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'"
                >
                  System
                </button>
                <button
                  type="button"
                  @click="switchScope('user')"
                  class="py-1 rounded-md font-mono font-medium cursor-pointer transition-colors whitespace-nowrap"
                  :class="config.scope === 'user' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'"
                >
                  --user
                </button>
              </div>
            </div>

            <div class="min-w-0">
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                {{ t('tools.systemdTimer.targetUnitLabel') }}
              </label>
              <input
                v-model="config.targetUnit"
                type="text"
                :placeholder="`${timerFilename.replace(/\.timer$/, '.service')} (${isZh ? '默认同名' : 'auto'})`"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div class="text-[11px] font-mono text-zinc-400 truncate pb-1.5" :title="installPath">
              {{ installPath }}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div class="min-w-0">
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">Description</label>
              <input
                v-model="config.description"
                type="text"
                placeholder="Scheduled Backup Timer"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div class="min-w-0">
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">Documentation ({{ isZh ? '可选' : 'optional' }})</label>
              <input
                v-model="config.documentation"
                type="text"
                placeholder="https://example.com/docs"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        <!-- 主配置分页卡 -->
        <div class="rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/80 p-4 space-y-4 text-xs">
          <div class="flex flex-wrap gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <button
              v-for="tab in [
                { id: 'calendar', label: t('tools.systemdTimer.tabCalendar'), icon: CalendarClock },
                { id: 'monotonic', label: t('tools.systemdTimer.tabMonotonic'), icon: Sliders },
                { id: 'service', label: t('tools.systemdTimer.tabService'), icon: Play },
              ]"
              :key="tab.id"
              type="button"
              @click="leftTab = tab.id as any"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              :class="leftTab === tab.id
                ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'"
            >
              <component :is="tab.icon" class="w-3.5 h-3.5 shrink-0" />
              <span>{{ tab.label }}</span>
            </button>
          </div>

          <!-- TAB 1: OnCalendar 编排与未来触发时间预测 -->
          <div v-if="leftTab === 'calendar'" class="space-y-4">
            <!-- 快捷 OnCalendar 表达式 -->
            <div class="space-y-1.5">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-semibold text-zinc-700 dark:text-zinc-300">
                  {{ t('tools.systemdTimer.quickCalendarTitle') }}
                </span>
                <button
                  type="button"
                  @click="addCalendarRow()"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 cursor-pointer whitespace-nowrap"
                >
                  <Plus class="w-3 h-3 shrink-0" />
                  <span>{{ t('tools.systemdTimer.addCalendarRow') }}</span>
                </button>
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="q in QUICK_CALENDAR_EXPRESSIONS"
                  :key="q.expr"
                  type="button"
                  @click="applyQuickCalendar(q.expr)"
                  class="px-2 py-1 rounded-md text-[11px] bg-zinc-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-950/40 text-zinc-700 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400 border border-zinc-200/80 dark:border-zinc-700/70 transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>{{ isZh ? q.labelZh : q.labelEn }}</span>
                  <span class="ml-1 font-mono opacity-60">{{ q.expr }}</span>
                </button>
              </div>
            </div>

            <!-- OnCalendar 规则列表 -->
            <div class="space-y-2">
              <div
                v-if="config.onCalendars.length === 0"
                class="p-3 rounded-lg border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-400"
              >
                {{ t('tools.systemdTimer.noCalendarNotice') }}
              </div>

              <div
                v-for="(_, idx) in config.onCalendars"
                :key="idx"
                class="flex flex-col gap-1"
              >
                <div class="flex items-center gap-2">
                  <span class="font-mono text-[11px] font-semibold text-zinc-500 shrink-0">OnCalendar=</span>
                  <input
                    v-model="config.onCalendars[idx]"
                    type="text"
                    placeholder="Mon..Fri *-*-* 09:00:00"
                    class="flex-1 min-w-0 rounded-lg border px-2.5 py-1.5 font-mono text-xs bg-zinc-50 dark:bg-zinc-950/60 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1"
                    :class="checkSingleCalendar(config.onCalendars[idx])?.valid === false
                      ? 'border-rose-400 focus:ring-rose-500'
                      : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'"
                  />
                  <button
                    type="button"
                    @click="removeCalendarRow(idx)"
                    class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer shrink-0"
                    :title="t('common.clear')"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>

                <div
                  v-if="checkSingleCalendar(config.onCalendars[idx]) && !checkSingleCalendar(config.onCalendars[idx])!.valid"
                  class="text-[11px] text-rose-500 pl-20"
                >
                  {{ isZh ? checkSingleCalendar(config.onCalendars[idx])!.errorZh : checkSingleCalendar(config.onCalendars[idx])!.errorEn }}
                </div>
              </div>
            </div>

            <!-- Cron -> OnCalendar 快捷转译条 -->
            <div class="p-3 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/40 border border-zinc-200/80 dark:border-zinc-800 space-y-2">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <span class="font-semibold text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1.5">
                  <ArrowRightLeft class="w-3.5 h-3.5 text-blue-500 shrink-0" />
                  <span>{{ t('tools.systemdTimer.cronConvertTitle') }}</span>
                </span>
                <span class="text-[11px] text-zinc-400">
                  {{ t('tools.systemdTimer.cronConvertHint') }}
                </span>
              </div>
              <div class="flex flex-wrap items-center gap-2">
                <input
                  v-model="cronInput"
                  type="text"
                  placeholder="*/15 9-18 * * 1-5"
                  @keydown.enter="handleConvertCron"
                  class="flex-1 min-w-[180px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-2.5 py-1.5 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button
                  type="button"
                  @click="handleConvertCron"
                  class="px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-white font-medium cursor-pointer whitespace-nowrap transition-colors"
                >
                  {{ t('tools.systemdTimer.cronConvertBtn') }}
                </button>
              </div>
              <p v-if="cronConvertError" class="text-[11px] text-rose-500">{{ cronConvertError }}</p>
            </div>

            <!-- 未来 10 次触发时间预测时间线 -->
            <div class="rounded-xl border border-blue-200/70 dark:border-blue-900/50 bg-blue-50/30 dark:bg-blue-950/15 overflow-hidden">
              <div class="px-3.5 py-2 border-b border-blue-200/60 dark:border-blue-900/40 flex flex-wrap items-center justify-between gap-2">
                <div class="flex items-center gap-1.5 font-semibold text-blue-900 dark:text-blue-200">
                  <Clock class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                  <span>{{ t('tools.systemdTimer.forecastTitle') }}</span>
                </div>
                <button
                  type="button"
                  @click="forecastAnchor = new Date()"
                  class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer whitespace-nowrap"
                >
                  {{ t('tools.systemdTimer.refreshAnchor') }}
                </button>
              </div>

              <div
                v-if="calendarPredictions.mergedRuns.length === 0"
                class="p-4 text-center text-zinc-500 dark:text-zinc-400"
              >
                {{ t('tools.systemdTimer.forecastEmpty') }}
              </div>

              <div v-else class="divide-y divide-blue-100/80 dark:divide-blue-900/30 max-h-56 overflow-y-auto">
                <div
                  v-for="(run, rIdx) in calendarPredictions.mergedRuns"
                  :key="rIdx"
                  class="px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2 font-mono text-[11px]"
                >
                  <div class="flex items-center gap-2 min-w-0">
                    <span class="w-5 text-zinc-400 shrink-0">#{{ rIdx + 1 }}</span>
                    <span class="font-semibold text-zinc-800 dark:text-zinc-100">
                      {{ formatDateTime(run.date, run.isUtc) }}
                    </span>
                    <span
                      v-if="run.isUtc"
                      class="px-1 py-0.2 rounded bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 text-[10px]"
                    >
                      UTC
                    </span>
                  </div>
                  <div class="flex items-center gap-2 shrink-0 ml-auto">
                    <span v-if="config.randomizedDelaySec.trim()" class="text-[10px] text-amber-600 dark:text-amber-400">
                      (+0 ~ {{ config.randomizedDelaySec.trim() }})
                    </span>
                    <span class="px-1.5 py-0.5 rounded bg-white/80 dark:bg-zinc-900/80 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-800/50">
                      {{ formatRelative(run.date) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: 单调定时器 & 精度防抖策略 -->
          <div v-else-if="leftTab === 'monotonic'" class="space-y-4">
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                  OnBootSec ({{ t('tools.systemdTimer.onBootHint') }})
                </label>
                <input
                  v-model="config.onBootSec"
                  type="text"
                  placeholder="2min"
                  class="w-full min-w-0 rounded-lg border px-2.5 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-1"
                  :class="!isValidSystemdTimespan(config.onBootSec) ? 'border-rose-400 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'"
                />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                  OnUnitActiveSec ({{ t('tools.systemdTimer.onUnitActiveHint') }})
                </label>
                <input
                  v-model="config.onUnitActiveSec"
                  type="text"
                  placeholder="1h"
                  class="w-full min-w-0 rounded-lg border px-2.5 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-1"
                  :class="!isValidSystemdTimespan(config.onUnitActiveSec) ? 'border-rose-400 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'"
                />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                  OnUnitInactiveSec ({{ t('tools.systemdTimer.onUnitInactiveHint') }})
                </label>
                <input
                  v-model="config.onUnitInactiveSec"
                  type="text"
                  placeholder="30min"
                  class="w-full min-w-0 rounded-lg border px-2.5 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-1"
                  :class="!isValidSystemdTimespan(config.onUnitInactiveSec) ? 'border-rose-400 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'"
                />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                  OnActiveSec ({{ t('tools.systemdTimer.onActiveHint') }})
                </label>
                <input
                  v-model="config.onActiveSec"
                  type="text"
                  placeholder="15m"
                  class="w-full min-w-0 rounded-lg border px-2.5 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-1"
                  :class="!isValidSystemdTimespan(config.onActiveSec) ? 'border-rose-400 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'"
                />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                  AccuracySec ({{ t('tools.systemdTimer.accuracyHint') }})
                </label>
                <input
                  v-model="config.accuracySec"
                  type="text"
                  placeholder="1min"
                  class="w-full min-w-0 rounded-lg border px-2.5 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-1"
                  :class="!isValidSystemdTimespan(config.accuracySec) ? 'border-rose-400 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'"
                />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                  RandomizedDelaySec ({{ t('tools.systemdTimer.randomDelayHint') }})
                </label>
                <input
                  v-model="config.randomizedDelaySec"
                  type="text"
                  placeholder="5min"
                  class="w-full min-w-0 rounded-lg border px-2.5 py-1.5 font-mono bg-zinc-50 dark:bg-zinc-950/60 focus:outline-none focus:ring-1"
                  :class="!isValidSystemdTimespan(config.randomizedDelaySec) ? 'border-rose-400 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <label class="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <input v-model="config.persistent" type="checkbox" class="mt-0.5 rounded text-blue-600 cursor-pointer" />
                <div>
                  <div class="font-mono font-semibold text-zinc-800 dark:text-zinc-200">Persistent=true</div>
                  <div class="text-[11px] text-zinc-500">{{ t('tools.systemdTimer.persistentDesc') }}</div>
                </div>
              </label>

              <label class="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <input v-model="config.fixedRandomDelay" type="checkbox" class="mt-0.5 rounded text-blue-600 cursor-pointer" />
                <div>
                  <div class="font-mono font-semibold text-zinc-800 dark:text-zinc-200">FixedRandomDelay=true</div>
                  <div class="text-[11px] text-zinc-500">{{ t('tools.systemdTimer.fixedRandomDesc') }}</div>
                </div>
              </label>

              <label class="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <input v-model="config.wakeSystem" type="checkbox" class="mt-0.5 rounded text-blue-600 cursor-pointer" />
                <div>
                  <div class="font-mono font-semibold text-zinc-800 dark:text-zinc-200">WakeSystem=true</div>
                  <div class="text-[11px] text-zinc-500">{{ t('tools.systemdTimer.wakeSystemDesc') }}</div>
                </div>
              </label>

              <label class="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <input v-model="config.remainAfterElapse" type="checkbox" class="mt-0.5 rounded text-blue-600 cursor-pointer" />
                <div>
                  <div class="font-mono font-semibold text-zinc-800 dark:text-zinc-200">RemainAfterElapse</div>
                  <div class="text-[11px] text-zinc-500">{{ t('tools.systemdTimer.remainAfterElapseDesc') }}</div>
                </div>
              </label>

              <label class="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <input v-model="config.onClockChange" type="checkbox" class="mt-0.5 rounded text-blue-600 cursor-pointer" />
                <div>
                  <div class="font-mono font-semibold text-zinc-800 dark:text-zinc-200">OnClockChange=true</div>
                  <div class="text-[11px] text-zinc-500">{{ t('tools.systemdTimer.onClockChangeDesc') }}</div>
                </div>
              </label>

              <label class="flex items-start gap-2 p-2.5 rounded-lg bg-zinc-50/70 dark:bg-zinc-950/40 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <input v-model="config.onTimezoneChange" type="checkbox" class="mt-0.5 rounded text-blue-600 cursor-pointer" />
                <div>
                  <div class="font-mono font-semibold text-zinc-800 dark:text-zinc-200">OnTimezoneChange=true</div>
                  <div class="text-[11px] text-zinc-500">{{ t('tools.systemdTimer.onTimezoneChangeDesc') }}</div>
                </div>
              </label>
            </div>
          </div>

          <!-- TAB 3: 配套 .service 存根与 [Install] -->
          <div v-else class="space-y-4">
            <div class="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/70 dark:border-blue-900/40 text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {{ t('tools.systemdTimer.serviceStubIntro', { service: serviceFilename, path: serviceInstallPath }) }}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="sm:col-span-2">
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                  ExecStart ({{ t('tools.systemdTimer.execStartHint') }})
                </label>
                <input
                  v-model="config.serviceExecStart"
                  type="text"
                  placeholder="/usr/local/bin/backup.sh"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div v-if="config.scope === 'system'">
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">User ({{ isZh ? '可选' : 'optional' }})</label>
                <input
                  v-model="config.serviceUser"
                  type="text"
                  placeholder="root / www-data"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">WorkingDirectory ({{ isZh ? '可选' : 'optional' }})</label>
                <input
                  v-model="config.serviceWorkingDir"
                  type="text"
                  placeholder="/opt/app"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
              <div class="font-semibold text-zinc-700 dark:text-zinc-300">
                [Install] WantedBy
              </div>
              <input
                :value="config.wantedBy.join(' ')"
                @input="config.wantedBy = ($event.target as HTMLInputElement).value.split(/\s+/).filter(Boolean)"
                type="text"
                placeholder="timers.target"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：.timer / .service 预览、命令与诊断 -->
      <div class="xl:col-span-5 flex flex-col gap-3 xl:min-h-0">
        <div class="flex-1 flex flex-col min-h-[260px]">
          <TextEditorBox
            :modelValue="activeOutputContent"
            :label="activeOutputFilename"
            :readonly="true"
            :showPaste="false"
            :showClear="false"
            :showLineNumbers="true"
            :showWrapToggle="true"
            :defaultWrap="false"
          >
            <template #actions>
              <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80 mr-1">
                <button
                  type="button"
                  @click="outputTab = 'timer'"
                  class="px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap"
                  :class="outputTab === 'timer' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-zinc-500'"
                >
                  .timer
                </button>
                <button
                  type="button"
                  @click="outputTab = 'service'"
                  class="px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap"
                  :class="outputTab === 'service' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-zinc-500'"
                >
                  .service
                </button>
              </div>

              <label
                v-if="outputTab === 'timer'"
                class="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mr-1 cursor-pointer whitespace-nowrap"
              >
                <input v-model="includeHeaderComment" type="checkbox" class="rounded text-blue-600" />
                <span>{{ t('tools.systemdTimer.headerComment') }}</span>
              </label>
            </template>
          </TextEditorBox>
        </div>

        <!-- 配套 systemctl / systemd-analyze 命令 -->
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs shrink-0 overflow-hidden">
          <button
            type="button"
            @click="showCommands = !showCommands"
            class="w-full px-3.5 py-2 flex items-center justify-between text-xs font-semibold bg-zinc-50/80 dark:bg-zinc-900/70 text-zinc-700 dark:text-zinc-200 cursor-pointer"
          >
            <span class="inline-flex items-center gap-1.5">
              <Terminal class="w-3.5 h-3.5 text-blue-500 shrink-0" />
              <span>{{ t('tools.systemdTimer.commandsTitle') }}</span>
            </span>
            <span class="text-[11px] font-normal text-zinc-400">
              {{ showCommands ? (isZh ? '收起' : 'Hide') : (isZh ? '展开' : 'Show') }}
            </span>
          </button>
          <div v-if="showCommands" class="p-3 space-y-2 max-h-48 overflow-y-auto border-t border-zinc-100 dark:border-zinc-800">
            <div
              v-for="cmd in companionCommands"
              :key="cmd.id"
              class="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1"
            >
              <div class="flex items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>{{ isZh ? cmd.labelZh : cmd.labelEn }}</span>
                <CopyButton :text="cmd.command" variant="ghost" />
              </div>
              <pre class="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all">{{ cmd.command }}</pre>
            </div>
          </div>
        </div>

        <!-- 校验诊断面板 -->
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs shrink-0 overflow-hidden">
          <button
            type="button"
            @click="showDiagnostics = !showDiagnostics"
            class="w-full px-3.5 py-2 flex items-center justify-between text-xs font-medium bg-zinc-50/80 dark:bg-zinc-900/70 cursor-pointer"
          >
            <div class="flex items-center gap-2 min-w-0">
              <CheckCircle2 v-if="errorCount === 0 && warningCount === 0" class="w-4 h-4 text-emerald-500 shrink-0" />
              <AlertCircle v-else-if="errorCount > 0" class="w-4 h-4 text-rose-500 shrink-0" />
              <AlertTriangle v-else class="w-4 h-4 text-amber-500 shrink-0" />
              <span class="truncate">
                {{ diagnostics.length === 0 ? t('tools.systemdTimer.lintPassed') : t('tools.systemdTimer.lintCount', { count: diagnostics.length }) }}
              </span>
            </div>
            <span class="text-[11px] text-zinc-400 shrink-0">
              {{ showDiagnostics ? (isZh ? '收起' : 'Hide') : (isZh ? '展开' : 'Show') }}
            </span>
          </button>

          <div
            v-if="showDiagnostics && diagnostics.length > 0"
            class="max-h-36 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 border-t border-zinc-100 dark:border-zinc-800"
          >
            <div
              v-for="(issue, idx) in diagnostics"
              :key="idx"
              class="px-3.5 py-2 text-xs flex items-start justify-between gap-2"
            >
              <div class="flex items-start gap-2 min-w-0">
                <AlertCircle v-if="issue.level === 'error'" class="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <AlertTriangle v-else-if="issue.level === 'warning'" class="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <Info v-else class="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span class="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {{ isZh ? issue.messageZh : issue.messageEn }}
                </span>
              </div>
              <button
                v-if="issue.fixable"
                type="button"
                @click="applyFix(issue.fixable)"
                class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-medium shrink-0 cursor-pointer whitespace-nowrap"
              >
                <Wrench class="w-3 h-3 shrink-0" />
                <span>{{ isZh ? '修复' : 'Fix' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入 .timer 模态框 -->
    <div
      v-if="showImportModal"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      @click.self="showImportModal = false"
    >
      <div class="w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col">
        <div class="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {{ t('tools.systemdTimer.importModalTitle') }}
          </span>
          <button
            type="button"
            @click="showImportModal = false"
            class="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-4 space-y-3 text-xs">
          <div class="flex items-center justify-between gap-2">
            <input ref="importFileRef" type="file" accept=".timer,.txt" class="hidden" @change="onImportFileSelected" />
            <button
              type="button"
              @click="importFileRef?.click()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
            >
              <Upload class="w-3.5 h-3.5" />
              <span>{{ t('tools.systemdTimer.chooseFile') }}</span>
            </button>
          </div>

          <textarea
            v-model="importText"
            rows="10"
            placeholder="[Unit]&#10;Description=...&#10;&#10;[Timer]&#10;OnCalendar=daily&#10;Persistent=true&#10;&#10;[Install]&#10;WantedBy=timers.target"
            class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 font-mono text-xs text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />

          <p v-if="importError" class="text-rose-500">{{ importError }}</p>
        </div>

        <div class="px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-end gap-2 bg-zinc-50/60 dark:bg-zinc-900/60 text-xs">
          <button
            type="button"
            @click="showImportModal = false"
            class="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            {{ t('tools.systemdTimer.cancel') }}
          </button>
          <button
            type="button"
            @click="confirmImport"
            class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer"
          >
            {{ t('tools.systemdTimer.confirmImport') }}
          </button>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
