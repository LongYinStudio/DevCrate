<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Cog,
  Plus,
  Trash2,
  Upload,
  FileDown,
  RotateCcw,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Play,
  GitBranch,
  FileText,
  Shield,
  Terminal,
  Wrench,
  X,
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import { downloadFile } from '../../utils/download';
import {
  COMMON_CAPABILITIES,
  COMMON_UNIT_TARGETS,
  SYSTEMD_PRESETS,
} from './systemdServicePresets';
import {
  fixUserScopeConfig,
  generateSystemdCommands,
  generateSystemdUnit,
  getUnitInstallPath,
  lintSystemdUnit,
  normalizeUnitFilename,
  parseSystemdUnit,
  type SystemdFormatOptions,
  type SystemdUnitConfig,
} from './systemdServiceUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// ==================== 核心状态 ====================
const activePresetId = ref(SYSTEMD_PRESETS[0].id);
const config = ref<SystemdUnitConfig>(SYSTEMD_PRESETS[0].build());

const activeTab = ref<'exec' | 'deps' | 'env' | 'limits'>('exec');
const outputTab = ref<'unit' | 'commands'>('unit');

const formatOptions = ref<SystemdFormatOptions>({
  includeHeaderComment: true,
});

const showImportModal = ref(false);
const importUnitText = ref('');
const importError = ref('');
const importFileInputRef = ref<HTMLInputElement | null>(null);

const toastMessage = ref('');
const isDownloaded = ref(false);

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = '';
  }, 3000);
}

// ==================== 派生数据 ====================
const unitFilename = computed(() => normalizeUnitFilename(config.value.unitName));
const installPath = computed(() => getUnitInstallPath(config.value));

const generatedUnit = computed(() =>
  generateSystemdUnit(config.value, formatOptions.value)
);

const generatedCommands = computed(() =>
  generateSystemdCommands(config.value, generatedUnit.value)
);

const lintIssues = computed(() => lintSystemdUnit(config.value));
const lintErrorCount = computed(() => lintIssues.value.filter(i => i.level === 'error').length);
const lintWarningCount = computed(() => lintIssues.value.filter(i => i.level === 'warning').length);
const hasFixableUserScope = computed(() =>
  lintIssues.value.some(i => i.fixable === 'fix-user-scope')
);

// ==================== 下拉选项 ====================
const serviceTypeOptions: SelectOption[] = [
  { label: 'simple', value: 'simple' },
  { label: 'exec', value: 'exec' },
  { label: 'forking', value: 'forking' },
  { label: 'oneshot', value: 'oneshot' },
  { label: 'notify', value: 'notify' },
  { label: 'idle', value: 'idle' },
];

const restartOptions: SelectOption[] = [
  { label: 'on-failure', value: 'on-failure' },
  { label: 'always', value: 'always' },
  { label: 'on-abnormal', value: 'on-abnormal' },
  { label: 'on-abort', value: 'on-abort' },
  { label: 'on-success', value: 'on-success' },
  { label: 'on-watchdog', value: 'on-watchdog' },
  { label: 'no', value: 'no' },
];

const killModeOptions = computed<SelectOption[]>(() => [
  { label: t('tools.systemdService.unset'), value: '' },
  { label: 'control-group', value: 'control-group' },
  { label: 'mixed', value: 'mixed' },
  { label: 'process', value: 'process' },
  { label: 'none', value: 'none' },
]);

const protectSystemOptions = computed<SelectOption[]>(() => [
  { label: t('tools.systemdService.unset'), value: '' },
  { label: 'true', value: 'true' },
  { label: 'full', value: 'full' },
  { label: 'strict', value: 'strict' },
]);

const protectHomeOptions = computed<SelectOption[]>(() => [
  { label: t('tools.systemdService.unset'), value: '' },
  { label: 'true', value: 'true' },
  { label: 'read-only', value: 'read-only' },
  { label: 'tmpfs', value: 'tmpfs' },
]);

