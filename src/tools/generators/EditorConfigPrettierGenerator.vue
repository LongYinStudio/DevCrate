<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { strToU8, zipSync } from 'fflate';
import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle2,
  Eye,
  FileCode2,
  FileDown,
  Info,
  Package,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Upload,
  Wrench,
  X,
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import { downloadFile } from '../../utils/download';
import { COMMON_PRETTIER_PLUGINS, STYLE_PRESETS } from './editorConfigPrettierPresets';
import {
  auditStyleConfig,
  createStyleRuleId,
  generateEditorConfig,
  generatePrettierConfig,
  generatePrettierIgnore,
  getPrettierFilename,
  parseImportedStyleFile,
  renderLivePreviewSample,
  type PrettierOutputFormat,
  type StyleSyncConfig,
} from './editorConfigPrettierUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// ==================== 核心状态 ====================
const activePresetId = ref(STYLE_PRESETS[0].id);
const config = ref<StyleSyncConfig>(STYLE_PRESETS[0].build());

const leftTab = ref<'core' | 'overrides' | 'ignore'>('core');
const outputTab = ref<'editorconfig' | 'prettier' | 'prettierignore' | 'preview'>('editorconfig');
const showDiagnostics = ref(true);

const showImportModal = ref(false);
const importText = ref('');
const importError = ref('');
const importFileRef = ref<HTMLInputElement | null>(null);

const toastMessage = ref('');
const newIgnorePattern = ref('');
const customPluginInput = ref('');

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = '';
  }, 2600);
}

// ==================== 派生文本与审计 ====================
const editorConfigText = computed(() => generateEditorConfig(config.value));
const prettierText = computed(() => generatePrettierConfig(config.value));
const prettierIgnoreText = computed(() => generatePrettierIgnore(config.value));
const livePreviewText = computed(() => renderLivePreviewSample(config.value));
const prettierFilename = computed(() => getPrettierFilename(config.value.prettierFormat));

const activeOutputContent = computed(() => {
  if (outputTab.value === 'editorconfig') return editorConfigText.value;
  if (outputTab.value === 'prettier') return prettierText.value;
  if (outputTab.value === 'prettierignore') return prettierIgnoreText.value;
  return livePreviewText.value;
});

const activeOutputLabel = computed(() => {
  if (outputTab.value === 'editorconfig') return '.editorconfig';
  if (outputTab.value === 'prettier') return prettierFilename.value;
  if (outputTab.value === 'prettierignore') return '.prettierignore';
  return isZh.value ? '格式化效果实时预览 (example.ts)' : 'Live Formatted Preview (example.ts)';
});

const auditIssues = computed(() => auditStyleConfig(config.value));
const errorCount = computed(() => auditIssues.value.filter((i) => i.level === 'error').length);
const warningCount = computed(() => auditIssues.value.filter((i) => i.level === 'warning').length);

// ==================== 下拉选项 ====================
const indentSizeOptions: SelectOption[] = [
  { label: '2', value: 2 },
  { label: '4', value: 4 },
  { label: '8', value: 8 },
];

const eolOptions = computed<SelectOption[]>(() => [
  { label: 'LF (\\n · Linux / macOS)', value: 'lf' },
  { label: 'CRLF (\\r\\n · Windows)', value: 'crlf' },
  { label: isZh.value ? 'Auto (随系统换行)' : 'Auto (preserve)', value: 'auto' },
  { label: 'CR (\\r · Legacy)', value: 'cr' },
]);

const charsetOptions: SelectOption[] = [
  { label: 'utf-8', value: 'utf-8' },
  { label: 'utf-8-bom', value: 'utf-8-bom' },
  { label: 'latin1', value: 'latin1' },
];

const trailingCommaOptions = computed<SelectOption[]>(() => [
  { label: isZh.value ? 'all (全部合法位置加尾逗号)' : 'all (everywhere possible)', value: 'all' },
  { label: isZh.value ? 'es5 (对象与数组加尾逗号)' : 'es5 (objects & arrays)', value: 'es5' },
  { label: isZh.value ? 'none (不加尾逗号)' : 'none (disabled)', value: 'none' },
]);

const arrowParensOptions = computed<SelectOption[]>(() => [
  { label: 'always — (x) => x', value: 'always' },
  { label: 'avoid — x => x', value: 'avoid' },
]);

