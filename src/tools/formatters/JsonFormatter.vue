<script setup lang="ts">
import { ref, watch, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  FileJson,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Minimize2,
  ArrowRightLeft,
  ArrowUpDown,
  Wrench,
  Trash2,
  Columns2,
  Rows2,
  Maximize2,
  LocateFixed,
  Quote,
  Undo2
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import CustomSelect from '../../components/common/CustomSelect.vue';
import JsonTreeView from './components/JsonTreeView.vue';

const { t, locale } = useI18n();

const inputJson = ref('');
const outputJson = ref('');
const parsedData = ref<any>(null);
const indentType = ref<'2' | '4' | 'tab'>('2');
const isValid = ref<boolean | null>(null);
const liveFormat = ref(true);
const viewMode = ref<'code' | 'tree'>('code');
const layoutMode = ref<'split' | 'stack' | 'output'>('split');
const repairedNotice = ref('');

interface JsonErrorInfo {
  message: string;
  line: number | null;
  column: number | null;
}
const errorInfo = ref<JsonErrorInfo | null>(null);

const inputEditorRef = ref<InstanceType<typeof TextEditorBox> | null>(null);

const sampleJson = `{
  "name": "DevCrate",
  "version": "1.0.0",
  "description": "Modern developer toolbox built with Tauri 2 and Vue 3",
  "private": true,
  "features": [
    "Offline native speed",
    "Dark & light adaptive theme",
    "Zero-dependency privacy first",
    "Interactive JSON tree inspector",
    "Multi-language i18n support"
  ],
  "author": {
    "name": "LongYinStudio",
    "active": true,
    "rating": 5
  },
  "stats": {
    "downloads": 12800,
    "openSource": true,
    "license": "MIT"
  }
}`;

function getIndent(): string | number {
  if (indentType.value === 'tab') return '\t';
  return Number(indentType.value);
}

function parseJsonError(err: any, text: string): JsonErrorInfo {
  const msg: string = err?.message || 'JSON 语法错误';
  let line: number | null = null;
  let column: number | null = null;

  // 1. 优先匹配 "line X column Y"
  const lineColMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
  if (lineColMatch) {
    line = parseInt(lineColMatch[1], 10);
    column = parseInt(lineColMatch[2], 10);
  } else {
    // 2. 匹配 "at line X"
    const lineMatch = msg.match(/at line\s+(\d+)/i);
    if (lineMatch) {
      line = parseInt(lineMatch[1], 10);
    }
  }

  // 3. 匹配 "position X"
  if (line === null) {
    const posMatch = msg.match(/position\s+(\d+)/i);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      if (!isNaN(pos) && pos >= 0 && pos <= text.length) {
        const textBefore = text.slice(0, pos);
        const lines = textBefore.split('\n');
        line = lines.length;
        column = lines[lines.length - 1].length + 1;
      }
    }
  }

  return { message: msg, line, column };
}

function formatJson() {
  repairedNotice.value = '';
  if (!inputJson.value.trim()) {
    outputJson.value = '';
    parsedData.value = null;
    errorInfo.value = null;
    isValid.value = null;
    return;
  }

  try {
    const parsed = JSON.parse(inputJson.value);
    parsedData.value = parsed;
    outputJson.value = JSON.stringify(parsed, null, getIndent());
    errorInfo.value = null;
    isValid.value = true;
  } catch (err: any) {
    isValid.value = false;
    parsedData.value = null;
    errorInfo.value = parseJsonError(err, inputJson.value);
  }
}

function minifyJson() {
  if (!inputJson.value.trim()) return;
  try {
    const parsed = JSON.parse(inputJson.value);
    parsedData.value = parsed;
    outputJson.value = JSON.stringify(parsed);
    errorInfo.value = null;
    isValid.value = true;
  } catch (err: any) {
    isValid.value = false;
    errorInfo.value = parseJsonError(err, inputJson.value);
  }
}

// 递归按字母排序键名
function sortObjectKeys(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys);
  }
  if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj)
      .sort((a, b) => a.localeCompare(b))
      .reduce((acc, key) => {
        acc[key] = sortObjectKeys(obj[key]);
        return acc;
      }, {} as any);
  }
  return obj;
}

function sortAndFormat() {
  if (!inputJson.value.trim()) return;
  try {
    const parsed = JSON.parse(inputJson.value);
    const sorted = sortObjectKeys(parsed);
    parsedData.value = sorted;
    outputJson.value = JSON.stringify(sorted, null, getIndent());
    errorInfo.value = null;
    isValid.value = true;
  } catch (err: any) {
    isValid.value = false;
    errorInfo.value = parseJsonError(err, inputJson.value);
  }
}

