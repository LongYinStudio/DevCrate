<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Workflow,
  Plus,
  Trash2,
  Copy,
  ArrowUp,
  ArrowDown,
  FileDown,
  Upload,
  RotateCcw,
  Check,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  Layers,
  Zap,
  Shield,
  Package,
  Terminal,
  Boxes,
  Eye,
  EyeOff,
  X,
  ArrowRight
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import { downloadFile } from '../../utils/download';
import {
  WORKFLOW_PRESETS,
  ACTION_CATALOG,
  PERMISSION_SCOPES,
  RUNNER_OPTIONS,
  CRON_QUICK_PRESETS,
  createEmptyJob,
  createEmptyStep,
  createStepFromCatalog,
  generateWorkflowYaml,
  lintWorkflow,
  parseWorkflowYaml,
  nextWorkflowUid,
  type WorkflowConfig,
  type WorkflowJob,
  type WorkflowStep,
  type WorkflowFormatOptions,
  type ActionCatalogItem,
  type PermissionAccess
} from './githubActionsUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

const activePresetId = ref('node-ci');
const config = ref<WorkflowConfig>(WORKFLOW_PRESETS[0].build());
const selectedJobUid = ref<string>(config.value.jobs[0]?.uid ?? '');
const expandedStepUids = ref<Set<string>>(new Set([config.value.jobs[0]?.steps[0]?.uid ?? '']));

const activeTab = ref<'jobs' | 'triggers' | 'workflow' | 'catalog'>('jobs');
const showMatrixPanel = ref(false);
const showJobEnvPanel = ref(false);
const showJobAdvanced = ref(false);

const formatOptions = ref<WorkflowFormatOptions>({
  indentSize: 2,
  includeHeaderComment: true
});

const catalogSearch = ref('');
const catalogCategory = ref<'all' | ActionCatalogItem['category']>('all');
const addedToast = ref('');
const isDownloaded = ref(false);
const showDiagnostics = ref(true);

// 导入弹窗
const showImportModal = ref(false);
const importYamlText = ref('');
const importError = ref('');
const importFileInputRef = ref<HTMLInputElement | null>(null);

const selectedJob = computed<WorkflowJob | undefined>(() => {
  return config.value.jobs.find(j => j.uid === selectedJobUid.value) ?? config.value.jobs[0];
});

const generatedYaml = computed(() => {
  return generateWorkflowYaml(config.value, formatOptions.value);
});

const lintIssues = computed(() => {
  return lintWorkflow(config.value);
});

const lintErrorCount = computed(() => lintIssues.value.filter(i => i.level === 'error').length);
const lintWarningCount = computed(() => lintIssues.value.filter(i => i.level === 'warning').length);

const runnerSelectOptions = computed<SelectOption[]>(() =>
  RUNNER_OPTIONS.map(r => ({ label: r, value: r }))
);

const indentOptions: SelectOption[] = [
  { label: '2 spaces', value: 2 },
  { label: '4 spaces', value: 4 }
];

const shellOptions: SelectOption[] = [
  { label: 'Default', value: '' },
  { label: 'bash', value: 'bash' },
  { label: 'sh', value: 'sh' },
  { label: 'pwsh', value: 'pwsh' },
  { label: 'python', value: 'python' },
  { label: 'cmd', value: 'cmd' }
];

const permissionAccessOptions = computed<SelectOption[]>(() => [
  { label: t('tools.githubActions.permDefault'), value: 'default' },
  { label: 'read', value: 'read' },
  { label: 'write', value: 'write' },
  { label: 'none', value: 'none' }
]);

const inputTypeOptions: SelectOption[] = [
  { label: 'string', value: 'string' },
  { label: 'boolean', value: 'boolean' },
  { label: 'choice', value: 'choice' },
  { label: 'environment', value: 'environment' }
];

const filteredCatalog = computed(() => {
  const q = catalogSearch.value.trim().toLowerCase();
  return ACTION_CATALOG.filter(item => {
    if (catalogCategory.value !== 'all' && item.category !== catalogCategory.value) return false;
    if (!q) return true;
    return (
      item.name.toLowerCase().includes(q) ||
      item.uses.toLowerCase().includes(q) ||
      item.descZh.toLowerCase().includes(q) ||
      item.descEn.toLowerCase().includes(q)
    );
  });
});

function applyPreset(presetId: string) {
  const preset = WORKFLOW_PRESETS.find(p => p.id === presetId);
  if (!preset) return;
  activePresetId.value = presetId;
  config.value = preset.build();
  const firstJob = config.value.jobs[0];
  selectedJobUid.value = firstJob?.uid ?? '';
  expandedStepUids.value = new Set(firstJob?.steps[0] ? [firstJob.steps[0].uid] : []);
}

function resetCurrentPreset() {
  applyPreset(activePresetId.value);
}

// ==================== Job 操作 ====================

function addJob() {
  const existingIds = new Set(config.value.jobs.map(j => j.id));
  let idx = config.value.jobs.length + 1;
  let id = `job_${idx}`;
  while (existingIds.has(id)) {
    idx++;
    id = `job_${idx}`;
  }
  const job = createEmptyJob(id, `Job ${idx}`);
  config.value.jobs.push(job);
  selectedJobUid.value = job.uid;
  expandedStepUids.value = new Set(job.steps[0] ? [job.steps[0].uid] : []);
}

function duplicateJob(job: WorkflowJob) {
  const existingIds = new Set(config.value.jobs.map(j => j.id));
  let copyId = `${job.id}_copy`;
  let n = 2;
  while (existingIds.has(copyId)) {
    copyId = `${job.id}_copy_${n++}`;
  }
  const clone: WorkflowJob = {
    ...JSON.parse(JSON.stringify(job)),
    uid: nextWorkflowUid('job'),
    id: copyId,
    name: job.name ? `${job.name} (Copy)` : copyId
  };
  clone.steps = clone.steps.map(s => ({ ...s, uid: nextWorkflowUid('step') }));
  config.value.jobs.push(clone);
  selectedJobUid.value = clone.uid;
}

