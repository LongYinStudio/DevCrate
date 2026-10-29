<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Network,
  Upload,
  FileArchive,
  Search,
  RotateCcw,
  Sparkles,
  ClipboardPaste,
  Check,
  Copy,
  Terminal,
  ExternalLink,
  X,
  AlertCircle
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import type { HarArchive, HarEntry } from './types';
import {
  processRawHar,
  formatBytes,
  formatDuration,
  buildCurlCommand,
  getStatusStyle,
  getMethodStyle
} from './harUtils';
import { sampleHarData } from './sampleHar';

const { t, locale } = useI18n();

// 核心状态
const archive = ref<HarArchive | null>(null);
const fileName = ref('');
const fileSize = ref(0);
const isDragging = ref(false);
const errorMessage = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);

// 交互与详情状态
const selectedEntry = ref<HarEntry | null>(null);
const activeDetailTab = ref<'headers' | 'payload' | 'response' | 'cookies' | 'timing'>('headers');

// 过滤状态
const searchQuery = ref('');
const selectedMethod = ref('ALL');
const selectedType = ref('ALL');
const selectedStatus = ref('ALL');
const onlyErrors = ref(false);

// 粘贴弹窗
const isPasteModalOpen = ref(false);
const pasteText = ref('');

// 复制反馈
const copiedCurl = ref(false);
const copiedUrl = ref(false);
const copiedResponse = ref(false);

// 处理文件读取
function handleFileSelect(e: Event) {
  const files = (e.target as HTMLInputElement).files;
  if (files && files.length > 0) {
    loadFile(files[0]);
  }
}

function handleDrop(e: DragEvent) {
  isDragging.value = false;
  if (e.dataTransfer && e.dataTransfer.files.length > 0) {
    loadFile(e.dataTransfer.files[0]);
  }
}

function loadFile(file: File) {
  errorMessage.value = '';
  fileName.value = file.name;
  fileSize.value = file.size;

  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const content = event.target?.result as string;
      const parsed = JSON.parse(content);
      const processed = processRawHar(parsed);
      archive.value = processed;
      if (processed.log.entries.length > 0) {
        selectedEntry.value = processed.log.entries[0];
      } else {
        selectedEntry.value = null;
      }
    } catch (err: any) {
      console.error(err);
      errorMessage.value = t('tools.harViewer.errorParsing');
    }
  };
  reader.onerror = () => {
    errorMessage.value = t('tools.harViewer.errorParsing');
  };
  reader.readAsText(file);
}

// 加载内置示例
function loadSample() {
  errorMessage.value = '';
  fileName.value = 'devtools_dashboard.har';
  fileSize.value = 28420;
  const processed = processRawHar(sampleHarData);
  archive.value = processed;
  selectedEntry.value = processed.log.entries[0] || null;
}

// 处理粘贴文本解析
function parsePastedJson() {
  if (!pasteText.value.trim()) return;
  errorMessage.value = '';
  try {
    const parsed = JSON.parse(pasteText.value);
    const processed = processRawHar(parsed);
    archive.value = processed;
    fileName.value = 'pasted_archive.har';
    fileSize.value = new TextEncoder().encode(pasteText.value).length;
    selectedEntry.value = processed.log.entries[0] || null;
    isPasteModalOpen.value = false;
    pasteText.value = '';
  } catch (err: any) {
    console.error(err);
    errorMessage.value = t('tools.harViewer.errorParsing');
  }
}

// 清空当前数据
function clearData() {
  archive.value = null;
  fileName.value = '';
  fileSize.value = 0;
  selectedEntry.value = null;
  errorMessage.value = '';
  searchQuery.value = '';
  selectedMethod.value = 'ALL';
  selectedType.value = 'ALL';
  selectedStatus.value = 'ALL';
  onlyErrors.value = false;
  if (fileInputRef.value) {
    fileInputRef.value.value = '';
  }
}

// 统计信息计算
const totalEntriesCount = computed(() => archive.value?.log.entries.length || 0);

const metrics = computed(() => {
  if (!archive.value || archive.value.log.entries.length === 0) {
    return {
      transferredSize: 0,
      contentSize: 0,
      totalDuration: 0,
      maxDuration: 0,
      errorCount: 0,
      status2xx: 0,
      status3xx: 0,
      status4xx: 0,
      status5xx: 0
    };
  }

  let transferred = 0;
  let content = 0;
  let errorCount = 0;
  let maxDur = 0;
  let s2 = 0, s3 = 0, s4 = 0, s5 = 0;

  archive.value.log.entries.forEach(e => {
    const res = e.response;
    const bodySize = res.bodySize > 0 ? res.bodySize : (res.content?.size || 0);
    transferred += bodySize + (res.headersSize > 0 ? res.headersSize : 0);
    content += res.content?.size || 0;

    if (e.time > maxDur) maxDur = e.time;

    const status = res.status;
    if (status >= 200 && status < 300) s2++;
    else if (status >= 300 && status < 400) s3++;
    else if (status >= 400 && status < 500) { s4++; errorCount++; }
    else if (status >= 500) { s5++; errorCount++; }
    else if (status === 0) { errorCount++; }
  });

  return {
    transferredSize: transferred,
    contentSize: content,
    maxDuration: maxDur,
    errorCount,
    status2xx: s2,
    status3xx: s3,
    status4xx: s4,
    status5xx: s5
  };
});

