<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  AlertTriangle,
  ArrowRightLeft,
  CheckCircle2,
  Code2,
  Eraser,
  Eye,
  Languages,
  ShieldAlert,
  Sparkles,
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import {
  inspectUnicodeText,
  normalizeSpecialSpaces,
  stripInvisibleAndBidiChars,
  transformUnicodeText,
  type CharSeverity,
  type EscapeFormat,
  type HtmlEntityStyle,
} from './unicodeEscapeUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// ==================== 核心状态 ====================
const mode = ref<'encode' | 'decode'>('encode');
const format = ref<EscapeFormat>('js-unicode');
const escapeAscii = ref(false);
const useBracedCodePoint = ref(false);
const htmlStyle = ref<HtmlEntityStyle>('named-hex');
const inputText = ref('');

const inspectorTab = ref<'highlight' | 'table'>('highlight');
const tableFilter = ref<'all' | 'non-ascii' | 'anomaly'>('all');
const toastMessage = ref('');

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = '';
  }, 2400);
}

// ==================== 选项 ====================
const formatOptions = computed<SelectOption[]>(() => [
  { label: isZh.value ? 'JS / JSON Unicode (\\uXXXX)' : 'JS / JSON Unicode (\\uXXXX)', value: 'js-unicode' },
  { label: isZh.value ? 'Python / C / Go 转义 (\\x / \\U)' : 'Python / C / Go (\\x / \\U)', value: 'python-c' },
  { label: isZh.value ? 'HTML 实体 (&#x / &nbsp;)' : 'HTML Entities (&#x / &nbsp;)', value: 'html-entity' },
  { label: isZh.value ? 'CSS 内容转义 (\\XXXX)' : 'CSS Escapes (\\XXXX)', value: 'css-escape' },
  { label: isZh.value ? 'Unicode 码点列表 (U+XXXX)' : 'Unicode Code Points (U+XXXX)', value: 'codepoints' },
  { label: isZh.value ? 'Punycode 国际域名 (xn--)' : 'Punycode Domain (xn--)', value: 'punycode' },
]);

const htmlStyleOptions = computed<SelectOption[]>(() => [
  { label: isZh.value ? '命名实体优先 + Hex (&#x)' : 'Named + Hex (&#x)', value: 'named-hex' },
  { label: isZh.value ? '十六进制 (&#x4E2D;)' : 'Hexadecimal (&#x4E2D;)', value: 'hex' },
  { label: isZh.value ? '十进制 (&#20013;)' : 'Decimal (&#20013;)', value: 'decimal' },
]);

// ==================== 计算转换与检测 ====================
const conversion = computed(() => {
  if (!inputText.value) {
    return { output: '', error: '' };
  }
  try {
    const out = transformUnicodeText(inputText.value, mode.value, format.value, {
      escapeAscii: escapeAscii.value,
      useBracedCodePoint: useBracedCodePoint.value,
      htmlStyle: htmlStyle.value,
    });
    return { output: out, error: '' };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { output: '', error: message };
  }
});

const plainTextForInspect = computed(() => {
  if (mode.value === 'encode') return inputText.value;
  return conversion.value.error ? '' : conversion.value.output;
});

const report = computed(() => inspectUnicodeText(plainTextForInspect.value));

const totalAnomalies = computed(
  () =>
    report.value.invisibleCount +
    report.value.bidiCount +
    report.value.specialSpaceCount +
    report.value.controlCount +
    report.value.confusableCount
);

const filteredTokens = computed(() => {
  const list = report.value.tokens;
  if (tableFilter.value === 'anomaly') {
    return list.filter((tok) => tok.severity !== 'normal');
  }
  if (tableFilter.value === 'non-ascii') {
    return list.filter((tok) => !tok.isAsciiPrintable || tok.severity !== 'normal');
  }
  return list;
});

// ==================== 操作与示例 ====================
function swapMode() {
  const prevOutput = conversion.value.output;
  mode.value = mode.value === 'encode' ? 'decode' : 'encode';
  if (prevOutput) {
    inputText.value = prevOutput;
  }
}