// ==================== 预设与表单操作 ====================
function applyPreset(presetId: string) {
  const preset = SYSTEMD_PRESETS.find(p => p.id === presetId);
  if (!preset) return;
  activePresetId.value = presetId;
  config.value = preset.build();
}

function resetPreset() {
  applyPreset(activePresetId.value);
}

function switchScope(scope: 'system' | 'user') {
  config.value.scope = scope;
  if (scope === 'user' && config.value.wantedBy.includes('multi-user.target')) {
    config.value.wantedBy = config.value.wantedBy.map(w =>
      w === 'multi-user.target' ? 'default.target' : w
    );
  } else if (scope === 'system' && config.value.wantedBy.includes('default.target')) {
    config.value.wantedBy = config.value.wantedBy.map(w =>
      w === 'default.target' ? 'multi-user.target' : w
    );
  }
}

function parseSpaceList(raw: string): string[] {
  return raw
    .split(/[\s,]+/)
    .map(s => s.trim())
    .filter(Boolean);
}

function toggleListToken(list: string[], token: string) {
  const idx = list.indexOf(token);
  if (idx >= 0) list.splice(idx, 1);
  else list.push(token);
}

function handleFixUserScope() {
  if (fixUserScopeConfig(config.value)) {
    showToast(t('tools.systemdService.fixedUserScopeToast'));
  }
}

// ==================== 导入与导出 ====================
function openImportModal() {
  importUnitText.value = generatedUnit.value;
  importError.value = '';
  showImportModal.value = true;
}

function handleImportFile(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      importUnitText.value = reader.result;
    }
  };
  reader.readAsText(file);
}

function confirmImport() {
  importError.value = '';
  try {
    const parsed = parseSystemdUnit(importUnitText.value, config.value.unitName);
    config.value = parsed;
    showImportModal.value = false;
    showToast(t('tools.systemdService.importedToast', { name: parsed.unitName }));
  } catch (err) {
    importError.value = err instanceof Error ? err.message : String(err);
  }
}

function downloadServiceFile() {
  downloadFile(generatedUnit.value, unitFilename.value, 'text/plain;charset=utf-8');
  isDownloaded.value = true;
  setTimeout(() => {
    isDownloaded.value = false;
  }, 1800);
  showToast(t('tools.systemdService.downloadedNotice', { filename: unitFilename.value }));
}
</script>