// 全局瀑布流时间区间 (用于百分比计算)
const timeRange = computed(() => {
  if (!archive.value || archive.value.log.entries.length === 0) {
    return { minStart: 0, maxEnd: 1, duration: 1 };
  }
  let minStart = Infinity;
  let maxEnd = -Infinity;

  archive.value.log.entries.forEach(e => {
    const start = e._startTimeMs;
    const end = start + e.time;
    if (start < minStart) minStart = start;
    if (end > maxEnd) maxEnd = end;
  });

  const duration = Math.max(maxEnd - minStart, 10);
  return { minStart, maxEnd, duration };
});

// 计算单条请求瀑布流柱形位置
function getWaterfallBarStyle(entry: HarEntry) {
  const range = timeRange.value;
  const startOffset = Math.max(0, entry._startTimeMs - range.minStart);
  const leftPercent = (startOffset / range.duration) * 100;
  const widthPercent = Math.max((entry.time / range.duration) * 100, 2);

  return {
    left: `${Math.min(leftPercent, 96)}%`,
    width: `${Math.min(widthPercent, 100 - leftPercent)}%`
  };
}

// 筛选后的列表
const filteredEntries = computed(() => {
  if (!archive.value) return [];
  const q = searchQuery.value.trim().toLowerCase();

  return archive.value.log.entries.filter(e => {
    // 错误过滤
    if (onlyErrors.value && e.response.status < 400 && e.response.status !== 0) {
      return false;
    }

    // 方法过滤
    if (selectedMethod.value !== 'ALL' && e.request.method !== selectedMethod.value) {
      return false;
    }

    // 类型过滤
    if (selectedType.value !== 'ALL' && e._resourceType !== selectedType.value) {
      return false;
    }

    // 状态码区间过滤
    if (selectedStatus.value !== 'ALL') {
      const s = e.response.status;
      if (selectedStatus.value === '2xx' && (s < 200 || s >= 300)) return false;
      if (selectedStatus.value === '3xx' && (s < 300 || s >= 400)) return false;
      if (selectedStatus.value === '4xx' && (s < 400 || s >= 500)) return false;
      if (selectedStatus.value === '5xx' && s < 500) return false;
    }

    // 搜索词过滤
    if (q) {
      const url = e.request.url.toLowerCase();
      const status = String(e.response.status);
      const mime = (e.response.content.mimeType || '').toLowerCase();
      const path = e._parsedUrl.pathname.toLowerCase();
      const host = e._parsedUrl.hostname.toLowerCase();
      if (!url.includes(q) && !status.includes(q) && !mime.includes(q) && !path.includes(q) && !host.includes(q)) {
        return false;
      }
    }

    return true;
  });
});

// 复制 cURL 命令
async function copyCurl() {
  if (!selectedEntry.value) return;
  const curl = buildCurlCommand(selectedEntry.value);
  try {
    await navigator.clipboard.writeText(curl);
    copiedCurl.value = true;
    setTimeout(() => { copiedCurl.value = false; }, 1500);
  } catch (err) {
    console.error('Failed to copy cURL', err);
  }
}

// 复制 URL
async function copyUrl() {
  if (!selectedEntry.value) return;
  try {
    await navigator.clipboard.writeText(selectedEntry.value.request.url);
    copiedUrl.value = true;
    setTimeout(() => { copiedUrl.value = false; }, 1500);
  } catch (err) {
    console.error('Failed to copy URL', err);
  }
}

// 复制响应内容
async function copyResponseContent() {
  if (!selectedEntry.value || !selectedEntry.value.response.content.text) return;
  try {
    await navigator.clipboard.writeText(selectedEntry.value.response.content.text);
    copiedResponse.value = true;
    setTimeout(() => { copiedResponse.value = false; }, 1500);
  } catch (err) {
    console.error('Failed to copy response', err);
  }
}

// 格式化当前选中条目响应体（如果是 JSON 则格式化美化）
const formattedResponseBody = computed(() => {
  if (!selectedEntry.value || !selectedEntry.value.response.content.text) return '';
  const text = selectedEntry.value.response.content.text;
  const mime = (selectedEntry.value.response.content.mimeType || '').toLowerCase();
  if (mime.includes('json') || (text.startsWith('{') && text.endsWith('}')) || (text.startsWith('[') && text.endsWith(']'))) {
    try {
      return JSON.stringify(JSON.parse(text), null, 2);
    } catch {
      return text;
    }
  }
  return text;
});

// 格式化当前请求体
const formattedRequestBody = computed(() => {
  if (!selectedEntry.value || !selectedEntry.value.request.postData?.text) return '';
  const text = selectedEntry.value.request.postData.text;
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
});