function removeJob(uid: string) {
  if (config.value.jobs.length <= 1) return;
  const idx = config.value.jobs.findIndex(j => j.uid === uid);
  if (idx === -1) return;
  const removedId = config.value.jobs[idx].id;
  config.value.jobs.splice(idx, 1);
  // 清理其他 job 的 needs 引用
  for (const j of config.value.jobs) {
    j.needs = j.needs.filter(n => n !== removedId);
  }
  if (selectedJobUid.value === uid) {
    selectedJobUid.value = config.value.jobs[Math.max(0, idx - 1)].uid;
  }
}

function toggleJobNeeds(targetJobId: string) {
  const job = selectedJob.value;
  if (!job || job.id === targetJobId) return;
  const i = job.needs.indexOf(targetJobId);
  if (i === -1) job.needs.push(targetJobId);
  else job.needs.splice(i, 1);
}

// ==================== Step 操作 ====================

function toggleStepExpand(uid: string) {
  const next = new Set(expandedStepUids.value);
  if (next.has(uid)) next.delete(uid);
  else next.add(uid);
  expandedStepUids.value = next;
}

function addShellStep() {
  const job = selectedJob.value;
  if (!job) return;
  const step = createEmptyStep('run');
  job.steps.push(step);
  expandedStepUids.value = new Set([...expandedStepUids.value, step.uid]);
}

function addActionStep(item: ActionCatalogItem) {
  const job = selectedJob.value;
  if (!job) return;
  const step = createStepFromCatalog(item);
  job.steps.push(step);
  expandedStepUids.value = new Set([...expandedStepUids.value, step.uid]);
  addedToast.value = item.name;
  setTimeout(() => {
    if (addedToast.value === item.name) addedToast.value = '';
  }, 1600);
}

function moveStep(index: number, delta: -1 | 1) {
  const job = selectedJob.value;
  if (!job) return;
  const target = index + delta;
  if (target < 0 || target >= job.steps.length) return;
  const [moved] = job.steps.splice(index, 1);
  job.steps.splice(target, 0, moved);
}

function duplicateStep(index: number) {
  const job = selectedJob.value;
  if (!job) return;
  const src = job.steps[index];
  const copy: WorkflowStep = {
    ...JSON.parse(JSON.stringify(src)),
    uid: nextWorkflowUid('step'),
    name: src.name ? `${src.name} (Copy)` : ''
  };
  job.steps.splice(index + 1, 0, copy);
  expandedStepUids.value = new Set([...expandedStepUids.value, copy.uid]);
}

function removeStep(index: number) {
  const job = selectedJob.value;
  if (!job) return;
  job.steps.splice(index, 1);
}

// ==================== Triggers & Key-Value 操作 ====================

function addDispatchInput() {
  config.value.triggers.workflowDispatch.inputs.push({
    name: `param_${config.value.triggers.workflowDispatch.inputs.length + 1}`,
    description: '',
    required: false,
    defaultValue: '',
    type: 'string',
    options: ''
  });
}

function removeDispatchInput(idx: number) {
  config.value.triggers.workflowDispatch.inputs.splice(idx, 1);
}

function addScheduleCron(expr = '0 2 * * *') {
  config.value.triggers.schedule.crons.push(expr);
}

function removeScheduleCron(idx: number) {
  config.value.triggers.schedule.crons.splice(idx, 1);
}

function addMatrixAxis() {
  selectedJob.value?.strategy.matrix.push({ key: 'version', values: '1, 2' });
}

function removeMatrixAxis(idx: number) {
  selectedJob.value?.strategy.matrix.splice(idx, 1);
}

function setPermissionScope(scope: (typeof PERMISSION_SCOPES)[number], val: PermissionAccess) {
  config.value.permissions[scope] = val;
}

// ==================== 导出与导入 ====================

function handleDownloadYaml() {
  const filename = (config.value.filename || 'ci.yml').trim() || 'ci.yml';
  downloadFile(generatedYaml.value, filename, 'text/yaml;charset=utf-8');
  isDownloaded.value = true;
  setTimeout(() => {
    isDownloaded.value = false;
  }, 1800);
}

function openImportModal() {
  importYamlText.value = '';
  importError.value = '';
  showImportModal.value = true;
}

function onImportFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    importYamlText.value = typeof reader.result === 'string' ? reader.result : '';
    const res = parseWorkflowYaml(importYamlText.value, file.name);
    if (res.config) {
      config.value = res.config;
      selectedJobUid.value = res.config.jobs[0]?.uid ?? '';
      expandedStepUids.value = new Set(res.config.jobs[0]?.steps[0] ? [res.config.jobs[0].steps[0].uid] : []);
      showImportModal.value = false;
    } else {
      importError.value = res.error || 'Failed to parse YAML';
    }
  };
  reader.readAsText(file, 'utf-8');
  input.value = '';
}

function confirmImportYaml() {
  if (!importYamlText.value.trim()) {
    importError.value = t('tools.githubActions.importEmptyError');
    return;
  }
  const res = parseWorkflowYaml(importYamlText.value, config.value.filename || 'ci.yml');
  if (res.config) {
    config.value = res.config;
    selectedJobUid.value = res.config.jobs[0]?.uid ?? '';
    expandedStepUids.value = new Set(res.config.jobs[0]?.steps[0] ? [res.config.jobs[0].steps[0].uid] : []);
    showImportModal.value = false;
  } else {
    importError.value = res.error || 'Failed to parse YAML';
  }
}
</script>

