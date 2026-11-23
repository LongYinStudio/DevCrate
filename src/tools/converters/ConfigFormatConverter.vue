<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  FileSliders,
  ArrowLeftRight,
  Upload,
  FileDown,
  Check,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  LocateFixed,
  Columns2,
  Rows2,
  Trash2,
  Sparkles,
  ArrowRight
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import JsonTreeView from '../formatters/components/JsonTreeView.vue';
import { downloadFile } from '../../utils/download';
import {
  CONFIG_FORMATS,
  CONFIG_SAMPLES,
  DEFAULT_CONVERT_OPTIONS,
  convertConfig,
  detectFormatFromFilename,
  type ConfigFormat,
  type InputFormatChoice,
  type ConfigConvertOptions
} from './configConverterUtils';

const { t, locale } = useI18n();

const inputText = ref('');
const filenameHint = ref<string | undefined>(undefined);
const sourceFormat = ref<InputFormatChoice>('auto');
const targetFormat = ref<ConfigFormat>('yaml');
const options = reactive<ConfigConvertOptions>({ ...DEFAULT_CONVERT_OPTIONS });

const viewMode = ref<'code' | 'tree'>('code');
const layoutMode = ref<'split' | 'stack'>('split');
const isDragging = ref(false);
const isDownloaded = ref(false);

const fileInputRef = ref<HTMLInputElement | null>(null);
const inputEditorRef = ref<InstanceType<typeof TextEditorBox> | null>(null);

// 默认加载第一个示例或保持空白？DevCrate 转换器默认空白并有示例预设按钮，方便粘贴即用
const convertResult = computed(() => {
  return convertConfig(
    inputText.value,
    sourceFormat.value,
    targetFormat.value,
    { ...options },
    filenameHint.value
  );
});

const detectedMeta = computed(() => {
  return CONFIG_FORMATS.find(f => f.id === convertResult.value.detectedFormat) || CONFIG_FORMATS[0];
});

const targetMeta = computed(() => {
  return CONFIG_FORMATS.find(f => f.id === targetFormat.value) || CONFIG_FORMATS[0];
});

const sourceOptions = computed<SelectOption[]>(() => [
  { label: t('tools.configFormatConverter.autoDetect'), value: 'auto' },
  ...CONFIG_FORMATS.map(f => ({ label: f.label, value: f.id }))
]);

const indentOptions = computed<SelectOption[]>(() => [
  { label: t('tools.configFormatConverter.indent2'), value: '2' },
  { label: t('tools.configFormatConverter.indent4'), value: '4' },
  { label: t('tools.configFormatConverter.indentTab'), value: 'tab' }
]);

const delimiterOptions = computed<SelectOption[]>(() => [
  { label: t('tools.configFormatConverter.delimDot'), value: '.' },
  { label: t('tools.configFormatConverter.delimUnderscore'), value: '_' },
  { label: t('tools.configFormatConverter.delimDoubleUnderscore'), value: '__' }
]);

const sampleOptions = computed<SelectOption[]>(() =>
  CONFIG_SAMPLES.map(s => ({
    label: t(`tools.configFormatConverter.samples.${s.id}`),
    value: s.id
  }))
);

const selectedSample = ref('');

const outputStats = computed(() => {
  const text = convertResult.value.output || '';
  const lines = text ? text.split('\n').length : 0;
  const kb = (new Blob([text]).size / 1024).toFixed(1);
  return { lines, kb };
});

const showSourceTypeInferOption = computed(() => {
  const fmt = convertResult.value.detectedFormat;
  return fmt === 'xml' || fmt === 'ini' || fmt === 'env' || fmt === 'properties';
});

const showSourceUnflattenOption = computed(() => {
  const fmt = convertResult.value.detectedFormat;
  return fmt === 'ini' || fmt === 'env' || fmt === 'properties';
});

