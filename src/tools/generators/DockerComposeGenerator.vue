<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Container,
  Plus,
  Copy,
  Trash2,
  ArrowLeftRight,
  Upload,
  FileDown,
  RotateCcw,
  Check,
  AlertCircle,
  AlertTriangle,
  Info,
  Search,
  Sparkles,
  Server,
  Network,
  HardDrive,
  HeartPulse,
  Cpu,
  Terminal,
  X,
  Wrench,
  Layers,
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import { downloadFile } from '../../utils/download';
import {
  COMPOSE_PRESETS,
  SERVICE_CATALOG,
  SAMPLE_DOCKER_RUN,
  type ServiceCatalogItem,
} from './dockerComposePresets';
import {
  autoDeclareMissingResources,
  cloneComposeService,
  createEmptyService,
  generateComposeYaml,
  generateDockerRunCommands,
  generateDotEnv,
  lintComposeConfig,
  parseComposeYaml,
  parseDockerRunCommand,
  serviceToDockerRun,
  type ComposeConfig,
  type ComposeFormatOptions,
  type ComposeService,
  type PullPolicy,
  type RestartPolicy,
} from './dockerComposeUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// ==================== 核心状态 ====================
const activePresetId = ref(COMPOSE_PRESETS[0].id);
const config = ref<ComposeConfig>(COMPOSE_PRESETS[0].build());
const selectedServiceUid = ref<string>(config.value.services[0]?.uid ?? '');

const mainTab = ref<'services' | 'resources' | 'catalog'>('services');
const serviceSubTab = ref<'general' | 'network' | 'storage' | 'health' | 'resources'>('general');
const outputTab = ref<'yaml' | 'docker-run' | 'env'>('yaml');

const formatOptions = ref<ComposeFormatOptions>({
  indentSize: 2,
  includeHeaderComment: true,
});
const dockerRunMultiline = ref(true);
const dockerRunScope = ref<'all' | 'current'>('all');

// ==================== 服务库检索 ====================
const catalogSearch = ref('');
const catalogCategory = ref<'all' | ServiceCatalogItem['category']>('all');

// ==================== 导入与转换弹窗 ====================
const showDockerRunModal = ref(false);
const dockerRunInput = ref(SAMPLE_DOCKER_RUN);
const dockerRunImportMode = ref<'replace' | 'append'>('append');
const dockerRunPreview = computed(() => parseDockerRunCommand(dockerRunInput.value));

const showYamlImportModal = ref(false);
const yamlImportInput = ref('');
const yamlImportError = ref('');
const yamlFileInputRef = ref<HTMLInputElement | null>(null);

// ==================== 通知与状态 ====================
const toastMessage = ref('');
const isDownloaded = ref(false);
const showDiagnostics = ref(true);

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = '';
  }, 3000);
}

// ==================== 派生数据 ====================
const activeService = computed<ComposeService | undefined>(() => {
  return (
    config.value.services.find(s => s.uid === selectedServiceUid.value) ??
    config.value.services[0]
  );
});

const generatedYaml = computed(() => generateComposeYaml(config.value, formatOptions.value));

const generatedDockerRun = computed(() => {
  if (dockerRunScope.value === 'current' && activeService.value) {
    return serviceToDockerRun(activeService.value, dockerRunMultiline.value);
  }
  return generateDockerRunCommands(config.value, dockerRunMultiline.value);
});

const generatedEnv = computed(() => generateDotEnv(config.value));

const activeOutputContent = computed(() => {
  if (outputTab.value === 'docker-run') return generatedDockerRun.value;
  if (outputTab.value === 'env') return generatedEnv.value;
  return generatedYaml.value;
});

const lintIssues = computed(() => lintComposeConfig(config.value));
const lintErrorCount = computed(() => lintIssues.value.filter(i => i.level === 'error').length);
const lintWarningCount = computed(() => lintIssues.value.filter(i => i.level === 'warning').length);
const hasFixableIssues = computed(() =>
  lintIssues.value.some(i => i.fixable === 'declare-missing')
);

const filteredCatalog = computed(() => {
  const q = catalogSearch.value.trim().toLowerCase();
  return SERVICE_CATALOG.filter(item => {
    if (catalogCategory.value !== 'all' && item.category !== catalogCategory.value) {
      return false;
    }
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.image.toLowerCase().includes(q) ||
      item.descZh.toLowerCase().includes(q) ||
      item.descEn.toLowerCase().includes(q)
    );
  });
});

// ==================== 下拉选项 ====================
const indentOptions: SelectOption[] = [
  { label: '2 spaces', value: 2 },
  { label: '4 spaces', value: 4 },
];

const versionOptions = computed<SelectOption[]>(() => [
  { label: t('tools.dockerCompose.versionModern'), value: '' },
  { label: '3.9', value: '3.9' },
  { label: '3.8', value: '3.8' },
]);

const restartOptions = computed<SelectOption[]>(() => [
  { label: t('tools.dockerCompose.notSet'), value: '' },
  { label: 'unless-stopped', value: 'unless-stopped' },
  { label: 'always', value: 'always' },
  { label: 'on-failure', value: 'on-failure' },
  { label: 'no', value: 'no' },
]);

const pullPolicyOptions = computed<SelectOption[]>(() => [
  { label: t('tools.dockerCompose.notSet'), value: '' },
  { label: 'missing', value: 'missing' },
  { label: 'always', value: 'always' },
  { label: 'never', value: 'never' },
  { label: 'build', value: 'build' },
]);

const protocolOptions: SelectOption[] = [
  { label: 'tcp', value: 'tcp' },
  { label: 'udp', value: 'udp' },
];

const volumeModeOptions = computed<SelectOption[]>(() => [
  { label: t('tools.dockerCompose.volModeDefault'), value: '' },
  { label: 'ro (Read-only)', value: 'ro' },
  { label: 'rw (Read-write)', value: 'rw' },
]);

const dependsConditionOptions: SelectOption[] = [
  { label: 'service_started', value: 'service_started' },
  { label: 'service_healthy', value: 'service_healthy' },
  { label: 'service_completed_successfully', value: 'service_completed_successfully' },
];