const proseWrapOptions = computed<SelectOption[]>(() => [
  { label: isZh.value ? 'preserve (保留原折行)' : 'preserve', value: 'preserve' },
  { label: isZh.value ? 'always (按 printWidth 折行)' : 'always', value: 'always' },
  { label: isZh.value ? 'never (强制不折行)' : 'never', value: 'never' },
]);

const htmlWhitespaceOptions: SelectOption[] = [
  { label: 'css', value: 'css' },
  { label: 'strict', value: 'strict' },
  { label: 'ignore', value: 'ignore' },
];

const prettierFormatOptions: { id: PrettierOutputFormat; label: string }[] = [
  { id: 'json', label: '.prettierrc.json' },
  { id: 'yaml', label: '.prettierrc.yaml' },
  { id: 'mjs', label: 'prettier.config.mjs' },
];

// ==================== 操作函数 ====================
function applyPreset(presetId: string) {
  const found = STYLE_PRESETS.find((p) => p.id === presetId);
  if (!found) return;
  activePresetId.value = presetId;
  config.value = found.build();
}

function handleReset() {
  applyPreset(activePresetId.value);
}

function addEditorConfigOverride() {
  config.value.editorConfigOverrides.push({
    id: createStyleRuleId('ec'),
    enabled: true,
    glob: '*.py',
    indentStyle: 'space',
    indentSize: 4,
  });
}

function removeEditorConfigOverride(index: number) {
  config.value.editorConfigOverrides.splice(index, 1);
}

function addPrettierOverride() {
  config.value.prettierOverrides.push({
    id: createStyleRuleId('pr'),
    enabled: true,
    files: '*.md',
    tabWidth: 2,
    proseWrap: 'preserve',
  });
}

function removePrettierOverride(index: number) {
  config.value.prettierOverrides.splice(index, 1);
}

function togglePlugin(pluginName: string) {
  const idx = config.value.plugins.indexOf(pluginName);
  if (idx >= 0) {
    config.value.plugins.splice(idx, 1);
  } else {
    config.value.plugins.push(pluginName);
  }
}

function addCustomPlugin() {
  const name = customPluginInput.value.trim();
  if (!name) return;
  if (!config.value.plugins.includes(name)) {
    config.value.plugins.push(name);
  }
  customPluginInput.value = '';
}

function addIgnorePattern() {
  const line = newIgnorePattern.value.trim();
  if (!line) return;
  if (!config.value.prettierIgnoreLines.includes(line)) {
    config.value.prettierIgnoreLines.push(line);
  }
  newIgnorePattern.value = '';
}

function applyFix(fixable: 'fix-md-whitespace' | 'fix-makefile-tab' | 'fix-eol-lf') {
  if (fixable === 'fix-eol-lf') {
    config.value.endOfLine = 'lf';
  } else if (fixable === 'fix-md-whitespace') {
    const existing = config.value.editorConfigOverrides.find((o) => /\*\.md\b/i.test(o.glob));
    if (existing) {
      existing.enabled = true;
      existing.trimTrailingWhitespace = false;
    } else {
      config.value.editorConfigOverrides.push({
        id: createStyleRuleId('ec'),
        enabled: true,
        glob: '*.md',
        trimTrailingWhitespace: false,
      });
    }
  } else if (fixable === 'fix-makefile-tab') {
    const existing = config.value.editorConfigOverrides.find((o) => /makefile/i.test(o.glob));
    if (existing) {
      existing.enabled = true;
      existing.indentStyle = 'tab';
    } else {
      config.value.editorConfigOverrides.push({
        id: createStyleRuleId('ec'),
        enabled: true,
        glob: 'Makefile',
        indentStyle: 'tab',
      });
    }
  }
}

function downloadActiveFile() {
  if (outputTab.value === 'preview') {
    downloadFile(livePreviewText.value, 'example.ts', 'text/typescript;charset=utf-8');
    showToast(t('tools.editorConfigPrettier.downloadedToast', { filename: 'example.ts' }));
    return;
  }
  const filename =
    outputTab.value === 'editorconfig'
      ? '.editorconfig'
      : outputTab.value === 'prettier'
        ? prettierFilename.value
        : '.prettierignore';
  downloadFile(activeOutputContent.value, filename, 'text/plain;charset=utf-8');
  showToast(t('tools.editorConfigPrettier.downloadedToast', { filename }));
}