<template>
  <ToolContainer
    tool-id="systemd-service"
    name-key="tools.systemdService.name"
    desc-key="tools.systemdService.desc"
    :icon="Cog"
    :full-height="false"
    wide
  >
    <template #header-actions>
      <button
        type="button"
        @click="openImportModal"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Upload class="w-3.5 h-3.5" />
        <span>{{ t('tools.systemdService.importBtn') }}</span>
      </button>

      <button
        type="button"
        @click="resetPreset"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer shrink-0"
        :title="t('common.reset')"
      >
        <RotateCcw class="w-3.5 h-3.5" />
      </button>

      <button
        type="button"
        @click="downloadServiceFile"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Check v-if="isDownloaded" class="w-3.5 h-3.5" />
        <FileDown v-else class="w-3.5 h-3.5" />
        <span>{{ t('tools.systemdService.downloadBtn') }}</span>
      </button>
    </template>

    <!-- 提示条 -->
    <div
      v-if="toastMessage"
      class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs"
    >
      <Check class="w-4 h-4 shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- 场景预设栏 -->
    <div
      class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 px-3.5 py-2.5 flex flex-wrap items-center gap-2"
    >
      <span class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mr-1">
        <Sparkles class="w-3.5 h-3.5 text-blue-500" />
        {{ t('tools.systemdService.presetsLabel') }}:
      </span>
      <button
        v-for="preset in SYSTEMD_PRESETS"
        :key="preset.id"
        type="button"
        @click="applyPreset(preset.id)"
        :title="isZh ? preset.descZh : preset.descEn"
        class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border"
        :class="
          activePresetId === preset.id
            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400/70 dark:border-blue-700 text-blue-700 dark:text-blue-300'
            : 'bg-zinc-50 dark:bg-zinc-800/70 border-zinc-200/80 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:border-blue-400/60'
        "
      >
        {{ isZh ? preset.nameZh : preset.nameEn }}
      </button>
    </div>

    <!-- 主工作区 -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
      <!-- 左侧配置区 (7 cols) -->
      <div class="xl:col-span-7 flex flex-col gap-3 min-w-0">
        <!-- 基本信息卡片 -->
        <div
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-3 text-xs"
        >
          <div class="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
            <div class="sm:col-span-5">
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                {{ t('tools.systemdService.unitNameLabel') }}
              </label>
              <input
                v-model="config.unitName"
                type="text"
                placeholder="myapp.service"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
              />
            </div>

            <div class="sm:col-span-4">
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                {{ t('tools.systemdService.scopeLabel') }}
              </label>
              <div class="grid grid-cols-2 rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700">
                <button
                  type="button"
                  @click="switchScope('system')"
                  class="py-1 rounded-md font-medium cursor-pointer transition-colors"
                  :class="config.scope === 'system' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'"
                >
                  System
                </button>
                <button
                  type="button"
                  @click="switchScope('user')"
                  class="py-1 rounded-md font-mono font-medium cursor-pointer transition-colors"
                  :class="config.scope === 'user' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'"
                >
                  --user
                </button>
              </div>
            </div>

            <div class="sm:col-span-3 text-[11px] font-mono text-zinc-400 truncate pb-1.5" :title="installPath">
              {{ installPath }}
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">Description</label>
              <input
                v-model="config.description"
                type="text"
                placeholder="My Backend API Service"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5"
              />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">Documentation (optional)</label>
              <input
                v-model="config.documentation"
                type="text"
                placeholder="https://example.com/docs"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>
        </div>

        <!-- 分页详情配置卡 -->
        <div
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-4 text-xs"
        >
          <div class="flex flex-wrap gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <button
              v-for="tab in [
                { id: 'exec', label: t('tools.systemdService.tabExec'), icon: Play },
                { id: 'deps', label: t('tools.systemdService.tabDeps'), icon: GitBranch },
                { id: 'env', label: t('tools.systemdService.tabEnv'), icon: FileText },
                { id: 'limits', label: t('tools.systemdService.tabLimits'), icon: Shield },
              ]"
              :key="tab.id"
              type="button"
              @click="activeTab = tab.id as any"
              class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              :class="
                activeTab === tab.id
                  ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                  : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
              "
            >
              <component :is="tab.icon" class="w-3.5 h-3.5" />
              <span>{{ tab.label }}</span>
            </button>
          </div>

          <!-- TAB 1: 启动执行与重启策略 -->
          <div v-if="activeTab === 'exec'" class="space-y-3.5">
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">Type</label>
                <CustomSelect v-model="config.type" :options="serviceTypeOptions" full-width />
              </div>
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">WorkingDirectory</label>
                <input
                  v-model="config.workingDirectory"
                  type="text"
                  placeholder="/opt/myapp"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div class="flex items-end pb-1.5">
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                  <input v-model="config.remainAfterExit" type="checkbox" class="accent-blue-600" />
                  <span class="font-mono">RemainAfterExit</span>
                </label>
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                ExecStart ({{ t('tools.systemdService.absPathHint') }})
              </label>
              <input
                v-model="config.execStart"
                type="text"
                placeholder="/usr/bin/node /opt/myapp/dist/server.js"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
              />
            </div>

            <div v-if="config.scope === 'system'" class="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">User</label>
                <input
                  v-model="config.user"
                  type="text"
                  placeholder="www-data"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">Group</label>
                <input
                  v-model="config.group"
                  type="text"
                  placeholder="www-data"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">UMask</label>
                <input
                  v-model="config.umask"
                  type="text"
                  placeholder="0027"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>

            <!-- 重启与超时 -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">Restart</label>
                <CustomSelect v-model="config.restart" :options="restartOptions" full-width />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">RestartSec</label>
                <input
                  v-model="config.restartSec"
                  type="text"
                  placeholder="5s"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">TimeoutStartSec</label>
                <input
                  v-model="config.timeoutStartSec"
                  type="text"
                  placeholder="90s"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">TimeoutStopSec</label>
                <input
                  v-model="config.timeoutStopSec"
                  type="text"
                  placeholder="30s"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
            </div>

            <!-- 钩子与信号 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">ExecReload</label>
                <input
                  v-model="config.execReload"
                  type="text"
                  placeholder="/bin/kill -HUP $MAINPID"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">ExecStop</label>
                <input
                  v-model="config.execStop"
                  type="text"
                  placeholder="(optional graceful stop cmd)"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">KillMode</label>
                <CustomSelect v-model="config.killMode" :options="killModeOptions" full-width />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">SuccessExitStatus</label>
                <input
                  v-model="config.successExitStatus"
                  type="text"
                  placeholder="143"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">PIDFile</label>
                <input
                  v-model="config.pidFile"
                  type="text"
                  placeholder="/run/myapp.pid"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
            </div>

            <!-- ExecStartPre -->
            <div class="space-y-1.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div class="flex items-center justify-between">
                <span class="font-medium text-zinc-600 dark:text-zinc-300">ExecStartPre</span>
                <button
                  type="button"
                  @click="config.execStartPre.push('/usr/bin/mkdir -p /var/lib/myapp')"
                  class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>{{ t('tools.systemdService.addItem') }}</span>
                </button>
              </div>
              <div v-for="(_p, idx) in config.execStartPre" :key="idx" class="flex items-center gap-2">
                <input
                  v-model="config.execStartPre[idx]"
                  type="text"
                  class="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1 font-mono"
                />
                <button
                  type="button"
                  @click="config.execStartPre.splice(idx, 1)"
                  class="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 2: 单元依赖与安装目标 -->
          <div v-if="activeTab === 'deps'" class="space-y-4">
            <!-- Quick target chips -->
            <div>
              <div class="text-[11px] font-medium text-zinc-500 mb-1.5">
                {{ t('tools.systemdService.quickTargetsAfter') }}
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="tgt in COMMON_UNIT_TARGETS"
                  :key="tgt"
                  type="button"
                  @click="toggleListToken(config.after, tgt)"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-lg border font-mono text-[11px] cursor-pointer transition-colors"
                  :class="
                    config.after.includes(tgt)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500'
                  "
                >
                  <Check v-if="config.after.includes(tgt)" class="w-3 h-3" />
                  <span>{{ tgt }}</span>
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">After</label>
                <input
                  :value="config.after.join(' ')"
                  @input="config.after = parseSpaceList(($event.target as HTMLInputElement).value)"
                  type="text"
                  placeholder="network-online.target postgresql.service"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">Wants</label>
                <input
                  :value="config.wants.join(' ')"
                  @input="config.wants = parseSpaceList(($event.target as HTMLInputElement).value)"
                  type="text"
                  placeholder="network-online.target"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">Requires</label>
                <input
                  :value="config.requires.join(' ')"
                  @input="config.requires = parseSpaceList(($event.target as HTMLInputElement).value)"
                  type="text"
                  placeholder="docker.service"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">BindsTo</label>
                <input
                  :value="config.bindsTo.join(' ')"
                  @input="config.bindsTo = parseSpaceList(($event.target as HTMLInputElement).value)"
                  type="text"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">StartLimitIntervalSec</label>
                <input
                  v-model="config.startLimitIntervalSec"
                  type="text"
                  placeholder="60s"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">StartLimitBurst</label>
                <input
                  v-model="config.startLimitBurst"
                  type="text"
                  placeholder="5"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">[Install] WantedBy</label>
                <input
                  :value="config.wantedBy.join(' ')"
                  @input="config.wantedBy = parseSpaceList(($event.target as HTMLInputElement).value)"
                  type="text"
                  placeholder="multi-user.target"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">[Install] Alias</label>
                <input
                  v-model="config.alias"
                  type="text"
                  placeholder="app.service"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>
          </div>

          <!-- TAB 3: 环境变量与日志输出 -->
          <div v-if="activeTab === 'env'" class="space-y-4">
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-zinc-700 dark:text-zinc-200">
                  Environment ({{ t('tools.systemdService.envVars') }})
                </span>
                <button
                  type="button"
                  @click="config.environments.push({ key: '', value: '' })"
                  class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>{{ t('tools.systemdService.addItem') }}</span>
                </button>
              </div>
              <div
                v-for="(e, idx) in config.environments"
                :key="idx"
                class="grid grid-cols-12 gap-1.5 items-center"
              >
                <input
                  v-model="e.key"
                  type="text"
                  placeholder="KEY"
                  class="col-span-5 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                />
                <input
                  v-model="e.value"
                  type="text"
                  placeholder="value"
                  class="col-span-6 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                />
                <button
                  type="button"
                  @click="config.environments.splice(idx, 1)"
                  class="col-span-1 p-1 text-zinc-400 hover:text-rose-500 cursor-pointer flex justify-center"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div class="flex items-center justify-between">
                <span class="font-semibold text-zinc-700 dark:text-zinc-200">
                  EnvironmentFile <span class="font-normal text-zinc-400">({{ t('tools.systemdService.envFilePrefixHint') }})</span>
                </span>
                <button
                  type="button"
                  @click="config.environmentFiles.push('-/opt/myapp/.env')"
                  class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>{{ t('tools.systemdService.addItem') }}</span>
                </button>
              </div>
              <div
                v-for="(_ef, idx) in config.environmentFiles"
                :key="idx"
                class="flex items-center gap-2"
              >
                <input
                  v-model="config.environmentFiles[idx]"
                  type="text"
                  placeholder="-/opt/myapp/.env"
                  class="flex-1 min-w-0 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                />
                <button
                  type="button"
                  @click="config.environmentFiles.splice(idx, 1)"
                  class="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">SyslogIdentifier</label>
                <input
                  v-model="config.syslogIdentifier"
                  type="text"
                  placeholder="myapp"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">StandardOutput</label>
                <input
                  v-model="config.standardOutput"
                  type="text"
                  placeholder="journal or append:/var/log/app.log"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">StandardError</label>
                <input
                  v-model="config.standardError"
                  type="text"
                  placeholder="journal"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
            </div>
          </div>

          <!-- TAB 4: 资源限额与安全沙箱 -->
          <div v-if="activeTab === 'limits'" class="space-y-4">
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">LimitNOFILE</label>
                <input
                  v-model="config.limitNOFILE"
                  type="text"
                  placeholder="65535"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">MemoryHigh</label>
                <input
                  v-model="config.memoryHigh"
                  type="text"
                  placeholder="384M"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">MemoryMax</label>
                <input
                  v-model="config.memoryMax"
                  type="text"
                  placeholder="512M"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">CPUQuota</label>
                <input
                  v-model="config.cpuQuota"
                  type="text"
                  placeholder="100%"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">LimitNPROC</label>
                <input
                  v-model="config.limitNPROC"
                  type="text"
                  placeholder="4096"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">TasksMax</label>
                <input
                  v-model="config.tasksMax"
                  type="text"
                  placeholder="512"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                />
              </div>
            </div>

            <!-- Security Sandboxing -->
            <div class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/20">
              <div class="font-semibold text-zinc-700 dark:text-zinc-200">
                {{ t('tools.systemdService.sandboxingTitle') }}
              </div>

              <div class="flex flex-wrap gap-4">
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                  <input v-model="config.noNewPrivileges" type="checkbox" class="accent-blue-600" />
                  <span class="font-mono">NoNewPrivileges=true</span>
                </label>
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                  <input v-model="config.privateTmp" type="checkbox" class="accent-blue-600" />
                  <span class="font-mono">PrivateTmp=true</span>
                </label>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">ProtectSystem</label>
                  <CustomSelect v-model="config.protectSystem" :options="protectSystemOptions" full-width />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">ProtectHome</label>
                  <CustomSelect v-model="config.protectHome" :options="protectHomeOptions" full-width />
                </div>
              </div>

              <div>
                <label class="block text-[10px] text-zinc-400 mb-1">ReadWritePaths</label>
                <input
                  :value="config.readWritePaths.join(' ')"
                  @input="config.readWritePaths = parseSpaceList(($event.target as HTMLInputElement).value)"
                  type="text"
                  placeholder="/var/lib/myapp /var/log/myapp"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
              </div>

              <div>
                <div class="flex flex-wrap items-center justify-between gap-2 mb-1">
                  <label class="text-[10px] text-zinc-400">AmbientCapabilities</label>
                  <div class="flex flex-wrap gap-1">
                    <button
                      v-for="cap in COMMON_CAPABILITIES"
                      :key="cap"
                      type="button"
                      @click="config.ambientCapabilities = cap"
                      class="px-1.5 py-0.2 rounded bg-zinc-200/70 dark:bg-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-300 hover:text-blue-600 cursor-pointer"
                    >
                      + {{ cap }}
                    </button>
                  </div>
                </div>
                <input
                  v-model="config.ambientCapabilities"
                  type="text"
                  placeholder="CAP_NET_BIND_SERVICE"
                  class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧栏 (5 cols)：诊断、.service 预览与 systemctl/journalctl 命令 -->
      <div class="xl:col-span-5 flex flex-col gap-3 min-w-0 xl:sticky xl:top-0">
        <!-- 静态检查面板 -->
        <div
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-3 space-y-2 text-xs"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2 font-semibold">
              <AlertCircle v-if="lintErrorCount > 0" class="w-4 h-4 text-rose-500" />
              <AlertTriangle v-else-if="lintWarningCount > 0" class="w-4 h-4 text-amber-500" />
              <Check v-else class="w-4 h-4 text-emerald-500" />
              <span class="text-zinc-800 dark:text-zinc-100">
                {{
                  lintIssues.length === 0
                    ? t('tools.systemdService.lintPassed')
                    : t('tools.systemdService.lintCount', { count: lintIssues.length })
                }}
              </span>
            </div>

            <button
              v-if="hasFixableUserScope"
              type="button"
              @click="handleFixUserScope"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 hover:bg-amber-100 cursor-pointer"
            >
              <Wrench class="w-3 h-3" />
              <span>{{ t('tools.systemdService.fixUserScopeBtn') }}</span>
            </button>
          </div>

          <div v-if="lintIssues.length > 0" class="space-y-1 max-h-36 overflow-y-auto">
            <div
              v-for="(issue, idx) in lintIssues"
              :key="idx"
              class="flex items-start gap-1.5 text-[11px] rounded-lg px-2 py-1"
              :class="
                issue.level === 'error'
                  ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300'
                  : issue.level === 'warning'
                    ? 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300'
              "
            >
              <Info class="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>{{ isZh ? issue.messageZh : issue.messageEn }}</span>
            </div>
          </div>
        </div>

        <!-- 输出卡片 -->
        <div
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-3.5 flex flex-col gap-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="inline-flex rounded-xl p-0.5 bg-zinc-100 dark:bg-zinc-800 text-xs">
              <button
                type="button"
                @click="outputTab = 'unit'"
                class="px-2.5 py-1 rounded-lg font-mono font-medium cursor-pointer transition-colors whitespace-nowrap"
                :class="outputTab === 'unit' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'"
              >
                {{ unitFilename }}
              </button>
              <button
                type="button"
                @click="outputTab = 'commands'"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap"
                :class="outputTab === 'commands' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'"
              >
                <Terminal class="w-3 h-3" />
                <span>systemctl / journalctl</span>
              </button>
            </div>

            <CopyButton v-if="outputTab === 'unit'" :text="generatedUnit" />
          </div>

          <template v-if="outputTab === 'unit'">
            <div class="flex items-center justify-between gap-2 text-xs">
              <label class="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 cursor-pointer">
                <input v-model="formatOptions.includeHeaderComment" type="checkbox" class="accent-blue-600" />
                <span>{{ t('tools.systemdService.headerComment') }}</span>
              </label>
              <span class="text-[11px] font-mono text-zinc-400">
                {{ generatedUnit.split('\n').length }} lines
              </span>
            </div>

            <pre
              class="min-h-[280px] max-h-[520px] xl:max-h-[calc(100vh-19rem)] rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 p-3.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 overflow-auto leading-relaxed select-all"
            >{{ generatedUnit }}</pre>
          </template>

          <template v-else>
            <div class="space-y-2.5 text-xs max-h-[540px] overflow-y-auto pr-0.5">
              <div
                v-for="item in [
                  { title: t('tools.systemdService.cmdDeploy'), cmd: generatedCommands.deployOneLiner },
                  { title: t('tools.systemdService.cmdReloadEnable'), cmd: generatedCommands.reloadAndEnable },
                  { title: t('tools.systemdService.cmdStatus'), cmd: generatedCommands.statusCmd },
                  { title: t('tools.systemdService.cmdRestart'), cmd: generatedCommands.restartCmd },
                  { title: t('tools.systemdService.cmdStop'), cmd: generatedCommands.stopCmd },
                  { title: t('tools.systemdService.cmdLogsFollow'), cmd: generatedCommands.logsFollow },
                  { title: t('tools.systemdService.cmdLogsErrors'), cmd: generatedCommands.logsErrors },
                  { title: t('tools.systemdService.cmdVerify'), cmd: generatedCommands.analyzeVerify },
                  ...(generatedCommands.lingerHint
                    ? [{ title: t('tools.systemdService.cmdLinger'), cmd: generatedCommands.lingerHint }]
                    : []),
                ]"
                :key="item.title"
                class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/60 p-2.5 space-y-1.5"
              >
                <div class="flex items-center justify-between gap-2">
                  <span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">{{ item.title }}</span>
                  <CopyButton :text="item.cmd" />
                </div>
                <pre class="text-[11px] font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all select-all">{{ item.cmd }}</pre>
              </div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- 导入 .service 文件弹窗 -->
    <div
      v-if="showImportModal"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      @click.self="showImportModal = false"
    >
      <div
        class="w-full max-w-3xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-5 flex flex-col gap-3.5 max-h-[88vh]"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {{ t('tools.systemdService.importModalTitle') }}
          </h3>
          <div class="flex items-center gap-2">
            <input
              ref="importFileInputRef"
              type="file"
              accept=".service,.unit,.txt"
              class="hidden"
              @change="handleImportFile"
            />
            <button
              type="button"
              @click="importFileInputRef?.click()"
              class="px-2.5 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {{ t('tools.systemdService.chooseFile') }}
            </button>
            <button
              type="button"
              @click="showImportModal = false"
              class="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <textarea
          v-model="importUnitText"
          rows="10"
          placeholder="[Unit]&#10;Description=My Service&#10;&#10;[Service]&#10;ExecStart=/usr/bin/node /opt/app/index.js"
          class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 text-xs font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500 resize-y"
        />

        <div
          v-if="importError"
          class="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 px-3 py-2 text-xs text-rose-700 dark:text-rose-300"
        >
          {{ importError }}
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            @click="showImportModal = false"
            class="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            {{ t('tools.systemdService.cancel') }}
          </button>
          <button
            type="button"
            @click="confirmImport"
            :disabled="!importUnitText.trim()"
            class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-40"
          >
            {{ t('tools.systemdService.confirmImport') }}
          </button>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
