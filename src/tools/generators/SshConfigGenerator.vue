<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  SquareTerminal,
  Plus,
  Copy,
  Trash2,
  Upload,
  FileDown,
  RotateCcw,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  Sparkles,
  Server,
  Waypoints,
  Shield,
  SlidersHorizontal,
  ArrowUp,
  ArrowDown,
  Eye,
  EyeOff,
  Terminal,
  Wrench,
  X,
  ArrowRight,
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import { downloadFile } from '../../utils/download';
import { SSH_PRESETS } from './sshConfigPresets';
import {
  cloneSshHost,
  createEmptyHost,
  generateSshCliCommands,
  generateSshConfig,
  lintSshConfig,
  moveWildcardHostsToBottom,
  parseSshConfig,
  type SshConfigDocument,
  type SshFormatOptions,
  type SshHostEntry,
} from './sshConfigUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// ==================== 核心状态 ====================
const activePresetId = ref(SSH_PRESETS[0].id);
const doc = ref<SshConfigDocument>(SSH_PRESETS[0].build());
const selectedHostUid = ref<string>(doc.value.hosts[0]?.uid ?? '');

const activeSubTab = ref<'connection' | 'forwarding' | 'keepalive' | 'advanced'>('connection');
const outputTab = ref<'config' | 'cli'>('config');

const formatOptions = ref<SshFormatOptions>({
  indentSize: 2,
  includeHeaderComment: true,
  includeDisabledAsComments: true,
});

const showImportModal = ref(false);
const importConfigText = ref('');
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
const activeHost = computed<SshHostEntry | undefined>(() => {
  return doc.value.hosts.find(h => h.uid === selectedHostUid.value) ?? doc.value.hosts[0];
});

const activeHostIndex = computed(() => {
  if (!activeHost.value) return -1;
  return doc.value.hosts.findIndex(h => h.uid === activeHost.value!.uid);
});

const generatedConfig = computed(() => generateSshConfig(doc.value, formatOptions.value));

const generatedCli = computed(() => {
  if (!activeHost.value) return null;
  return generateSshCliCommands(activeHost.value);
});

const lintIssues = computed(() => lintSshConfig(doc.value));
const lintErrorCount = computed(() => lintIssues.value.filter(i => i.level === 'error').length);
const lintWarningCount = computed(() => lintIssues.value.filter(i => i.level === 'warning').length);
const hasMovableWildcard = computed(() =>
  lintIssues.value.some(i => i.fixable === 'move-wildcard-bottom')
);

const jumpHostQuickCandidates = computed(() => {
  const curUid = activeHost.value?.uid;
  return doc.value.hosts
    .filter(h => h.uid !== curUid && !h.disabled && h.alias.trim() && !h.alias.includes('*'))
    .map(h => h.alias.trim().split(/\s+/)[0]);
});

// ==================== 下拉选项 ====================
const indentOptions: SelectOption[] = [
  { label: '2 spaces', value: 2 },
  { label: '4 spaces', value: 4 },
];

const boolSelectOptions = computed<SelectOption[]>(() => [
  { label: t('tools.sshConfig.unset'), value: '' },
  { label: 'yes', value: 'yes' },
  { label: 'no', value: 'no' },
]);

const addKeysOptions = computed<SelectOption[]>(() => [
  { label: t('tools.sshConfig.unset'), value: '' },
  { label: 'yes', value: 'yes' },
  { label: 'no', value: 'no' },
  { label: 'ask', value: 'ask' },
  { label: 'confirm', value: 'confirm' },
]);

const strictHostOptions = computed<SelectOption[]>(() => [
  { label: t('tools.sshConfig.unset'), value: '' },
  { label: 'accept-new', value: 'accept-new' },
  { label: 'yes', value: 'yes' },
  { label: 'ask', value: 'ask' },
  { label: 'no', value: 'no' },
]);