function downloadZipBundle() {
  const files: Record<string, Uint8Array> = {
    '.editorconfig': strToU8(editorConfigText.value),
    [prettierFilename.value]: strToU8(prettierText.value),
    '.prettierignore': strToU8(prettierIgnoreText.value),
  };
  const zipped = zipSync(files, { level: 6 });
  const blob = new Blob([zipped as Uint8Array<ArrayBuffer>], { type: 'application/zip' });
  downloadFile(blob, 'code-style-config.zip', 'application/zip');
  showToast(t('tools.editorConfigPrettier.downloadedZipToast'));
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
  importError.value = '';
  try {
    const { kind, patch } = parseImportedStyleFile(importText.value);
    config.value = { ...config.value, ...patch };
    showImportModal.value = false;
    showToast(t('tools.editorConfigPrettier.importedToast', { kind }));
  } catch (err: unknown) {
    importError.value = err instanceof Error ? err.message : String(err);
  }
}
</script>

<template>
  <ToolContainer
    toolId="editorconfig-prettier"
    nameKey="tools.editorConfigPrettier.name"
    descKey="tools.editorConfigPrettier.desc"
    :icon="SlidersHorizontal"
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
          <span>{{ t('tools.editorConfigPrettier.importBtn') }}</span>
        </button>

        <button
          type="button"
          @click="downloadActiveFile"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          <FileDown class="w-3.5 h-3.5 shrink-0" />
          <span>{{ t('tools.editorConfigPrettier.downloadSingleBtn', { name: outputTab === 'preview' ? 'example.ts' : activeOutputLabel }) }}</span>
        </button>

        <button
          type="button"
          @click="downloadZipBundle"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
        >
          <Package class="w-3.5 h-3.5 shrink-0" />
          <span>{{ t('tools.editorConfigPrettier.downloadZipBtn') }}</span>
        </button>

        <button
          type="button"
          @click="handleReset"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
          :title="t('common.reset')"
        >
          <RotateCcw class="w-3.5 h-3.5 shrink-0" />
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

    <!-- 预设与协同同步提示栏 -->
    <div class="flex flex-wrap items-center justify-between gap-2.5 shrink-0">
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1 mr-1 whitespace-nowrap">
          <Sparkles class="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{{ t('tools.editorConfigPrettier.presetsLabel') }}:</span>
        </span>
        <button
          v-for="preset in STYLE_PRESETS"
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

      <!-- Prettier 输出格式切换 -->
      <div class="inline-flex items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/70 text-xs">
        <button
          v-for="fmt in prettierFormatOptions"
          :key="fmt.id"
          type="button"
          @click="config.prettierFormat = fmt.id"
          class="px-2.5 py-1 rounded-lg font-mono text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap"
          :class="config.prettierFormat === fmt.id
            ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
        >
          {{ fmt.label }}
        </button>
      </div>
    </div>

    <!-- 主分栏工作区 -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-3.5 xl:flex-1 xl:min-h-0">
      <!-- 左侧配置项 -->
      <div class="xl:col-span-6 flex flex-col xl:min-h-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <!-- 左侧 Tab 栏 -->
        <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/70 flex flex-wrap items-center gap-1 shrink-0 select-none text-xs">
          <button
            v-for="tab in [
              { id: 'core', label: t('tools.editorConfigPrettier.tabCore'), icon: SlidersHorizontal },
              { id: 'overrides', label: t('tools.editorConfigPrettier.tabOverrides'), icon: FileCode2 },
              { id: 'ignore', label: t('tools.editorConfigPrettier.tabIgnore'), icon: Eye },
            ]"
            :key="tab.id"
            type="button"
            @click="leftTab = tab.id as any"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
            :class="leftTab === tab.id
              ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
          >
            <component :is="tab.icon" class="w-3.5 h-3.5 shrink-0" />
            <span>{{ tab.label }}</span>
          </button>
        </div>

        <!-- TAB 1: 核心协同规范 & Prettier 参数 -->
        <div v-if="leftTab === 'core'" class="xl:flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          <!-- 1. 协同核心项（同步写入两个配置文件） -->
          <div class="p-3.5 rounded-xl bg-blue-50/40 dark:bg-blue-950/15 border border-blue-200/70 dark:border-blue-900/40 space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-bold text-blue-900 dark:text-blue-200">
                {{ t('tools.editorConfigPrettier.sharedRulesTitle') }}
              </span>
              <span class="text-[11px] font-mono text-blue-600 dark:text-blue-400">
                .editorconfig ⇄ Prettier
              </span>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label class="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  {{ t('tools.editorConfigPrettier.indentStyle') }}
                </label>
                <div class="grid grid-cols-2 rounded-lg p-0.5 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700">
                  <button
                    type="button"
                    @click="config.indentStyle = 'space'"
                    class="py-1 rounded font-medium cursor-pointer transition-colors whitespace-nowrap"
                    :class="config.indentStyle === 'space' ? 'bg-blue-600 text-white shadow-2xs' : 'text-zinc-600 dark:text-zinc-400'"
                  >
                    Space
                  </button>
                  <button
                    type="button"
                    @click="config.indentStyle = 'tab'"
                    class="py-1 rounded font-medium cursor-pointer transition-colors whitespace-nowrap"
                    :class="config.indentStyle === 'tab' ? 'bg-blue-600 text-white shadow-2xs' : 'text-zinc-600 dark:text-zinc-400'"
                  >
                    Tab
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  {{ t('tools.editorConfigPrettier.indentSize') }}
                </label>
                <CustomSelect v-model="config.indentSize" :options="indentSizeOptions" size="sm" fullWidth />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  {{ t('tools.editorConfigPrettier.printWidth') }}
                </label>
                <input
                  v-model.number="config.printWidth"
                  type="number"
                  min="40"
                  max="240"
                  class="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">
                  {{ t('tools.editorConfigPrettier.endOfLine') }}
                </label>
                <CustomSelect v-model="config.endOfLine" :options="eolOptions" size="sm" fullWidth />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
              <label class="inline-flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input v-model="config.syncMaxLineLengthToEditorConfig" type="checkbox" class="rounded text-blue-600" />
                <span>{{ t('tools.editorConfigPrettier.syncMaxLineLength') }}</span>
              </label>

              <label class="inline-flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input v-model="config.insertFinalNewline" type="checkbox" class="rounded text-blue-600" />
                <span>insert_final_newline = true</span>
              </label>

              <label class="inline-flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input v-model="config.trimTrailingWhitespace" type="checkbox" class="rounded text-blue-600" />
                <span>trim_trailing_whitespace = true</span>
              </label>

              <label class="inline-flex items-center gap-2 cursor-pointer text-zinc-700 dark:text-zinc-300">
                <input v-model="config.root" type="checkbox" class="rounded text-blue-600" />
                <span>.editorconfig root = true</span>
              </label>
            </div>
          </div>

          <!-- 2. Prettier 语法与格式选项 -->
          <div class="space-y-3">
            <div class="font-bold text-zinc-800 dark:text-zinc-200">
              {{ t('tools.editorConfigPrettier.prettierOptionsTitle') }}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">trailingComma</label>
                <CustomSelect v-model="config.trailingComma" :options="trailingCommaOptions" size="sm" fullWidth />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">arrowParens</label>
                <CustomSelect v-model="config.arrowParens" :options="arrowParensOptions" size="sm" fullWidth />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">proseWrap (Markdown)</label>
                <CustomSelect v-model="config.proseWrap" :options="proseWrapOptions" size="sm" fullWidth />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">htmlWhitespaceSensitivity</label>
                <CustomSelect v-model="config.htmlWhitespaceSensitivity" :options="htmlWhitespaceOptions" size="sm" fullWidth />
              </div>

              <div>
                <label class="block text-[11px] font-medium text-zinc-500 mb-1">.editorconfig charset</label>
                <CustomSelect v-model="config.charset" :options="charsetOptions" size="sm" fullWidth />
              </div>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
              <label class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <span><strong class="font-mono">semi</strong> · {{ t('tools.editorConfigPrettier.optSemi') }}</span>
                <input v-model="config.semi" type="checkbox" class="rounded text-blue-600" />
              </label>

              <label class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <span><strong class="font-mono">singleQuote</strong> · {{ t('tools.editorConfigPrettier.optSingleQuote') }}</span>
                <input v-model="config.singleQuote" type="checkbox" class="rounded text-blue-600" />
              </label>

              <label class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <span><strong class="font-mono">jsxSingleQuote</strong> · {{ t('tools.editorConfigPrettier.optJsxSingleQuote') }}</span>
                <input v-model="config.jsxSingleQuote" type="checkbox" class="rounded text-blue-600" />
              </label>

              <label class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <span><strong class="font-mono">bracketSpacing</strong> · <code class="text-[11px]">{ a }</code></span>
                <input v-model="config.bracketSpacing" type="checkbox" class="rounded text-blue-600" />
              </label>

              <label class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <span><strong class="font-mono">bracketSameLine</strong> · JSX <code class="text-[11px]">&gt;</code></span>
                <input v-model="config.bracketSameLine" type="checkbox" class="rounded text-blue-600" />
              </label>

              <label class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <span><strong class="font-mono">singleAttributePerLine</strong></span>
                <input v-model="config.singleAttributePerLine" type="checkbox" class="rounded text-blue-600" />
              </label>

              <label class="flex items-center justify-between p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 cursor-pointer">
                <span><strong class="font-mono">vueIndentScriptAndStyle</strong></span>
                <input v-model="config.vueIndentScriptAndStyle" type="checkbox" class="rounded text-blue-600" />
              </label>
            </div>
          </div>

          <!-- 3. 常用 Prettier 插件 -->
          <div class="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
            <div class="font-bold text-zinc-800 dark:text-zinc-200">
              {{ t('tools.editorConfigPrettier.pluginsTitle') }}
            </div>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="plg in COMMON_PRETTIER_PLUGINS"
                :key="plg"
                type="button"
                @click="togglePlugin(plg)"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer whitespace-nowrap"
                :class="config.plugins.includes(plg)
                  ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300 font-semibold'
                  : 'bg-zinc-50 dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-blue-400'"
              >
                <Check v-if="config.plugins.includes(plg)" class="w-3 h-3 shrink-0" />
                <span>{{ plg }}</span>
              </button>
            </div>
            <div class="flex items-center gap-2 pt-1">
              <input
                v-model="customPluginInput"
                type="text"
                @keydown.enter="addCustomPlugin"
                :placeholder="t('tools.editorConfigPrettier.customPluginPlaceholder')"
                class="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                @click="addCustomPlugin"
                class="px-2.5 py-1.5 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium cursor-pointer whitespace-nowrap"
              >
                {{ t('tools.editorConfigPrettier.addBtn') }}
              </button>
            </div>
          </div>
        </div>

        <!-- TAB 2: 分文件例外规则 (.editorconfig + Prettier overrides) -->
        <div v-else-if="leftTab === 'overrides'" class="xl:flex-1 overflow-y-auto p-4 space-y-5 text-xs">
          <!-- .editorconfig 例外 -->
          <div class="space-y-2.5">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-bold text-zinc-800 dark:text-zinc-200">
                .editorconfig [glob] {{ t('tools.editorConfigPrettier.overridesLabel') }}
              </span>
              <button
                type="button"
                @click="addEditorConfigOverride"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 hover:bg-blue-100 cursor-pointer whitespace-nowrap"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ t('tools.editorConfigPrettier.addOverrideBtn') }}</span>
              </button>
            </div>

            <div
              v-for="(ov, idx) in config.editorConfigOverrides"
              :key="ov.id"
              class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 space-y-2.5"
              :class="{ 'opacity-55': !ov.enabled }"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <input v-model="ov.enabled" type="checkbox" class="rounded text-blue-600 shrink-0" />
                  <input
                    v-model="ov.glob"
                    type="text"
                    placeholder="*.md / Makefile / *.{py,rs}"
                    class="flex-1 min-w-0 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs"
                  />
                </div>
                <button
                  type="button"
                  @click="removeEditorConfigOverride(idx)"
                  class="p-1 text-zinc-400 hover:text-rose-500 rounded cursor-pointer shrink-0"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-0.5">indent_style</label>
                  <select
                    :value="ov.indentStyle || ''"
                    @change="ov.indentStyle = (($event.target as HTMLSelectElement).value as any) || undefined"
                    class="w-full px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="">{{ t('tools.editorConfigPrettier.inherit') }}</option>
                    <option value="space">space</option>
                    <option value="tab">tab</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] text-zinc-400 mb-0.5">indent_size</label>
                  <input
                    :value="ov.indentSize ?? ''"
                    @input="ov.indentSize = ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined"
                    type="number"
                    min="1"
                    max="16"
                    :placeholder="t('tools.editorConfigPrettier.inherit')"
                    class="w-full px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs"
                  />
                </div>

                <div>
                  <label class="block text-[10px] text-zinc-400 mb-0.5">trim_trailing_whitespace</label>
                  <select
                    :value="ov.trimTrailingWhitespace === undefined ? '' : String(ov.trimTrailingWhitespace)"
                    @change="ov.trimTrailingWhitespace = ($event.target as HTMLSelectElement).value === '' ? undefined : ($event.target as HTMLSelectElement).value === 'true'"
                    class="w-full px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="">{{ t('tools.editorConfigPrettier.inherit') }}</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- Prettier overrides -->
          <div class="space-y-2.5 pt-3 border-t border-zinc-100 dark:border-zinc-800">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-bold text-zinc-800 dark:text-zinc-200">
                Prettier overrides[] {{ t('tools.editorConfigPrettier.overridesLabel') }}
              </span>
              <button
                type="button"
                @click="addPrettierOverride"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/60 hover:bg-purple-100 cursor-pointer whitespace-nowrap"
              >
                <Plus class="w-3.5 h-3.5" />
                <span>{{ t('tools.editorConfigPrettier.addOverrideBtn') }}</span>
              </button>
            </div>

            <div
              v-if="config.prettierOverrides.length === 0"
              class="p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 text-center text-zinc-400"
            >
              {{ t('tools.editorConfigPrettier.noPrettierOverrides') }}
            </div>

            <div
              v-for="(po, idx) in config.prettierOverrides"
              :key="po.id"
              class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/30 space-y-2.5"
              :class="{ 'opacity-55': !po.enabled }"
            >
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 flex-1 min-w-0">
                  <input v-model="po.enabled" type="checkbox" class="rounded text-purple-600 shrink-0" />
                  <input
                    v-model="po.files"
                    type="text"
                    placeholder="*.md, *.mdx"
                    class="flex-1 min-w-0 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs"
                  />
                </div>
                <button
                  type="button"
                  @click="removePrettierOverride(idx)"
                  class="p-1 text-zinc-400 hover:text-rose-500 rounded cursor-pointer shrink-0"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <label class="block text-[10px] text-zinc-400 mb-0.5">tabWidth</label>
                  <input
                    :value="po.tabWidth ?? ''"
                    @input="po.tabWidth = ($event.target as HTMLInputElement).value ? Number(($event.target as HTMLInputElement).value) : undefined"
                    type="number"
                    min="1"
                    max="16"
                    :placeholder="t('tools.editorConfigPrettier.inherit')"
                    class="w-full px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 font-mono text-xs"
                  />
                </div>

                <div>
                  <label class="block text-[10px] text-zinc-400 mb-0.5">singleQuote</label>
                  <select
                    :value="po.singleQuote === undefined ? '' : String(po.singleQuote)"
                    @change="po.singleQuote = ($event.target as HTMLSelectElement).value === '' ? undefined : ($event.target as HTMLSelectElement).value === 'true'"
                    class="w-full px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="">{{ t('tools.editorConfigPrettier.inherit') }}</option>
                    <option value="true">true</option>
                    <option value="false">false</option>
                  </select>
                </div>

                <div>
                  <label class="block text-[10px] text-zinc-400 mb-0.5">proseWrap</label>
                  <select
                    :value="po.proseWrap || ''"
                    @change="po.proseWrap = (($event.target as HTMLSelectElement).value as any) || undefined"
                    class="w-full px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs"
                  >
                    <option value="">{{ t('tools.editorConfigPrettier.inherit') }}</option>
                    <option value="preserve">preserve</option>
                    <option value="always">always</option>
                    <option value="never">never</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- TAB 3: .prettierignore 管理 -->
        <div v-else class="xl:flex-1 overflow-y-auto p-4 space-y-3 text-xs">
          <div class="flex items-center gap-2">
            <input
              v-model="newIgnorePattern"
              type="text"
              @keydown.enter="addIgnorePattern"
              :placeholder="t('tools.editorConfigPrettier.ignorePlaceholder')"
              class="flex-1 min-w-0 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 font-mono"
            />
            <button
              type="button"
              @click="addIgnorePattern"
              class="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer whitespace-nowrap"
            >
              {{ t('tools.editorConfigPrettier.addBtn') }}
            </button>
          </div>

          <div class="flex flex-wrap gap-1.5">
            <span
              v-for="(line, idx) in config.prettierIgnoreLines"
              :key="line + idx"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 font-mono text-[11px] text-zinc-700 dark:text-zinc-200"
            >
              <span>{{ line }}</span>
              <button
                type="button"
                @click="config.prettierIgnoreLines.splice(idx, 1)"
                class="text-zinc-400 hover:text-rose-500 cursor-pointer"
              >
                <X class="w-3 h-3" />
              </button>
            </span>
          </div>
        </div>
      </div>

      <!-- 右侧：三件套文件预览 + 格式化效果示例 + 冲突审计 -->
      <div class="xl:col-span-6 flex flex-col gap-3 xl:min-h-0">
        <div class="flex-1 flex flex-col min-h-[280px]">
          <TextEditorBox
            :modelValue="activeOutputContent"
            :label="activeOutputLabel"
            :readonly="true"
            :showPaste="false"
            :showClear="false"
            :showLineNumbers="true"
            :showWrapToggle="true"
            :defaultWrap="false"
          >
            <template #actions>
              <div class="inline-flex flex-wrap rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80 mr-1">
                <button
                  v-for="tab in [
                    { id: 'editorconfig', label: '.editorconfig' },
                    { id: 'prettier', label: prettierFilename },
                    { id: 'prettierignore', label: '.prettierignore' },
                    { id: 'preview', label: t('tools.editorConfigPrettier.previewTab') },
                  ]"
                  :key="tab.id"
                  type="button"
                  @click="outputTab = tab.id as any"
                  class="px-2 py-0.5 rounded text-[11px] font-medium cursor-pointer transition-colors whitespace-nowrap"
                  :class="outputTab === tab.id ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-zinc-500'"
                >
                  {{ tab.label }}
                </button>
              </div>
            </template>
          </TextEditorBox>
        </div>

        <!-- 协同一致性与冲突检查面板 -->
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
                {{ auditIssues.length === 0 ? t('tools.editorConfigPrettier.lintPassed') : t('tools.editorConfigPrettier.lintCount', { count: auditIssues.length }) }}
              </span>
            </div>
            <span class="text-[11px] text-zinc-400 shrink-0">
              {{ showDiagnostics ? (isZh ? '收起' : 'Hide') : (isZh ? '展开' : 'Show') }}
            </span>
          </button>

          <div
            v-if="showDiagnostics && auditIssues.length > 0"
            class="max-h-36 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 border-t border-zinc-100 dark:border-zinc-800"
          >
            <div
              v-for="(issue, idx) in auditIssues"
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

    <!-- 导入现有配置弹窗 -->
    <div
      v-if="showImportModal"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
      @click.self="showImportModal = false"
    >
      <div class="w-full max-w-xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden flex flex-col">
        <div class="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
          <span class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {{ t('tools.editorConfigPrettier.importModalTitle') }}
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
            <input ref="importFileRef" type="file" accept=".editorconfig,.prettierrc,.json,.txt" class="hidden" @change="onImportFileSelected" />
            <button
              type="button"
              @click="importFileRef?.click()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 cursor-pointer"
            >
              <Upload class="w-3.5 h-3.5" />
              <span>{{ t('tools.editorConfigPrettier.chooseFile') }}</span>
            </button>
            <span class="text-[11px] text-zinc-400">{{ t('tools.editorConfigPrettier.importHint') }}</span>
          </div>

          <textarea
            v-model="importText"
            rows="10"
            placeholder="Paste .editorconfig or .prettierrc.json content here..."
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
            {{ t('tools.editorConfigPrettier.cancel') }}
          </button>
          <button
            type="button"
            @click="confirmImport"
            class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium cursor-pointer"
          >
            {{ t('tools.editorConfigPrettier.confirmImport') }}
          </button>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
