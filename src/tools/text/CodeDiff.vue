<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  FileDiff,
  ArrowLeftRight,
  Upload,
  FileDown,
  Copy,
  Check,
  Trash2,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Columns2,
  AlignJustify,
  FileCode2,
  Maximize2,
  Minimize2,
  CheckCircle2,
  WrapText,
  ArrowUpDown,
  UnfoldVertical
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import { downloadFile } from '../../utils/download';
import {
  computeCodeDiff,
  generateUnifiedPatch,
  sortAndFormatJsonForDiff,
  DEFAULT_DIFF_OPTIONS,
  DIFF_SAMPLE_PRESETS,
  type DiffOptions,
  type SplitDiffRow,
  type UnifiedDiffRow
} from './diffUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

const originalText = ref('');
const modifiedText = ref('');
const originalFilename = ref('original.txt');
const modifiedFilename = ref('modified.txt');

const options = reactive<DiffOptions>({ ...DEFAULT_DIFF_OPTIONS });
const viewMode = ref<'split' | 'unified' | 'patch'>('split');
const paneLayout = ref<'both' | 'diff-only'>('both');
const collapseUnchanged = ref(false);
const wrapLines = ref(false);
const contextLines = 3;

const expandedBlocks = ref<Set<string>>(new Set());
const currentHunkIndex = ref(0);
const diffScrollRef = ref<HTMLDivElement | null>(null);

const isDraggingLeft = ref(false);
const isDraggingRight = ref(false);
const leftFileInputRef = ref<HTMLInputElement | null>(null);
const rightFileInputRef = ref<HTMLInputElement | null>(null);

const selectedPreset = ref('');
const copiedPatch = ref(false);
const downloadedPatch = ref(false);
const jsonNormalizedNotice = ref(false);

const presetOptions = computed<SelectOption[]>(() =>
  DIFF_SAMPLE_PRESETS.map(p => ({
    label: t(`tools.codeDiff.presets.${p.id}`),
    value: p.id
  }))
);

const diffResult = computed(() => {
  return computeCodeDiff(originalText.value, modifiedText.value, { ...options });
});

const patchText = computed(() => {
  return generateUnifiedPatch(
    diffResult.value.unifiedRows,
    originalFilename.value || 'original',
    modifiedFilename.value || 'modified',
    contextLines
  );
});

const canSortJson = computed(() => {
  const a = originalText.value.trim();
  const b = modifiedText.value.trim();
  if (!a || !b) return false;
  return (a.startsWith('{') || a.startsWith('[')) && (b.startsWith('{') || b.startsWith('['));
});

type DisplaySplitItem =
  | { kind: 'row'; row: SplitDiffRow }
  | { kind: 'collapsed'; key: string; startIdx: number; endIdx: number; count: number };

type DisplayUnifiedItem =
  | { kind: 'row'; row: UnifiedDiffRow }
  | { kind: 'collapsed'; key: string; startIdx: number; endIdx: number; count: number };

function buildCollapsedWindows<T extends { hunkId: number | null }>(rows: T[]): boolean[] {
  const visible = new Array<boolean>(rows.length).fill(false);
  rows.forEach((r, idx) => {
    if (r.hunkId !== null) {
      const from = Math.max(0, idx - contextLines);
      const to = Math.min(rows.length - 1, idx + contextLines);
      for (let i = from; i <= to; i++) visible[i] = true;
    }
  });
  return visible;
}

const displaySplitItems = computed<DisplaySplitItem[]>(() => {
  const rows = diffResult.value.splitRows;
  if (!collapseUnchanged.value || diffResult.value.stats.isIdentical) {
    return rows.map(row => ({ kind: 'row', row }));
  }

  const visible = buildCollapsedWindows(rows);
  const items: DisplaySplitItem[] = [];
  let i = 0;
  while (i < rows.length) {
    if (visible[i]) {
      items.push({ kind: 'row', row: rows[i] });
      i++;
      continue;
    }
    const startIdx = i;
    while (i < rows.length && !visible[i]) i++;
    const endIdx = i - 1;
    const count = endIdx - startIdx + 1;
    const key = `s-${startIdx}-${endIdx}`;
    if (count <= 2 || expandedBlocks.value.has(key)) {
      for (let k = startIdx; k <= endIdx; k++) {
        items.push({ kind: 'row', row: rows[k] });
      }
    } else {
      items.push({ kind: 'collapsed', key, startIdx, endIdx, count });
    }
  }
  return items;
});