const controlMasterOptions = computed<SelectOption[]>(() => [
  { label: t('tools.sshConfig.unset'), value: '' },
  { label: 'auto', value: 'auto' },
  { label: 'yes', value: 'yes' },
  { label: 'no', value: 'no' },
  { label: 'ask', value: 'ask' },
  { label: 'autoask', value: 'autoask' },
]);

const gatewayPortsOptions = computed<SelectOption[]>(() => [
  { label: t('tools.sshConfig.unset'), value: '' },
  { label: 'clientspecified', value: 'clientspecified' },
  { label: 'yes', value: 'yes' },
  { label: 'no', value: 'no' },
]);

const requestTtyOptions = computed<SelectOption[]>(() => [
  { label: t('tools.sshConfig.unset'), value: '' },
  { label: 'auto', value: 'auto' },
  { label: 'yes', value: 'yes' },
  { label: 'no', value: 'no' },
  { label: 'force', value: 'force' },
]);

// ==================== 预设与主机列表操作 ====================
function applyPreset(presetId: string) {
  const found = SSH_PRESETS.find(p => p.id === presetId);
  if (!found) return;
  activePresetId.value = presetId;
  doc.value = found.build();
  selectedHostUid.value = doc.value.hosts[0]?.uid ?? '';
}

function resetPreset() {
  applyPreset(activePresetId.value);
}

function uniqueAlias(base: string): string {
  const used = new Set(doc.value.hosts.map(h => h.alias.trim()));
  let candidate = base;
  let i = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

function addHost(isWildcard = false) {
  const host = isWildcard
    ? createEmptyHost({
        alias: '*',
        serverAliveInterval: '60',
        serverAliveCountMax: '3',
        addKeysToAgent: 'yes',
      })
    : createEmptyHost({
        alias: uniqueAlias('server'),
        hostName: '192.168.1.10',
        user: 'ubuntu',
        identityFiles: ['~/.ssh/id_ed25519'],
      });

  if (isWildcard) {
    doc.value.hosts.push(host);
  } else {
    // Insert before trailing Host * if present
    const wildcardIdx = doc.value.hosts.findIndex(h => h.alias.trim() === '*');
    if (wildcardIdx >= 0) {
      doc.value.hosts.splice(wildcardIdx, 0, host);
    } else {
      doc.value.hosts.push(host);
    }
  }
  selectedHostUid.value = host.uid;
}

function duplicateActiveHost() {
  if (!activeHost.value) return;
  const copy = cloneSshHost(activeHost.value, uniqueAlias(activeHost.value.alias));
  const idx = activeHostIndex.value;
  doc.value.hosts.splice(idx + 1, 0, copy);
  selectedHostUid.value = copy.uid;
}

function moveActiveHost(dir: -1 | 1) {
  const idx = activeHostIndex.value;
  if (idx < 0) return;
  const target = idx + dir;
  if (target < 0 || target >= doc.value.hosts.length) return;
  const [item] = doc.value.hosts.splice(idx, 1);
  doc.value.hosts.splice(target, 0, item);
}

function removeActiveHost() {
  const idx = activeHostIndex.value;
  if (idx < 0 || doc.value.hosts.length <= 1) return;
  doc.value.hosts.splice(idx, 1);
  selectedHostUid.value = doc.value.hosts[Math.max(0, idx - 1)]?.uid ?? '';
}

function handleMoveWildcardToBottom() {
  const moved = moveWildcardHostsToBottom(doc.value);
  if (moved > 0) {
    showToast(t('tools.sshConfig.movedWildcardToast'));
  }
}

// ==================== 主机内部数组项编辑 ====================
function addIdentityFile() {
  activeHost.value?.identityFiles.push('~/.ssh/id_ed25519');
}

function addLocalForward() {
  activeHost.value?.localForwards.push({
    bindAddress: '127.0.0.1',
    bindPort: '15432',
    targetHost: '127.0.0.1',
    targetPort: '5432',
  });
}

function addRemoteForward() {
  activeHost.value?.remoteForwards.push({
    bindAddress: '127.0.0.1',
    bindPort: '9000',
    targetHost: '127.0.0.1',
    targetPort: '3000',
  });
}

function addDynamicForward() {
  activeHost.value?.dynamicForwards.push({
    bindAddress: '127.0.0.1',
    port: '1080',
  });
}

function applyMultiplexingQuickPreset() {
  if (!activeHost.value) return;
  activeHost.value.controlMaster = 'auto';
  activeHost.value.controlPath = '~/.ssh/cm-%r@%h:%p';
  activeHost.value.controlPersist = '10m';
}

// ==================== 导入与导出 ====================
function openImportModal() {
  importConfigText.value = generatedConfig.value;
  importError.value = '';
  showImportModal.value = true;
}

function handleConfigFileUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      importConfigText.value = reader.result;
    }
  };
  reader.readAsText(file);
}