// 智能修复宽松 JSON（单引号、未加引号键名、末尾多余逗号、注释、Python 字面量等）
function repairLooseJson(raw: string): string {
  let s = raw.trim();
  if (!s) return s;

  // 1. 去除单行注释 //... 与多行注释 /*...*/
  s = s.replace(/\/\/.*$/gm, '').replace(/\/\*[\s\S]*?\*\//g, '');

  // 2. 替换 Python 特殊字面量
  s = s.replace(/:\s*True\b/g, ': true')
       .replace(/:\s*False\b/g, ': false')
       .replace(/:\s*None\b/g, ': null');

  // 3. 替换单引号包裹的键名与字符串值
  s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, content) => {
    return '"' + content.replace(/"/g, '\\"') + '"';
  });

  // 4. 为没有加引号的合法标识符键名补齐双引号，形如 { name: "val" } -> { "name": "val" }
  s = s.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$-]*)\s*:/g, '$1"$2":');

  // 5. 去除数组与对象末尾多余逗号 (trailing commas)
  s = s.replace(/,\s*([}\]])/g, '$1');

  return s;
}

function repairAndFormat() {
  if (!inputJson.value.trim()) return;
  try {
    const repaired = repairLooseJson(inputJson.value);
    const parsed = JSON.parse(repaired);
    inputJson.value = JSON.stringify(parsed, null, getIndent());
    parsedData.value = parsed;
    outputJson.value = inputJson.value;
    errorInfo.value = null;
    isValid.value = true;
    repairedNotice.value = t('tools.jsonFormatter.repaired');
  } catch (err: any) {
    isValid.value = false;
    errorInfo.value = parseJsonError(err, inputJson.value);
  }
}

function escapeJson() {
  if (!inputJson.value) return;
  outputJson.value = JSON.stringify(inputJson.value);
}

function unescapeJson() {
  if (!inputJson.value) return;
  try {
    outputJson.value = JSON.parse(inputJson.value);
  } catch {
    outputJson.value = inputJson.value.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
}

function swapInputOutput() {
  if (!outputJson.value) return;
  const temp = inputJson.value;
  inputJson.value = outputJson.value;
  outputJson.value = temp;
  formatJson();
}

function clearAll() {
  inputJson.value = '';
  outputJson.value = '';
  parsedData.value = null;
  isValid.value = null;
  errorInfo.value = null;
  repairedNotice.value = '';
}

function loadSample() {
  inputJson.value = sampleJson;
  formatJson();
}

function jumpToErrorLine() {
  if (errorInfo.value?.line && inputEditorRef.value) {
    inputEditorRef.value.scrollToLine(errorInfo.value.line);
  }
}

// 实时输入去抖动格式化
let debounceTimer: any = null;
watch(inputJson, () => {
  if (!liveFormat.value) return;
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    formatJson();
  }, 120);
});

watch(indentType, () => {
  if (inputJson.value.trim()) {
    formatJson();
  }
});

// 输出统计指标
const outputStats = computed(() => {
  const text = outputJson.value || '';
  const lines = text ? text.split('\n').length : 0;
  const chars = text.length;
  const kb = (new Blob([text]).size / 1024).toFixed(1);
  return { lines, chars, kb };
});
</script>