const networkDriverOptions: SelectOption[] = [
  { label: 'bridge', value: 'bridge' },
  { label: 'overlay', value: 'overlay' },
  { label: 'host', value: 'host' },
  { label: 'none', value: 'none' },
];

const otherServiceOptions = computed<SelectOption[]>(() => {
  const cur = activeService.value?.uid;
  return config.value.services
    .filter(s => s.uid !== cur && s.name.trim())
    .map(s => ({ label: s.name, value: s.name }));
});

// ==================== 预设与服务 CRUD ====================
function applyPreset(presetId: string) {
  const preset = COMPOSE_PRESETS.find(p => p.id === presetId);
  if (!preset) return;
  activePresetId.value = presetId;
  config.value = preset.build();
  selectedServiceUid.value = config.value.services[0]?.uid ?? '';
  mainTab.value = 'services';
}

function resetPreset() {
  applyPreset(activePresetId.value);
}

function uniqueServiceName(base: string): string {
  const used = new Set(config.value.services.map(s => s.name.trim()));
  let candidate = base;
  let i = 2;
  while (used.has(candidate)) {
    candidate = `${base}-${i++}`;
  }
  return candidate;
}

function addBlankService() {
  const svc = createEmptyService({
    name: uniqueServiceName('service'),
    image: 'alpine:3.20',
  });
  config.value.services.push(svc);
  selectedServiceUid.value = svc.uid;
  mainTab.value = 'services';
}

function addFromCatalog(item: ServiceCatalogItem) {
  const svc = item.build();
  svc.name = uniqueServiceName(svc.name);
  config.value.services.push(svc);
  autoDeclareMissingResources(config.value);
  selectedServiceUid.value = svc.uid;
  mainTab.value = 'services';
  showToast(t('tools.dockerCompose.addedServiceToast', { name: svc.name }));
}

function duplicateActiveService() {
  if (!activeService.value) return;
  const copy = cloneComposeService(
    activeService.value,
    uniqueServiceName(activeService.value.name)
  );
  config.value.services.push(copy);
  selectedServiceUid.value = copy.uid;
}

function removeService(uid: string) {
  const idx = config.value.services.findIndex(s => s.uid === uid);
  if (idx < 0) return;
  config.value.services.splice(idx, 1);
  if (selectedServiceUid.value === uid) {
    selectedServiceUid.value = config.value.services[Math.max(0, idx - 1)]?.uid ?? '';
  }
}

// ==================== 服务字段操作 ====================
function addPort() {
  activeService.value?.ports.push({
    hostIp: '',
    host: '8080',
    container: '80',
    protocol: 'tcp',
  });
}

function addVolume() {
  activeService.value?.volumes.push({ source: './data', target: '/data', mode: '' });
}

function addEnv() {
  activeService.value?.environment.push({ key: '', value: '' });
}

function addLabel() {
  activeService.value?.labels.push({ key: '', value: '' });
}

function addDependency() {
  const firstOther = otherServiceOptions.value[0]?.value;
  if (!activeService.value) return;
  activeService.value.dependsOn.push({
    service: firstOther ? String(firstOther) : '',
    condition: 'service_started',
  });
}

function toggleServiceNetwork(netName: string) {
  if (!activeService.value) return;
  const idx = activeService.value.networks.indexOf(netName);
  if (idx >= 0) {
    activeService.value.networks.splice(idx, 1);
  } else {
    activeService.value.networks.push(netName);
  }
}

function parseCsvList(raw: string): string[] {
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

// ==================== 顶层网络与卷操作 ====================
function addTopNetwork() {
  const used = new Set(config.value.networks.map(n => n.name));
  let name = 'app_net';
  let i = 2;
  while (used.has(name)) name = `app_net_${i++}`;
  config.value.networks.push({ name, driver: 'bridge', external: false, subnet: '' });
}

function addTopVolume() {
  const used = new Set(config.value.volumes.map(v => v.name));
  let name = 'app_data';
  let i = 2;
  while (used.has(name)) name = `app_data_${i++}`;
  config.value.volumes.push({ name, driver: '', external: false });
}

function handleAutoFixMissing() {
  const added = autoDeclareMissingResources(config.value);
  if (added > 0) {
    showToast(t('tools.dockerCompose.autoFixedToast', { count: added }));
  }
}

// ==================== docker run 导入 & compose.yml 导入 ====================
function applyDockerRunImport() {
  const res = dockerRunPreview.value;
  if (res.services.length === 0) return;

  if (dockerRunImportMode.value === 'replace') {
    config.value = {
      projectName: config.value.projectName,
      legacyVersion: config.value.legacyVersion,
      services: res.services,
      networks: res.networks,
      volumes: res.volumes,
    };
    selectedServiceUid.value = res.services[0]?.uid ?? '';
  } else {
    for (const svc of res.services) {
      svc.name = uniqueServiceName(svc.name);
      config.value.services.push(svc);
    }
    autoDeclareMissingResources(config.value);
    selectedServiceUid.value = res.services[0]?.uid ?? selectedServiceUid.value;
  }

  showDockerRunModal.value = false;
  mainTab.value = 'services';
  showToast(
    t('tools.dockerCompose.dockerRunImportedToast', { count: res.services.length })
  );
}

function applyYamlImport() {
  yamlImportError.value = '';
  try {
    const parsed = parseComposeYaml(yamlImportInput.value);
    config.value = parsed;
    selectedServiceUid.value = parsed.services[0]?.uid ?? '';
    showYamlImportModal.value = false;
    mainTab.value = 'services';
    showToast(
      t('tools.dockerCompose.yamlImportedToast', { count: parsed.services.length })
    );
  } catch (err) {
    yamlImportError.value = err instanceof Error ? err.message : String(err);
  }
}

function handleYamlFileUpload(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      yamlImportInput.value = reader.result;
    }
  };
  reader.readAsText(file);
}