// 判断响应是否为图片
const isImageResponse = computed(() => {
  if (!selectedEntry.value) return false;
  const mime = (selectedEntry.value.response.content.mimeType || '').toLowerCase();
  return mime.startsWith('image/') || mime.includes('svg');
});

// 生成图片预览 data: URI
const imagePreviewSrc = computed(() => {
  if (!isImageResponse.value || !selectedEntry.value) return '';
  const c = selectedEntry.value.response.content;
  if (!c.text) return '';
  if (c.mimeType.includes('svg')) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(c.text)}`;
  }
  if (c.encoding === 'base64') {
    return `data:${c.mimeType};base64,${c.text}`;
  }
  return `data:${c.mimeType};utf8,${c.text}`;
});
</script>

<template>
  <ToolContainer
    toolId="har-viewer"
    nameKey="tools.harViewer.name"
    descKey="tools.harViewer.desc"
    :icon="Network"
    :wide="true"
    :fullHeight="true"
  >
    <!-- 空状态：拖拽上传 & 示例引导 -->
    <div
      v-if="!archive"
      class="flex-1 flex flex-col items-center justify-center p-6 sm:p-12"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop.prevent="handleDrop"
    >
      <input
        ref="fileInputRef"
        type="file"
        accept=".har,.json,application/json"
        class="hidden"
        @change="handleFileSelect"
      />

      <div
        class="max-w-xl w-full p-8 sm:p-12 rounded-3xl border-2 border-dashed transition-all flex flex-col items-center text-center shadow-xs"
        :class="[
          isDragging
            ? 'border-blue-500 bg-blue-50/50 dark:bg-blue-950/20 scale-[1.01]'
            : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900/60 hover:border-blue-400 dark:hover:border-blue-500'
        ]"
      >
        <div class="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-5 shadow-xs">
          <Upload class="w-8 h-8" />
        </div>

        <h2 class="text-base sm:text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-1.5">
          {{ t('tools.harViewer.uploadTitle') }}
        </h2>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm mb-6 leading-relaxed">
          {{ t('tools.harViewer.uploadDesc') }}
        </p>

        <!-- 错误提示 -->
        <div
          v-if="errorMessage"
          class="flex items-center gap-2 p-3 mb-5 text-xs text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 rounded-xl"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>

        <!-- 操作按钮组 -->
        <div class="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            @click="fileInputRef?.click()"
            class="px-5 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm hover:shadow transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <FileArchive class="w-4 h-4" />
            <span>{{ t('tools.harViewer.selectFile') }}</span>
          </button>

          <button
            type="button"
            @click="loadSample"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <Sparkles class="w-4 h-4 text-amber-500" />
            <span>{{ t('tools.harViewer.loadSample') }}</span>
          </button>

          <button
            type="button"
            @click="isPasteModalOpen = true"
            class="px-4 py-2.5 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-all cursor-pointer inline-flex items-center gap-2"
          >
            <ClipboardPaste class="w-4 h-4 text-blue-500" />
            <span>{{ t('tools.harViewer.pasteHar') }}</span>
          </button>
        </div>
      </div>
    </div>

    <!-- 已加载 HAR 查看器主工作区 -->
    <div v-else class="flex-1 flex flex-col min-h-0 h-full overflow-hidden">
      <!-- 顶部信息栏与 KPI 指标卡片 -->
      <div class="p-3.5 sm:p-4 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 shrink-0 flex flex-col gap-3">
        <!-- 文件信息 & 重置操作 -->
        <div class="flex items-center justify-between flex-wrap gap-2">
          <div class="flex items-center gap-2.5 min-w-0">
            <div class="p-1.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
              <FileArchive class="w-4 h-4" />
            </div>
            <div class="flex flex-col min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-bold text-xs sm:text-sm text-zinc-900 dark:text-zinc-100 truncate" :title="fileName">
                  {{ fileName }}
                </span>
                <span class="text-[11px] font-mono text-zinc-400">
                  ({{ formatBytes(fileSize) }})
                </span>
              </div>
              <span class="text-[11px] text-zinc-400 truncate">
                {{ archive.log.creator.name }} {{ archive.log.creator.version }} · HAR v{{ archive.log.version }}
              </span>
            </div>
          </div>

          <div class="flex items-center gap-2 shrink-0">
            <button
              type="button"
              @click="loadSample"
              class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Sparkles class="w-3.5 h-3.5 text-amber-500" />
              <span>{{ t('tools.harViewer.loadSample') }}</span>
            </button>

            <button
              type="button"
              @click="clearData"
              class="px-2.5 py-1.5 rounded-lg text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCcw class="w-3.5 h-3.5" />
              <span>{{ t('tools.harViewer.clear') }}</span>
            </button>
          </div>
        </div>

        <!-- 4 项 KPI 摘要指标 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
          <!-- 请求总数与错误数 -->
          <div class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col justify-between">
            <span class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ t('tools.harViewer.requestsCount') }}</span>
            <div class="flex items-baseline gap-2 mt-1">
              <span class="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100">{{ totalEntriesCount }}</span>
              <span v-if="metrics.errorCount > 0" class="text-[11px] font-semibold text-rose-600 dark:text-rose-400">
                {{ metrics.errorCount }} {{ locale.startsWith('zh') ? '个异常' : 'errors' }}
              </span>
            </div>
          </div>

          <!-- 传输体积 -->
          <div class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col justify-between">
            <span class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ t('tools.harViewer.transferredSize') }}</span>
            <span class="font-mono text-base font-bold text-blue-600 dark:text-blue-400 mt-1">
              {{ formatBytes(metrics.transferredSize) }}
            </span>
          </div>

          <!-- 原始未压缩体积 -->
          <div class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col justify-between">
            <span class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ t('tools.harViewer.contentSize') }}</span>
            <span class="font-mono text-base font-bold text-zinc-800 dark:text-zinc-200 mt-1">
              {{ formatBytes(metrics.contentSize) }}
            </span>
          </div>

          <!-- 耗时最长请求 -->
          <div class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col justify-between">
            <span class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ locale.startsWith('zh') ? '最长单项耗时' : 'Max Single Latency' }}</span>
            <span class="font-mono text-base font-bold text-purple-600 dark:text-purple-400 mt-1">
              {{ formatDuration(metrics.maxDuration) }}
            </span>
          </div>
        </div>

        <!-- 筛选与搜索工具条 -->
        <div class="flex items-center gap-2 flex-wrap text-xs pt-1">
          <!-- 搜索框 -->
          <div class="relative flex-1 min-w-[200px]">
            <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('tools.harViewer.searchPlaceholder')"
              class="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- 资源类型快捷过滤 Pills -->
          <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700 text-xs overflow-x-auto">
            <button
              v-for="typ in [
                { id: 'ALL', label: t('tools.harViewer.allTypes') },
                { id: 'xhr', label: 'Fetch/XHR' },
                { id: 'js', label: 'JS' },
                { id: 'css', label: 'CSS' },
                { id: 'img', label: 'Img' },
                { id: 'doc', label: 'Doc' }
              ]"
              :key="typ.id"
              type="button"
              @click="selectedType = typ.id"
              class="px-2 py-1 rounded-md text-[11px] font-medium transition-all cursor-pointer whitespace-nowrap"
              :class="selectedType === typ.id ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs font-semibold' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            >
              {{ typ.label }}
            </button>
          </div>

          <!-- 仅看错误切换 -->
          <button
            type="button"
            @click="onlyErrors = !onlyErrors"
            class="px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
            :class="onlyErrors ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-400 font-semibold' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
          >
            <AlertCircle class="w-3.5 h-3.5" />
            <span>{{ t('tools.harViewer.errorsOnly') }}</span>
          </button>
        </div>
      </div>

      <!-- 主分栏工作区：左侧请求列表 + 右侧详情抽屉 -->
      <div class="flex-1 flex min-h-0 overflow-hidden">
        <!-- 左侧表格列表 -->
        <div
          class="flex-1 flex flex-col min-w-0 h-full border-r border-zinc-200/80 dark:border-zinc-800/80 overflow-hidden"
          :class="{ 'hidden md:flex': selectedEntry }"
        >
          <!-- 表头 -->
          <div class="grid grid-cols-12 gap-2 px-3 py-2 bg-zinc-100/70 dark:bg-zinc-900/80 border-b border-zinc-200 dark:border-zinc-800 text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 select-none shrink-0">
            <span class="col-span-5 sm:col-span-4">{{ t('tools.harViewer.table.name') }}</span>
            <span class="col-span-2 sm:col-span-2 text-center">{{ t('tools.harViewer.table.status') }}</span>
            <span class="col-span-2 sm:col-span-1 text-center hidden sm:block">{{ t('tools.harViewer.table.type') }}</span>
            <span class="col-span-2 sm:col-span-2 text-right">{{ t('tools.harViewer.table.size') }}</span>
            <span class="col-span-3 sm:col-span-3 text-right pr-2">{{ t('tools.harViewer.table.time') }} / {{ t('tools.harViewer.table.waterfall') }}</span>
          </div>

          <!-- 列表内容区 -->
          <div class="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60 select-none">
            <div
              v-if="filteredEntries.length === 0"
              class="p-8 text-center text-xs text-zinc-400 dark:text-zinc-500"
            >
              {{ t('tools.harViewer.noEntries') }}
            </div>

            <div
              v-for="entry in filteredEntries"
              :key="entry.id"
              @click="selectedEntry = entry"
              class="grid grid-cols-12 gap-2 px-3 py-2 text-xs items-center cursor-pointer transition-colors"
              :class="[
                selectedEntry?.id === entry.id
                  ? 'bg-blue-50/80 dark:bg-blue-950/40 text-blue-900 dark:text-blue-100 border-l-3 border-blue-600'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 text-zinc-700 dark:text-zinc-300 border-l-3 border-transparent'
              ]"
            >
              <!-- 名称与路径 -->
              <div class="col-span-5 sm:col-span-4 flex items-center gap-2 min-w-0">
                <span
                  class="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold shrink-0 border"
                  :class="[getMethodStyle(entry.request.method).badgeBg, getMethodStyle(entry.request.method).badgeText]"
                >
                  {{ entry.request.method }}
                </span>
                <div class="flex flex-col min-w-0">
                  <span class="font-medium text-xs truncate" :title="entry.request.url">
                    {{ entry._parsedUrl.filename }}
                  </span>
                  <span class="text-[10px] text-zinc-400 dark:text-zinc-500 truncate" :title="entry.request.url">
                    {{ entry._parsedUrl.hostname }}{{ entry._parsedUrl.pathname }}
                  </span>
                </div>
              </div>

              <!-- 状态码 -->
              <div class="col-span-2 sm:col-span-2 flex items-center justify-center">
                <span
                  class="px-1.5 py-0.5 rounded text-[11px] font-mono border"
                  :class="[getStatusStyle(entry.response.status).badgeBg, getStatusStyle(entry.response.status).badgeText]"
                >
                  {{ entry.response.status || '0' }}
                </span>
              </div>

              <!-- 资源类型 -->
              <div class="col-span-2 sm:col-span-1 hidden sm:flex items-center justify-center">
                <span class="text-[11px] uppercase font-mono text-zinc-500 dark:text-zinc-400">
                  {{ entry._resourceType }}
                </span>
              </div>

              <!-- 体积 -->
              <div class="col-span-2 sm:col-span-2 text-right font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                {{ formatBytes(entry.response.bodySize > 0 ? entry.response.bodySize : entry.response.content.size) }}
              </div>

              <!-- 耗时与迷你瀑布流条 -->
              <div class="col-span-3 sm:col-span-3 flex flex-col items-end pr-2 gap-1">
                <span class="font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                  {{ formatDuration(entry.time) }}
                </span>
                <!-- 迷你瀑布条 (横条) -->
                <div class="relative w-full h-1.5 bg-zinc-200/70 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    class="absolute top-0 bottom-0 rounded-full bg-blue-500"
                    :style="getWaterfallBarStyle(entry)"
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 右侧详情抽屉 (Master-Detail Pane) -->
        <div
          v-if="selectedEntry"
          class="flex-1 md:w-[500px] lg:w-[620px] md:flex-none flex flex-col min-w-0 h-full bg-white dark:bg-zinc-900 overflow-hidden"
        >
          <!-- 详情顶栏 -->
          <div class="p-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 flex items-center justify-between gap-2 shrink-0 bg-zinc-50/50 dark:bg-zinc-900/60">
            <div class="flex items-center gap-2 min-w-0">
              <span
                class="px-2 py-0.5 rounded text-xs font-mono font-bold border"
                :class="[getMethodStyle(selectedEntry.request.method).badgeBg, getMethodStyle(selectedEntry.request.method).badgeText]"
              >
                {{ selectedEntry.request.method }}
              </span>
              <span
                class="px-2 py-0.5 rounded text-xs font-mono font-semibold border"
                :class="[getStatusStyle(selectedEntry.response.status).badgeBg, getStatusStyle(selectedEntry.response.status).badgeText]"
              >
                {{ selectedEntry.response.status }} {{ selectedEntry.response.statusText }}
              </span>
            </div>

            <!-- 快捷工具按钮组 (cURL / URL / 关闭) -->
            <div class="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                @click="copyCurl"
                class="px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                :title="locale.startsWith('zh') ? '复制为完整的 cURL 请求命令' : 'Copy as cURL command'"
              >
                <Check v-if="copiedCurl" class="w-3.5 h-3.5 text-emerald-500" />
                <Terminal v-else class="w-3.5 h-3.5 text-blue-500" />
                <span>{{ copiedCurl ? t('tools.harViewer.details.copiedCurl') : t('tools.harViewer.details.copyCurl') }}</span>
              </button>

              <button
                type="button"
                @click="copyUrl"
                class="p-1 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                :title="t('tools.harViewer.details.copyUrl')"
              >
                <Check v-if="copiedUrl" class="w-4 h-4 text-emerald-500" />
                <ExternalLink v-else class="w-4 h-4" />
              </button>

              <button
                type="button"
                @click="selectedEntry = null"
                class="p-1 rounded-md text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                :title="locale.startsWith('zh') ? '关闭详情面板' : 'Close details panel'"
              >
                <X class="w-4 h-4" />
              </button>
            </div>
          </div>

          <!-- URL 标头条 -->
          <div class="px-3.5 py-2 bg-zinc-50 dark:bg-zinc-950/40 border-b border-zinc-200/60 dark:border-zinc-800/60 font-mono text-xs text-zinc-700 dark:text-zinc-300 break-all select-all">
            {{ selectedEntry.request.url }}
          </div>

          <!-- 详情 Tab 切换条 -->
          <div class="flex items-center px-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 text-xs shrink-0 gap-1 bg-white dark:bg-zinc-900">
            <button
              v-for="tab in [
                { id: 'headers', label: t('tools.harViewer.details.headers') },
                { id: 'payload', label: t('tools.harViewer.details.payload') },
                { id: 'response', label: t('tools.harViewer.details.response') },
                { id: 'cookies', label: t('tools.harViewer.details.cookies') },
                { id: 'timing', label: t('tools.harViewer.details.timing') }
              ]"
              :key="tab.id"
              type="button"
              @click="activeDetailTab = tab.id as any"
              class="px-3 py-2.5 font-medium border-b-2 transition-colors cursor-pointer"
              :class="activeDetailTab === tab.id ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-semibold' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            >
              {{ tab.label }}
            </button>
          </div>

          <!-- 详情 Tab 内容区 -->
          <div class="flex-1 overflow-y-auto p-4 select-text space-y-5 text-xs">
            <!-- 1. Headers (标头) -->
            <template v-if="activeDetailTab === 'headers'">
              <!-- 通用信息卡片 -->
              <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 p-3 flex flex-col gap-2">
                <span class="font-semibold text-zinc-800 dark:text-zinc-200">
                  {{ t('tools.harViewer.details.general') }}
                </span>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] font-mono">
                  <div>
                    <span class="text-zinc-400">{{ t('tools.harViewer.details.requestUrl') }}:</span>
                    <span class="text-zinc-800 dark:text-zinc-200 ml-1 break-all">{{ selectedEntry.request.url }}</span>
                  </div>
                  <div>
                    <span class="text-zinc-400">{{ t('tools.harViewer.details.requestMethod') }}:</span>
                    <span class="text-zinc-800 dark:text-zinc-200 ml-1 font-bold">{{ selectedEntry.request.method }}</span>
                  </div>
                  <div>
                    <span class="text-zinc-400">{{ t('tools.harViewer.details.statusCode') }}:</span>
                    <span class="text-zinc-800 dark:text-zinc-200 ml-1 font-bold">{{ selectedEntry.response.status }} {{ selectedEntry.response.statusText }}</span>
                  </div>
                  <div>
                    <span class="text-zinc-400">{{ t('tools.harViewer.details.remoteIp') }}:</span>
                    <span class="text-zinc-800 dark:text-zinc-200 ml-1">{{ selectedEntry.serverIPAddress || 'N/A' }}</span>
                  </div>
                  <div>
                    <span class="text-zinc-400">{{ t('tools.harViewer.details.httpVersion') }}:</span>
                    <span class="text-zinc-800 dark:text-zinc-200 ml-1">{{ selectedEntry.request.httpVersion }}</span>
                  </div>
                  <div>
                    <span class="text-zinc-400">{{ locale.startsWith('zh') ? '开始时间' : 'Started At' }}:</span>
                    <span class="text-zinc-800 dark:text-zinc-200 ml-1">{{ selectedEntry.startedDateTime }}</span>
                  </div>
                </div>
              </div>

              <!-- 响应标头 (Response Headers) -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-zinc-800 dark:text-zinc-200">
                    {{ t('tools.harViewer.details.responseHeaders') }} ({{ selectedEntry.response.headers.length }})
                  </span>
                </div>
                <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono text-[11px]">
                  <div
                    v-for="h in selectedEntry.response.headers"
                    :key="h.name + h.value"
                    class="p-2 flex flex-col sm:flex-row sm:items-start gap-1 bg-white dark:bg-zinc-900"
                  >
                    <span class="text-blue-600 dark:text-blue-400 font-semibold sm:w-44 shrink-0 break-all select-all">{{ h.name }}:</span>
                    <span class="text-zinc-700 dark:text-zinc-300 break-all select-all">{{ h.value }}</span>
                  </div>
                </div>
              </div>

              <!-- 请求标头 (Request Headers) -->
              <div class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-zinc-800 dark:text-zinc-200">
                    {{ t('tools.harViewer.details.requestHeaders') }} ({{ selectedEntry.request.headers.length }})
                  </span>
                </div>
                <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono text-[11px]">
                  <div
                    v-for="h in selectedEntry.request.headers"
                    :key="h.name + h.value"
                    class="p-2 flex flex-col sm:flex-row sm:items-start gap-1 bg-white dark:bg-zinc-900"
                  >
                    <span class="text-purple-600 dark:text-purple-400 font-semibold sm:w-44 shrink-0 break-all select-all">{{ h.name }}:</span>
                    <span class="text-zinc-700 dark:text-zinc-300 break-all select-all">{{ h.value }}</span>
                  </div>
                </div>
              </div>
            </template>

            <!-- 2. Payload (载荷 & Query 参数) -->
            <template v-else-if="activeDetailTab === 'payload'">
              <!-- 查询参数 -->
              <div v-if="selectedEntry.request.queryString.length > 0" class="flex flex-col gap-2">
                <span class="font-semibold text-zinc-800 dark:text-zinc-200">
                  {{ t('tools.harViewer.details.queryString') }} ({{ selectedEntry.request.queryString.length }})
                </span>
                <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono text-[11px]">
                  <div
                    v-for="q in selectedEntry.request.queryString"
                    :key="q.name"
                    class="p-2 flex flex-col sm:flex-row sm:items-start gap-1 bg-white dark:bg-zinc-900"
                  >
                    <span class="text-blue-600 dark:text-blue-400 font-semibold sm:w-44 shrink-0 break-all select-all">{{ q.name }}:</span>
                    <span class="text-zinc-700 dark:text-zinc-300 break-all select-all">{{ q.value }}</span>
                  </div>
                </div>
              </div>

              <!-- POST / PUT 请求体 -->
              <div v-if="selectedEntry.request.postData" class="flex flex-col gap-2">
                <div class="flex items-center justify-between">
                  <span class="font-semibold text-zinc-800 dark:text-zinc-200">
                    {{ t('tools.harViewer.details.requestBody') }}
                  </span>
                  <span class="text-[11px] font-mono text-zinc-400">
                    {{ selectedEntry.request.postData.mimeType }}
                  </span>
                </div>
                <div class="relative">
                  <pre class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto max-h-96 leading-relaxed select-all">{{ formattedRequestBody }}</pre>
                  <div class="absolute top-2 right-2">
                    <CopyButton :text="formattedRequestBody" variant="secondary" />
                  </div>
                </div>
              </div>

              <div
                v-if="selectedEntry.request.queryString.length === 0 && !selectedEntry.request.postData"
                class="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs"
              >
                {{ t('tools.harViewer.details.noPayload') }}
              </div>
            </template>

            <!-- 3. Response (响应内容) -->
            <template v-else-if="activeDetailTab === 'response'">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="font-semibold text-zinc-800 dark:text-zinc-200">
                    {{ t('tools.harViewer.details.responseBody') }}
                  </span>
                  <span class="text-[11px] font-mono text-zinc-400">
                    {{ selectedEntry.response.content.mimeType || 'unknown' }} · {{ formatBytes(selectedEntry.response.content.size) }}
                  </span>
                </div>

                <button
                  v-if="selectedEntry.response.content.text"
                  type="button"
                  @click="copyResponseContent"
                  class="px-2 py-1 rounded text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Check v-if="copiedResponse" class="w-3.5 h-3.5 text-emerald-500" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  <span>{{ copiedResponse ? t('common.copied') : t('tools.harViewer.details.copyResponse') }}</span>
                </button>
              </div>

              <!-- 图片预览 -->
              <div v-if="isImageResponse" class="flex flex-col items-center justify-center p-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100/50 dark:bg-zinc-950/50 gap-3">
                <img :src="imagePreviewSrc" alt="Response Image" class="max-h-64 max-w-full object-contain rounded-lg shadow-xs" />
                <span class="text-[11px] text-zinc-400 font-mono">{{ selectedEntry.response.content.mimeType }}</span>
              </div>

              <!-- 文本/JSON 格式化渲染 -->
              <div v-else-if="selectedEntry.response.content.text" class="relative">
                <pre class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto max-h-[500px] leading-relaxed select-all">{{ formattedResponseBody }}</pre>
              </div>

              <!-- 空响应提示 -->
              <div v-else class="py-12 text-center text-zinc-400 dark:text-zinc-500 text-xs">
                {{ t('tools.harViewer.details.noResponse') }}
              </div>
            </template>

            <!-- 4. Cookies (Cookie 列表) -->
            <template v-else-if="activeDetailTab === 'cookies'">
              <!-- 请求 Cookies -->
              <div class="flex flex-col gap-2">
                <span class="font-semibold text-zinc-800 dark:text-zinc-200">
                  {{ locale.startsWith('zh') ? '请求 Cookies (Request Cookies)' : 'Request Cookies' }} ({{ selectedEntry.request.cookies.length }})
                </span>
                <div
                  v-if="selectedEntry.request.cookies.length > 0"
                  class="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono text-[11px]"
                >
                  <div
                    v-for="c in selectedEntry.request.cookies"
                    :key="c.name"
                    class="p-2.5 flex flex-col gap-1 bg-white dark:bg-zinc-900"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-blue-600 dark:text-blue-400 font-bold select-all">{{ c.name }}</span>
                      <div class="flex items-center gap-1.5 text-[10px]">
                        <span v-if="c.httpOnly" class="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">HttpOnly</span>
                        <span v-if="c.secure" class="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">Secure</span>
                      </div>
                    </div>
                    <span class="text-zinc-700 dark:text-zinc-300 break-all select-all">{{ c.value }}</span>
                  </div>
                </div>
                <div v-else class="p-4 text-center text-zinc-400 text-xs bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  {{ locale.startsWith('zh') ? '无请求 Cookie' : 'No request cookies' }}
                </div>
              </div>

              <!-- 响应 Cookies (Set-Cookie) -->
              <div class="flex flex-col gap-2 pt-2">
                <span class="font-semibold text-zinc-800 dark:text-zinc-200">
                  {{ locale.startsWith('zh') ? '响应设置 Cookies (Response Cookies)' : 'Response Cookies' }} ({{ selectedEntry.response.cookies.length }})
                </span>
                <div
                  v-if="selectedEntry.response.cookies.length > 0"
                  class="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden divide-y divide-zinc-100 dark:divide-zinc-800/80 font-mono text-[11px]"
                >
                  <div
                    v-for="c in selectedEntry.response.cookies"
                    :key="c.name"
                    class="p-2.5 flex flex-col gap-1 bg-white dark:bg-zinc-900"
                  >
                    <div class="flex items-center justify-between">
                      <span class="text-purple-600 dark:text-purple-400 font-bold select-all">{{ c.name }}</span>
                      <div class="flex items-center gap-1.5 text-[10px]">
                        <span v-if="c.httpOnly" class="px-1.5 py-0.2 rounded bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900">HttpOnly</span>
                        <span v-if="c.secure" class="px-1.5 py-0.2 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900">Secure</span>
                      </div>
                    </div>
                    <span class="text-zinc-700 dark:text-zinc-300 break-all select-all">{{ c.value }}</span>
                  </div>
                </div>
                <div v-else class="p-4 text-center text-zinc-400 text-xs bg-zinc-50 dark:bg-zinc-900/40 rounded-xl border border-zinc-200 dark:border-zinc-800">
                  {{ locale.startsWith('zh') ? '无响应 Cookie' : 'No response cookies' }}
                </div>
              </div>
            </template>

            <!-- 5. Timing (详细耗时时序) -->
            <template v-else-if="activeDetailTab === 'timing'">
              <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col gap-3">
                <div class="flex items-center justify-between pb-2 border-b border-zinc-200/60 dark:border-zinc-800/60">
                  <span class="font-bold text-zinc-900 dark:text-zinc-100">{{ t('tools.harViewer.details.timing') }}</span>
                  <span class="font-mono font-bold text-blue-600 dark:text-blue-400">{{ formatDuration(selectedEntry.time) }}</span>
                </div>

                <div class="space-y-2.5 font-mono text-[11px]">
                  <div
                    v-for="item in [
                      { key: 'blocked', label: t('tools.harViewer.timingLabels.blocked'), val: selectedEntry.timings.blocked, color: 'bg-zinc-400' },
                      { key: 'dns', label: t('tools.harViewer.timingLabels.dns'), val: selectedEntry.timings.dns, color: 'bg-teal-500' },
                      { key: 'connect', label: t('tools.harViewer.timingLabels.connect'), val: selectedEntry.timings.connect, color: 'bg-sky-500' },
                      { key: 'ssl', label: t('tools.harViewer.timingLabels.ssl'), val: selectedEntry.timings.ssl, color: 'bg-purple-500' },
                      { key: 'send', label: t('tools.harViewer.timingLabels.send'), val: selectedEntry.timings.send, color: 'bg-amber-500' },
                      { key: 'wait', label: t('tools.harViewer.timingLabels.wait'), val: selectedEntry.timings.wait, color: 'bg-blue-500' },
                      { key: 'receive', label: t('tools.harViewer.timingLabels.receive'), val: selectedEntry.timings.receive, color: 'bg-emerald-500' }
                    ]"
                    :key="item.key"
                    class="flex items-center justify-between gap-3"
                  >
                    <div class="flex items-center gap-2">
                      <span class="w-2.5 h-2.5 rounded-xs shrink-0" :class="item.color"></span>
                      <span class="text-zinc-600 dark:text-zinc-300 font-sans">{{ item.label }}</span>
                    </div>
                    <span class="text-zinc-700 dark:text-zinc-300 font-semibold">{{ formatDuration(item.val) }}</span>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </div>
    </div>

    <!-- 粘贴 HAR JSON 弹窗 -->
    <div
      v-if="isPasteModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <div class="w-full max-w-xl bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 flex flex-col gap-4">
        <div class="flex items-center justify-between pb-2 border-b border-zinc-200 dark:border-zinc-800">
          <div class="flex items-center gap-2">
            <ClipboardPaste class="w-5 h-5 text-blue-500" />
            <span class="font-bold text-sm text-zinc-900 dark:text-zinc-100">
              {{ t('tools.harViewer.pasteDialogTitle') }}
            </span>
          </div>
          <button
            type="button"
            @click="isPasteModalOpen = false"
            class="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <textarea
          v-model="pasteText"
          :placeholder="t('tools.harViewer.pastePlaceholder')"
          rows="10"
          class="w-full p-3 font-mono text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 outline-none focus:border-blue-500"
        ></textarea>

        <div class="flex items-center justify-end gap-2.5">
          <button
            type="button"
            @click="isPasteModalOpen = false"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {{ t('tools.harViewer.cancel') }}
          </button>
          <button
            type="button"
            @click="parsePastedJson"
            :disabled="!pasteText.trim()"
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-40"
          >
            {{ t('tools.harViewer.confirmParse') }}
          </button>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