function confirmImportConfig() {
  importError.value = '';
  const parsed = parseSshConfig(importConfigText.value);
  if (parsed.hosts.length === 0 && parsed.topIncludes.length === 0) {
    importError.value = t('tools.sshConfig.importEmptyError');
    return;
  }
  doc.value = parsed;
  selectedHostUid.value = parsed.hosts[0]?.uid ?? '';
  showImportModal.value = false;
  showToast(t('tools.sshConfig.importedToast', { count: parsed.hosts.length }));
}

function downloadSshConfig() {
  downloadFile(generatedConfig.value, 'config', 'text/plain;charset=utf-8');
  isDownloaded.value = true;
  setTimeout(() => {
    isDownloaded.value = false;
  }, 1800);
  showToast(t('tools.sshConfig.downloadedNotice'));
}
</script>

<template>
  <ToolContainer
    tool-id="ssh-config"
    name-key="tools.sshConfig.name"
    desc-key="tools.sshConfig.desc"
    :icon="SquareTerminal"
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
        <span>{{ t('tools.sshConfig.importBtn') }}</span>
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
        @click="downloadSshConfig"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Check v-if="isDownloaded" class="w-3.5 h-3.5" />
        <FileDown v-else class="w-3.5 h-3.5" />
        <span>{{ t('tools.sshConfig.downloadBtn') }}</span>
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

    <!-- 快捷预设栏 -->
    <div
      class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 px-3.5 py-2.5 flex flex-wrap items-center gap-2"
    >
      <span class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mr-1">
        <Sparkles class="w-3.5 h-3.5 text-blue-500" />
        {{ t('tools.sshConfig.presetsLabel') }}:
      </span>
      <button
        v-for="preset in SSH_PRESETS"
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
        <div
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 flex flex-col gap-3.5"
        >
          <!-- 主机列表选择器 -->
          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                v-for="h in doc.hosts"
                :key="h.uid"
                type="button"
                @click="selectedHostUid = h.uid"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer"
                :class="[
                  activeHost?.uid === h.uid
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:border-blue-400/60',
                  h.disabled ? 'opacity-50 line-through' : '',
                ]"
              >
                <span>{{ h.alias || 'unnamed' }}</span>
                <span
                  v-if="h.localForwards.length + h.remoteForwards.length + h.dynamicForwards.length > 0"
                  class="px-1 py-0.2 rounded bg-blue-500/15 text-[10px]"
                >
                  {{ h.localForwards.length + h.remoteForwards.length + h.dynamicForwards.length }}T
                </span>
              </button>

              <button
                type="button"
                @click="addHost(false)"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-blue-600 hover:border-blue-400 transition-colors cursor-pointer whitespace-nowrap"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ t('tools.sshConfig.addHost') }}</span>
              </button>

              <button
                type="button"
                @click="addHost(true)"
                class="inline-flex items-center gap-1 px-2 py-1.5 rounded-xl text-xs font-mono border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-blue-600 hover:border-blue-400 transition-colors cursor-pointer whitespace-nowrap"
                :title="t('tools.sshConfig.addWildcardTitle')"
              >
                + Host *
              </button>
            </div>

            <div v-if="activeHost" class="flex items-center gap-1">
              <button
                type="button"
                @click="moveActiveHost(-1)"
                :disabled="activeHostIndex <= 0"
                class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-30"
                :title="t('tools.sshConfig.moveUp')"
              >
                <ArrowUp class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="moveActiveHost(1)"
                :disabled="activeHostIndex >= doc.hosts.length - 1"
                class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-30"
                :title="t('tools.sshConfig.moveDown')"
              >
                <ArrowDown class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="activeHost.disabled = !activeHost.disabled"
                class="p-1.5 rounded-lg text-zinc-400 hover:text-amber-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                :title="activeHost.disabled ? t('tools.sshConfig.enableHost') : t('tools.sshConfig.disableHost')"
              >
                <EyeOff v-if="activeHost.disabled" class="w-3.5 h-3.5" />
                <Eye v-else class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="duplicateActiveHost"
                class="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                :title="t('tools.sshConfig.duplicateHost')"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="removeActiveHost"
                :disabled="doc.hosts.length <= 1"
                class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer disabled:opacity-30"
                :title="t('tools.sshConfig.deleteHost')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <template v-if="activeHost">
            <!-- 子页签 -->
            <div class="flex flex-wrap gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-2 text-xs">
              <button
                v-for="tab in [
                  { id: 'connection', label: t('tools.sshConfig.tabConnection'), icon: Server },
                  { id: 'forwarding', label: t('tools.sshConfig.tabForwarding'), icon: Waypoints },
                  { id: 'keepalive', label: t('tools.sshConfig.tabKeepalive'), icon: Shield },
                  { id: 'advanced', label: t('tools.sshConfig.tabAdvanced'), icon: SlidersHorizontal },
                ]"
                :key="tab.id"
                type="button"
                @click="activeSubTab = tab.id as any"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
                :class="
                  activeSubTab === tab.id
                    ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
                "
              >
                <component :is="tab.icon" class="w-3.5 h-3.5" />
                <span>{{ tab.label }}</span>
              </button>
            </div>

            <!-- 子页 1: 连接、认证与跳板机 -->
            <div v-if="activeSubTab === 'connection'" class="space-y-3.5 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                    Host ({{ t('tools.sshConfig.hostAliasLabel') }})
                  </label>
                  <input
                    v-model="activeHost.alias"
                    type="text"
                    placeholder="prod-api or *.internal or *"
                    class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                    {{ t('tools.sshConfig.commentLabel') }}
                  </label>
                  <input
                    v-model="activeHost.comment"
                    type="text"
                    :placeholder="t('tools.sshConfig.commentPlaceholder')"
                    class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-12 gap-3">
                <div class="sm:col-span-6">
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">HostName</label>
                  <input
                    v-model="activeHost.hostName"
                    type="text"
                    placeholder="10.0.1.25 or ssh.example.com"
                    class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div class="sm:col-span-4">
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">User</label>
                  <input
                    v-model="activeHost.user"
                    type="text"
                    placeholder="ubuntu"
                    class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div class="sm:col-span-2">
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">Port</label>
                  <input
                    v-model="activeHost.port"
                    type="text"
                    placeholder="22"
                    class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <!-- 密钥认证 -->
              <div class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-3 space-y-2.5 bg-zinc-50/50 dark:bg-zinc-800/20">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-zinc-700 dark:text-zinc-200">
                    IdentityFile ({{ t('tools.sshConfig.identityFiles') }})
                  </span>
                  <button
                    type="button"
                    @click="addIdentityFile"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>{{ t('tools.sshConfig.addIdentityFile') }}</span>
                  </button>
                </div>

                <div
                  v-for="(_f, idx) in activeHost.identityFiles"
                  :key="idx"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="activeHost.identityFiles[idx]"
                    type="text"
                    placeholder="~/.ssh/id_ed25519"
                    class="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1 font-mono"
                  />
                  <button
                    type="button"
                    @click="activeHost.identityFiles.splice(idx, 1)"
                    class="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>

                <div class="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <label class="inline-flex items-center gap-1.5 cursor-pointer">
                    <input v-model="activeHost.identitiesOnly" type="checkbox" class="accent-blue-600" />
                    <span class="font-mono">IdentitiesOnly yes</span>
                    <span class="text-[11px] text-zinc-400">({{ t('tools.sshConfig.identitiesOnlyHint') }})</span>
                  </label>
                </div>
              </div>

              <!-- 跳板机与代理 -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div class="flex items-center justify-between mb-1">
                    <label class="text-[11px] font-medium text-zinc-500">ProxyJump (-J)</label>
                    <div v-if="jumpHostQuickCandidates.length > 0" class="flex flex-wrap gap-1">
                      <button
                        v-for="cand in jumpHostQuickCandidates.slice(0, 3)"
                        :key="cand"
                        type="button"
                        @click="activeHost.proxyJump = cand"
                        class="px-1.5 py-0.2 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-300 hover:text-blue-600 cursor-pointer"
                      >
                        {{ cand }}
                      </button>
                    </div>
                  </div>
                  <input
                    v-model="activeHost.proxyJump"
                    type="text"
                    placeholder="bastion or user@jump:2222"
                    class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">ProxyCommand</label>
                  <input
                    v-model="activeHost.proxyCommand"
                    type="text"
                    placeholder="nc -X 5 -x 127.0.0.1:7890 %h %p"
                    class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>
            </div>

            <!-- 子页 2: 端口转发与 SOCKS5 隧道 -->
            <div v-if="activeSubTab === 'forwarding'" class="space-y-4 text-xs">
              <!-- LocalForward (-L) -->
              <div class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-3 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div class="font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                      <span class="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 font-mono text-[11px]">-L</span>
                      <span>LocalForward · {{ t('tools.sshConfig.localForwardTitle') }}</span>
                    </div>
                    <p class="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1 flex-wrap">
                      <span>{{ t('tools.sshConfig.localClient') }}</span>
                      <ArrowRight class="w-3 h-3" />
                      <span>{{ t('tools.sshConfig.remoteInternalService') }}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    @click="addLocalForward"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>{{ t('tools.sshConfig.addRule') }}</span>
                  </button>
                </div>

                <div
                  v-for="(lf, idx) in activeHost.localForwards"
                  :key="idx"
                  class="grid grid-cols-12 gap-1.5 items-center"
                >
                  <input
                    v-model="lf.bindAddress"
                    type="text"
                    placeholder="127.0.0.1"
                    class="col-span-3 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="lf.bindPort"
                    type="text"
                    placeholder="LocalPort"
                    class="col-span-2 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="lf.targetHost"
                    type="text"
                    placeholder="TargetHost"
                    class="col-span-4 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="lf.targetPort"
                    type="text"
                    placeholder="Port"
                    class="col-span-2 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <button
                    type="button"
                    @click="activeHost.localForwards.splice(idx, 1)"
                    class="col-span-1 p-1 text-zinc-400 hover:text-rose-500 cursor-pointer flex justify-center"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- RemoteForward (-R) -->
              <div class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-3 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div class="font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                      <span class="px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 font-mono text-[11px]">-R</span>
                      <span>RemoteForward · {{ t('tools.sshConfig.remoteForwardTitle') }}</span>
                    </div>
                    <p class="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-1 flex-wrap">
                      <span>{{ t('tools.sshConfig.remoteBindPort') }}</span>
                      <ArrowRight class="w-3 h-3" />
                      <span>{{ t('tools.sshConfig.localDevService') }}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    @click="addRemoteForward"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>{{ t('tools.sshConfig.addRule') }}</span>
                  </button>
                </div>

                <div
                  v-for="(rf, idx) in activeHost.remoteForwards"
                  :key="idx"
                  class="grid grid-cols-12 gap-1.5 items-center"
                >
                  <input
                    v-model="rf.bindAddress"
                    type="text"
                    placeholder="127.0.0.1"
                    class="col-span-3 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="rf.bindPort"
                    type="text"
                    placeholder="RemotePort"
                    class="col-span-2 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="rf.targetHost"
                    type="text"
                    placeholder="LocalHost"
                    class="col-span-4 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="rf.targetPort"
                    type="text"
                    placeholder="Port"
                    class="col-span-2 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <button
                    type="button"
                    @click="activeHost.remoteForwards.splice(idx, 1)"
                    class="col-span-1 p-1 text-zinc-400 hover:text-rose-500 cursor-pointer flex justify-center"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- DynamicForward (-D) + GatewayPorts -->
              <div class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-3 space-y-2.5">
                <div class="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div class="font-semibold text-zinc-800 dark:text-zinc-100 flex items-center gap-1.5">
                      <span class="px-1.5 py-0.5 rounded bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 font-mono text-[11px]">-D</span>
                      <span>DynamicForward · {{ t('tools.sshConfig.dynamicForwardTitle') }}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    @click="addDynamicForward"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>{{ t('tools.sshConfig.addRule') }}</span>
                  </button>
                </div>

                <div
                  v-for="(df, idx) in activeHost.dynamicForwards"
                  :key="idx"
                  class="grid grid-cols-12 gap-1.5 items-center"
                >
                  <input
                    v-model="df.bindAddress"
                    type="text"
                    placeholder="127.0.0.1"
                    class="col-span-6 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="df.port"
                    type="text"
                    placeholder="1080"
                    class="col-span-5 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <button
                    type="button"
                    @click="activeHost.dynamicForwards.splice(idx, 1)"
                    class="col-span-1 p-1 text-zinc-400 hover:text-rose-500 cursor-pointer flex justify-center"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>

                <div class="pt-1 max-w-xs">
                  <label class="block text-[10px] text-zinc-400 mb-1">GatewayPorts</label>
                  <CustomSelect v-model="activeHost.gatewayPorts" :options="gatewayPortsOptions" full-width />
                </div>
              </div>
            </div>

            <!-- 子页 3: 保活、Agent、安全与连接复用 -->
            <div v-if="activeSubTab === 'keepalive'" class="space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">ServerAliveInterval (s)</label>
                  <input
                    v-model="activeHost.serverAliveInterval"
                    type="text"
                    placeholder="60"
                    class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">ServerAliveCountMax</label>
                  <input
                    v-model="activeHost.serverAliveCountMax"
                    type="text"
                    placeholder="3"
                    class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">Compression</label>
                  <CustomSelect v-model="activeHost.compression" :options="boolSelectOptions" full-width />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">ForwardAgent (-A)</label>
                  <CustomSelect v-model="activeHost.forwardAgent" :options="boolSelectOptions" full-width />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">AddKeysToAgent</label>
                  <CustomSelect v-model="activeHost.addKeysToAgent" :options="addKeysOptions" full-width />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">StrictHostKeyChecking</label>
                  <CustomSelect v-model="activeHost.strictHostKeyChecking" :options="strictHostOptions" full-width />
                </div>
              </div>

              <div class="flex flex-wrap items-center gap-4">
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                  <input v-model="activeHost.useKeychain" type="checkbox" class="accent-blue-600" />
                  <span class="font-mono">UseKeychain yes</span>
                  <span class="text-[11px] text-zinc-400">(macOS)</span>
                </label>
              </div>

              <!-- ControlMaster 连接复用 -->
              <div class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-3 space-y-2.5 bg-zinc-50/50 dark:bg-zinc-800/20">
                <div class="flex items-center justify-between gap-2">
                  <span class="font-semibold text-zinc-700 dark:text-zinc-200">
                    {{ t('tools.sshConfig.multiplexingTitle') }}
                  </span>
                  <button
                    type="button"
                    @click="applyMultiplexingQuickPreset"
                    class="text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    {{ t('tools.sshConfig.applyMultiplexingPreset') }}
                  </button>
                </div>
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label class="block text-[10px] text-zinc-400 mb-1">ControlMaster</label>
                    <CustomSelect v-model="activeHost.controlMaster" :options="controlMasterOptions" full-width />
                  </div>
                  <div>
                    <label class="block text-[10px] text-zinc-400 mb-1">ControlPath</label>
                    <input
                      v-model="activeHost.controlPath"
                      type="text"
                      placeholder="~/.ssh/cm-%r@%h:%p"
                      class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 font-mono"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] text-zinc-400 mb-1">ControlPersist</label>
                    <input
                      v-model="activeHost.controlPersist"
                      type="text"
                      placeholder="10m"
                      class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            <!-- 子页 4: 远程命令、自定义指令与全局 Include -->
            <div v-if="activeSubTab === 'advanced'" class="space-y-4 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div class="sm:col-span-2">
                  <label class="block text-[10px] text-zinc-400 mb-1">RemoteCommand</label>
                  <input
                    v-model="activeHost.remoteCommand"
                    type="text"
                    placeholder="tmux attach || tmux new"
                    class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">RequestTTY</label>
                  <CustomSelect v-model="activeHost.requestTty" :options="requestTtyOptions" full-width />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">PreferredAuthentications</label>
                  <input
                    v-model="activeHost.preferredAuthentications"
                    type="text"
                    placeholder="publickey,keyboard-interactive"
                    class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">UserKnownHostsFile</label>
                  <input
                    v-model="activeHost.userKnownHostsFile"
                    type="text"
                    placeholder="/dev/null"
                    class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <!-- Extra Directives -->
              <div class="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-zinc-700 dark:text-zinc-200">
                    {{ t('tools.sshConfig.extraDirectives') }}
                  </span>
                  <button
                    type="button"
                    @click="activeHost.extraDirectives.push({ key: '', value: '' })"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>{{ t('tools.sshConfig.addRule') }}</span>
                  </button>
                </div>

                <div
                  v-for="(d, idx) in activeHost.extraDirectives"
                  :key="idx"
                  class="grid grid-cols-12 gap-1.5 items-center"
                >
                  <input
                    v-model="d.key"
                    type="text"
                    placeholder="HostKeyAlgorithms"
                    class="col-span-5 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="d.value"
                    type="text"
                    placeholder="+ssh-rsa"
                    class="col-span-6 min-w-0 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <button
                    type="button"
                    @click="activeHost.extraDirectives.splice(idx, 1)"
                    class="col-span-1 p-1 text-zinc-400 hover:text-rose-500 cursor-pointer flex justify-center"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Global Include -->
              <div class="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-zinc-700 dark:text-zinc-200">
                    Include ({{ t('tools.sshConfig.topIncludes') }})
                  </span>
                  <button
                    type="button"
                    @click="doc.topIncludes.push('~/.ssh/conf.d/*.conf')"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>{{ t('tools.sshConfig.addRule') }}</span>
                  </button>
                </div>
                <div
                  v-for="(_inc, idx) in doc.topIncludes"
                  :key="idx"
                  class="flex items-center gap-2"
                >
                  <input
                    v-model="doc.topIncludes[idx]"
                    type="text"
                    placeholder="~/.ssh/conf.d/*.conf"
                    class="flex-1 min-w-0 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <button
                    type="button"
                    @click="doc.topIncludes.splice(idx, 1)"
                    class="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>
      </div>

      <!-- 右侧栏 (5 cols)：诊断 + ~/.ssh/config 与 CLI 命令行 -->
      <div class="xl:col-span-5 flex flex-col gap-3 min-w-0 xl:sticky xl:top-0">
        <!-- 静态检查与提示 -->
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
                    ? t('tools.sshConfig.lintPassed')
                    : t('tools.sshConfig.lintCount', { count: lintIssues.length })
                }}
              </span>
            </div>

            <button
              v-if="hasMovableWildcard"
              type="button"
              @click="handleMoveWildcardToBottom"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 hover:bg-amber-100 cursor-pointer"
            >
              <Wrench class="w-3 h-3" />
              <span>{{ t('tools.sshConfig.moveWildcardBtn') }}</span>
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
                @click="outputTab = 'config'"
                class="px-2.5 py-1 rounded-lg font-mono font-medium cursor-pointer transition-colors whitespace-nowrap"
                :class="outputTab === 'config' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'"
              >
                ~/.ssh/config
              </button>
              <button
                type="button"
                @click="outputTab = 'cli'"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium cursor-pointer transition-colors whitespace-nowrap"
                :class="outputTab === 'cli' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'"
              >
                <Terminal class="w-3 h-3" />
                <span>{{ t('tools.sshConfig.cliCommandsTab') }}</span>
              </button>
            </div>

            <CopyButton v-if="outputTab === 'config'" :text="generatedConfig" />
          </div>

          <template v-if="outputTab === 'config'">
            <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
              <div class="flex flex-wrap items-center gap-2">
                <CustomSelect v-model="formatOptions.indentSize" :options="indentOptions" size="sm" />
                <label class="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 cursor-pointer">
                  <input v-model="formatOptions.includeHeaderComment" type="checkbox" class="accent-blue-600" />
                  <span>{{ t('tools.sshConfig.headerComment') }}</span>
                </label>
              </div>
              <span class="text-[11px] font-mono text-zinc-400">
                {{ generatedConfig.split('\n').length }} lines
              </span>
            </div>

            <pre
              class="min-h-[280px] max-h-[520px] xl:max-h-[calc(100vh-19rem)] rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 p-3.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 overflow-auto leading-relaxed select-all"
            >{{ generatedConfig }}</pre>
          </template>

          <template v-else-if="generatedCli">
            <div class="space-y-2.5 text-xs max-h-[540px] overflow-y-auto pr-0.5">
              <div
                v-for="item in [
                  { title: t('tools.sshConfig.cliAliasConnect'), cmd: generatedCli.sshAlias },
                  { title: t('tools.sshConfig.cliStandaloneConnect'), cmd: generatedCli.sshStandalone },
                  { title: t('tools.sshConfig.cliTunnelOnly'), cmd: generatedCli.sshTunnelOnly },
                  { title: t('tools.sshConfig.cliScpUpload'), cmd: generatedCli.scpUpload },
                  { title: t('tools.sshConfig.cliRsyncSync'), cmd: generatedCli.rsyncSync },
                  { title: t('tools.sshConfig.cliCopyId'), cmd: generatedCli.sshCopyId },
                  { title: t('tools.sshConfig.cliKeygen'), cmd: generatedCli.sshKeygen },
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

    <!-- 导入 ~/.ssh/config 弹窗 -->
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
            {{ t('tools.sshConfig.importModalTitle') }}
          </h3>
          <div class="flex items-center gap-2">
            <input
              ref="importFileInputRef"
              type="file"
              class="hidden"
              @change="handleConfigFileUpload"
            />
            <button
              type="button"
              @click="importFileInputRef?.click()"
              class="px-2.5 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {{ t('tools.sshConfig.chooseFile') }}
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
          v-model="importConfigText"
          rows="10"
          placeholder="Host my-server&#10;  HostName 192.168.1.10&#10;  User ubuntu"
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
            {{ t('tools.sshConfig.cancel') }}
          </button>
          <button
            type="button"
            @click="confirmImportConfig"
            :disabled="!importConfigText.trim()"
            class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-40"
          >
            {{ t('tools.sshConfig.confirmImport') }}
          </button>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