function handleSampleSelect(sampleId: string) {
  const preset = CONFIG_SAMPLES.find(s => s.id === sampleId);
  if (!preset) return;
  filenameHint.value = undefined;
  sourceFormat.value = 'auto';
  inputText.value = preset.content;
  // 若目标格式与示例相同，自动切换到另一种常用格式以展示转换结果
  if (targetFormat.value === preset.format) {
    targetFormat.value = preset.format === 'json' ? 'yaml' : 'json';
  }
  selectedSample.value = '';
}

function loadDefaultSample() {
  handleSampleSelect('appYaml');
}

function handleSwap() {
  if (!convertResult.value.ok || !convertResult.value.output) return;
  const prevSource = convertResult.value.detectedFormat;
  const prevTarget = targetFormat.value;
  const nextInput = convertResult.value.output;

  filenameHint.value = undefined;
  sourceFormat.value = prevTarget;
  targetFormat.value = prevSource;
  inputText.value = nextInput;
}

function handleClearAll() {
  inputText.value = '';
  filenameHint.value = undefined;
  viewMode.value = 'code';
}

function triggerFileImport() {
  fileInputRef.value?.click();
}

function readConfigFile(file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    const content = typeof reader.result === 'string' ? reader.result : '';
    filenameHint.value = file.name;
    const guessed = detectFormatFromFilename(file.name);
    if (guessed) {
      sourceFormat.value = 'auto';
      if (targetFormat.value === guessed) {
        targetFormat.value = guessed === 'json' ? 'yaml' : 'json';
      }
    }
    inputText.value = content;
  };
  reader.readAsText(file, 'utf-8');
}

function onFileSelected(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    readConfigFile(file);
  }
  input.value = '';
}

function onDropFile(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    readConfigFile(file);
  }
}

function handleDownloadOutput() {
  if (!convertResult.value.ok || !convertResult.value.output) return;
  downloadFile(
    convertResult.value.output,
    targetMeta.value.defaultFilename,
    targetMeta.value.mimeType
  );
  isDownloaded.value = true;
  setTimeout(() => {
    isDownloaded.value = false;
  }, 1600);
}

function jumpToErrorLine() {
  const line = convertResult.value.error?.line;
  if (line && inputEditorRef.value) {
    inputEditorRef.value.scrollToLine(line);
  }
}

watch(
  () => convertResult.value.ok,
  ok => {
    if (!ok && viewMode.value === 'tree') {
      viewMode.value = 'code';
    }
  }
);
</script>

