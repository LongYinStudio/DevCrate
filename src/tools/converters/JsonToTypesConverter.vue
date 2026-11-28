<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  AlertCircle,
  Braces,
  Check,
  CheckCircle2,
  FileDown,
  Info,
  Sparkles,
  Wand2,
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import { downloadFile } from '../../utils/download';
import { JSON_TO_TYPES_SAMPLES } from './jsonToTypesPresets';
import {
  convertJsonToTargetTypes,
  createDefaultConvertOptions,
  getOutputFilename,
  parseRelaxedJson,
  type ConvertOptions,
  type TargetLang,
} from './jsonToTypesUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// ==================== 核心状态 ====================
const targetLang = ref<TargetLang>('typescript');
const options = ref<ConvertOptions>(createDefaultConvertOptions());
const jsonInput = ref(JSON_TO_TYPES_SAMPLES[0].json);
const activeSampleId = ref(JSON_TO_TYPES_SAMPLES[0].id);

const isDownloaded = ref(false);
const toastMessage = ref('');

options.value.rootName = JSON_TO_TYPES_SAMPLES[0].rootName;

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = '';
  }, 2400);
}

const langTabs: { id: TargetLang; label: string; badge: string }[] = [
  { id: 'typescript', label: 'TypeScript', badge: '.ts' },
  { id: 'zod', label: 'Zod Schema', badge: 'zod' },
  { id: 'go', label: 'Go Struct', badge: '.go' },
  { id: 'rust', label: 'Rust Serde', badge: '.rs' },
  { id: 'pydantic', label: 'Python Pydantic', badge: '.py' },
];

// ==================== 实时转换与统计 ====================
const result = computed(() => {
  if (!jsonInput.value.trim()) {
    return {
      code: '',
      error: '',
      stats: { structCount: 0, mergedOptionalFields: 0, nullableFields: 0 },
    };
  }
  try {
    const out = convertJsonToTargetTypes(jsonInput.value, targetLang.value, options.value);
    return { code: out.code, error: '', stats: out.stats };
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return {
      code: '',
      error: msg,
      stats: { structCount: 0, mergedOptionalFields: 0, nullableFields: 0 },
    };
  }
});

const outputFilename = computed(() => getOutputFilename(targetLang.value));

// ==================== 操作函数 ====================
function loadSample(sampleId: string) {
  const sample = JSON_TO_TYPES_SAMPLES.find((s) => s.id === sampleId);
  if (!sample) return;
  activeSampleId.value = sample.id;
  options.value.rootName = sample.rootName;
  jsonInput.value = sample.json;
}

function formatJsonInput() {
  if (!jsonInput.value.trim()) return;
  try {
    const parsed = parseRelaxedJson(jsonInput.value);
    jsonInput.value = JSON.stringify(parsed, null, 2);
  } catch (err: unknown) {
    showToast(err instanceof Error ? err.message : String(err));
  }
}

function handleDownload() {
  if (!result.value.code) return;
  downloadFile(result.value.code, outputFilename.value, 'text/plain;charset=utf-8');
  isDownloaded.value = true;
  showToast(t('tools.jsonToTypes.downloadedToast', { filename: outputFilename.value }));
  setTimeout(() => {
    isDownloaded.value = false;
  }, 1800);
}
</script>