const displayUnifiedItems = computed<DisplayUnifiedItem[]>(() => {
  const rows = diffResult.value.unifiedRows;
  if (!collapseUnchanged.value || diffResult.value.stats.isIdentical) {
    return rows.map(row => ({ kind: 'row', row }));
  }

  const visible = buildCollapsedWindows(rows);
  const items: DisplayUnifiedItem[] = [];
  let i = 0;
  while (i < rows.length) {
    if (visible[i]) {
      items.push({ kind: 'row', row: rows[i] });
      i++;
      continue;
    }
    const startIdx = i;
    while (i < rows.length && !visible[i]) i++;
    const endIdx = i - 1;
    const count = endIdx - startIdx + 1;
    const key = `u-${startIdx}-${endIdx}`;
    if (count <= 2 || expandedBlocks.value.has(key)) {
      for (let k = startIdx; k <= endIdx; k++) {
        items.push({ kind: 'row', row: rows[k] });
      }
    } else {
      items.push({ kind: 'collapsed', key, startIdx, endIdx, count });
    }
  }
  return items;
});

function expandCollapsedBlock(key: string) {
  expandedBlocks.value = new Set([...expandedBlocks.value, key]);
}

function loadPreset(presetId: string) {
  const p = DIFF_SAMPLE_PRESETS.find(item => item.id === presetId);
  if (!p) return;
  originalFilename.value = p.oldFilename;
  modifiedFilename.value = p.newFilename;
  originalText.value = p.oldContent;
  modifiedText.value = p.newContent;
  expandedBlocks.value = new Set();
  currentHunkIndex.value = 0;
  selectedPreset.value = '';
}

function loadDefaultSample() {
  loadPreset('tsRefactor');
}

function swapSides() {
  const tmpText = originalText.value;
  originalText.value = modifiedText.value;
  modifiedText.value = tmpText;

  const tmpName = originalFilename.value;
  originalFilename.value = modifiedFilename.value;
  modifiedFilename.value = tmpName;
}

function clearAll() {
  originalText.value = '';
  modifiedText.value = '';
  originalFilename.value = 'original.txt';
  modifiedFilename.value = 'modified.txt';
  expandedBlocks.value = new Set();
  currentHunkIndex.value = 0;
}

function formatAndSortBothJson() {
  const r1 = sortAndFormatJsonForDiff(originalText.value);
  const r2 = sortAndFormatJsonForDiff(modifiedText.value);
  if (r1.ok && r2.ok) {
    originalText.value = r1.text;
    modifiedText.value = r2.text;
    jsonNormalizedNotice.value = true;
    setTimeout(() => {
      jsonNormalizedNotice.value = false;
    }, 1800);
  }
}

function jumpToHunk(delta: -1 | 1) {
  const total = diffResult.value.stats.hunkCount;
  if (total === 0) return;
  const next = (currentHunkIndex.value + delta + total) % total;
  currentHunkIndex.value = next;

  const container = diffScrollRef.value;
  if (!container) return;
  const targetEl = container.querySelector(`[data-hunk-id="${next}"]`) as HTMLElement | null;
  if (targetEl) {
    targetEl.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }
}

function readDroppedOrPickedFile(file: File, side: 'left' | 'right') {
  const reader = new FileReader();
  reader.onload = () => {
    const content = typeof reader.result === 'string' ? reader.result : '';
    if (side === 'left') {
      originalFilename.value = file.name;
      originalText.value = content;
    } else {
      modifiedFilename.value = file.name;
      modifiedText.value = content;
    }
  };
  reader.readAsText(file, 'utf-8');
}

function onFileChange(e: Event, side: 'left' | 'right') {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) readDroppedOrPickedFile(file, side);
  input.value = '';
}