<template>
  <ToolContainer
    toolId="json-formatter"
    nameKey="tools.jsonFormatter.name"
    descKey="tools.jsonFormatter.desc"
    :icon="FileJson"
    :wide="true"
    :fullHeight="true"
  >
    <!-- 顶部操作工具栏 -->
    <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0 select-none">
      <div class="flex flex-wrap items-center gap-1.5">
        <!-- 美化格式 -->
        <button
          type="button"
          @click="formatJson"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-xs"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ t('tools.jsonFormatter.beautify') }}</span>
        </button>

        <!-- 压缩单行 -->
        <button
          type="button"
          @click="minifyJson"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer"
        >
          <Minimize2 class="w-3.5 h-3.5" />
          <span>{{ t('tools.jsonFormatter.minify') }}</span>
        </button>

        <!-- 键名排序 A-Z -->
        <button
          type="button"
          @click="sortAndFormat"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer"
          :title="t('tools.jsonFormatter.sortKeys')"
        >
          <ArrowUpDown class="w-3.5 h-3.5 text-blue-500" />
          <span>{{ t('tools.jsonFormatter.sortKeys') }}</span>
        </button>

        <!-- 智能修复 -->
        <button
          type="button"
          @click="repairAndFormat"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer"
          :title="t('tools.jsonFormatter.repair')"
        >
          <Wrench class="w-3.5 h-3.5 text-amber-500" />
          <span>{{ t('tools.jsonFormatter.repair') }}</span>
        </button>

        <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5"></div>

        <!-- 转义 -->
        <button
          type="button"
          @click="escapeJson"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer"
          :title="t('tools.jsonFormatter.escape')"
        >
          <Quote class="w-3.5 h-3.5" />
          <span>{{ t('tools.jsonFormatter.escape') }}</span>
        </button>

        <!-- 反转义 -->
        <button
          type="button"
          @click="unescapeJson"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer"
          :title="t('tools.jsonFormatter.unescape')"
        >
          <Undo2 class="w-3.5 h-3.5" />
          <span>{{ t('tools.jsonFormatter.unescape') }}</span>
        </button>

        <!-- 互换输入输出 -->
        <button
          type="button"
          @click="swapInputOutput"
          :disabled="!outputJson"
          class="inline-flex items-center justify-center w-8 h-7 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer disabled:opacity-40"
          :title="t('tools.jsonFormatter.swap')"
        >
          <ArrowRightLeft class="w-3.5 h-3.5" />
        </button>

        <!-- 清空全部 -->
        <button
          type="button"
          @click="clearAll"
          :disabled="!inputJson && !outputJson"
          class="inline-flex items-center justify-center w-8 h-7 rounded-lg text-xs font-medium text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-40"
          :title="t('common.clear')"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="flex items-center gap-3">
        <!-- 实时格式化开关 -->
        <label class="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
          <input
            type="checkbox"
            v-model="liveFormat"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>{{ t('tools.jsonFormatter.liveFormat') }}</span>
        </label>

        <!-- 缩进选项 -->
        <div class="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
          <span>{{ t('tools.jsonFormatter.indentation') }}:</span>
          <CustomSelect
            v-model="indentType"
            :options="[
              { label: t('tools.jsonFormatter.indent2'), value: '2' },
              { label: t('tools.jsonFormatter.indent4'), value: '4' },
              { label: t('tools.jsonFormatter.indentTab'), value: 'tab' }
            ]"
          />
        </div>

        <button
          type="button"
          @click="loadSample"
          class="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          {{ t('common.loadSample') }}
        </button>
      </div>
    </div>

    <!-- 紧凑状态反馈条 -->
    <div
      v-if="isValid !== null || repairedNotice"
      class="flex items-center justify-between px-3.5 py-1.5 rounded-lg text-xs shrink-0 transition-all select-none gap-2"
      :class="[
        isValid
          ? 'bg-emerald-50/90 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/50'
          : 'bg-rose-50/90 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/50'
      ]"
    >
      <div class="flex items-center gap-2 overflow-hidden text-ellipsis whitespace-nowrap">
        <CheckCircle2 v-if="isValid" class="w-4 h-4 text-emerald-500 shrink-0" />
        <AlertCircle v-else class="w-4 h-4 text-rose-500 shrink-0" />

        <span class="font-medium">
          <template v-if="isValid">
            {{ repairedNotice || t('tools.jsonFormatter.validJson') }}
            <span class="text-zinc-500 dark:text-zinc-400 font-normal ml-1">
              · {{ outputStats.lines }} {{ t('common.lines') }} · {{ outputStats.chars }} {{ t('common.chars') }} ({{ outputStats.kb }} KB)
            </span>
          </template>
          <template v-else-if="errorInfo">
            <span class="font-semibold text-rose-600 dark:text-rose-400">
              {{ errorInfo.line ? (locale.startsWith('zh') ? `第 ${errorInfo.line} 行${errorInfo.column ? ` 第 ${errorInfo.column} 列` : ''}: ` : `Line ${errorInfo.line}${errorInfo.column ? ` Col ${errorInfo.column}` : ''}: `) : '' }}
            </span>
            <span>{{ errorInfo.message }}</span>
          </template>
        </span>
      </div>

      <!-- 错误时的快捷操作 -->
      <div v-if="!isValid && errorInfo" class="flex items-center gap-2 shrink-0">
        <button
          v-if="errorInfo.line"
          type="button"
          @click="jumpToErrorLine"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-white dark:bg-zinc-800 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800 hover:bg-rose-100/50 dark:hover:bg-rose-900/40 transition-colors cursor-pointer"
        >
          <LocateFixed class="w-3 h-3" />
          <span>{{ t('tools.jsonFormatter.jumpToError') }}</span>
        </button>

        <button
          type="button"
          @click="repairAndFormat"
          class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-rose-600 hover:bg-rose-500 text-white transition-colors cursor-pointer"
        >
          <Wrench class="w-3 h-3" />
          <span>{{ t('tools.jsonFormatter.tryRepair') }}</span>
        </button>
      </div>
    </div>

    <!-- 主编辑区分栏（填满剩余纵向空间） -->
    <div
      class="flex-1 min-h-0 w-full"
      :class="[
        layoutMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-3.5' : '',
        layoutMode === 'stack' ? 'flex flex-col gap-3.5' : '',
        layoutMode === 'output' ? 'flex flex-col' : ''
      ]"
    >
      <!-- 左侧：输入区域 -->
      <TextEditorBox
        v-if="layoutMode !== 'output'"
        ref="inputEditorRef"
        v-model="inputJson"
        :label="t('common.input')"
        :placeholder="t('tools.jsonFormatter.inputPlaceholder')"
        :showLineNumbers="true"
        :showWrapToggle="true"
        :defaultWrap="false"
        @clear="outputJson = ''; parsedData = null; isValid = null; errorInfo = null; repairedNotice = ''"
      />

      <!-- 右侧：格式化结果与视图模式切换 -->
      <div class="flex-1 flex flex-col min-h-0 h-full">
        <!-- 代码模式视图 -->
        <TextEditorBox
          v-if="viewMode === 'code'"
          v-model="outputJson"
          :label="t('common.output')"
          :readonly="true"
          :placeholder="t('tools.jsonFormatter.outputPlaceholder')"
          :showPaste="false"
          :showClear="false"
          :showLineNumbers="true"
          :showWrapToggle="true"
          :defaultWrap="false"
        >
          <template #actions>
            <!-- 视图模式切换 -->
            <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80 mr-1 select-none">
              <button
                type="button"
                @click="viewMode = 'code'"
                class="px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs"
              >
                {{ t('tools.jsonFormatter.codeView') }}
              </button>
              <button
                type="button"
                @click="viewMode = 'tree'"
                :disabled="!isValid || !parsedData"
                class="px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed"
                :title="locale.startsWith('zh') ? '以交互树形结构预览' : 'Preview as interactive tree'"
              >
                {{ t('tools.jsonFormatter.treeView') }}
              </button>
            </div>

            <!-- 布局模式切换 -->
            <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80 mr-1 select-none">
              <button
                type="button"
                @click="layoutMode = 'split'"
                class="p-1 rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 cursor-pointer"
                :class="{ 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs': layoutMode === 'split' }"
                :title="t('tools.jsonFormatter.layoutSplit')"
              >
                <Columns2 class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="layoutMode = 'stack'"
                class="p-1 rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 cursor-pointer"
                :class="{ 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs': layoutMode === 'stack' }"
                :title="t('tools.jsonFormatter.layoutStack')"
              >
                <Rows2 class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                @click="layoutMode = layoutMode === 'output' ? 'split' : 'output'"
                class="p-1 rounded text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 cursor-pointer"
                :class="{ 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs': layoutMode === 'output' }"
                :title="t('tools.jsonFormatter.layoutOutput')"
              >
                <Maximize2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </template>
        </TextEditorBox>

        <!-- 树形交互模式视图 -->
        <div v-else class="flex-1 flex flex-col min-h-0 h-full">
          <div class="flex items-center justify-between pb-1.5">
            <span class="text-xs font-medium text-zinc-700 dark:text-zinc-300">
              {{ t('tools.jsonFormatter.treeView') }} {{ locale.startsWith('zh') ? '预览' : 'Preview' }}
            </span>
            <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80 select-none">
              <button
                type="button"
                @click="viewMode = 'code'"
                class="px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
              >
                {{ t('tools.jsonFormatter.codeView') }}
              </button>
              <button
                type="button"
                @click="viewMode = 'tree'"
                class="px-2 py-0.5 rounded-md text-[11px] font-medium transition-all cursor-pointer bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs"
              >
                {{ t('tools.jsonFormatter.treeView') }}
              </button>
            </div>
          </div>
          <JsonTreeView :data="parsedData" />
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