<template>
  <ToolContainer
    toolId="json-to-types"
    nameKey="tools.jsonToTypes.name"
    descKey="tools.jsonToTypes.desc"
    :icon="Braces"
    :wide="true"
    :fullHeight="true"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          @click="handleDownload"
          :disabled="!result.code"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer shadow-xs whitespace-nowrap"
        >
          <component :is="isDownloaded ? Check : FileDown" class="w-3.5 h-3.5 shrink-0" />
          <span>{{ t('tools.jsonToTypes.downloadBtn', { filename: outputFilename }) }}</span>
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

    <!-- 顶部控制面板：目标语言 + 根名称 + 示例 + 语言选项 -->
    <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3 shrink-0">
      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <!-- 目标语言切换 -->
        <div class="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80">
          <button
            v-for="tab in langTabs"
            :key="tab.id"
            type="button"
            @click="targetLang = tab.id"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
            :class="targetLang === tab.id
              ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
          >
            <span>{{ tab.label }}</span>
            <span class="text-[10px] font-mono opacity-65">{{ tab.badge }}</span>
          </button>
        </div>

        <!-- 根类型名称 + 示例加载 -->
        <div class="flex flex-wrap items-center gap-2 text-xs">
          <label class="inline-flex items-center gap-1.5 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 whitespace-nowrap">
            <span class="text-zinc-500 dark:text-zinc-400 font-medium">{{ t('tools.jsonToTypes.rootNameLabel') }}:</span>
            <input
              v-model="options.rootName"
              type="text"
              placeholder="ApiResponse"
              class="w-32 font-mono font-semibold text-zinc-900 dark:text-zinc-100 bg-transparent focus:outline-none"
            />
          </label>

          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-zinc-400 inline-flex items-center gap-1 whitespace-nowrap">
              <Sparkles class="w-3.5 h-3.5 text-amber-500 shrink-0" />
            </span>
            <button
              v-for="s in JSON_TO_TYPES_SAMPLES"
              :key="s.id"
              type="button"
              @click="loadSample(s.id)"
              class="px-2 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap"
              :class="activeSampleId === s.id
                ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400'
                : 'bg-zinc-50 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
            >
              {{ t(s.labelKey) }}
            </button>
          </div>
        </div>
      </div>

      <!-- 精细生成选项条 -->
      <div class="flex flex-wrap items-center gap-x-4 gap-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-300">
        <!-- 通用推演选项 -->
        <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
          <input v-model="options.nullableAsOptional" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
          <span>{{ t('tools.jsonToTypes.optNullableOptional') }}</span>
        </label>

        <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
          <input v-model="options.detectFormats" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
          <span>{{ t('tools.jsonToTypes.optDetectFormats') }}</span>
        </label>

        <!-- TypeScript 选项 -->
        <template v-if="targetLang === 'typescript'">
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.tsUseInterface" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span>{{ t('tools.jsonToTypes.optTsInterface') }}</span>
          </label>
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.tsExport" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span>export</span>
          </label>
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.tsReadonly" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span>readonly</span>
          </label>
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.inlineComments" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span>{{ t('tools.jsonToTypes.optInlineComments') }}</span>
          </label>
        </template>

        <!-- Zod 选项 -->
        <template v-else-if="targetLang === 'zod'">
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.zodExport" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span>export</span>
          </label>
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.zodInferType" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span>{{ t('tools.jsonToTypes.optZodInfer') }}</span>
          </label>
        </template>

        <!-- Go 选项 -->
        <template v-else-if="targetLang === 'go'">
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.goOmitEmpty" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span class="font-mono">,omitempty</span>
          </label>
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.goPointerNullable" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span>{{ t('tools.jsonToTypes.optGoPointers') }}</span>
          </label>
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.goUseAny" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span>{{ t('tools.jsonToTypes.optGoUseAny') }}</span>
          </label>
        </template>

        <!-- Rust 选项 -->
        <template v-else-if="targetLang === 'rust'">
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.rustDeriveSerde" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span class="font-mono">Serde (Serialize/Deserialize)</span>
          </label>
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.rustPublic" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span class="font-mono">pub</span>
          </label>
        </template>

        <!-- Pydantic 选项 -->
        <template v-else-if="targetLang === 'pydantic'">
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.pyModernUnion" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span>{{ t('tools.jsonToTypes.optPyModernUnion') }}</span>
          </label>
          <label class="inline-flex items-center gap-1.5 cursor-pointer select-none whitespace-nowrap">
            <input v-model="options.pyPopulateByName" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
            <span class="font-mono">populate_by_name=True</span>
          </label>
        </template>

        <!-- 推演统计徽章 -->
        <div
          v-if="!result.error && result.stats.structCount > 0"
          class="ml-auto inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-500 dark:text-zinc-400 whitespace-nowrap"
        >
          <Info class="w-3 h-3 text-blue-500 shrink-0" />
          <span>{{ t('tools.jsonToTypes.statsStructs', { count: result.stats.structCount }) }}</span>
          <template v-if="result.stats.mergedOptionalFields > 0">
            <span>·</span>
            <span class="text-amber-600 dark:text-amber-400">{{ t('tools.jsonToTypes.statsOptional', { count: result.stats.mergedOptionalFields }) }}</span>
          </template>
          <template v-if="result.stats.nullableFields > 0">
            <span>·</span>
            <span class="text-purple-600 dark:text-purple-400">{{ t('tools.jsonToTypes.statsNullable', { count: result.stats.nullableFields }) }}</span>
          </template>
        </div>
      </div>
    </div>

    <!-- JSON 解析错误提示 -->
    <div
      v-if="result.error"
      class="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 shrink-0"
    >
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span class="font-mono break-all">{{ result.error }}</span>
    </div>

    <!-- 左右双栏编辑区 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 shrink-0 lg:shrink lg:flex-1 lg:min-h-[280px]">
      <TextEditorBox
        v-model="jsonInput"
        :label="isZh ? 'JSON / JSONC 输入（支持注释与尾逗号）' : 'JSON / JSONC Input (comments & trailing commas OK)'"
        :placeholder="t('tools.jsonToTypes.jsonPlaceholder')"
        :showLineNumbers="true"
        :showWrapToggle="true"
        :defaultWrap="false"
      >
        <template #actions>
          <button
            type="button"
            @click="formatJsonInput"
            :disabled="!jsonInput.trim()"
            class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 whitespace-nowrap"
          >
            <Wand2 class="w-3.5 h-3.5 shrink-0" />
            <span class="hidden sm:inline">{{ t('tools.jsonToTypes.formatInputBtn') }}</span>
          </button>
        </template>
      </TextEditorBox>

      <TextEditorBox
        :modelValue="result.code"
        :label="outputFilename"
        :readonly="true"
        :showPaste="false"
        :showClear="false"
        :showLineNumbers="true"
        :showWrapToggle="true"
        :defaultWrap="false"
        :placeholder="t('tools.jsonToTypes.outputPlaceholder')"
      />
    </div>
  </ToolContainer>
</template>