function handleStripInvisible() {
  const target = plainTextForInspect.value;
  if (!target) return;
  const cleaned = stripInvisibleAndBidiChars(target);
  if (mode.value === 'encode') {
    inputText.value = cleaned;
  } else {
    mode.value = 'encode';
    inputText.value = cleaned;
  }
  showToast(t('tools.unicodeEscape.cleanedInvisibleToast'));
}

function handleNormalizeSpaces() {
  const target = plainTextForInspect.value;
  if (!target) return;
  const normalized = normalizeSpecialSpaces(target);
  if (mode.value === 'encode') {
    inputText.value = normalized;
  } else {
    mode.value = 'encode';
    inputText.value = normalized;
  }
  showToast(t('tools.unicodeEscape.normalizedSpacesToast'));
}

function loadSample(kind: 'standard' | 'trap' | 'punycode' | 'html') {
  if (kind === 'trap') {
    mode.value = 'encode';
    format.value = 'js-unicode';
    // Contains BOM (\uFEFF), ZWSP (\u200B), NBSP (\u00A0), RLO (\u202E), Cyrillic homoglyph 'а' (\u0430)
    inputText.value =
      '\uFEFFconst apiKey = "sk-\u200Btest\u200Ckey";\n// 警告：包含\u00A0不换行空格与隐形字符，以及伪装字母 p\u0430ypal.com 与方向覆写 \u202Eabc';
    inspectorTab.value = 'highlight';
    return;
  }
  if (kind === 'punycode') {
    mode.value = 'encode';
    format.value = 'punycode';
    inputText.value = 'https://开发者.中国/docs?lang=zh-CN\nmünchen.de\n例え.jp';
    return;
  }
  if (kind === 'html') {
    mode.value = 'decode';
    format.value = 'html-entity';
    inputText.value = '&lt;div class=&quot;note&quot;&gt;&#x5F00;&#x53D1;&#x8005;&nbsp;&amp;&nbsp;&#128640; &copy; 2026&lt;/div&gt;';
    return;
  }
  mode.value = 'encode';
  format.value = 'js-unicode';
  inputText.value = 'Hello 世界 🚀 DevCrate — © 2026';
}

function getBadgeClasses(severity: CharSeverity): string {
  switch (severity) {
    case 'bidi':
      return 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-300 dark:border-rose-700';
    case 'invisible':
      return 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700';
    case 'special-space':
      return 'bg-sky-100 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border-sky-300 dark:border-sky-700';
    case 'control':
      return 'bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-600';
    case 'confusable':
      return 'bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-700';
    default:
      return '';
  }
}
</script>