<template>
  <ToolContainer
    toolId="github-actions"
    nameKey="tools.githubActions.name"
    descKey="tools.githubActions.desc"
    :icon="Workflow"
    :wide="true"
    :fullHeight="true"
  >
    <template #header-actions>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="openImportModal"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          <Upload class="w-3.5 h-3.5" />
          <span>{{ t('tools.githubActions.importYaml') }}</span>
        </button>

        <button
          type="button"
          @click="resetCurrentPreset"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>{{ t('common.reset') }}</span>
        </button>

        <button
          type="button"
          @click="handleDownloadYaml"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-xs"
        >
          <component :is="isDownloaded ? Check : FileDown" class="w-3.5 h-3.5" />
          <span>{{ isDownloaded ? t('tools.githubActions.downloaded') : t('tools.githubActions.downloadYaml') }}</span>
        </button>
      </div>
    </template>

    <div class="flex-1 flex flex-col min-h-0 gap-3 overflow-hidden">
      <!-- 场景预设快捷栏 -->
      <div class="flex flex-wrap items-center gap-1.5 shrink-0 select-none">
        <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
          {{ t('tools.githubActions.presetsLabel') }}:
        </span>
        <button
          v-for="preset in WORKFLOW_PRESETS"
          :key="preset.id"
          type="button"
          @click="applyPreset(preset.id)"
          class="px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer"
          :class="
            activePresetId === preset.id
              ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
              : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
          "
          :title="t(preset.descKey)"
        >
          {{ t(preset.nameKey) }}
        </button>
      </div>

      <!-- 主工作区：左侧可视化编排 + 右侧实时 YAML 与检查 -->
      <div class="grid grid-cols-1 xl:grid-cols-12 gap-3.5 xl:flex-1 xl:min-h-0">
        <!-- 左侧可视化构建器 -->
        <div class="xl:col-span-7 flex flex-col xl:min-h-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
          <!-- 顶部 Tabs -->
          <div class="flex items-center justify-between px-3 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/70 shrink-0 select-none gap-2 flex-wrap">
            <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
              <button
                type="button"
                @click="activeTab = 'jobs'"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
                :class="activeTab === 'jobs' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
              >
                <Layers class="w-3.5 h-3.5" />
                <span>{{ t('tools.githubActions.tabs.jobs') }}</span>
                <span class="px-1.5 py-0.2 rounded bg-zinc-200/70 dark:bg-zinc-600/60 text-[10px] font-mono">{{ config.jobs.length }}</span>
              </button>

              <button
                type="button"
                @click="activeTab = 'triggers'"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
                :class="activeTab === 'triggers' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
              >
                <Zap class="w-3.5 h-3.5" />
                <span>{{ t('tools.githubActions.tabs.triggers') }}</span>
              </button>

              <button
                type="button"
                @click="activeTab = 'workflow'"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
                :class="activeTab === 'workflow' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
              >
                <Shield class="w-3.5 h-3.5" />
                <span>{{ t('tools.githubActions.tabs.workflow') }}</span>
              </button>

              <button
                type="button"
                @click="activeTab = 'catalog'"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
                :class="activeTab === 'catalog' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
              >
                <Package class="w-3.5 h-3.5" />
                <span>{{ t('tools.githubActions.tabs.catalog') }}</span>
              </button>
            </div>

            <span
              v-if="addedToast"
              class="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800/50"
            >
              <Check class="w-3 h-3" />
              {{ t('tools.githubActions.addedStepToast', { name: addedToast }) }}
            </span>
          </div>

          <!-- Tab 内容滚动区 -->
          <div class="flex-1 overflow-y-auto p-3.5 space-y-3.5 min-h-0">
            <!-- ==================== TAB 1: 作业与步骤 ==================== -->
            <template v-if="activeTab === 'jobs'">
              <!-- Job 列表选择器 -->
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  v-for="job in config.jobs"
                  :key="job.uid"
                  type="button"
                  @click="selectedJobUid = job.uid"
                  class="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all cursor-pointer"
                  :class="
                    selectedJob?.uid === job.uid
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                      : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300 hover:border-zinc-300'
                  "
                >
                  <Boxes class="w-3.5 h-3.5 shrink-0" />
                  <span class="font-mono">{{ job.id || 'unnamed' }}</span>
                  <span class="text-[10px] opacity-70">({{ job.steps.filter(s => !s.disabled).length }})</span>
                </button>

                <button
                  type="button"
                  @click="addJob"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:border-blue-400 transition-colors cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>{{ t('tools.githubActions.addJob') }}</span>
                </button>
              </div>

              <!-- 当前选中 Job 编辑器 -->
              <div v-if="selectedJob" class="space-y-3">
                <div class="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      {{ t('tools.githubActions.jobConfig') }}
                    </span>
                    <div class="flex items-center gap-1">
                      <button
                        type="button"
                        @click="duplicateJob(selectedJob)"
                        class="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer"
                        :title="t('tools.githubActions.duplicateJob')"
                      >
                        <Copy class="w-3 h-3" />
                        <span>{{ t('tools.githubActions.duplicate') }}</span>
                      </button>
                      <button
                        type="button"
                        @click="removeJob(selectedJob.uid)"
                        :disabled="config.jobs.length <= 1"
                        class="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                        :title="t('tools.githubActions.deleteJob')"
                      >
                        <Trash2 class="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        {{ t('tools.githubActions.jobId') }}
                      </label>
                      <input
                        v-model="selectedJob.id"
                        type="text"
                        placeholder="build"
                        class="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        {{ t('tools.githubActions.jobName') }}
                      </label>
                      <input
                        v-model="selectedJob.name"
                        type="text"
                        placeholder="Build & Test"
                        class="w-full px-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none focus:border-blue-500"
                      />
                    </div>

                    <div>
                      <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                        runs-on
                      </label>
                      <CustomSelect
                        v-model="selectedJob.runsOn"
                        :options="runnerSelectOptions"
                        size="md"
                        fullWidth
                      />
                    </div>
                  </div>

                  <!-- 依赖前置作业 (needs) -->
                  <div v-if="config.jobs.length > 1" class="flex flex-wrap items-center gap-1.5 pt-1">
                    <span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mr-1">
                      {{ t('tools.githubActions.needsLabel') }}:
                    </span>
                    <button
                      v-for="other in config.jobs.filter(j => j.uid !== selectedJob?.uid)"
                      :key="other.uid"
                      type="button"
                      @click="toggleJobNeeds(other.id)"
                      class="px-2 py-0.5 rounded-md text-[11px] font-mono border transition-colors cursor-pointer"
                      :class="
                        selectedJob.needs.includes(other.id)
                          ? 'bg-blue-600 text-white border-blue-600'
                          : 'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-blue-400'
                      "
                    >
                      {{ other.id }}
                    </button>
                  </div>

                  <!-- 可折叠：Matrix / Job Env / 高级 -->
                  <div class="flex flex-wrap items-center gap-3 pt-1 text-xs">
                    <button
                      type="button"
                      @click="showMatrixPanel = !showMatrixPanel"
                      class="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    >
                      <component :is="showMatrixPanel ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
                      <span>{{ t('tools.githubActions.matrixStrategy') }}</span>
                      <span v-if="selectedJob.strategy.enabled" class="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                    </button>

                    <button
                      type="button"
                      @click="showJobEnvPanel = !showJobEnvPanel"
                      class="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    >
                      <component :is="showJobEnvPanel ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
                      <span>{{ t('tools.githubActions.jobEnv') }} ({{ selectedJob.env.length }})</span>
                    </button>

                    <button
                      type="button"
                      @click="showJobAdvanced = !showJobAdvanced"
                      class="inline-flex items-center gap-1 text-[11px] font-medium text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                    >
                      <component :is="showJobAdvanced ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
                      <span>{{ t('tools.githubActions.advancedOptions') }}</span>
                    </button>
                  </div>

                  <!-- Matrix 面板 -->
                  <div v-if="showMatrixPanel" class="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
                    <div class="flex items-center justify-between">
                      <label class="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-200 cursor-pointer">
                        <input
                          v-model="selectedJob.strategy.enabled"
                          type="checkbox"
                          class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600"
                        />
                        <span>{{ t('tools.githubActions.enableMatrix') }}</span>
                      </label>

                      <div class="flex items-center gap-3 text-xs">
                        <label class="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-400 cursor-pointer">
                          <input v-model="selectedJob.strategy.failFast" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600" />
                          <span>fail-fast</span>
                        </label>
                        <button
                          type="button"
                          @click="addMatrixAxis"
                          class="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <Plus class="w-3 h-3" />
                          <span>{{ t('tools.githubActions.addMatrixAxis') }}</span>
                        </button>
                      </div>
                    </div>

                    <div v-if="selectedJob.strategy.enabled" class="space-y-1.5">
                      <div
                        v-for="(axis, idx) in selectedJob.strategy.matrix"
                        :key="idx"
                        class="flex items-center gap-2"
                      >
                        <input
                          v-model="axis.key"
                          type="text"
                          placeholder="node-version"
                          class="w-36 px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                        />
                        <input
                          v-model="axis.values"
                          type="text"
                          placeholder="18, 20, 22"
                          class="flex-1 px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                        />
                        <button
                          type="button"
                          @click="removeMatrixAxis(idx)"
                          class="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>

                  <!-- Job Env 面板 -->
                  <div v-if="showJobEnvPanel" class="p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-xs font-medium text-zinc-700 dark:text-zinc-200">{{ t('tools.githubActions.jobEnv') }}</span>
                      <button
                        type="button"
                        @click="selectedJob.env.push({ key: '', value: '' })"
                        class="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                      >
                        <Plus class="w-3 h-3" />
                        <span>{{ t('tools.githubActions.addEnv') }}</span>
                      </button>
                    </div>
                    <div v-for="(ev, idx) in selectedJob.env" :key="idx" class="flex items-center gap-2">
                      <input
                        v-model="ev.key"
                        type="text"
                        placeholder="KEY"
                        class="w-40 px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                      />
                      <input
                        v-model="ev.value"
                        type="text"
                        placeholder="VALUE"
                        class="flex-1 px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                      />
                      <button type="button" @click="selectedJob.env.splice(idx, 1)" class="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer">
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <!-- Job 高级选项 -->
                  <div v-if="showJobAdvanced" class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                    <div>
                      <label class="block text-[11px] text-zinc-500 mb-1">if</label>
                      <input
                        v-model="selectedJob.ifExpr"
                        type="text"
                        placeholder="github.ref == 'refs/heads/main'"
                        class="w-full px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-500 mb-1">environment</label>
                      <input
                        v-model="selectedJob.environment"
                        type="text"
                        placeholder="production"
                        class="w-full px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-500 mb-1">timeout-minutes</label>
                      <input
                        v-model.number="selectedJob.timeoutMinutes"
                        type="number"
                        min="1"
                        max="360"
                        placeholder="30"
                        class="w-full px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                </div>

                <!-- Steps 列表 -->
                <div class="space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-200">
                      {{ t('tools.githubActions.stepsTitle') }} ({{ selectedJob.steps.length }})
                    </span>
                    <div class="flex items-center gap-1.5">
                      <button
                        type="button"
                        @click="addShellStep"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 cursor-pointer"
                      >
                        <Terminal class="w-3.5 h-3.5 text-emerald-500" />
                        <span>{{ t('tools.githubActions.addShellStep') }}</span>
                      </button>
                      <button
                        type="button"
                        @click="activeTab = 'catalog'"
                        class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/60 cursor-pointer"
                      >
                        <Plus class="w-3.5 h-3.5" />
                        <span>{{ t('tools.githubActions.addActionStep') }}</span>
                      </button>
                    </div>
                  </div>

                  <div
                    v-for="(step, idx) in selectedJob.steps"
                    :key="step.uid"
                    class="rounded-xl border transition-all overflow-hidden"
                    :class="
                      step.disabled
                        ? 'border-zinc-200/60 dark:border-zinc-800/60 opacity-55 bg-zinc-50/40 dark:bg-zinc-900/40'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                    "
                  >
                    <!-- Step 头部 -->
                    <div
                      @click="toggleStepExpand(step.uid)"
                      class="flex items-center justify-between px-3 py-2 bg-zinc-50/70 dark:bg-zinc-900/70 cursor-pointer select-none hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors"
                    >
                      <div class="flex items-center gap-2 min-w-0">
                        <span class="text-[11px] font-mono text-zinc-400 w-4">{{ idx + 1 }}.</span>
                        <span
                          class="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase shrink-0"
                          :class="
                            step.kind === 'uses'
                              ? 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-400'
                              : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                          "
                        >
                          {{ step.kind === 'uses' ? 'uses' : 'run' }}
                        </span>
                        <span class="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                          {{ step.name || (step.kind === 'uses' ? step.uses : step.run.split('\n')[0]) || 'Unnamed step' }}
                        </span>
                        <span
                          v-if="step.kind === 'uses' && step.uses"
                          class="hidden sm:inline text-[11px] font-mono text-zinc-400 truncate"
                        >
                          {{ step.uses }}
                        </span>
                      </div>

                      <div class="flex items-center gap-0.5 shrink-0" @click.stop>
                        <button
                          type="button"
                          @click="moveStep(idx, -1)"
                          :disabled="idx === 0"
                          class="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowUp class="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          @click="moveStep(idx, 1)"
                          :disabled="idx === selectedJob.steps.length - 1"
                          class="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer"
                        >
                          <ArrowDown class="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          @click="step.disabled = !step.disabled"
                          class="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                          :title="step.disabled ? t('tools.githubActions.enableStep') : t('tools.githubActions.disableStep')"
                        >
                          <component :is="step.disabled ? EyeOff : Eye" class="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          @click="duplicateStep(idx)"
                          class="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          <Copy class="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          @click="removeStep(idx)"
                          class="p-1 rounded text-zinc-400 hover:text-rose-500 cursor-pointer"
                        >
                          <Trash2 class="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          @click="toggleStepExpand(step.uid)"
                          class="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                        >
                          <component :is="expandedStepUids.has(step.uid) ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <!-- Step 展开编辑体 -->
                    <div v-if="expandedStepUids.has(step.uid)" class="p-3 border-t border-zinc-100 dark:border-zinc-800/80 space-y-2.5 text-xs">
                      <div class="grid grid-cols-1 sm:grid-cols-12 gap-2">
                        <div class="sm:col-span-5">
                          <label class="block text-[11px] text-zinc-500 mb-1">{{ t('tools.githubActions.stepName') }}</label>
                          <input
                            v-model="step.name"
                            type="text"
                            class="w-full px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                          />
                        </div>
                        <div class="sm:col-span-3">
                          <label class="block text-[11px] text-zinc-500 mb-1">{{ t('tools.githubActions.stepType') }}</label>
                          <div class="inline-flex w-full rounded-md bg-zinc-100 dark:bg-zinc-800 p-0.5">
                            <button
                              type="button"
                              @click="step.kind = 'uses'"
                              class="flex-1 py-1 rounded text-[11px] font-medium cursor-pointer"
                              :class="step.kind === 'uses' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500'"
                            >
                              uses
                            </button>
                            <button
                              type="button"
                              @click="step.kind = 'run'"
                              class="flex-1 py-1 rounded text-[11px] font-medium cursor-pointer"
                              :class="step.kind === 'run' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500'"
                            >
                              run
                            </button>
                          </div>
                        </div>
                        <div class="sm:col-span-4">
                          <label class="block text-[11px] text-zinc-500 mb-1">if ({{ t('tools.githubActions.optional') }})</label>
                          <input
                            v-model="step.ifExpr"
                            type="text"
                            placeholder="success()"
                            class="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                          />
                        </div>
                      </div>

                      <!-- uses 模式 -->
                      <template v-if="step.kind === 'uses'">
                        <div>
                          <label class="block text-[11px] text-zinc-500 mb-1">uses (owner/repo@ref)</label>
                          <input
                            v-model="step.uses"
                            type="text"
                            placeholder="actions/checkout@v4"
                            class="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                          />
                        </div>

                        <div class="space-y-1.5">
                          <div class="flex items-center justify-between">
                            <span class="text-[11px] font-medium text-zinc-500">with ({{ t('tools.githubActions.stepInputs') }})</span>
                            <button
                              type="button"
                              @click="step.withParams.push({ key: '', value: '' })"
                              class="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                            >
                              <Plus class="w-3 h-3" />
                              <span>{{ t('tools.githubActions.addParam') }}</span>
                            </button>
                          </div>
                          <div
                            v-for="(p, pIdx) in step.withParams"
                            :key="pIdx"
                            class="flex items-start gap-2"
                          >
                            <input
                              v-model="p.key"
                              type="text"
                              placeholder="key"
                              class="w-36 px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                            />
                            <textarea
                              v-if="p.value.includes('\n')"
                              v-model="p.value"
                              rows="2"
                              class="flex-1 px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                            />
                            <input
                              v-else
                              v-model="p.value"
                              type="text"
                              placeholder="value"
                              class="flex-1 px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                            />
                            <button type="button" @click="step.withParams.splice(pIdx, 1)" class="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer">
                              <Trash2 class="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </template>

                      <!-- run 模式 -->
                      <template v-else>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label class="block text-[11px] text-zinc-500 mb-1">shell</label>
                            <CustomSelect v-model="step.shell" :options="shellOptions" size="sm" fullWidth />
                          </div>
                          <div>
                            <label class="block text-[11px] text-zinc-500 mb-1">working-directory</label>
                            <input
                              v-model="step.workingDirectory"
                              type="text"
                              placeholder="./packages/app"
                              class="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label class="block text-[11px] text-zinc-500 mb-1">run</label>
                          <textarea
                            v-model="step.run"
                            rows="3"
                            spellcheck="false"
                            placeholder="npm ci&#10;npm test"
                            class="w-full px-2.5 py-1.5 font-mono text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none focus:border-blue-500"
                          />
                        </div>
                      </template>

                      <!-- Step ID & Env 快捷行 -->
                      <div class="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-zinc-100 dark:border-zinc-800/60">
                        <div class="flex items-center gap-2">
                          <span class="text-[11px] text-zinc-500">id:</span>
                          <input
                            v-model="step.id"
                            type="text"
                            placeholder="optional"
                            class="w-28 px-2 py-0.5 font-mono text-[11px] rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                          />
                          <label class="inline-flex items-center gap-1 text-[11px] text-zinc-500 cursor-pointer ml-2">
                            <input v-model="step.continueOnError" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600" />
                            <span>continue-on-error</span>
                          </label>
                        </div>

                        <button
                          type="button"
                          @click="step.env.push({ key: '', value: '' })"
                          class="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                        >
                          <Plus class="w-3 h-3" />
                          <span>{{ t('tools.githubActions.addStepEnv') }}</span>
                        </button>
                      </div>

                      <div v-if="step.env.length > 0" class="space-y-1.5">
                        <div v-for="(se, seIdx) in step.env" :key="seIdx" class="flex items-center gap-2">
                          <input
                            v-model="se.key"
                            type="text"
                            placeholder="ENV_KEY"
                            class="w-36 px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                          />
                          <input
                            v-model="se.value"
                            type="text"
                            placeholder="${{ secrets.TOKEN }}"
                            class="flex-1 px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                          />
                          <button type="button" @click="step.env.splice(seIdx, 1)" class="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer">
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- ==================== TAB 2: 触发器配置 ==================== -->
            <template v-else-if="activeTab === 'triggers'">
              <div class="space-y-3 text-xs">
                <!-- push -->
                <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <label class="flex items-center justify-between cursor-pointer">
                    <div>
                      <span class="font-semibold font-mono text-zinc-800 dark:text-zinc-100">push</span>
                      <p class="text-[11px] text-zinc-500">{{ t('tools.githubActions.triggers.pushDesc') }}</p>
                    </div>
                    <input v-model="config.triggers.push.enabled" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 w-4 h-4" />
                  </label>
                  <div v-if="config.triggers.push.enabled" class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div>
                      <label class="block text-[11px] text-zinc-500 mb-1">branches ({{ t('tools.githubActions.csvHint') }})</label>
                      <input v-model="config.triggers.push.branches" type="text" placeholder="main, develop" class="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-500 mb-1">tags</label>
                      <input v-model="config.triggers.push.tags" type="text" placeholder="v*" class="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-500 mb-1">branches-ignore</label>
                      <input v-model="config.triggers.push.branchesIgnore" type="text" placeholder="gh-pages" class="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-500 mb-1">paths</label>
                      <input v-model="config.triggers.push.paths" type="text" placeholder="src/**, package.json" class="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                <!-- pull_request -->
                <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <label class="flex items-center justify-between cursor-pointer">
                    <div>
                      <span class="font-semibold font-mono text-zinc-800 dark:text-zinc-100">pull_request</span>
                      <p class="text-[11px] text-zinc-500">{{ t('tools.githubActions.triggers.prDesc') }}</p>
                    </div>
                    <input v-model="config.triggers.pullRequest.enabled" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 w-4 h-4" />
                  </label>
                  <div v-if="config.triggers.pullRequest.enabled" class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div>
                      <label class="block text-[11px] text-zinc-500 mb-1">branches</label>
                      <input v-model="config.triggers.pullRequest.branches" type="text" placeholder="main" class="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-500 mb-1">types</label>
                      <input v-model="config.triggers.pullRequest.types" type="text" placeholder="opened, synchronize" class="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-500 mb-1">paths</label>
                      <input v-model="config.triggers.pullRequest.paths" type="text" placeholder="src/**" class="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>

                <!-- workflow_dispatch -->
                <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <label class="flex items-center justify-between cursor-pointer">
                    <div>
                      <span class="font-semibold font-mono text-zinc-800 dark:text-zinc-100">workflow_dispatch</span>
                      <p class="text-[11px] text-zinc-500">{{ t('tools.githubActions.triggers.dispatchDesc') }}</p>
                    </div>
                    <input v-model="config.triggers.workflowDispatch.enabled" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 w-4 h-4" />
                  </label>
                  <div v-if="config.triggers.workflowDispatch.enabled" class="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <div class="flex items-center justify-between">
                      <span class="text-[11px] font-medium text-zinc-500">{{ t('tools.githubActions.dispatchInputs') }}</span>
                      <button type="button" @click="addDispatchInput" class="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer">
                        <Plus class="w-3 h-3" />
                        <span>{{ t('tools.githubActions.addInput') }}</span>
                      </button>
                    </div>
                    <div
                      v-for="(inp, idx) in config.triggers.workflowDispatch.inputs"
                      :key="idx"
                      class="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/60 border border-zinc-200/70 dark:border-zinc-700/60 space-y-1.5"
                    >
                      <div class="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                        <input v-model="inp.name" type="text" placeholder="name" class="sm:col-span-3 px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-blue-500" />
                        <div class="sm:col-span-3">
                          <CustomSelect v-model="inp.type" :options="inputTypeOptions" size="sm" fullWidth />
                        </div>
                        <input v-model="inp.defaultValue" type="text" placeholder="default" class="sm:col-span-3 px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-blue-500" />
                        <div class="sm:col-span-3 flex items-center justify-between">
                          <label class="inline-flex items-center gap-1 text-[11px] cursor-pointer">
                            <input v-model="inp.required" type="checkbox" class="rounded text-blue-600" />
                            <span>required</span>
                          </label>
                          <button type="button" @click="removeDispatchInput(idx)" class="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer">
                            <Trash2 class="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <input v-model="inp.description" type="text" placeholder="description" class="px-2 py-1 rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-blue-500" />
                        <input v-if="inp.type === 'choice'" v-model="inp.options" type="text" placeholder="staging, production" class="px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 outline-none focus:border-blue-500" />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- schedule -->
                <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <label class="flex items-center justify-between cursor-pointer">
                    <div>
                      <span class="font-semibold font-mono text-zinc-800 dark:text-zinc-100">schedule</span>
                      <p class="text-[11px] text-zinc-500">{{ t('tools.githubActions.triggers.scheduleDesc') }}</p>
                    </div>
                    <input v-model="config.triggers.schedule.enabled" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 w-4 h-4" />
                  </label>
                  <div v-if="config.triggers.schedule.enabled" class="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                    <div class="flex flex-wrap items-center gap-1.5">
                      <button
                        v-for="cp in CRON_QUICK_PRESETS"
                        :key="cp.expr"
                        type="button"
                        @click="addScheduleCron(cp.expr)"
                        class="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-[11px] cursor-pointer"
                      >
                        + {{ isZh ? cp.labelZh : cp.labelEn }}
                      </button>
                    </div>
                    <div v-for="(_c, idx) in config.triggers.schedule.crons" :key="idx" class="flex items-center gap-2">
                      <input
                        v-model="config.triggers.schedule.crons[idx]"
                        type="text"
                        placeholder="0 2 * * *"
                        class="flex-1 px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                      />
                      <button
                        type="button"
                        @click="removeScheduleCron(idx)"
                        :disabled="config.triggers.schedule.crons.length <= 1"
                        class="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer disabled:opacity-30"
                      >
                        <Trash2 class="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- release & workflow_call -->
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                    <label class="flex items-center justify-between cursor-pointer">
                      <span class="font-semibold font-mono text-zinc-800 dark:text-zinc-100">release</span>
                      <input v-model="config.triggers.release.enabled" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 w-4 h-4" />
                    </label>
                    <input
                      v-if="config.triggers.release.enabled"
                      v-model="config.triggers.release.types"
                      type="text"
                      placeholder="published"
                      class="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
                    <div>
                      <span class="font-semibold font-mono text-zinc-800 dark:text-zinc-100">workflow_call</span>
                      <p class="text-[11px] text-zinc-500">{{ t('tools.githubActions.triggers.callDesc') }}</p>
                    </div>
                    <input v-model="config.triggers.workflowCall.enabled" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 w-4 h-4" />
                  </div>
                </div>
              </div>
            </template>

            <!-- ==================== TAB 3: 工作流元数据与权限 ==================== -->
            <template v-else-if="activeTab === 'workflow'">
              <div class="space-y-3.5 text-xs">
                <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label class="block text-[11px] font-medium text-zinc-500 mb-1">{{ t('tools.githubActions.workflowName') }}</label>
                    <input v-model="config.name" type="text" placeholder="CI" class="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-medium text-zinc-500 mb-1">{{ t('tools.githubActions.filename') }}</label>
                    <input v-model="config.filename" type="text" placeholder="ci.yml" class="w-full px-2.5 py-1.5 font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                  </div>
                  <div>
                    <label class="block text-[11px] font-medium text-zinc-500 mb-1">run-name ({{ t('tools.githubActions.optional') }})</label>
                    <input v-model="config.runName" type="text" placeholder="${{ github.actor }} run" class="w-full px-2.5 py-1.5 font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                  </div>
                </div>

                <!-- 并发控制 -->
                <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="inline-flex items-center gap-2 font-semibold text-zinc-800 dark:text-zinc-100 cursor-pointer">
                      <input v-model="config.concurrency.enabled" type="checkbox" class="rounded text-blue-600" />
                      <span>concurrency ({{ t('tools.githubActions.concurrencyTitle') }})</span>
                    </label>
                    <label v-if="config.concurrency.enabled" class="inline-flex items-center gap-1.5 text-zinc-600 dark:text-zinc-300 cursor-pointer">
                      <input v-model="config.concurrency.cancelInProgress" type="checkbox" class="rounded text-blue-600" />
                      <span>cancel-in-progress</span>
                    </label>
                  </div>
                  <input
                    v-if="config.concurrency.enabled"
                    v-model="config.concurrency.group"
                    type="text"
                    placeholder="${{ github.workflow }}-${{ github.ref }}"
                    class="w-full px-2.5 py-1.5 font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                  />
                </div>

                <!-- GITHUB_TOKEN 权限 -->
                <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2.5">
                  <div class="flex flex-wrap items-center justify-between gap-2">
                    <span class="font-semibold text-zinc-800 dark:text-zinc-100">permissions (GITHUB_TOKEN)</span>
                    <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5">
                      <button
                        v-for="mode in (['default', 'read-all', 'write-all', 'custom'] as const)"
                        :key="mode"
                        type="button"
                        @click="config.permissionsPreset = mode"
                        class="px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer"
                        :class="config.permissionsPreset === mode ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500'"
                      >
                        {{ mode }}
                      </button>
                    </div>
                  </div>

                  <div v-if="config.permissionsPreset === 'custom'" class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <div
                      v-for="scope in PERMISSION_SCOPES"
                      :key="scope"
                      class="flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-700/50"
                    >
                      <span class="font-mono text-[11px] text-zinc-700 dark:text-zinc-300">{{ scope }}</span>
                      <div class="w-24">
                        <CustomSelect
                          :modelValue="config.permissions[scope]"
                          @update:modelValue="(val: PermissionAccess) => setPermissionScope(scope, val)"
                          :options="permissionAccessOptions"
                          size="sm"
                          align="right"
                          fullWidth
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <!-- 全局 env & defaults -->
                <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-2">
                  <div class="flex items-center justify-between">
                    <span class="font-semibold text-zinc-800 dark:text-zinc-100">{{ t('tools.githubActions.globalEnv') }}</span>
                    <button
                      type="button"
                      @click="config.env.push({ key: '', value: '' })"
                      class="inline-flex items-center gap-1 text-[11px] text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                    >
                      <Plus class="w-3 h-3" />
                      <span>{{ t('tools.githubActions.addEnv') }}</span>
                    </button>
                  </div>
                  <div v-for="(ev, idx) in config.env" :key="idx" class="flex items-center gap-2">
                    <input v-model="ev.key" type="text" placeholder="ENV_VAR" class="w-40 px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                    <input v-model="ev.value" type="text" placeholder="value" class="flex-1 px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                    <button type="button" @click="config.env.splice(idx, 1)" class="p-1 text-zinc-400 hover:text-rose-500 cursor-pointer">
                      <Trash2 class="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
                    <div>
                      <label class="block text-[11px] text-zinc-500 mb-1">defaults.run.shell</label>
                      <CustomSelect v-model="config.defaultsShell" :options="shellOptions" size="sm" fullWidth />
                    </div>
                    <div>
                      <label class="block text-[11px] text-zinc-500 mb-1">defaults.run.working-directory</label>
                      <input v-model="config.defaultsWorkingDirectory" type="text" placeholder="./app" class="w-full px-2 py-1 font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500" />
                    </div>
                  </div>
                </div>
              </div>
            </template>

            <!-- ==================== TAB 4: 常用 Actions 动作库 ==================== -->
            <template v-else-if="activeTab === 'catalog'">
              <div class="space-y-3">
                <div class="flex flex-wrap items-center gap-2">
                  <div class="relative flex-1 min-w-[180px]">
                    <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      v-model="catalogSearch"
                      type="text"
                      :placeholder="t('tools.githubActions.searchCatalog')"
                      class="w-full pl-8 pr-2.5 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 outline-none focus:border-blue-500"
                    />
                  </div>
                  <div class="inline-flex flex-wrap rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5">
                    <button
                      v-for="cat in (['all', 'vcs', 'setup', 'cache', 'docker', 'release', 'security'] as const)"
                      :key="cat"
                      type="button"
                      @click="catalogCategory = cat"
                      class="px-2 py-1 rounded text-[11px] font-medium cursor-pointer"
                      :class="catalogCategory === cat ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500'"
                    >
                      {{ t(`tools.githubActions.catalogCats.${cat}`) }}
                    </button>
                  </div>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div
                    v-for="item in filteredCatalog"
                    :key="item.id"
                    class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 flex flex-col justify-between gap-2 hover:border-blue-400/70 transition-colors"
                  >
                    <div>
                      <div class="flex items-center justify-between gap-2">
                        <span class="text-xs font-semibold font-mono text-zinc-800 dark:text-zinc-100 truncate">
                          {{ item.uses }}
                        </span>
                        <span class="px-1.5 py-0.5 rounded text-[10px] bg-zinc-200/70 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 uppercase shrink-0">
                          {{ item.category }}
                        </span>
                      </div>
                      <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
                        {{ isZh ? item.descZh : item.descEn }}
                      </p>
                    </div>
                    <button
                      type="button"
                      @click="addActionStep(item)"
                      class="w-full inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-white dark:bg-zinc-800 hover:bg-blue-600 hover:text-white border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                    >
                      <Plus class="w-3.5 h-3.5" />
                      <span>{{ t('tools.githubActions.addToJob', { job: selectedJob?.id || 'job' }) }}</span>
                    </button>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>

        <!-- 右侧：Pipeline 概览 + 实时 YAML + 静态校验 -->
        <div class="xl:col-span-5 flex flex-col min-h-0 gap-3">
          <!-- Pipeline DAG 概览条 -->
          <div class="px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs shrink-0">
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
                {{ t('tools.githubActions.pipelinePreview') }}
              </span>
              <span class="text-[11px] font-mono text-zinc-400">
                .github/workflows/{{ config.filename || 'ci.yml' }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-1.5">
              <template v-for="job in config.jobs" :key="job.uid">
                <button
                  type="button"
                  @click="selectedJobUid = job.uid; activeTab = 'jobs'"
                  class="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs border transition-all cursor-pointer"
                  :class="
                    selectedJob?.uid === job.uid
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'bg-zinc-50 dark:bg-zinc-800/70 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
                  "
                >
                  <span v-if="job.needs.length > 0" class="inline-flex items-center gap-0.5 text-[10px] text-zinc-400 font-mono">
                    {{ job.needs.join(',') }}
                    <ArrowRight class="w-2.5 h-2.5" />
                  </span>
                  <span class="font-mono">{{ job.id }}</span>
                </button>
              </template>
            </div>
          </div>

          <!-- 实时 YAML 输出 -->
          <div class="flex-1 flex flex-col min-h-[240px]">
            <TextEditorBox
              :modelValue="generatedYaml"
              :label="`.github/workflows/${config.filename || 'ci.yml'}`"
              :readonly="true"
              :showPaste="false"
              :showClear="false"
              :showLineNumbers="true"
              :showWrapToggle="true"
              :defaultWrap="false"
            >
              <template #actions>
                <label class="hidden sm:inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400 mr-1 cursor-pointer">
                  <input v-model="formatOptions.includeHeaderComment" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600" />
                  <span>{{ t('tools.githubActions.headerComment') }}</span>
                </label>
                <div class="w-24 mr-1">
                  <CustomSelect v-model="formatOptions.indentSize" :options="indentOptions" size="sm" align="right" fullWidth />
                </div>
              </template>
            </TextEditorBox>
          </div>

          <!-- 静态校验 Linter 面板 -->
          <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs shrink-0 overflow-hidden">
            <button
              type="button"
              @click="showDiagnostics = !showDiagnostics"
              class="w-full px-3 py-2 flex items-center justify-between text-xs font-medium bg-zinc-50/80 dark:bg-zinc-900/70 cursor-pointer"
            >
              <div class="flex items-center gap-2">
                <CheckCircle2 v-if="lintIssues.length === 0" class="w-4 h-4 text-emerald-500" />
                <AlertCircle v-else-if="lintErrorCount > 0" class="w-4 h-4 text-rose-500" />
                <AlertTriangle v-else class="w-4 h-4 text-amber-500" />
                <span>
                  {{
                    lintIssues.length === 0
                      ? t('tools.githubActions.lintClean')
                      : t('tools.githubActions.lintSummary', { errors: lintErrorCount, warnings: lintWarningCount })
                  }}
                </span>
              </div>
              <component :is="showDiagnostics ? ChevronDown : ChevronUp" class="w-4 h-4 text-zinc-400" />
            </button>

            <div v-if="showDiagnostics && lintIssues.length > 0" class="max-h-32 overflow-y-auto px-3 py-2 space-y-1.5 border-t border-zinc-100 dark:border-zinc-800 text-xs">
              <div
                v-for="(issue, idx) in lintIssues"
                :key="idx"
                class="flex items-start gap-2"
                :class="issue.level === 'error' ? 'text-rose-600 dark:text-rose-400' : 'text-amber-600 dark:text-amber-400'"
              >
                <component :is="issue.level === 'error' ? AlertCircle : AlertTriangle" class="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>
                  {{ t(`tools.githubActions.lint.${issue.code}`, { detail: issue.detail || '' }) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 导入 YAML 弹窗 -->
    <div
      v-if="showImportModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      @click.self="showImportModal = false"
    >
      <div class="w-full max-w-2xl rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xl overflow-hidden flex flex-col">
        <div class="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {{ t('tools.githubActions.importModalTitle') }}
          </h3>
          <button type="button" @click="showImportModal = false" class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer">
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-4 space-y-3">
          <div class="flex items-center justify-between">
            <p class="text-xs text-zinc-500 dark:text-zinc-400">
              {{ t('tools.githubActions.importModalDesc') }}
            </p>
            <input
              ref="importFileInputRef"
              type="file"
              accept=".yml,.yaml"
              class="hidden"
              @change="onImportFileSelected"
            />
            <button
              type="button"
              @click="importFileInputRef?.click()"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 cursor-pointer"
            >
              <Upload class="w-3.5 h-3.5" />
              <span>{{ t('tools.githubActions.chooseFile') }}</span>
            </button>
          </div>

          <textarea
            v-model="importYamlText"
            rows="12"
            spellcheck="false"
            placeholder="name: CI&#10;on: [push]&#10;jobs: ..."
            class="w-full p-3 font-mono text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 outline-none focus:border-blue-500"
          />

          <div v-if="importError" class="flex items-center gap-2 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ importError }}</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60">
          <button
            type="button"
            @click="showImportModal = false"
            class="px-3 py-1.5 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer"
          >
            {{ t('tools.githubActions.cancel') }}
          </button>
          <button
            type="button"
            @click="confirmImportYaml"
            class="px-3.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white cursor-pointer"
          >
            {{ t('tools.githubActions.confirmImport') }}
          </button>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