// ==================== 下载导出 ====================
function downloadActiveOutput() {
  if (outputTab.value === 'env') {
    downloadFile(generatedEnv.value, '.env.example', 'text/plain;charset=utf-8');
    showToast(t('tools.dockerCompose.downloadedNotice', { filename: '.env.example' }));
    return;
  }
  if (outputTab.value === 'docker-run') {
    downloadFile(generatedDockerRun.value, 'docker-run.sh', 'text/x-shellscript;charset=utf-8');
    showToast(t('tools.dockerCompose.downloadedNotice', { filename: 'docker-run.sh' }));
    return;
  }
  downloadFile(generatedYaml.value, 'compose.yml', 'text/yaml;charset=utf-8');
  isDownloaded.value = true;
  setTimeout(() => {
    isDownloaded.value = false;
  }, 1800);
  showToast(t('tools.dockerCompose.downloadedNotice', { filename: 'compose.yml' }));
}
</script>

<template>
  <ToolContainer
    tool-id="docker-compose"
    name-key="tools.dockerCompose.name"
    desc-key="tools.dockerCompose.desc"
    :icon="Container"
    :full-height="false"
    wide
  >
    <template #header-actions>
      <button
        type="button"
        @click="showDockerRunModal = true"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <ArrowLeftRight class="w-3.5 h-3.5" />
        <span>{{ t('tools.dockerCompose.dockerRunConvertBtn') }}</span>
      </button>

      <button
        type="button"
        @click="showYamlImportModal = true"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <Upload class="w-3.5 h-3.5" />
        <span>{{ t('tools.dockerCompose.importYamlBtn') }}</span>
      </button>

      <button
        type="button"
        @click="resetPreset"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer shrink-0"
        :title="t('common.reset')"
      >
        <RotateCcw class="w-3.5 h-3.5" />
      </button>
    </template>

    <!-- 全局提示条 -->
    <div
      v-if="toastMessage"
      class="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs"
    >
      <Check class="w-4 h-4 shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- 快捷预设条 -->
    <div
      class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 px-3.5 py-2.5 flex flex-wrap items-center gap-2"
    >
      <span class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mr-1">
        <Sparkles class="w-3.5 h-3.5 text-blue-500" />
        {{ t('tools.dockerCompose.presetsLabel') }}:
      </span>
      <button
        v-for="preset in COMPOSE_PRESETS"
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

    <!-- 主工作区：左侧可视化编排 / 右侧输出与诊断 -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
      <!-- 左侧配置区 (7 cols) -->
      <div class="xl:col-span-7 flex flex-col gap-3 min-w-0">
        <!-- 主切换 Tabs -->
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="inline-flex flex-wrap rounded-xl p-1 bg-zinc-100 dark:bg-zinc-800/80 border border-zinc-200/70 dark:border-zinc-700/70 text-xs">
            <button
              type="button"
              @click="mainTab = 'services'"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              :class="mainTab === 'services' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            >
              <Server class="w-3.5 h-3.5" />
              <span>{{ t('tools.dockerCompose.tabServices', { count: config.services.length }) }}</span>
            </button>
            <button
              type="button"
              @click="mainTab = 'resources'"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              :class="mainTab === 'resources' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            >
              <Layers class="w-3.5 h-3.5" />
              <span>{{ t('tools.dockerCompose.tabResources') }}</span>
            </button>
            <button
              type="button"
              @click="mainTab = 'catalog'"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              :class="mainTab === 'catalog' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            >
              <Plus class="w-3.5 h-3.5" />
              <span>{{ t('tools.dockerCompose.tabCatalog') }}</span>
            </button>
          </div>
        </div>

        <!-- TAB 1: 服务编排编辑器 -->
        <div
          v-if="mainTab === 'services'"
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 flex flex-col gap-3.5"
        >
          <!-- 服务列表切换条 -->
          <div class="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-zinc-100 dark:border-zinc-800">
            <div class="flex flex-wrap items-center gap-1.5">
              <button
                v-for="svc in config.services"
                :key="svc.uid"
                type="button"
                @click="selectedServiceUid = svc.uid"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono font-medium border transition-all cursor-pointer"
                :class="
                  activeService?.uid === svc.uid
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                    : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 hover:border-blue-400/60'
                "
              >
                <span>{{ svc.name || 'unnamed' }}</span>
              </button>

              <button
                type="button"
                @click="addBlankService"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-medium border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 hover:text-blue-600 hover:border-blue-400 transition-colors cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ t('tools.dockerCompose.addService') }}</span>
              </button>
            </div>

            <div v-if="activeService" class="flex items-center gap-1">
              <button
                type="button"
                @click="duplicateActiveService"
                class="p-1.5 rounded-lg text-zinc-400 hover:text-blue-600 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                :title="t('tools.dockerCompose.duplicateService')"
              >
                <Copy class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="removeService(activeService.uid)"
                :disabled="config.services.length <= 1"
                class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-30"
                :title="t('tools.dockerCompose.deleteService')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <template v-if="activeService">
            <!-- 服务子标签 -->
            <div class="flex flex-wrap gap-1 border-b border-zinc-100 dark:border-zinc-800 pb-2 text-xs">
              <button
                v-for="st in [
                  { id: 'general', label: t('tools.dockerCompose.subTabGeneral'), icon: Server },
                  { id: 'network', label: t('tools.dockerCompose.subTabNetwork'), icon: Network },
                  { id: 'storage', label: t('tools.dockerCompose.subTabStorage'), icon: HardDrive },
                  { id: 'health', label: t('tools.dockerCompose.subTabHealth'), icon: HeartPulse },
                  { id: 'resources', label: t('tools.dockerCompose.subTabResources'), icon: Cpu },
                ]"
                :key="st.id"
                type="button"
                @click="serviceSubTab = st.id as any"
                class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer"
                :class="
                  serviceSubTab === st.id
                    ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
                    : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800/70'
                "
              >
                <component :is="st.icon" class="w-3.5 h-3.5" />
                <span>{{ st.label }}</span>
              </button>
            </div>

            <!-- 子页 1: 基础与镜像 -->
            <div v-if="serviceSubTab === 'general'" class="space-y-3 text-xs">
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                    {{ t('tools.dockerCompose.serviceName') }}
                  </label>
                  <input
                    v-model="activeService.name"
                    type="text"
                    placeholder="api"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                    {{ t('tools.dockerCompose.image') }}
                  </label>
                  <input
                    v-model="activeService.image"
                    type="text"
                    placeholder="nginx:1.27-alpine"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <!-- Build 开关与参数 -->
              <div class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-3 space-y-2.5 bg-zinc-50/50 dark:bg-zinc-800/20">
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="font-medium text-zinc-700 dark:text-zinc-200">
                    {{ t('tools.dockerCompose.enableBuild') }}
                  </span>
                  <input v-model="activeService.buildEnabled" type="checkbox" class="accent-blue-600" />
                </label>
                <div v-if="activeService.buildEnabled" class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label class="block text-[10px] text-zinc-400 mb-1">context</label>
                    <input
                      v-model="activeService.buildContext"
                      type="text"
                      placeholder="."
                      class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 font-mono"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] text-zinc-400 mb-1">dockerfile</label>
                    <input
                      v-model="activeService.buildDockerfile"
                      type="text"
                      placeholder="Dockerfile"
                      class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 font-mono"
                    />
                  </div>
                  <div>
                    <label class="block text-[10px] text-zinc-400 mb-1">target</label>
                    <input
                      v-model="activeService.buildTarget"
                      type="text"
                      placeholder="production"
                      class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 font-mono"
                    />
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">restart</label>
                  <CustomSelect
                    :model-value="activeService.restart"
                    :options="restartOptions"
                    full-width
                    @change="(v: RestartPolicy) => (activeService!.restart = v)"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">pull_policy</label>
                  <CustomSelect
                    :model-value="activeService.pullPolicy"
                    :options="pullPolicyOptions"
                    full-width
                    @change="(v: PullPolicy) => (activeService!.pullPolicy = v)"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">platform</label>
                  <input
                    v-model="activeService.platform"
                    type="text"
                    placeholder="linux/amd64"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">container_name</label>
                  <input
                    v-model="activeService.containerName"
                    type="text"
                    placeholder="(optional)"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">hostname</label>
                  <input
                    v-model="activeService.hostname"
                    type="text"
                    placeholder="(optional)"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">command</label>
                  <input
                    v-model="activeService.command"
                    type="text"
                    placeholder="npm run start"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">entrypoint</label>
                  <input
                    v-model="activeService.entrypoint"
                    type="text"
                    placeholder="/entrypoint.sh"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">working_dir</label>
                  <input
                    v-model="activeService.workingDir"
                    type="text"
                    placeholder="/app"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">user</label>
                  <input
                    v-model="activeService.user"
                    type="text"
                    placeholder="1000:1000"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div class="flex flex-wrap gap-4 pt-1">
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                  <input v-model="activeService.init" type="checkbox" class="accent-blue-600" />
                  <span class="font-mono">init</span>
                </label>
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                  <input v-model="activeService.stdinOpen" type="checkbox" class="accent-blue-600" />
                  <span class="font-mono">stdin_open (-i)</span>
                </label>
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                  <input v-model="activeService.tty" type="checkbox" class="accent-blue-600" />
                  <span class="font-mono">tty (-t)</span>
                </label>
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                  <input v-model="activeService.readOnly" type="checkbox" class="accent-blue-600" />
                  <span class="font-mono">read_only</span>
                </label>
                <label class="inline-flex items-center gap-1.5 cursor-pointer">
                  <input v-model="activeService.privileged" type="checkbox" class="accent-blue-600" />
                  <span class="font-mono text-amber-600 dark:text-amber-400">privileged</span>
                </label>
              </div>
            </div>

            <!-- 子页 2: 端口与网络 -->
            <div v-if="serviceSubTab === 'network'" class="space-y-4 text-xs">
              <!-- Ports -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-zinc-700 dark:text-zinc-200">
                    {{ t('tools.dockerCompose.portsMapping') }}
                  </span>
                  <button
                    type="button"
                    @click="addPort"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>{{ t('tools.dockerCompose.addPort') }}</span>
                  </button>
                </div>

                <div v-if="activeService.ports.length === 0" class="text-[11px] text-zinc-400">
                  {{ t('tools.dockerCompose.noPortsHint') }}
                </div>

                <div
                  v-for="(p, idx) in activeService.ports"
                  :key="idx"
                  class="grid grid-cols-12 gap-1.5 items-center"
                >
                  <input
                    v-model="p.hostIp"
                    type="text"
                    placeholder="127.0.0.1"
                    class="col-span-3 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="p.host"
                    type="text"
                    placeholder="Host"
                    class="col-span-3 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="p.container"
                    type="text"
                    placeholder="Container"
                    class="col-span-3 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <div class="col-span-2">
                    <CustomSelect v-model="p.protocol" :options="protocolOptions" full-width />
                  </div>
                  <button
                    type="button"
                    @click="activeService.ports.splice(idx, 1)"
                    class="col-span-1 p-1 text-zinc-400 hover:text-rose-500 cursor-pointer flex justify-center"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Network Mode & Attached Networks -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">network_mode</label>
                  <input
                    v-model="activeService.networkMode"
                    type="text"
                    placeholder="host / bridge / none"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                    expose ({{ t('tools.dockerCompose.commaSeparated') }})
                  </label>
                  <input
                    :value="activeService.expose.join(', ')"
                    @input="activeService.expose = parseCsvList(($event.target as HTMLInputElement).value)"
                    type="text"
                    placeholder="8080, 9090"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div v-if="!activeService.networkMode" class="space-y-1.5">
                <div class="text-[11px] font-medium text-zinc-500">
                  {{ t('tools.dockerCompose.attachedNetworks') }}
                </div>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="net in config.networks"
                    :key="net.name"
                    type="button"
                    @click="toggleServiceNetwork(net.name)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border font-mono text-[11px] cursor-pointer transition-colors"
                    :class="
                      activeService.networks.includes(net.name)
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                        : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/60 text-zinc-500'
                    "
                  >
                    <Check v-if="activeService.networks.includes(net.name)" class="w-3 h-3" />
                    <span>{{ net.name }}</span>
                  </button>
                  <span v-if="config.networks.length === 0" class="text-[11px] text-zinc-400">
                    {{ t('tools.dockerCompose.noNetworksDeclared') }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                    extra_hosts ({{ t('tools.dockerCompose.commaSeparated') }})
                  </label>
                  <input
                    :value="activeService.extraHosts.join(', ')"
                    @input="activeService.extraHosts = parseCsvList(($event.target as HTMLInputElement).value)"
                    type="text"
                    placeholder="host.docker.internal:host-gateway"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                    dns ({{ t('tools.dockerCompose.commaSeparated') }})
                  </label>
                  <input
                    :value="activeService.dns.join(', ')"
                    @input="activeService.dns = parseCsvList(($event.target as HTMLInputElement).value)"
                    type="text"
                    placeholder="1.1.1.1, 8.8.8.8"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>
            </div>

            <!-- 子页 3: 数据卷与环境变量 -->
            <div v-if="serviceSubTab === 'storage'" class="space-y-4 text-xs">
              <!-- Volumes -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-zinc-700 dark:text-zinc-200">
                    {{ t('tools.dockerCompose.volumesMapping') }}
                  </span>
                  <button
                    type="button"
                    @click="addVolume"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>{{ t('tools.dockerCompose.addVolume') }}</span>
                  </button>
                </div>

                <div
                  v-for="(v, idx) in activeService.volumes"
                  :key="idx"
                  class="grid grid-cols-12 gap-1.5 items-center"
                >
                  <input
                    v-model="v.source"
                    type="text"
                    placeholder="./data or vol_name"
                    class="col-span-5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="v.target"
                    type="text"
                    placeholder="/var/lib/data"
                    class="col-span-4 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <div class="col-span-2">
                    <CustomSelect v-model="v.mode" :options="volumeModeOptions" full-width />
                  </div>
                  <button
                    type="button"
                    @click="activeService.volumes.splice(idx, 1)"
                    class="col-span-1 p-1 text-zinc-400 hover:text-rose-500 cursor-pointer flex justify-center"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Environment -->
              <div class="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-zinc-700 dark:text-zinc-200">
                    {{ t('tools.dockerCompose.environmentVars') }}
                  </span>
                  <button
                    type="button"
                    @click="addEnv"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>{{ t('tools.dockerCompose.addEnv') }}</span>
                  </button>
                </div>

                <div
                  v-for="(e, idx) in activeService.environment"
                  :key="idx"
                  class="grid grid-cols-12 gap-1.5 items-center"
                >
                  <input
                    v-model="e.key"
                    type="text"
                    placeholder="KEY"
                    class="col-span-5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="e.value"
                    type="text"
                    placeholder="value"
                    class="col-span-6 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <button
                    type="button"
                    @click="activeService.environment.splice(idx, 1)"
                    class="col-span-1 p-1 text-zinc-400 hover:text-rose-500 cursor-pointer flex justify-center"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                    env_file ({{ t('tools.dockerCompose.commaSeparated') }})
                  </label>
                  <input
                    :value="activeService.envFile.join(', ')"
                    @input="activeService.envFile = parseCsvList(($event.target as HTMLInputElement).value)"
                    type="text"
                    placeholder=".env, .env.local"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                    tmpfs ({{ t('tools.dockerCompose.commaSeparated') }})
                  </label>
                  <input
                    :value="activeService.tmpfs.join(', ')"
                    @input="activeService.tmpfs = parseCsvList(($event.target as HTMLInputElement).value)"
                    type="text"
                    placeholder="/tmp, /run"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                  />
                </div>
              </div>
            </div>

            <!-- 子页 4: 依赖与健康检查 -->
            <div v-if="serviceSubTab === 'health'" class="space-y-4 text-xs">
              <!-- depends_on -->
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-zinc-700 dark:text-zinc-200">
                    depends_on ({{ t('tools.dockerCompose.serviceDeps') }})
                  </span>
                  <button
                    type="button"
                    @click="addDependency"
                    :disabled="otherServiceOptions.length === 0"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer disabled:opacity-40"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>{{ t('tools.dockerCompose.addDep') }}</span>
                  </button>
                </div>

                <div
                  v-for="(dep, idx) in activeService.dependsOn"
                  :key="idx"
                  class="grid grid-cols-12 gap-2 items-center"
                >
                  <div class="col-span-5">
                    <CustomSelect
                      v-model="dep.service"
                      :options="otherServiceOptions"
                      full-width
                    />
                  </div>
                  <div class="col-span-6">
                    <CustomSelect
                      v-model="dep.condition"
                      :options="dependsConditionOptions"
                      full-width
                    />
                  </div>
                  <button
                    type="button"
                    @click="activeService.dependsOn.splice(idx, 1)"
                    class="col-span-1 p-1 text-zinc-400 hover:text-rose-500 cursor-pointer flex justify-center"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Healthcheck -->
              <div class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-3 space-y-3 bg-zinc-50/50 dark:bg-zinc-800/20">
                <label class="flex items-center justify-between cursor-pointer">
                  <span class="font-semibold text-zinc-700 dark:text-zinc-200">
                    healthcheck ({{ t('tools.dockerCompose.enableHealthcheck') }})
                  </span>
                  <input v-model="activeService.healthcheck.enabled" type="checkbox" class="accent-blue-600" />
                </label>

                <div v-if="activeService.healthcheck.enabled" class="space-y-2.5">
                  <div>
                    <label class="block text-[10px] text-zinc-400 mb-1">test (CMD-SHELL)</label>
                    <input
                      v-model="activeService.healthcheck.test"
                      type="text"
                      placeholder="curl -f http://localhost:3000/health || exit 1"
                      class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                    />
                  </div>
                  <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <div>
                      <label class="block text-[10px] text-zinc-400 mb-1">interval</label>
                      <input
                        v-model="activeService.healthcheck.interval"
                        type="text"
                        placeholder="10s"
                        class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 font-mono"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-zinc-400 mb-1">timeout</label>
                      <input
                        v-model="activeService.healthcheck.timeout"
                        type="text"
                        placeholder="5s"
                        class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 font-mono"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-zinc-400 mb-1">retries</label>
                      <input
                        v-model.number="activeService.healthcheck.retries"
                        type="number"
                        min="1"
                        class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 font-mono"
                      />
                    </div>
                    <div>
                      <label class="block text-[10px] text-zinc-400 mb-1">start_period</label>
                      <input
                        v-model="activeService.healthcheck.startPeriod"
                        type="text"
                        placeholder="15s"
                        class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1 font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 子页 5: 资源限制、日志与标签 -->
            <div v-if="serviceSubTab === 'resources'" class="space-y-4 text-xs">
              <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">cpus (limit)</label>
                  <input
                    v-model="activeService.cpus"
                    type="text"
                    placeholder="1.0"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">memory (limit)</label>
                  <input
                    v-model="activeService.memory"
                    type="text"
                    placeholder="512M"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">mem_reservation</label>
                  <input
                    v-model="activeService.memReservation"
                    type="text"
                    placeholder="256M"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">shm_size</label>
                  <input
                    v-model="activeService.shmSize"
                    type="text"
                    placeholder="256m"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">logging.driver</label>
                  <input
                    v-model="activeService.loggingDriver"
                    type="text"
                    placeholder="json-file"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">max-size</label>
                  <input
                    v-model="activeService.loggingMaxSize"
                    type="text"
                    placeholder="10m"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">max-file</label>
                  <input
                    v-model="activeService.loggingMaxFile"
                    type="text"
                    placeholder="3"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                  />
                </div>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">
                    cap_add ({{ t('tools.dockerCompose.commaSeparated') }})
                  </label>
                  <input
                    :value="activeService.capAdd.join(', ')"
                    @input="activeService.capAdd = parseCsvList(($event.target as HTMLInputElement).value)"
                    type="text"
                    placeholder="NET_ADMIN"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">
                    cap_drop ({{ t('tools.dockerCompose.commaSeparated') }})
                  </label>
                  <input
                    :value="activeService.capDrop.join(', ')"
                    @input="activeService.capDrop = parseCsvList(($event.target as HTMLInputElement).value)"
                    type="text"
                    placeholder="ALL"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                  />
                </div>
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-1">
                    profiles ({{ t('tools.dockerCompose.commaSeparated') }})
                  </label>
                  <input
                    :value="activeService.profiles.join(', ')"
                    @input="activeService.profiles = parseCsvList(($event.target as HTMLInputElement).value)"
                    type="text"
                    placeholder="dev, debug"
                    class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1.5 font-mono"
                  />
                </div>
              </div>

              <!-- Labels -->
              <div class="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-zinc-700 dark:text-zinc-200">labels</span>
                  <button
                    type="button"
                    @click="addLabel"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <Plus class="w-3.5 h-3.5" />
                    <span>{{ t('tools.dockerCompose.addLabel') }}</span>
                  </button>
                </div>
                <div
                  v-for="(l, idx) in activeService.labels"
                  :key="idx"
                  class="grid grid-cols-12 gap-1.5 items-center"
                >
                  <input
                    v-model="l.key"
                    type="text"
                    placeholder="traefik.enable"
                    class="col-span-5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <input
                    v-model="l.value"
                    type="text"
                    placeholder="true"
                    class="col-span-6 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
                  />
                  <button
                    type="button"
                    @click="activeService.labels.splice(idx, 1)"
                    class="col-span-1 p-1 text-zinc-400 hover:text-rose-500 cursor-pointer flex justify-center"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </template>
        </div>

        <!-- TAB 2: 全局配置、顶层网络与数据卷 -->
        <div
          v-if="mainTab === 'resources'"
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-4 text-xs"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                {{ t('tools.dockerCompose.projectName') }} (name)
              </label>
              <input
                v-model="config.projectName"
                type="text"
                placeholder="my-stack"
                class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                {{ t('tools.dockerCompose.composeVersion') }}
              </label>
              <CustomSelect v-model="config.legacyVersion" :options="versionOptions" full-width />
            </div>
          </div>

          <!-- Top-level Networks -->
          <div class="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-zinc-700 dark:text-zinc-200">networks</span>
              <button
                type="button"
                @click="addTopNetwork"
                class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ t('tools.dockerCompose.addNetwork') }}</span>
              </button>
            </div>
            <div
              v-for="(net, idx) in config.networks"
              :key="idx"
              class="grid grid-cols-12 gap-1.5 items-center"
            >
              <input
                v-model="net.name"
                type="text"
                placeholder="network_name"
                class="col-span-4 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
              />
              <div class="col-span-3">
                <CustomSelect v-model="net.driver" :options="networkDriverOptions" full-width />
              </div>
              <input
                v-model="net.subnet"
                type="text"
                placeholder="172.28.0.0/16"
                class="col-span-3 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
              />
              <label class="col-span-1 flex items-center justify-center" title="external">
                <input v-model="net.external" type="checkbox" class="accent-blue-600" />
              </label>
              <button
                type="button"
                @click="config.networks.splice(idx, 1)"
                class="col-span-1 p-1 text-zinc-400 hover:text-rose-500 cursor-pointer flex justify-center"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- Top-level Volumes -->
          <div class="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-zinc-700 dark:text-zinc-200">volumes</span>
              <button
                type="button"
                @click="addTopVolume"
                class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ t('tools.dockerCompose.addTopVolume') }}</span>
              </button>
            </div>
            <div
              v-for="(vol, idx) in config.volumes"
              :key="idx"
              class="grid grid-cols-12 gap-1.5 items-center"
            >
              <input
                v-model="vol.name"
                type="text"
                placeholder="volume_name"
                class="col-span-5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
              />
              <input
                v-model="vol.driver"
                type="text"
                placeholder="local (optional)"
                class="col-span-5 px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
              />
              <label class="col-span-1 flex items-center justify-center" title="external">
                <input v-model="vol.external" type="checkbox" class="accent-blue-600" />
              </label>
              <button
                type="button"
                @click="config.volumes.splice(idx, 1)"
                class="col-span-1 p-1 text-zinc-400 hover:text-rose-500 cursor-pointer flex justify-center"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 3: 常用组件服务库 -->
        <div
          v-if="mainTab === 'catalog'"
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-3"
        >
          <div class="flex flex-wrap items-center gap-2">
            <div class="relative flex-1 min-w-[200px]">
              <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                v-model="catalogSearch"
                type="text"
                :placeholder="t('tools.dockerCompose.catalogSearchPlaceholder')"
                class="w-full pl-8 pr-3 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-xs focus:outline-none focus:border-blue-500"
              />
            </div>

            <div class="flex flex-wrap gap-1 text-[11px]">
              <button
                v-for="cat in ['all', 'database', 'cache', 'proxy', 'queue', 'search', 'runtime', 'observability']"
                :key="cat"
                type="button"
                @click="catalogCategory = cat as any"
                class="px-2 py-1 rounded-lg capitalize cursor-pointer transition-colors"
                :class="
                  catalogCategory === cat
                    ? 'bg-blue-600 text-white font-medium'
                    : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
                "
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[460px] overflow-y-auto pr-1">
            <div
              v-for="item in filteredCatalog"
              :key="item.id"
              class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-3 flex flex-col justify-between gap-2 bg-zinc-50/50 dark:bg-zinc-950/40"
            >
              <div>
                <div class="flex items-center justify-between gap-2">
                  <span class="text-xs font-bold text-zinc-900 dark:text-zinc-100">{{ item.name }}</span>
                  <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                    {{ item.category }}
                  </span>
                </div>
                <div class="text-[11px] font-mono text-blue-600 dark:text-blue-400 mt-0.5 truncate">
                  {{ item.image }}
                </div>
                <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                  {{ isZh ? item.descZh : item.descEn }}
                </p>
              </div>
              <button
                type="button"
                @click="addFromCatalog(item)"
                class="inline-flex items-center justify-center gap-1 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ t('tools.dockerCompose.appendToStack') }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧栏：诊断、compose.yml / docker run / .env 实时预览 (5 cols) -->
      <div class="xl:col-span-5 flex flex-col gap-3 min-w-0 xl:sticky xl:top-0">
        <!-- 静态校验面板 -->
        <div
          v-if="showDiagnostics"
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-3 space-y-2 text-xs"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2 font-semibold">
              <AlertCircle v-if="lintErrorCount > 0" class="w-4 h-4 text-rose-500" />
              <AlertTriangle v-else-if="lintWarningCount > 0" class="w-4 h-4 text-amber-500" />
              <Check v-else class="w-4 h-4 text-emerald-500" />
              <span class="text-zinc-800 dark:text-zinc-100">
                {{
                  lintIssues.length === 0
                    ? t('tools.dockerCompose.lintPassed')
                    : t('tools.dockerCompose.lintCount', { count: lintIssues.length })
                }}
              </span>
            </div>

            <button
              v-if="hasFixableIssues"
              type="button"
              @click="handleAutoFixMissing"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/60 hover:bg-amber-100 cursor-pointer"
            >
              <Wrench class="w-3 h-3" />
              <span>{{ t('tools.dockerCompose.autoDeclareBtn') }}</span>
            </button>
          </div>

          <div v-if="lintIssues.length > 0" class="space-y-1 max-h-32 overflow-y-auto">
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

        <!-- 输出预览卡片 -->
        <div
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-3.5 flex flex-col gap-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="inline-flex rounded-xl p-0.5 bg-zinc-100 dark:bg-zinc-800 text-xs">
              <button
                type="button"
                @click="outputTab = 'yaml'"
                class="px-2.5 py-1 rounded-lg font-mono font-medium cursor-pointer transition-colors"
                :class="outputTab === 'yaml' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'"
              >
                compose.yml
              </button>
              <button
                type="button"
                @click="outputTab = 'docker-run'"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg font-mono font-medium cursor-pointer transition-colors"
                :class="outputTab === 'docker-run' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'"
              >
                <Terminal class="w-3 h-3" />
                <span>docker run</span>
              </button>
              <button
                type="button"
                @click="outputTab = 'env'"
                class="px-2.5 py-1 rounded-lg font-mono font-medium cursor-pointer transition-colors"
                :class="outputTab === 'env' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'"
              >
                .env
              </button>
            </div>

            <div class="flex items-center gap-1.5">
              <CopyButton :text="activeOutputContent" />
              <button
                type="button"
                @click="downloadActiveOutput"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors cursor-pointer"
              >
                <Check v-if="isDownloaded && outputTab === 'yaml'" class="w-3.5 h-3.5" />
                <FileDown v-else class="w-3.5 h-3.5" />
                <span>{{ t('tools.dockerCompose.exportBtn') }}</span>
              </button>
            </div>
          </div>

          <!-- 子选项控制栏 -->
          <div v-if="outputTab === 'yaml'" class="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="flex items-center gap-2">
              <CustomSelect v-model="formatOptions.indentSize" :options="indentOptions" size="sm" />
              <label class="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 cursor-pointer">
                <input v-model="formatOptions.includeHeaderComment" type="checkbox" class="accent-blue-600" />
                <span>{{ t('tools.dockerCompose.headerComment') }}</span>
              </label>
            </div>
            <span class="text-[11px] font-mono text-zinc-400">
              {{ generatedYaml.split('\n').length }} lines
            </span>
          </div>

          <div v-if="outputTab === 'docker-run'" class="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div class="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 text-[11px]">
              <button
                type="button"
                @click="dockerRunScope = 'all'"
                class="px-2 py-0.5 rounded-md cursor-pointer"
                :class="dockerRunScope === 'all' ? 'bg-white dark:bg-zinc-700 font-medium' : 'text-zinc-500'"
              >
                {{ t('tools.dockerCompose.scopeAll') }}
              </button>
              <button
                type="button"
                @click="dockerRunScope = 'current'"
                class="px-2 py-0.5 rounded-md cursor-pointer"
                :class="dockerRunScope === 'current' ? 'bg-white dark:bg-zinc-700 font-medium' : 'text-zinc-500'"
              >
                {{ t('tools.dockerCompose.scopeCurrent') }} ({{ activeService?.name || '-' }})
              </button>
            </div>

            <label class="inline-flex items-center gap-1.5 text-[11px] text-zinc-500 cursor-pointer">
              <input v-model="dockerRunMultiline" type="checkbox" class="accent-blue-600" />
              <span>{{ t('tools.dockerCompose.multilineFormat') }}</span>
            </label>
          </div>

          <pre
            class="min-h-[280px] max-h-[520px] xl:max-h-[calc(100vh-19rem)] rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 p-3.5 text-xs font-mono text-zinc-800 dark:text-zinc-200 overflow-auto leading-relaxed select-all"
          >{{ activeOutputContent }}</pre>
        </div>
      </div>
    </div>

    <!-- 弹窗 1: docker run -> Compose 转换器 -->
    <div
      v-if="showDockerRunModal"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      @click.self="showDockerRunModal = false"
    >
      <div
        class="w-full max-w-3xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-5 flex flex-col gap-3.5 max-h-[88vh]"
      >
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {{ t('tools.dockerCompose.dockerRunModalTitle') }}
            </h3>
            <p class="text-xs text-zinc-500 mt-0.5">
              {{ t('tools.dockerCompose.dockerRunModalDesc') }}
            </p>
          </div>
          <button
            type="button"
            @click="showDockerRunModal = false"
            class="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <textarea
          v-model="dockerRunInput"
          rows="7"
          placeholder="docker run -d --name my-redis -p 6379:6379 -v redis_data:/data redis:7-alpine"
          class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 text-xs font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500 resize-y"
        />

        <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
          <div class="flex items-center gap-3">
            <span class="text-zinc-500">
              {{ t('tools.dockerCompose.parsedServicesCount', { count: dockerRunPreview.services.length }) }}
            </span>
            <div class="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800">
              <button
                type="button"
                @click="dockerRunImportMode = 'append'"
                class="px-2.5 py-1 rounded-md cursor-pointer"
                :class="dockerRunImportMode === 'append' ? 'bg-white dark:bg-zinc-700 font-medium shadow-2xs' : 'text-zinc-500'"
              >
                {{ t('tools.dockerCompose.modeAppend') }}
              </button>
              <button
                type="button"
                @click="dockerRunImportMode = 'replace'"
                class="px-2.5 py-1 rounded-md cursor-pointer"
                :class="dockerRunImportMode === 'replace' ? 'bg-white dark:bg-zinc-700 font-medium shadow-2xs' : 'text-zinc-500'"
              >
                {{ t('tools.dockerCompose.modeReplace') }}
              </button>
            </div>
          </div>

          <button
            type="button"
            @click="dockerRunInput = SAMPLE_DOCKER_RUN"
            class="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            {{ t('common.loadSample') }}
          </button>
        </div>

        <div
          v-if="dockerRunPreview.warnings.length > 0 || dockerRunPreview.notes.length > 0"
          class="rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 p-2.5 text-[11px] text-amber-700 dark:text-amber-300 space-y-1 max-h-28 overflow-y-auto font-mono"
        >
          <div v-for="(w, i) in dockerRunPreview.warnings" :key="`w-${i}`">! {{ w }}</div>
          <div v-for="(n, i) in dockerRunPreview.notes" :key="`n-${i}`" class="opacity-80">* {{ n }}</div>
        </div>

        <div class="flex justify-end gap-2 pt-1">
          <button
            type="button"
            @click="showDockerRunModal = false"
            class="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            {{ t('tools.dockerCompose.cancel') }}
          </button>
          <button
            type="button"
            @click="applyDockerRunImport"
            :disabled="dockerRunPreview.services.length === 0"
            class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-40"
          >
            {{ t('tools.dockerCompose.applyConversion') }}
          </button>
        </div>
      </div>
    </div>

    <!-- 弹窗 2: compose.yml 导入解析 -->
    <div
      v-if="showYamlImportModal"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      @click.self="showYamlImportModal = false"
    >
      <div
        class="w-full max-w-3xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-2xl p-5 flex flex-col gap-3.5 max-h-[88vh]"
      >
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
            {{ t('tools.dockerCompose.importYamlTitle') }}
          </h3>
          <div class="flex items-center gap-2">
            <input
              ref="yamlFileInputRef"
              type="file"
              accept=".yml,.yaml"
              class="hidden"
              @change="handleYamlFileUpload"
            />
            <button
              type="button"
              @click="yamlFileInputRef?.click()"
              class="px-2.5 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 cursor-pointer"
            >
              {{ t('tools.dockerCompose.chooseYmlFile') }}
            </button>
            <button
              type="button"
              @click="showYamlImportModal = false"
              class="p-1.5 rounded-lg text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>
        </div>

        <textarea
          v-model="yamlImportInput"
          rows="10"
          placeholder="services:&#10;  app:&#10;    image: nginx:alpine&#10;    ports:&#10;      - '8080:80'"
          class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-3 text-xs font-mono text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500 resize-y"
        />

        <div
          v-if="yamlImportError"
          class="rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 px-3 py-2 text-xs text-rose-700 dark:text-rose-300"
        >
          {{ yamlImportError }}
        </div>

        <div class="flex justify-end gap-2">
          <button
            type="button"
            @click="showYamlImportModal = false"
            class="px-3.5 py-1.5 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 cursor-pointer"
          >
            {{ t('tools.dockerCompose.cancel') }}
          </button>
          <button
            type="button"
            @click="applyYamlImport"
            :disabled="!yamlImportInput.trim()"
            class="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white cursor-pointer disabled:opacity-40"
          >
            {{ t('tools.dockerCompose.parseAndLoad') }}
          </button>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