<template>
  <ToolContainer
    toolId="unicode-escape"
    nameKey="tools.unicodeEscape.name"
    descKey="tools.unicodeEscape.desc"
    :icon="Languages"
    :wide="true"
    :fullHeight="true"
  >
    <!-- Toast 提示 -->
    <div
      v-if="toastMessage"
      class="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2 shrink-0"
    >
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- 顶部控制栏 -->
    <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-3 shrink-0">
      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <!-- 左侧：编解码方向与格式选择 -->
        <div class="flex flex-wrap items-center gap-2.5">
          <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              @click="mode = 'encode'"
              class="px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
              :class="mode === 'encode' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            >
              {{ t('tools.unicodeEscape.encode') }}
            </button>
            <button
              type="button"
              @click="mode = 'decode'"
              class="px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
              :class="mode === 'decode' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            >
              {{ t('tools.unicodeEscape.decode') }}
            </button>
          </div>

          <button
            type="button"
            @click="swapMode"
            class="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer shrink-0"
            :title="t('common.swap')"
          >
            <ArrowRightLeft class="w-3.5 h-3.5" />
          </button>

          <div class="w-56 sm:w-64">
            <CustomSelect v-model="format" :options="formatOptions" size="sm" fullWidth />
          </div>

          <!-- 格式相关细节选项 -->
          <div v-if="mode === 'encode' && format === 'html-entity'" class="w-44">
            <CustomSelect v-model="htmlStyle" :options="htmlStyleOptions" size="sm" fullWidth />
          </div>
        </div>

        <!-- 右侧：快捷示例加载 -->
        <div class="flex flex-wrap items-center gap-1.5 text-xs">
          <span class="text-zinc-400 inline-flex items-center gap-1 mr-0.5 whitespace-nowrap">
            <Sparkles class="w-3.5 h-3.5 text-amber-500 shrink-0" />
            <span>{{ t('common.loadSample') }}:</span>
          </span>
          <button
            type="button"
            @click="loadSample('standard')"
            class="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            {{ t('tools.unicodeEscape.sampleStandard') }}
          </button>
          <button
            type="button"
            @click="loadSample('trap')"
            class="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/40 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            {{ t('tools.unicodeEscape.sampleTrap') }}
          </button>
          <button
            type="button"
            @click="loadSample('punycode')"
            class="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            {{ t('tools.unicodeEscape.samplePunycode') }}
          </button>
          <button
            type="button"
            @click="loadSample('html')"
            class="px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-medium transition-colors cursor-pointer whitespace-nowrap"
          >
            {{ t('tools.unicodeEscape.sampleHtml') }}
          </button>
        </div>
      </div>

      <!-- 第二行：编码细粒度开关 -->
      <div
        v-if="mode === 'encode' && format !== 'punycode'"
        class="flex flex-wrap items-center gap-4 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-xs text-zinc-600 dark:text-zinc-300"
      >
        <label class="inline-flex items-center gap-1.5 cursor-pointer select-none">
          <input v-model="escapeAscii" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
          <span>{{ t('tools.unicodeEscape.escapeAscii') }}</span>
        </label>

        <label
          v-if="format === 'js-unicode'"
          class="inline-flex items-center gap-1.5 cursor-pointer select-none"
        >
          <input v-model="useBracedCodePoint" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
          <span>{{ t('tools.unicodeEscape.useBracedSyntax') }}</span>
        </label>
      </div>
    </div>

    <!-- 隐形字符与同形/方向攻击预警条 -->
    <div
      v-if="plainTextForInspect && totalAnomalies > 0"
      class="px-3.5 py-2.5 rounded-xl border bg-amber-50/90 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0"
    >
      <div class="flex flex-wrap items-center gap-2 min-w-0">
        <ShieldAlert class="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
        <span class="font-semibold text-amber-900 dark:text-amber-200">
          {{ t('tools.unicodeEscape.anomalyDetected', { count: totalAnomalies }) }}
        </span>
        <div class="flex flex-wrap items-center gap-1">
          <span
            v-for="item in report.anomalySummary"
            :key="item.codePoint"
            class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded border font-mono text-[11px] font-semibold"
            :class="getBadgeClasses(item.severity)"
            :title="isZh ? item.labelZh : item.labelEn"
          >
            <span>{{ item.shortTag }}</span>
            <span>{{ item.hexCodePoint }}</span>
            <span class="opacity-80">×{{ item.count }}</span>
          </span>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
        <button
          v-if="report.invisibleCount + report.bidiCount > 0"
          type="button"
          @click="handleStripInvisible"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-medium transition-colors cursor-pointer whitespace-nowrap"
        >
          <Eraser class="w-3.5 h-3.5 shrink-0" />
          <span>{{ t('tools.unicodeEscape.stripInvisibleBtn') }}</span>
        </button>

        <button
          v-if="report.specialSpaceCount > 0"
          type="button"
          @click="handleNormalizeSpaces"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-amber-300 dark:border-amber-700 bg-white dark:bg-zinc-900 text-amber-800 dark:text-amber-200 hover:bg-amber-100/70 dark:hover:bg-amber-900/40 font-medium transition-colors cursor-pointer whitespace-nowrap"
        >
          <span>{{ t('tools.unicodeEscape.normalizeSpacesBtn') }}</span>
        </button>
      </div>
    </div>

    <!-- 解码错误提示 -->
    <div
      v-if="conversion.error"
      class="px-3.5 py-2 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800/60 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2 shrink-0"
    >
      <AlertTriangle class="w-4 h-4 shrink-0" />
      <span>{{ conversion.error }}</span>
    </div>

    <!-- 双栏输入输出编辑器 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 shrink-0 lg:shrink lg:flex-1 lg:min-h-[240px]">
      <TextEditorBox
        v-model="inputText"
        :label="mode === 'encode' ? t('tools.unicodeEscape.plainInputLabel') : t('tools.unicodeEscape.escapedInputLabel')"
        :placeholder="mode === 'encode' ? t('tools.unicodeEscape.plainPlaceholder') : t('tools.unicodeEscape.escapedPlaceholder')"
        :showLineNumbers="true"
        :showWrapToggle="true"
      />

      <TextEditorBox
        :modelValue="conversion.output"
        :label="mode === 'encode' ? t('tools.unicodeEscape.escapedOutputLabel') : t('tools.unicodeEscape.plainOutputLabel')"
        :readonly="true"
        :showPaste="false"
        :showClear="false"
        :showLineNumbers="true"
        :showWrapToggle="true"
        :placeholder="t('tools.unicodeEscape.outputPlaceholder')"
      />
    </div>

    <!-- 底部透视面板：隐形字符高亮 & 逐字符码点拆解 -->
    <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs shrink-0 overflow-hidden">
      <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/70 flex flex-wrap items-center justify-between gap-2 text-xs select-none">
        <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
          <button
            type="button"
            @click="inspectorTab = 'highlight'"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap"
            :class="inspectorTab === 'highlight' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
          >
            <Eye class="w-3.5 h-3.5 shrink-0" />
            <span>{{ t('tools.unicodeEscape.tabHighlight') }}</span>
          </button>
          <button
            type="button"
            @click="inspectorTab = 'table'"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md font-medium transition-all cursor-pointer whitespace-nowrap"
            :class="inspectorTab === 'table' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
          >
            <Code2 class="w-3.5 h-3.5 shrink-0" />
            <span>{{ t('tools.unicodeEscape.tabBreakdown') }}</span>
          </button>
        </div>

        <!-- 右侧统计与表格筛选 -->
        <div class="flex flex-wrap items-center gap-2 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
          <span>{{ t('tools.unicodeEscape.statCodePoints') }}: <strong class="text-zinc-800 dark:text-zinc-200">{{ report.totalCodePoints }}</strong></span>
          <span>·</span>
          <span>UTF-16: <strong class="text-zinc-800 dark:text-zinc-200">{{ report.totalUtf16Units }}</strong></span>
          <span>·</span>
          <span>UTF-8: <strong class="text-zinc-800 dark:text-zinc-200">{{ report.totalUtf8Bytes }} B</strong></span>

          <div
            v-if="inspectorTab === 'table'"
            class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80 ml-1"
          >
            <button
              v-for="flt in [
                { id: 'all', label: t('tools.unicodeEscape.filterAll') },
                { id: 'non-ascii', label: t('tools.unicodeEscape.filterNonAscii') },
                { id: 'anomaly', label: t('tools.unicodeEscape.filterAnomaly') }
              ]"
              :key="flt.id"
              type="button"
              @click="tableFilter = flt.id as any"
              class="px-2 py-0.5 rounded text-[11px] font-sans font-medium cursor-pointer transition-colors whitespace-nowrap"
              :class="tableFilter === flt.id ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-zinc-500'"
            >
              {{ flt.label }}
            </button>
          </div>
        </div>
      </div>

      <!-- 透视内容区 -->
      <div v-if="!plainTextForInspect" class="p-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
        {{ t('tools.unicodeEscape.inspectorEmpty') }}
      </div>

      <!-- Tab 1: 隐形字符内联高亮透视 -->
      <div
        v-else-if="inspectorTab === 'highlight'"
        class="p-3.5 max-h-52 overflow-y-auto font-mono text-xs leading-7 select-text break-all bg-zinc-50/40 dark:bg-zinc-950/30"
      >
        <template v-for="tok in report.tokens" :key="tok.index">
          <br v-if="tok.isNewline" />
          <span
            v-else-if="tok.severity !== 'normal'"
            class="inline-flex items-center gap-0.5 px-1.5 py-0.2 mx-0.5 rounded border text-[11px] font-semibold align-baseline"
            :class="getBadgeClasses(tok.severity)"
            :title="`${tok.hexCodePoint} — ${isZh ? tok.labelZh : tok.labelEn}`"
          >
            <span v-if="tok.severity === 'confusable'">{{ tok.char }}</span>
            <span>[{{ tok.shortTag }} {{ tok.hexCodePoint }}]</span>
          </span>
          <span v-else class="text-zinc-800 dark:text-zinc-200">{{ tok.char }}</span>
        </template>
        <p v-if="report.truncated" class="mt-2 text-[11px] font-sans text-zinc-400">
          {{ t('tools.unicodeEscape.truncatedNotice', { total: report.totalCodePoints }) }}
        </p>
      </div>

      <!-- Tab 2: 逐字符码点详情表 -->
      <div v-else class="max-h-56 overflow-auto">
        <div v-if="filteredTokens.length === 0" class="p-6 text-center text-xs text-zinc-400">
          {{ t('tools.unicodeEscape.filterEmpty') }}
        </div>
        <table v-else class="w-full text-left border-collapse text-xs">
          <thead class="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 select-none">
            <tr>
              <th class="px-3 py-1.5 font-semibold whitespace-nowrap">#</th>
              <th class="px-3 py-1.5 font-semibold whitespace-nowrap">{{ t('tools.unicodeEscape.colChar') }}</th>
              <th class="px-3 py-1.5 font-semibold whitespace-nowrap">{{ t('tools.unicodeEscape.colCodePoint') }}</th>
              <th class="px-3 py-1.5 font-semibold whitespace-nowrap">UTF-16</th>
              <th class="px-3 py-1.5 font-semibold whitespace-nowrap">UTF-8</th>
              <th class="px-3 py-1.5 font-semibold whitespace-nowrap">HTML</th>
              <th class="px-3 py-1.5 font-semibold whitespace-nowrap">{{ t('tools.unicodeEscape.colNote') }}</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800/70 font-mono">
            <tr
              v-for="tok in filteredTokens"
              :key="tok.index"
              class="hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40"
            >
              <td class="px-3 py-1.5 text-[11px] text-zinc-400 whitespace-nowrap">{{ tok.index + 1 }}</td>
              <td class="px-3 py-1.5 whitespace-nowrap">
                <span
                  v-if="tok.severity !== 'normal'"
                  class="px-1.5 py-0.5 rounded border text-[11px] font-semibold"
                  :class="getBadgeClasses(tok.severity)"
                >
                  {{ tok.severity === 'confusable' ? `${tok.char} (${tok.shortTag})` : `[${tok.shortTag}]` }}
                </span>
                <span v-else-if="tok.isNewline" class="text-[11px] text-zinc-400">[LF \n]</span>
                <span v-else-if="tok.codePoint === 0x20" class="text-[11px] text-zinc-400">[SPACE]</span>
                <span v-else class="text-sm text-zinc-900 dark:text-zinc-100">{{ tok.char }}</span>
              </td>
              <td class="px-3 py-1.5 text-blue-600 dark:text-blue-400 whitespace-nowrap">{{ tok.hexCodePoint }}</td>
              <td class="px-3 py-1.5 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">{{ tok.utf16Escapes }}</td>
              <td class="px-3 py-1.5 text-zinc-600 dark:text-zinc-300 whitespace-nowrap">{{ tok.utf8Hex }}</td>
              <td class="px-3 py-1.5 text-emerald-600 dark:text-emerald-400 whitespace-nowrap">{{ tok.htmlEntity }}</td>
              <td class="px-3 py-1.5 font-sans text-[11px] text-zinc-500 dark:text-zinc-400">
                <span v-if="tok.severity !== 'normal'" class="font-medium text-amber-700 dark:text-amber-300">
                  {{ isZh ? tok.labelZh : tok.labelEn }}
                </span>
                <span v-else>{{ tok.isAsciiPrintable ? 'ASCII' : 'Unicode' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </ToolContainer>
</template>