<template>
  <ToolContainer
    toolId="config-format-converter"
    nameKey="tools.configFormatConverter.name"
    descKey="tools.configFormatConverter.desc"
    :icon="FileSliders"
    :wide="true"
    :fullHeight="true"
  >
    <!-- 顶部格式选择与操作栏 -->
    <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-2.5 shrink-0 select-none">
      <!-- 第一行：源格式 ⇄ 目标格式 + 示例/清空 -->
      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <div class="flex flex-wrap items-center gap-2">
          <!-- 源格式 -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {{ t('tools.configFormatConverter.sourceFormat') }}
            </span>
            <div class="w-32">
              <CustomSelect
                v-model="sourceFormat"
                :options="sourceOptions"
                size="sm"
                fullWidth
              />
            </div>
            <span
              v-if="sourceFormat === 'auto' && inputText.trim()"
              class="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/70 dark:border-blue-800/50"
            >
              {{ t('tools.configFormatConverter.detectedBadge', { format: detectedMeta.label }) }}
            </span>
          </div>

          <!-- 互换按钮 -->
          <button
            type="button"
            @click="handleSwap"
            :disabled="!convertResult.ok || !convertResult.output"
            class="inline-flex items-center justify-center w-8 h-7 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            :title="t('tools.configFormatConverter.swap')"
          >
            <ArrowLeftRight class="w-3.5 h-3.5" />
          </button>

          <!-- 目标格式 Segmented Control -->
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {{ t('tools.configFormatConverter.targetFormat') }}
            </span>
            <div class="inline-flex flex-wrap rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
              <button
                v-for="fmt in CONFIG_FORMATS"
                :key="fmt.id"
                type="button"
                @click="targetFormat = fmt.id"
                class="px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
                :class="targetFormat === fmt.id
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
              >
                {{ fmt.label }}
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧：示例预设与清空 -->
        <div class="flex items-center gap-1.5">
          <div class="w-40">
            <CustomSelect
              v-model="selectedSample"
              :options="sampleOptions"
              :placeholder="t('tools.configFormatConverter.loadPreset')"
              align="right"
              size="sm"
              fullWidth
              @change="handleSampleSelect"
            />
          </div>

          <button
            type="button"
            @click="loadDefaultSample"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span class="hidden sm:inline">{{ t('common.loadSample') }}</span>
          </button>

          <button
            type="button"
            @click="handleClearAll"
            :disabled="!inputText"
            class="inline-flex items-center justify-center w-8 h-7 rounded-lg text-xs font-medium text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            :title="t('common.clear')"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- 第二行：上下文自适应选项栏 -->
      <div class="pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-zinc-600 dark:text-zinc-300">
        <!-- 缩进（JSON / YAML / XML 有效） -->
        <div class="flex items-center gap-1.5">
          <span class="text-zinc-500 dark:text-zinc-400">{{ t('tools.configFormatConverter.indentation') }}:</span>
          <CustomSelect
            v-model="options.indent"
            :options="indentOptions"
            size="sm"
          />
        </div>

        <!-- 键名排序 -->
        <label class="inline-flex items-center gap-1.5 cursor-pointer">
          <input
            v-model="options.sortKeys"
            type="checkbox"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>{{ t('tools.configFormatConverter.sortKeys') }}</span>
        </label>

        <!-- 源格式特定解析选项 -->
        <label
          v-if="convertResult.detectedFormat === 'json'"
          class="inline-flex items-center gap-1.5 cursor-pointer"
        >
          <input
            v-model="options.tolerantJson"
            type="checkbox"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>{{ t('tools.configFormatConverter.tolerantJson') }}</span>
        </label>

        <label
          v-if="showSourceTypeInferOption"
          class="inline-flex items-center gap-1.5 cursor-pointer"
        >
          <input
            v-model="options.inferTypes"
            type="checkbox"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>{{ t('tools.configFormatConverter.inferTypes') }}</span>
        </label>

        <div v-if="showSourceUnflattenOption" class="flex items-center gap-2">
          <label class="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              v-model="options.unflattenKeys"
              type="checkbox"
              class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>{{ t('tools.configFormatConverter.unflattenKeys') }}</span>
          </label>

          <CustomSelect
            v-if="options.unflattenKeys && convertResult.detectedFormat === 'env'"
            v-model="options.unflattenDelimiter"
            :options="delimiterOptions"
            size="sm"
          />
        </div>

        <div class="h-3.5 w-px bg-zinc-200 dark:bg-zinc-800 hidden sm:block"></div>

        <!-- 目标格式特定序列化选项 -->
        <label
          v-if="targetFormat === 'json'"
          class="inline-flex items-center gap-1.5 cursor-pointer"
        >
          <input
            v-model="options.jsonMinify"
            type="checkbox"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>{{ t('tools.configFormatConverter.jsonMinify') }}</span>
        </label>

        <label
          v-if="targetFormat === 'yaml'"
          class="inline-flex items-center gap-1.5 cursor-pointer"
        >
          <input
            v-model="options.yamlFlowArrays"
            type="checkbox"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>{{ t('tools.configFormatConverter.yamlFlowArrays') }}</span>
        </label>

        <template v-if="targetFormat === 'xml'">
          <div class="flex items-center gap-1.5">
            <span class="text-zinc-500 dark:text-zinc-400">{{ t('tools.configFormatConverter.xmlRootTag') }}:</span>
            <input
              v-model="options.xmlRootTag"
              type="text"
              placeholder="config"
              class="w-24 px-2 py-0.5 text-xs font-mono rounded-md border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none focus:border-blue-500"
            />
          </div>
          <label class="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              v-model="options.xmlDeclaration"
              type="checkbox"
              class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>{{ t('tools.configFormatConverter.xmlDeclaration') }}</span>
          </label>
        </template>

        <template v-if="targetFormat === 'env'">
          <label class="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              v-model="options.envUppercaseKeys"
              type="checkbox"
              class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>{{ t('tools.configFormatConverter.envUppercaseKeys') }}</span>
          </label>
          <div class="flex items-center gap-1.5">
            <span class="text-zinc-500 dark:text-zinc-400">{{ t('tools.configFormatConverter.envDelimiter') }}:</span>
            <CustomSelect
              v-model="options.envDelimiter"
              :options="delimiterOptions"
              size="sm"
            />
          </div>
        </template>
      </div>
    </div>

    <!-- 错误或状态反馈条 -->
    <div
      v-if="!convertResult.ok && convertResult.error"
      class="flex items-center justify-between gap-2 px-3.5 py-2 rounded-lg text-xs shrink-0 bg-rose-50/90 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/50"
    >
      <div class="flex items-center gap-2 min-w-0">
        <AlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
        <span class="truncate">
          <span v-if="convertResult.error.line" class="font-semibold text-rose-600 dark:text-rose-400 mr-1">
            {{ locale.startsWith('zh')
              ? `第 ${convertResult.error.line} 行${convertResult.error.column ? ` 第 ${convertResult.error.column} 列` : ''}:`
              : `Line ${convertResult.error.line}${convertResult.error.column ? ` Col ${convertResult.error.column}` : ''}:` }}
          </span>
          <span>{{ convertResult.error.message }}</span>
        </span>
      </div>

      <button
        v-if="convertResult.error.line"
        type="button"
        @click="jumpToErrorLine"
        class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-zinc-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100/50 dark:hover:bg-rose-900/40 transition-colors cursor-pointer shrink-0"
      >
        <LocateFixed class="w-3 h-3" />
        <span>{{ t('tools.configFormatConverter.jumpToError') }}</span>
      </button>
    </div>

    <div
      v-else-if="inputText.trim()"
      class="flex flex-wrap items-center justify-between gap-2 px-3.5 py-1.5 rounded-lg text-xs shrink-0 bg-emerald-50/90 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50 select-none"
    >
      <div class="flex items-center gap-2 flex-wrap">
        <CheckCircle2 class="w-4 h-4 text-emerald-500 shrink-0" />
        <span class="font-medium inline-flex items-center gap-1.5">
          <span>{{ detectedMeta.label }}</span>
          <ArrowRight class="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
          <span>{{ targetMeta.label }}</span>
        </span>
        <span class="text-zinc-500 dark:text-zinc-400 font-normal">
          · {{ t('tools.configFormatConverter.statsKeys', { count: convertResult.stats.keys }) }}
          · {{ t('tools.configFormatConverter.statsDepth', { count: convertResult.stats.depth }) }}
          · {{ outputStats.lines }} {{ t('common.lines') }} ({{ outputStats.kb }} KB)
        </span>
      </div>

      <div
        v-if="convertResult.warnings.length > 0"
        class="flex items-center gap-1.5 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-100/70 dark:bg-amber-950/50 px-2 py-0.5 rounded border border-amber-200/70 dark:border-amber-800/50"
      >
        <AlertTriangle class="w-3.5 h-3.5 shrink-0" />
        <span>{{ convertResult.warnings.map(w => t(`tools.configFormatConverter.warnings.${w}`)).join(' · ') }}</span>
      </div>
    </div>

    <!-- 主双栏工作区 -->
    <div
      class="lg:flex-1 lg:min-h-0 w-full"
      :class="layoutMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-3.5' : 'flex flex-col gap-3.5'"
    >
      <!-- 左侧：输入区（支持文件拖拽导入） -->
      <div
        class="relative lg:flex-1 flex flex-col min-h-[240px]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="onDropFile"
      >
        <input
          ref="fileInputRef"
          type="file"
          accept=".json,.jsonc,.yaml,.yml,.toml,.xml,.ini,.cfg,.conf,.env,.properties,.txt"
          class="hidden"
          @change="onFileSelected"
        />

        <TextEditorBox
          ref="inputEditorRef"
          v-model="inputText"
          :label="`${t('common.input')} (${detectedMeta.label})`"
          :placeholder="t('tools.configFormatConverter.inputPlaceholder')"
          :showLineNumbers="true"
          :showWrapToggle="true"
          :defaultWrap="false"
          @clear="handleClearAll"
        >
          <template #actions>
            <button
              type="button"
              @click="triggerFileImport"
              class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              :title="t('tools.configFormatConverter.importFile')"
            >
              <Upload class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">{{ t('tools.configFormatConverter.importFile') }}</span>
            </button>
          </template>
        </TextEditorBox>

        <!-- 拖拽覆盖层 -->
        <div
          v-if="isDragging"
          class="absolute inset-0 z-20 rounded-xl border-2 border-dashed border-blue-500 bg-blue-50/90 dark:bg-blue-950/80 flex items-center justify-center pointer-events-none"
        >
          <div class="flex flex-col items-center gap-1.5 text-blue-600 dark:text-blue-300 text-xs font-medium">
            <Upload class="w-6 h-6" />
            <span>{{ t('tools.configFormatConverter.dropHint') }}</span>
          </div>
        </div>
      </div>

      <!-- 右侧：输出区（支持代码与树形视图切换） -->
      <div class="lg:flex-1 flex flex-col min-h-[240px]">
        <TextEditorBox
          v-if="viewMode === 'code'"
          :modelValue="convertResult.output"
          :label="`${t('common.output')} (${targetMeta.label})`"
          :readonly="true"
          :placeholder="t('tools.configFormatConverter.outputPlaceholder')"
          :showPaste="false"
          :showClear="false"
          :showLineNumbers="true"
          :showWrapToggle="true"
          :defaultWrap="false"
        >
          <template #actions>
            <!-- 代码/树形视图切换 -->
            <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80 mr-1 select-none">
              <button
                type="button"
                @click="viewMode = 'code'"
                class="px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs"
              >
                {{ t('tools.configFormatConverter.codeView') }}
              </button>
              <button
                type="button"
                @click="viewMode = 'tree'"
                :disabled="!convertResult.ok || convertResult.data === null"
                class="px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {{ t('tools.configFormatConverter.treeView') }}
              </button>
            </div>

            <!-- 布局切换 -->
            <div class="hidden lg:inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80 mr-1 select-none">
              <button
                type="button"
                @click="layoutMode = 'split'"
                class="p-1 rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 cursor-pointer"
                :class="{ 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs': layoutMode === 'split' }"
                :title="t('tools.configFormatConverter.layoutSplit')"
              >
                <Columns2 class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="layoutMode = 'stack'"
                class="p-1 rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 cursor-pointer"
                :class="{ 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs': layoutMode === 'stack' }"
                :title="t('tools.configFormatConverter.layoutStack')"
              >
                <Rows2 class="w-3.5 h-3.5" />
              </button>
            </div>

            <!-- 下载导出按钮 -->
            <button
              type="button"
              @click="handleDownloadOutput"
              :disabled="!convertResult.ok || !convertResult.output"
              class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              :title="t('tools.configFormatConverter.downloadFile', { filename: targetMeta.defaultFilename })"
            >
              <component :is="isDownloaded ? Check : FileDown" class="w-3.5 h-3.5" :class="isDownloaded ? 'text-emerald-500' : ''" />
              <span class="hidden sm:inline">{{ t('tools.configFormatConverter.exportFile') }}</span>
            </button>
          </template>
        </TextEditorBox>

        <!-- 树形结构透视 -->
        <div v-else class="flex-1 flex flex-col min-h-0 h-full">
          <div class="flex items-center justify-between pb-1.5 select-none">
            <span class="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {{ t('tools.configFormatConverter.treePreviewTitle') }}
            </span>
            <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
              <button
                type="button"
                @click="viewMode = 'code'"
                class="px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {{ t('tools.configFormatConverter.codeView') }}
              </button>
              <button
                type="button"
                @click="viewMode = 'tree'"
                class="px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs"
              >
                {{ t('tools.configFormatConverter.treeView') }}
              </button>
            </div>
          </div>
          <JsonTreeView :data="convertResult.data" />
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