function onDropSide(e: DragEvent, side: 'left' | 'right') {
  if (side === 'left') isDraggingLeft.value = false;
  else isDraggingRight.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) readDroppedOrPickedFile(file, side);
}

function copyPatch() {
  if (!patchText.value) return;
  navigator.clipboard.writeText(patchText.value).then(() => {
    copiedPatch.value = true;
    setTimeout(() => {
      copiedPatch.value = false;
    }, 1500);
  });
}

function downloadPatch() {
  if (!patchText.value) return;
  downloadFile(patchText.value, 'changes.patch', 'text/plain;charset=utf-8');
  downloadedPatch.value = true;
  setTimeout(() => {
    downloadedPatch.value = false;
  }, 1500);
}

watch([originalText, modifiedText, collapseUnchanged], () => {
  expandedBlocks.value = new Set();
  currentHunkIndex.value = 0;
});
</script>

<template>
  <ToolContainer
    toolId="code-diff"
    nameKey="tools.codeDiff.name"
    descKey="tools.codeDiff.desc"
    :icon="FileDiff"
    :wide="true"
    :fullHeight="true"
  >
    <template #header-actions>
      <div class="flex items-center gap-2">
        <button
          type="button"
          @click="paneLayout = paneLayout === 'both' ? 'diff-only' : 'both'"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
        >
          <component :is="paneLayout === 'diff-only' ? Minimize2 : Maximize2" class="w-3.5 h-3.5" />
          <span>{{ paneLayout === 'diff-only' ? t('tools.codeDiff.showEditors') : t('tools.codeDiff.focusDiff') }}</span>
        </button>

        <button
          type="button"
          @click="swapSides"
          :disabled="!originalText && !modifiedText"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-700 transition-colors cursor-pointer disabled:opacity-40"
        >
          <ArrowLeftRight class="w-3.5 h-3.5" />
          <span>{{ t('tools.codeDiff.swap') }}</span>
        </button>
      </div>
    </template>

    <div class="flex flex-col flex-1 min-h-0 gap-3">
      <!-- 顶部控制条 -->
      <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0 select-none">
        <div class="flex flex-wrap items-center gap-3">
          <!-- 对比视图模式 -->
          <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
            <button
              type="button"
              @click="viewMode = 'split'"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
              :class="viewMode === 'split' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            >
              <Columns2 class="w-3.5 h-3.5" />
              <span>{{ t('tools.codeDiff.viewSplit') }}</span>
            </button>
            <button
              type="button"
              @click="viewMode = 'unified'"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
              :class="viewMode === 'unified' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            >
              <AlignJustify class="w-3.5 h-3.5" />
              <span>{{ t('tools.codeDiff.viewUnified') }}</span>
            </button>
            <button
              type="button"
              @click="viewMode = 'patch'"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
              :class="viewMode === 'patch' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            >
              <FileCode2 class="w-3.5 h-3.5" />
              <span>Patch</span>
            </button>
          </div>

          <!-- 对比过滤选项 -->
          <div class="flex flex-wrap items-center gap-3 text-xs text-zinc-600 dark:text-zinc-300">
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="options.ignoreWhitespace" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600" />
              <span>{{ t('tools.codeDiff.ignoreWhitespace') }}</span>
            </label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="options.ignoreCase" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600" />
              <span>{{ t('tools.codeDiff.ignoreCase') }}</span>
            </label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="options.ignoreBlankLines" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600" />
              <span>{{ t('tools.codeDiff.ignoreBlankLines') }}</span>
            </label>
            <label class="inline-flex items-center gap-1.5 cursor-pointer">
              <input v-model="collapseUnchanged" type="checkbox" class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600" />
              <span>{{ t('tools.codeDiff.collapseUnchanged') }}</span>
            </label>
          </div>
        </div>

        <!-- 右侧：JSON 排序对比、预设、清空 -->
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            v-if="canSortJson"
            type="button"
            @click="formatAndSortBothJson"
            class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-950/40 dark:hover:bg-indigo-900/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 cursor-pointer"
          >
            <component :is="jsonNormalizedNotice ? Check : ArrowUpDown" class="w-3.5 h-3.5" />
            <span>{{ t('tools.codeDiff.sortJsonKeys') }}</span>
          </button>

          <div class="w-36">
            <CustomSelect
              v-model="selectedPreset"
              :options="presetOptions"
              :placeholder="t('tools.codeDiff.loadPreset')"
              size="sm"
              align="right"
              fullWidth
              @change="loadPreset"
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
            @click="clearAll"
            :disabled="!originalText && !modifiedText"
            class="inline-flex items-center justify-center w-8 h-7 rounded-lg text-xs text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-40"
            :title="t('common.clear')"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- 双栏源码输入区（可收起专注看 Diff） -->
      <div v-if="paneLayout === 'both'" class="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:h-[260px] shrink-0">
        <!-- 原始代码 -->
        <div
          class="relative flex flex-col h-full min-h-0"
          @dragover.prevent="isDraggingLeft = true"
          @dragleave.prevent="isDraggingLeft = false"
          @drop.prevent="onDropSide($event, 'left')"
        >
          <input ref="leftFileInputRef" type="file" class="hidden" @change="onFileChange($event, 'left')" />
          <TextEditorBox
            v-model="originalText"
            :label="`${t('tools.codeDiff.originalLabel')} · ${originalFilename}`"
            :placeholder="t('tools.codeDiff.originalPlaceholder')"
            :showLineNumbers="true"
          >
            <template #actions>
              <button
                type="button"
                @click="leftFileInputRef?.click()"
                class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Upload class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">{{ t('tools.codeDiff.importFile') }}</span>
              </button>
            </template>
          </TextEditorBox>
          <div v-if="isDraggingLeft" class="absolute inset-0 z-20 rounded-xl border-2 border-dashed border-blue-500 bg-blue-50/90 dark:bg-blue-950/80 flex items-center justify-center pointer-events-none text-xs font-medium text-blue-600 dark:text-blue-300">
            {{ t('tools.codeDiff.dropHint') }}
          </div>
        </div>

        <!-- 修改后代码 -->
        <div
          class="relative flex flex-col h-full min-h-0"
          @dragover.prevent="isDraggingRight = true"
          @dragleave.prevent="isDraggingRight = false"
          @drop.prevent="onDropSide($event, 'right')"
        >
          <input ref="rightFileInputRef" type="file" class="hidden" @change="onFileChange($event, 'right')" />
          <TextEditorBox
            v-model="modifiedText"
            :label="`${t('tools.codeDiff.modifiedLabel')} · ${modifiedFilename}`"
            :placeholder="t('tools.codeDiff.modifiedPlaceholder')"
            :showLineNumbers="true"
          >
            <template #actions>
              <button
                type="button"
                @click="rightFileInputRef?.click()"
                class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 cursor-pointer"
              >
                <Upload class="w-3.5 h-3.5" />
                <span class="hidden sm:inline">{{ t('tools.codeDiff.importFile') }}</span>
              </button>
            </template>
          </TextEditorBox>
          <div v-if="isDraggingRight" class="absolute inset-0 z-20 rounded-xl border-2 border-dashed border-blue-500 bg-blue-50/90 dark:bg-blue-950/80 flex items-center justify-center pointer-events-none text-xs font-medium text-blue-600 dark:text-blue-300">
            {{ t('tools.codeDiff.dropHint') }}
          </div>
        </div>
      </div>

      <!-- 差异统计与跳转工具栏 -->
      <div class="px-3.5 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 select-none">
        <div class="flex flex-wrap items-center gap-2">
          <template v-if="!originalText && !modifiedText">
            <span class="text-zinc-400">{{ t('tools.codeDiff.emptyStats') }}</span>
          </template>
          <template v-else-if="diffResult.stats.isIdentical">
            <span class="inline-flex items-center gap-1.5 font-medium text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 class="w-4 h-4" />
              <span>{{ t('tools.codeDiff.identical') }}</span>
            </span>
          </template>
          <template v-else>
            <span class="px-2 py-0.5 rounded-md font-mono font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/70 dark:border-emerald-800/50">
              +{{ diffResult.stats.added }} {{ t('tools.codeDiff.statAdded') }}
            </span>
            <span class="px-2 py-0.5 rounded-md font-mono font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200/70 dark:border-rose-800/50">
              -{{ diffResult.stats.removed }} {{ t('tools.codeDiff.statRemoved') }}
            </span>
            <span class="px-2 py-0.5 rounded-md font-mono font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50">
              ~{{ diffResult.stats.modified }} {{ t('tools.codeDiff.statModified') }}
            </span>
            <span class="text-zinc-500 dark:text-zinc-400 font-mono text-[11px]">
              · {{ diffResult.stats.unchanged }} {{ t('tools.codeDiff.statUnchanged') }}
            </span>
          </template>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <!-- 变更块跳转 -->
          <div v-if="diffResult.stats.hunkCount > 0 && viewMode !== 'patch'" class="inline-flex items-center gap-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
            <button
              type="button"
              @click="jumpToHunk(-1)"
              class="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              :title="t('tools.codeDiff.prevHunk')"
            >
              <ChevronUp class="w-3.5 h-3.5" />
            </button>
            <span class="px-1.5 font-mono text-[11px] text-zinc-600 dark:text-zinc-300">
              {{ currentHunkIndex + 1 }} / {{ diffResult.stats.hunkCount }}
            </span>
            <button
              type="button"
              @click="jumpToHunk(1)"
              class="p-1 rounded hover:bg-white dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              :title="t('tools.codeDiff.nextHunk')"
            >
              <ChevronDown class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- 换行切换 -->
          <button
            v-if="viewMode !== 'patch'"
            type="button"
            @click="wrapLines = !wrapLines"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border transition-colors cursor-pointer"
            :class="wrapLines ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800' : 'bg-zinc-50 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700'"
          >
            <WrapText class="w-3.5 h-3.5" />
            <span>{{ wrapLines ? t('common.wrap') : t('common.unwrap') }}</span>
          </button>

          <!-- 复制/下载 Patch -->
          <button
            type="button"
            @click="copyPatch"
            :disabled="!patchText"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 cursor-pointer disabled:opacity-40"
          >
            <component :is="copiedPatch ? Check : Copy" class="w-3.5 h-3.5" :class="copiedPatch ? 'text-emerald-500' : ''" />
            <span>{{ t('tools.codeDiff.copyPatch') }}</span>
          </button>

          <button
            type="button"
            @click="downloadPatch"
            :disabled="!patchText"
            class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 cursor-pointer disabled:opacity-40"
          >
            <component :is="downloadedPatch ? Check : FileDown" class="w-3.5 h-3.5" :class="downloadedPatch ? 'text-emerald-500' : ''" />
            <span>.patch</span>
          </button>
        </div>
      </div>

      <!-- 主 Diff 结果渲染区 -->
      <div class="flex-1 min-h-[240px] flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <!-- Patch 纯文本视图 -->
        <TextEditorBox
          v-if="viewMode === 'patch'"
          :modelValue="patchText || (isZh ? '// 暂无差异内容' : '// No differences found')"
          label="Unified Patch (.patch)"
          :readonly="true"
          :showPaste="false"
          :showClear="false"
          :showLineNumbers="true"
          :showWrapToggle="true"
        />

        <!-- 左右并排视图 (Side-by-Side) -->
        <div
          v-else-if="viewMode === 'split'"
          ref="diffScrollRef"
          class="flex-1 overflow-auto font-mono text-xs leading-6"
        >
          <div v-if="!originalText && !modifiedText" class="h-full flex items-center justify-center text-zinc-400 text-xs font-sans">
            {{ t('tools.codeDiff.emptyDiffHint') }}
          </div>

          <table v-else class="w-full border-collapse table-fixed min-w-[720px]">
            <thead class="sticky top-0 z-10 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-sans text-zinc-500 dark:text-zinc-400 select-none">
              <tr>
                <th class="w-11 py-1.5 px-2 text-right border-r border-zinc-200/70 dark:border-zinc-800">#</th>
                <th class="w-1/2 py-1.5 px-3 text-left border-r border-zinc-200 dark:border-zinc-800 truncate">{{ originalFilename }}</th>
                <th class="w-11 py-1.5 px-2 text-right border-r border-zinc-200/70 dark:border-zinc-800">#</th>
                <th class="w-1/2 py-1.5 px-3 text-left truncate">{{ modifiedFilename }}</th>
              </tr>
            </thead>
            <tbody>
              <template v-for="item in displaySplitItems" :key="item.kind === 'row' ? item.row.rowIndex : item.key">
                <!-- 折叠块展开条 -->
                <tr
                  v-if="item.kind === 'collapsed'"
                  @click="expandCollapsedBlock(item.key)"
                  class="bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-100/70 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-y border-blue-200/60 dark:border-blue-900/40 cursor-pointer select-none font-sans"
                >
                  <td colspan="4" class="py-1 px-3 text-center text-[11px]">
                    <span class="inline-flex items-center gap-1.5">
                      <UnfoldVertical class="w-3.5 h-3.5" />
                      {{ t('tools.codeDiff.expandCollapsed', { count: item.count }) }}
                    </span>
                  </td>
                </tr>

                <!-- 数据对比行 -->
                <tr
                  v-else
                  :data-hunk-id="item.row.hunkId ?? undefined"
                  :class="item.row.hunkId !== null && item.row.hunkId === currentHunkIndex ? 'ring-1 ring-inset ring-blue-400/50' : ''"
                >
                  <!-- 左侧行号 -->
                  <td
                    class="w-11 px-2 text-right select-none border-r border-zinc-200/60 dark:border-zinc-800/80 text-[11px]"
                    :class="
                      item.row.left.kind === 'removed' || item.row.left.kind === 'modified-old'
                        ? 'bg-rose-100/70 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400'
                        : item.row.left.kind === 'empty'
                          ? 'bg-zinc-100/70 dark:bg-zinc-800/40 text-transparent'
                          : 'bg-zinc-50/70 dark:bg-zinc-900/50 text-zinc-400'
                    "
                  >
                    {{ item.row.left.lineNo ?? '' }}
                  </td>

                  <!-- 左侧代码 -->
                  <td
                    class="px-3 align-top border-r border-zinc-200 dark:border-zinc-800 overflow-hidden"
                    :class="[
                      wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto',
                      item.row.left.kind === 'removed' || item.row.left.kind === 'modified-old'
                        ? 'bg-rose-50/80 dark:bg-rose-950/25 text-zinc-900 dark:text-zinc-100'
                        : item.row.left.kind === 'empty'
                          ? 'bg-zinc-100/50 dark:bg-zinc-900/80'
                          : 'text-zinc-700 dark:text-zinc-300'
                    ]"
                  >
                    <template v-if="item.row.left.tokens">
                      <span
                        v-for="(tok, tIdx) in item.row.left.tokens"
                        :key="tIdx"
                        :class="tok.type === 'removed' ? 'bg-rose-300/70 dark:bg-rose-700/60 rounded-xs' : ''"
                      >{{ tok.text }}</span>
                    </template>
                    <template v-else>{{ item.row.left.text || ' ' }}</template>
                  </td>

                  <!-- 右侧行号 -->
                  <td
                    class="w-11 px-2 text-right select-none border-r border-zinc-200/60 dark:border-zinc-800/80 text-[11px]"
                    :class="
                      item.row.right.kind === 'added' || item.row.right.kind === 'modified-new'
                        ? 'bg-emerald-100/70 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                        : item.row.right.kind === 'empty'
                          ? 'bg-zinc-100/70 dark:bg-zinc-800/40 text-transparent'
                          : 'bg-zinc-50/70 dark:bg-zinc-900/50 text-zinc-400'
                    "
                  >
                    {{ item.row.right.lineNo ?? '' }}
                  </td>

                  <!-- 右侧代码 -->
                  <td
                    class="px-3 align-top overflow-hidden"
                    :class="[
                      wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre overflow-x-auto',
                      item.row.right.kind === 'added' || item.row.right.kind === 'modified-new'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/25 text-zinc-900 dark:text-zinc-100'
                        : item.row.right.kind === 'empty'
                          ? 'bg-zinc-100/50 dark:bg-zinc-900/80'
                          : 'text-zinc-700 dark:text-zinc-300'
                    ]"
                  >
                    <template v-if="item.row.right.tokens">
                      <span
                        v-for="(tok, tIdx) in item.row.right.tokens"
                        :key="tIdx"
                        :class="tok.type === 'added' ? 'bg-emerald-300/70 dark:bg-emerald-700/60 rounded-xs' : ''"
                      >{{ tok.text }}</span>
                    </template>
                    <template v-else>{{ item.row.right.text || ' ' }}</template>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>

        <!-- 行内统一视图 (Unified) -->
        <div
          v-else
          ref="diffScrollRef"
          class="flex-1 overflow-auto font-mono text-xs leading-6"
        >
          <div v-if="!originalText && !modifiedText" class="h-full flex items-center justify-center text-zinc-400 text-xs font-sans">
            {{ t('tools.codeDiff.emptyDiffHint') }}
          </div>

          <table v-else class="w-full border-collapse">
            <tbody>
              <template v-for="item in displayUnifiedItems" :key="item.kind === 'row' ? item.row.rowIndex : item.key">
                <tr
                  v-if="item.kind === 'collapsed'"
                  @click="expandCollapsedBlock(item.key)"
                  class="bg-blue-50/60 dark:bg-blue-950/20 hover:bg-blue-100/70 dark:hover:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-y border-blue-200/60 dark:border-blue-900/40 cursor-pointer select-none font-sans"
                >
                  <td colspan="4" class="py-1 px-3 text-center text-[11px]">
                    <span class="inline-flex items-center gap-1.5">
                      <UnfoldVertical class="w-3.5 h-3.5" />
                      {{ t('tools.codeDiff.expandCollapsed', { count: item.count }) }}
                    </span>
                  </td>
                </tr>

                <tr
                  v-else
                  :data-hunk-id="item.row.hunkId ?? undefined"
                  :class="
                    item.row.type === 'removed'
                      ? 'bg-rose-50/80 dark:bg-rose-950/25'
                      : item.row.type === 'added'
                        ? 'bg-emerald-50/80 dark:bg-emerald-950/25'
                        : ''
                  "
                >
                  <td class="w-11 px-2 text-right select-none text-[11px] text-zinc-400 border-r border-zinc-200/60 dark:border-zinc-800/80">
                    {{ item.row.oldLineNo ?? '' }}
                  </td>
                  <td class="w-11 px-2 text-right select-none text-[11px] text-zinc-400 border-r border-zinc-200/60 dark:border-zinc-800/80">
                    {{ item.row.newLineNo ?? '' }}
                  </td>
                  <td
                    class="w-6 text-center select-none font-bold"
                    :class="
                      item.row.type === 'removed'
                        ? 'text-rose-600 dark:text-rose-400'
                        : item.row.type === 'added'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-zinc-400'
                    "
                  >
                    {{ item.row.type === 'removed' ? '-' : item.row.type === 'added' ? '+' : ' ' }}
                  </td>
                  <td
                    class="px-2.5 text-zinc-800 dark:text-zinc-200"
                    :class="wrapLines ? 'whitespace-pre-wrap break-all' : 'whitespace-pre'"
                  >
                    <template v-if="item.row.tokens">
                      <span
                        v-for="(tok, tIdx) in item.row.tokens"
                        :key="tIdx"
                        :class="
                          tok.type === 'removed'
                            ? 'bg-rose-300/70 dark:bg-rose-700/60 rounded-xs'
                            : tok.type === 'added'
                              ? 'bg-emerald-300/70 dark:bg-emerald-700/60 rounded-xs'
                              : ''
                        "
                      >{{ tok.text }}</span>
                    </template>
                    <template v-else>{{ item.row.text || ' ' }}</template>
                  </td>
                </tr>
              </template>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
