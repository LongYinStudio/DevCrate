<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Shapes,
  Sparkles,
  Minimize2,
  Eraser,
  Columns2,
  Rows2,
  Code2,
  Eye,
  SlidersHorizontal,
  FileDown,
  Download,
  Copy,
  Check,
  RotateCw,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  ZoomIn,
  ZoomOut,
  RefreshCw,
  Upload,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Palette,
  Maximize2,
  Move
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import {
  validateSvg,
  analyzeSvg,
  prettifySvg,
  minifySvg,
  cleanSvg,
  transformSvg,
  updateSvgStyling,
  updateSvgDimensions,
  svgToReact,
  svgToVue,
  svgToDataUri,
  svgToHtmlImg,
  svgToCssBg,
  rasterizeSvg,
  downloadFile,
  SAMPLE_SVG_PRESETS,
  type SvgPreset
} from './svgUtils';

const { t } = useI18n();

// 源码与历史基准体积
const svgCode = ref<string>(SAMPLE_SVG_PRESETS[0].svg);
const originalSize = ref<number>(new Blob([SAMPLE_SVG_PRESETS[0].svg]).size);

// 界面布局与当前面板标签
const layoutMode = ref<'split' | 'stack' | 'code' | 'preview'>('split');
const activeTab = ref<'canvas' | 'adjust' | 'export'>('canvas');

// 画布视图状态
const canvasBg = ref<'checkerboard' | 'dark' | 'light' | 'custom'>('checkerboard');
const customBgColor = ref('#0f172a');
const zoom = ref(2);
const panX = ref(0);
const panY = ref(0);
const isPanning = ref(false);
const startPanPos = { x: 0, y: 0 };
const canvasContainerRef = ref<HTMLDivElement | null>(null);

// 快捷调整状态
const customWidth = ref<number | ''>('');
const customHeight = ref<number | ''>('');
const customViewBox = ref('');
const overrideFill = ref('');
const overrideStroke = ref('');
const overrideStrokeWidth = ref<number | ''>('');

// 导出配置状态与下载反馈
const exportFormat = ref<'png' | 'jpeg' | 'webp'>('png');
const exportScale = ref<number>(2);
const exportBgType = ref<'transparent' | 'white' | 'dark' | 'custom'>('transparent');
const customExportBg = ref('#ffffff');
const isExporting = ref(false);
const exportStatus = ref('');
const isSvgDownloaded = ref(false);
const customSvgFileName = ref('vector-graphic.svg');
const globalNotice = ref<{ type: 'success' | 'error'; message: string } | null>(null);

function showNotice(message: string, type: 'success' | 'error' = 'success', duration = 3500) {
  globalNotice.value = { type, message };
  setTimeout(() => {
    if (globalNotice.value?.message === message) {
      globalNotice.value = null;
    }
  }, duration);
}

// 复制状态记录
const copiedCard = ref<string | null>(null);

// 校验与分析
const validation = computed(() => validateSvg(svgCode.value));
const stats = computed(() => analyzeSvg(svgCode.value, originalSize.value));

// 画布平滑动画过渡控制（拖拽与滚轮时禁用过渡以防止动态模糊）
const isSmoothTransition = ref(false);

function triggerSmoothTransition() {
  isSmoothTransition.value = true;
  setTimeout(() => {
    isSmoothTransition.value = false;
  }, 180);
}

// 画布预览安全清洗、尺寸动态缩放与高精度矢量渲染
const previewSvgHtml = computed(() => {
  if (!validation.value.isValid) return '';
  let clean = svgCode.value
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\bon[a-z]+\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, '');

  const match = clean.match(/<svg\b([^>]*)>/i);
  if (!match) return clean;

  const origW = stats.value.width || 120;
  const origH = stats.value.height || 120;
  const currentZoom = zoom.value || 1;
  const targetW = Math.max(1, Math.round(origW * currentZoom));
  const targetH = Math.max(1, Math.round(origH * currentZoom));

  let attrs = match[1];

  // 1. 确保存在 viewBox，若无则自动注入原始视口，确保放大缩小按真实矢量比例计算
  if (!/\bviewBox\s*=/i.test(attrs)) {
    attrs += ` viewBox="0 0 ${origW} ${origH}"`;
  }

  // 2. 将 SVG 物理尺寸直接设置为目标缩放像素，使浏览器矢量光栅引擎直接按高分辨率精准重绘，彻底解决 CSS scale 导致的模糊走样
  if (/\bwidth\s*=\s*["'][^"']*["']/i.test(attrs)) {
    attrs = attrs.replace(/\bwidth\s*=\s*["'][^"']*["']/i, `width="${targetW}px"`);
  } else {
    attrs += ` width="${targetW}px"`;
  }

  if (/\bheight\s*=\s*["'][^"']*["']/i.test(attrs)) {
    attrs = attrs.replace(/\bheight\s*=\s*["'][^"']*["']/i, `height="${targetH}px"`);
  } else {
    attrs += ` height="${targetH}px"`;
  }

  // 3. 规范化内联 style 属性，避免 style 中旧宽高覆盖属性
  if (/style=["'][^"']*["']/i.test(attrs)) {
    attrs = attrs.replace(/style=(["'])([^"']*)\1/i, (_, quote, content) => {
      const filtered = content
        .split(';')
        .map((s: string) => s.trim())
        .filter((s: string) => s && !s.startsWith('width:') && !s.startsWith('height:'))
        .join('; ');
      return `style=${quote}width: ${targetW}px; height: ${targetH}px; ${filtered}${quote}`;
    });
  } else {
    attrs += ` style="width: ${targetW}px; height: ${targetH}px;"`;
  }

  // 4. 注入高精度几何与文本渲染提示
  if (!/\bshape-rendering\s*=/i.test(attrs)) {
    attrs += ' shape-rendering="geometricPrecision"';
  }
  if (!/\btext-rendering\s*=/i.test(attrs)) {
    attrs += ' text-rendering="geometricPrecision"';
  }

  return clean.replace(/<svg\b[^>]*>/i, '<svg' + attrs + '>');
});

// 前端组件与数据代码导出缓存
const reactSnippet = computed(() => svgToReact(svgCode.value));
const vueSnippet = computed(() => svgToVue(svgCode.value));
const dataUriBase64 = computed(() => svgToDataUri(svgCode.value, 'base64'));
const dataUriUtf8 = computed(() => svgToDataUri(svgCode.value, 'utf8'));
const htmlImgSnippet = computed(() => svgToHtmlImg(svgCode.value));
const cssBgSnippet = computed(() => svgToCssBg(svgCode.value));

// 工具栏核心动作
function formatCode() {
  if (!svgCode.value.trim()) return;
  svgCode.value = prettifySvg(svgCode.value);
}

function minifyCode() {
  if (!svgCode.value.trim()) return;
  svgCode.value = minifySvg(svgCode.value, {
    stripComments: true,
    stripMetadata: true,
    stripEmptyGroups: true,
    precision: 2
  });
}

function cleanJunk() {
  if (!svgCode.value.trim()) return;
  svgCode.value = cleanSvg(svgCode.value);
}

function clearCode() {
  svgCode.value = '';
  originalSize.value = 0;
}

function loadPreset(preset: SvgPreset) {
  svgCode.value = preset.svg;
  originalSize.value = new Blob([preset.svg]).size;
  customSvgFileName.value = `${preset.id}.svg`;
  resetView();
  fitToCanvas();
}

// 文件导入
function triggerFileInput() {
  const fileInput = document.getElementById('svgFileInput') as HTMLInputElement;
  if (fileInput) {
    fileInput.value = '';
    fileInput.click();
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (e) => {
    const text = e.target?.result as string;
    if (text) {
      svgCode.value = text;
      originalSize.value = file.size;
      customSvgFileName.value = file.name;
      resetView();
      setTimeout(fitToCanvas, 50);
    }
  };
  reader.readAsText(file);
}

function handleDragOver(e: DragEvent) {
  e.preventDefault();
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  const file = e.dataTransfer?.files?.[0];
  if (!file || !file.name.toLowerCase().endsWith('.svg')) return;

  const reader = new FileReader();
  reader.onload = (ev) => {
    const text = ev.target?.result as string;
    if (text) {
      svgCode.value = text;
      originalSize.value = file.size;
      customSvgFileName.value = file.name;
      resetView();
      setTimeout(fitToCanvas, 50);
    }
  };
  reader.readAsText(file);
}

// 快速变换与属性应用
function applyTransform(action: 'rotate90' | 'rotateMinus90' | 'flipH' | 'flipV' | 'invertColors') {
  svgCode.value = transformSvg(svgCode.value, action);
}

function applyDimensionPreset(w: number, h: number) {
  customWidth.value = w;
  customHeight.value = h;
  svgCode.value = updateSvgDimensions(svgCode.value, {
    width: w,
    height: h,
    fixMissingViewBox: true
  });
}

function applyCustomDimensions() {
  svgCode.value = updateSvgDimensions(svgCode.value, {
    width: customWidth.value !== '' ? Number(customWidth.value) : null,
    height: customHeight.value !== '' ? Number(customHeight.value) : null,
    viewBox: customViewBox.value.trim() ? customViewBox.value.trim() : null
  });
}

function makeResponsive() {
  svgCode.value = updateSvgDimensions(svgCode.value, { makeResponsive: true });
}

function fixMissingViewBox() {
  svgCode.value = updateSvgDimensions(svgCode.value, { fixMissingViewBox: true });
}

function applyColorStyling() {
  svgCode.value = updateSvgStyling(svgCode.value, {
    fill: overrideFill.value.trim() ? overrideFill.value.trim() : undefined,
    stroke: overrideStroke.value.trim() ? overrideStroke.value.trim() : undefined,
    strokeWidth: overrideStrokeWidth.value !== '' ? Number(overrideStrokeWidth.value) : undefined
  });
}

// 画布缩放和平移交互
function onWheel(e: WheelEvent) {
  isSmoothTransition.value = false;
  const delta = e.deltaY < 0 ? 0.25 : -0.25;
  zoom.value = Math.max(0.1, Math.min(10, Number((zoom.value + delta).toFixed(2))));
}

function zoomIn() {
  triggerSmoothTransition();
  zoom.value = Math.min(10, Number((zoom.value + 0.25).toFixed(2)));
}

function zoomOut() {
  triggerSmoothTransition();
  zoom.value = Math.max(0.1, Number((zoom.value - 0.25).toFixed(2)));
}

function startPan(e: MouseEvent) {
  if (e.button !== 0) return; // 仅左键响应拖拽
  isSmoothTransition.value = false;
  isPanning.value = true;
  startPanPos.x = e.clientX - panX.value;
  startPanPos.y = e.clientY - panY.value;
}

function doPan(e: MouseEvent) {
  if (!isPanning.value) return;
  panX.value = Math.round(e.clientX - startPanPos.x);
  panY.value = Math.round(e.clientY - startPanPos.y);
}

function endPan() {
  isPanning.value = false;
}

function resetView() {
  triggerSmoothTransition();
  zoom.value = 1;
  panX.value = 0;
  panY.value = 0;
}

function fitToCanvas() {
  if (!canvasContainerRef.value) return;
  const rect = canvasContainerRef.value.getBoundingClientRect();
  const w = stats.value.width || 120;
  const h = stats.value.height || 120;
  if (w <= 0 || h <= 0) return;

  const pad = 64;
  const availW = Math.max(80, rect.width - pad);
  const availH = Math.max(80, rect.height - pad);
  const scale = Math.min(availW / w, availH / h);
  triggerSmoothTransition();
  zoom.value = Math.max(0.2, Math.min(8, Number(scale.toFixed(2))));
  panX.value = 0;
  panY.value = 0;
}

// 导出与下载
async function handleExportRaster() {
  if (!validation.value.isValid) return;
  isExporting.value = true;
  exportStatus.value = '';

  let bg: string | undefined = undefined;
  if (exportBgType.value === 'white') bg = '#ffffff';
  else if (exportBgType.value === 'dark') bg = '#09090b';
  else if (exportBgType.value === 'custom') bg = customExportBg.value;

  try {
    const res = await rasterizeSvg(svgCode.value, exportFormat.value, exportScale.value, bg);
    const ext = exportFormat.value === 'jpeg' ? 'jpg' : exportFormat.value;
    const baseName = customSvgFileName.value.replace(/\.svg$/i, '') || 'icon';
    const filename = `${baseName}-${res.width}x${res.height}.${ext}`;
    downloadFile(res.blob, filename, res.blob.type);
    showNotice(t('tools.svgEditor.rasterDownloadedNotice', { filename }));
    exportStatus.value = t('tools.svgEditor.exportSuccess', { name: filename });
    setTimeout(() => {
      exportStatus.value = '';
    }, 4000);
  } catch (err: any) {
    exportStatus.value = err?.message || t('tools.svgEditor.exportFailed');
  } finally {
    isExporting.value = false;
  }
}

function handleDownloadSvg() {
  if (!validation.value.isValid) return;
  let filename = customSvgFileName.value.trim() || 'vector-graphic.svg';
  if (!filename.toLowerCase().endsWith('.svg')) {
    filename += '.svg';
  }
  downloadFile(svgCode.value, filename, 'image/svg+xml');
  isSvgDownloaded.value = true;
  showNotice(t('tools.svgEditor.svgDownloadedNotice', { filename }));
  setTimeout(() => {
    isSvgDownloaded.value = false;
  }, 2500);
}

async function copySnippet(key: string, text: string) {
  try {
    await navigator.clipboard.writeText(text);
    copiedCard.value = key;
    setTimeout(() => {
      if (copiedCard.value === key) copiedCard.value = null;
    }, 2000);
  } catch (e) {
    console.error('Failed to copy', e);
  }
}

// 格式化可读字节数
function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

// 初始化自适应缩放
onMounted(() => {
  setTimeout(() => {
    fitToCanvas();
  }, 100);
});

watch(svgCode, (newVal) => {
  if (originalSize.value === 0 && newVal.trim()) {
    originalSize.value = new Blob([newVal]).size;
  }
});
</script>

<template>
  <ToolContainer
    toolId="svg-editor"
    nameKey="tools.svgEditor.name"
    descKey="tools.svgEditor.desc"
    :icon="Shapes"
    :wide="true"
    :fullHeight="true"
  >
    <!-- 顶部操作工具栏 -->
    <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0 select-none">
      <!-- 左侧操作组：格式化、压缩、净化、排版切换 -->
      <div class="flex flex-wrap items-center gap-1.5">
        <!-- 格式化美化 -->
        <button
          type="button"
          @click="formatCode"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-xs"
          :title="t('tools.svgEditor.formatDesc')"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ t('tools.svgEditor.format') }}</span>
        </button>

        <!-- 极致压缩 -->
        <button
          type="button"
          @click="minifyCode"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer"
          :title="t('tools.svgEditor.minifyDesc')"
        >
          <Minimize2 class="w-3.5 h-3.5" />
          <span>{{ t('tools.svgEditor.minify') }}</span>
        </button>

        <!-- 深度净化 -->
        <button
          type="button"
          @click="cleanJunk"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer"
          :title="t('tools.svgEditor.cleanDesc')"
        >
          <Eraser class="w-3.5 h-3.5 text-amber-500" />
          <span>{{ t('tools.svgEditor.clean') }}</span>
        </button>

        <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-0.5"></div>

        <!-- 布局切换 -->
        <div class="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/70">
          <button
            type="button"
            @click="layoutMode = 'split'"
            class="p-1.5 rounded-md transition-colors cursor-pointer"
            :class="layoutMode === 'split' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            :title="t('tools.svgEditor.layoutSplit')"
          >
            <Columns2 class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            @click="layoutMode = 'stack'"
            class="p-1.5 rounded-md transition-colors cursor-pointer"
            :class="layoutMode === 'stack' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            :title="t('tools.svgEditor.layoutStack')"
          >
            <Rows2 class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            @click="layoutMode = 'code'"
            class="p-1.5 rounded-md transition-colors cursor-pointer"
            :class="layoutMode === 'code' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            :title="t('tools.svgEditor.layoutCodeOnly')"
          >
            <Code2 class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            @click="layoutMode = 'preview'"
            class="p-1.5 rounded-md transition-colors cursor-pointer"
            :class="layoutMode === 'preview' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            :title="t('tools.svgEditor.layoutPreviewOnly')"
          >
            <Eye class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- 右侧操作组：样例库、导入、清空 -->
      <div class="flex items-center gap-1.5">
        <!-- 样例库快捷按钮组 -->
        <div class="hidden sm:flex items-center gap-1">
          <button
            v-for="preset in SAMPLE_SVG_PRESETS"
            :key="preset.id"
            type="button"
            @click="loadPreset(preset)"
            class="px-2 py-1 rounded-md text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 transition-colors cursor-pointer"
          >
            {{ t(preset.nameKey) }}
          </button>
        </div>

        <!-- 隐藏式文件导入 -->
        <input
          id="svgFileInput"
          type="file"
          accept=".svg,image/svg+xml"
          class="hidden"
          @change="handleFileChange"
        />

        <button
          type="button"
          @click="triggerFileInput"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer"
          :title="t('tools.svgEditor.importFile')"
        >
          <Upload class="w-3.5 h-3.5" />
          <span>{{ t('tools.svgEditor.importFile') }}</span>
        </button>

        <button
          type="button"
          @click="clearCode"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
          :title="t('common.clear')"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 主展示工作区 -->
    <div
      class="flex-1 min-h-0 mt-3"
      :class="[
        layoutMode === 'split' ? 'grid grid-cols-1 lg:grid-cols-2 gap-3.5 h-full' : '',
        layoutMode === 'stack' ? 'flex flex-col gap-3.5 h-full' : '',
        layoutMode === 'code' ? 'flex flex-col h-full' : '',
        layoutMode === 'preview' ? 'flex flex-col h-full' : ''
      ]"
    >
      <!-- 左侧：SVG 源码编辑区 -->
      <div
        v-show="layoutMode !== 'preview'"
        class="flex flex-col h-full min-h-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden"
        :class="layoutMode === 'split' ? 'flex-1' : layoutMode === 'stack' ? 'h-1/2' : 'h-full'"
        @dragover="handleDragOver"
        @drop="handleDrop"
      >
        <!-- 源码卡片头部 -->
        <div class="px-3.5 py-2.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 flex items-center justify-between gap-2 shrink-0">
          <div class="flex items-center gap-2">
            <Code2 class="w-4 h-4 text-zinc-500" />
            <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-200">{{ t('tools.svgEditor.codeHeader') }}</span>
            
            <!-- 语法状态药丸 -->
            <span
              v-if="validation.isValid"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-900/50"
            >
              <CheckCircle2 class="w-3 h-3" />
              <span>{{ t('tools.svgEditor.validSvg') }}</span>
            </span>
            <span
              v-else
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/50"
            >
              <AlertCircle class="w-3 h-3" />
              <span>{{ t('tools.svgEditor.syntaxError') }}</span>
            </span>
          </div>

          <!-- 源码体积与压缩率指标 -->
          <div class="flex items-center gap-2 text-[11px] text-zinc-500">
            <span>{{ formatBytes(stats.currentSize) }}</span>
            <span
              v-if="stats.savingsPercent > 0"
              class="px-1.5 py-0.2 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
            >
              -{{ stats.savingsPercent }}%
            </span>
          </div>
        </div>

        <!-- 文本编辑器 -->
        <div class="flex-1 min-h-0 relative">
          <TextEditorBox
            v-model="svgCode"
            :showLineNumbers="true"
            :showWrapToggle="true"
            :defaultWrap="true"
            :showClear="false"
            placeholder="<svg ...></svg>"
            class="h-full border-0 rounded-none shadow-none"
          />
        </div>

        <!-- 错误提示横幅 -->
        <div
          v-if="!validation.isValid && validation.errorMessage"
          class="px-3.5 py-2 bg-rose-50 dark:bg-rose-950/40 border-t border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-300 text-xs flex items-center gap-2 shrink-0"
        >
          <AlertCircle class="w-4 h-4 shrink-0 text-rose-500" />
          <span class="truncate">{{ validation.errorMessage }}</span>
        </div>
      </div>

      <!-- 右侧：可视化画布与工具控制台 -->
      <div
        v-show="layoutMode !== 'code'"
        class="flex flex-col h-full min-h-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden relative"
        :class="layoutMode === 'split' ? 'flex-1' : layoutMode === 'stack' ? 'h-1/2' : 'h-full'"
      >
        <!-- 下载成功与操作浮动气泡反馈 -->
        <transition
          enter-active-class="transition duration-200 ease-out"
          enter-from-class="opacity-0 -translate-y-2 scale-95"
          enter-to-class="opacity-100 translate-y-0 scale-100"
          leave-active-class="transition duration-150 ease-in"
          leave-from-class="opacity-100 translate-y-0 scale-100"
          leave-to-class="opacity-0 -translate-y-2 scale-95"
        >
          <div
            v-if="globalNotice"
            class="absolute top-12 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-3.5 py-1.5 rounded-full shadow-lg border text-xs font-medium backdrop-blur-md pointer-events-none select-none"
            :class="globalNotice.type === 'success' ? 'bg-emerald-600 text-white border-emerald-500 shadow-emerald-500/20' : 'bg-rose-600 text-white border-rose-500 shadow-rose-500/20'"
          >
            <CheckCircle2 class="w-3.5 h-3.5 shrink-0" />
            <span>{{ globalNotice.message }}</span>
          </div>
        </transition>

        <!-- 控制台选项卡切换 -->
        <div class="px-3.5 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/40 flex items-center justify-between gap-2 shrink-0">
          <div class="inline-flex items-center p-0.5 rounded-lg bg-zinc-200/70 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/60">
            <button
              type="button"
              @click="activeTab = 'canvas'"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
              :class="activeTab === 'canvas' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'"
            >
              <Eye class="w-3.5 h-3.5" />
              <span>{{ t('tools.svgEditor.tabCanvas') }}</span>
            </button>
            <button
              type="button"
              @click="activeTab = 'adjust'"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
              :class="activeTab === 'adjust' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'"
            >
              <SlidersHorizontal class="w-3.5 h-3.5" />
              <span>{{ t('tools.svgEditor.tabAdjust') }}</span>
            </button>
            <button
              type="button"
              @click="activeTab = 'export'"
              class="inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
              :class="activeTab === 'export' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100'"
            >
              <FileDown class="w-3.5 h-3.5" />
              <span>{{ t('tools.svgEditor.tabExport') }}</span>
            </button>
          </div>

          <!-- 快速下载 SVG 按钮 -->
          <button
            type="button"
            @click="handleDownloadSvg"
            class="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            :class="isSvgDownloaded ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'"
            :title="t('tools.svgEditor.downloadSvg')"
          >
            <component :is="isSvgDownloaded ? Check : Download" class="w-3.5 h-3.5" :class="isSvgDownloaded ? 'text-emerald-600 dark:text-emerald-400' : ''" />
            <span class="hidden sm:inline">{{ isSvgDownloaded ? t('tools.svgEditor.downloaded') : t('tools.svgEditor.downloadSvg') }}</span>
          </button>
        </div>

        <!-- 选项卡 1：交互式矢量画布 -->
        <div v-show="activeTab === 'canvas'" class="flex-1 flex flex-col min-h-0 relative">
          <!-- 画布浮动控制工具条 -->
          <div class="px-3 py-2 border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-xs flex flex-wrap items-center justify-between gap-2 text-xs shrink-0 select-none z-10">
            <!-- 底色方案切换 -->
            <div class="flex items-center gap-1.5">
              <span class="text-zinc-500 font-medium">{{ t('tools.svgEditor.background') }}:</span>
              <div class="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                <button
                  type="button"
                  @click="canvasBg = 'checkerboard'"
                  class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  :class="canvasBg === 'checkerboard' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
                >
                  {{ t('tools.svgEditor.bgCheckerboard') }}
                </button>
                <button
                  type="button"
                  @click="canvasBg = 'dark'"
                  class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  :class="canvasBg === 'dark' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
                >
                  {{ t('tools.svgEditor.bgDark') }}
                </button>
                <button
                  type="button"
                  @click="canvasBg = 'light'"
                  class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  :class="canvasBg === 'light' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
                >
                  {{ t('tools.svgEditor.bgLight') }}
                </button>
                <button
                  type="button"
                  @click="canvasBg = 'custom'"
                  class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  :class="canvasBg === 'custom' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
                >
                  {{ t('tools.svgEditor.bgCustom') }}
                </button>
              </div>

              <input
                v-if="canvasBg === 'custom'"
                type="color"
                v-model="customBgColor"
                class="w-6 h-6 rounded border border-zinc-200 dark:border-zinc-700 cursor-pointer p-0"
              />
            </div>

            <!-- 缩放与居中控制 -->
            <div class="flex items-center gap-1.5">
              <button
                type="button"
                @click="zoomOut"
                class="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                :title="t('tools.svgEditor.zoomOut')"
              >
                <ZoomOut class="w-3.5 h-3.5" />
              </button>

              <span class="min-w-12 text-center font-mono text-[11px] font-semibold text-zinc-700 dark:text-zinc-300">
                {{ Math.round(zoom * 100) }}%
              </span>

              <button
                type="button"
                @click="zoomIn"
                class="p-1 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer"
                :title="t('tools.svgEditor.zoomIn')"
              >
                <ZoomIn class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                @click="resetView"
                class="px-2 py-0.5 rounded text-[11px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                100%
              </button>

              <button
                type="button"
                @click="fitToCanvas"
                class="px-2 py-0.5 rounded text-[11px] bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 cursor-pointer"
              >
                {{ t('tools.svgEditor.fit') }}
              </button>
            </div>
          </div>

          <!-- 交互视口画布容器 -->
          <div
            ref="canvasContainerRef"
            class="flex-1 min-h-0 relative overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
            :class="[
              canvasBg === 'checkerboard' ? 'svg-checkerboard-light dark:svg-checkerboard-dark' : '',
              canvasBg === 'dark' ? 'bg-zinc-950 text-white' : '',
              canvasBg === 'light' ? 'bg-white text-zinc-900' : ''
            ]"
            :style="canvasBg === 'custom' ? { backgroundColor: customBgColor } : {}"
            @wheel.prevent="onWheel"
            @mousedown="startPan"
            @mousemove="doPan"
            @mouseup="endPan"
            @mouseleave="endPan"
          >
            <!-- 矢量内容渲染容器 -->
            <div
              v-if="validation.isValid"
              class="flex items-center justify-center pointer-events-none select-none"
              :class="isSmoothTransition ? 'transition-all duration-150 ease-out' : 'transition-none'"
              :style="{
                transform: `translate3d(${panX}px, ${panY}px, 0)`,
                transformOrigin: 'center center'
              }"
              v-html="previewSvgHtml"
            ></div>

            <!-- 语法错误提示占位 -->
            <div v-else class="text-center p-6 text-zinc-400 dark:text-zinc-500 pointer-events-none">
              <AlertCircle class="w-10 h-10 mx-auto mb-2 text-rose-500/80" />
              <p class="text-xs">{{ t('tools.svgEditor.invalidPreview') }}</p>
            </div>

            <!-- 画布右下角快捷提示 -->
            <div class="absolute bottom-3 right-3 pointer-events-none px-2 py-1 rounded bg-black/60 backdrop-blur-md text-white/90 text-[10px] flex items-center gap-2 font-mono">
              <span v-if="stats.viewBox">viewBox: {{ stats.viewBox }}</span>
              <span v-else-if="stats.width && stats.height">{{ stats.width }} × {{ stats.height }} px</span>
              <span class="opacity-60">|</span>
              <span>{{ t('tools.svgEditor.elementsCount', { count: stats.elementCount }) }}</span>
            </div>
          </div>
        </div>

        <!-- 选项卡 2：属性快捷微调面板 -->
        <div v-show="activeTab === 'adjust'" class="flex-1 overflow-y-auto p-4 space-y-5 text-xs text-zinc-700 dark:text-zinc-200">
          <!-- 尺寸与 ViewBox 区域 -->
          <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <Maximize2 class="w-3.5 h-3.5 text-blue-500" />
                {{ t('tools.svgEditor.dimensionsTitle') }}
              </span>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  @click="makeResponsive"
                  class="px-2 py-1 rounded text-[11px] font-medium bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                  :title="t('tools.svgEditor.makeResponsiveDesc')"
                >
                  {{ t('tools.svgEditor.makeResponsive') }}
                </button>
                <button
                  type="button"
                  @click="fixMissingViewBox"
                  class="px-2 py-1 rounded text-[11px] font-medium bg-zinc-200/80 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 transition-colors cursor-pointer"
                >
                  {{ t('tools.svgEditor.fixViewBox') }}
                </button>
              </div>
            </div>

            <!-- 常用尺寸预设芯片 -->
            <div class="flex flex-wrap items-center gap-1.5">
              <span class="text-zinc-500 mr-1">{{ t('tools.svgEditor.presets') }}:</span>
              <button
                v-for="size in [16, 24, 32, 48, 64, 128, 256]"
                :key="size"
                type="button"
                @click="applyDimensionPreset(size, size)"
                class="px-2 py-0.5 rounded text-[11px] bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:border-blue-500 dark:hover:border-blue-400 transition-colors cursor-pointer"
              >
                {{ size }}×{{ size }}
              </button>
            </div>

            <!-- 自定义宽高与 ViewBox 输入行 -->
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
              <div>
                <label class="block text-[11px] text-zinc-500 mb-1">{{ t('tools.svgEditor.width') }} (px)</label>
                <input
                  type="number"
                  v-model.number="customWidth"
                  :placeholder="String(stats.width || '100')"
                  class="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-[11px] text-zinc-500 mb-1">{{ t('tools.svgEditor.height') }} (px)</label>
                <input
                  type="number"
                  v-model.number="customHeight"
                  :placeholder="String(stats.height || '100')"
                  class="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label class="block text-[11px] text-zinc-500 mb-1">viewBox</label>
                <div class="flex gap-1.5">
                  <input
                    type="text"
                    v-model="customViewBox"
                    :placeholder="stats.viewBox || '0 0 100 100'"
                    class="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                  />
                  <button
                    type="button"
                    @click="applyCustomDimensions"
                    class="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors cursor-pointer shrink-0"
                  >
                    {{ t('common.apply') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 色彩与描边覆盖 -->
          <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
            <span class="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Palette class="w-3.5 h-3.5 text-blue-500" />
              {{ t('tools.svgEditor.stylingTitle') }}
            </span>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <!-- 填充色 -->
              <div>
                <label class="block text-[11px] text-zinc-500 mb-1.5">{{ t('tools.svgEditor.fillColor') }}</label>
                <div class="flex items-center gap-1.5">
                  <input
                    type="text"
                    v-model="overrideFill"
                    placeholder="currentColor / none / #3b82f6"
                    class="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none"
                  />
                  <button
                    type="button"
                    @click="overrideFill = 'currentColor'"
                    class="px-2 py-1 rounded bg-zinc-200/70 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[11px] font-mono cursor-pointer shrink-0"
                  >
                    current
                  </button>
                  <button
                    type="button"
                    @click="overrideFill = 'none'"
                    class="px-2 py-1 rounded bg-zinc-200/70 hover:bg-zinc-300 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-[11px] font-mono cursor-pointer shrink-0"
                  >
                    none
                  </button>
                </div>
              </div>

              <!-- 描边色与宽度 -->
              <div>
                <label class="block text-[11px] text-zinc-500 mb-1.5">{{ t('tools.svgEditor.strokeColor') }} & {{ t('tools.svgEditor.strokeWidth') }}</label>
                <div class="flex items-center gap-1.5">
                  <input
                    type="text"
                    v-model="overrideStroke"
                    placeholder="currentColor / #000"
                    class="flex-1 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none"
                  />
                  <input
                    type="number"
                    v-model.number="overrideStrokeWidth"
                    placeholder="2"
                    step="0.5"
                    class="w-16 px-2 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none text-center"
                  />
                  <button
                    type="button"
                    @click="applyColorStyling"
                    class="px-2.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors cursor-pointer shrink-0"
                  >
                    {{ t('common.apply') }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- 几何变换与旋转 -->
          <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
            <span class="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Move class="w-3.5 h-3.5 text-blue-500" />
              {{ t('tools.svgEditor.transformTitle') }}
            </span>

            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                @click="applyTransform('rotate90')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <RotateCw class="w-3.5 h-3.5 text-blue-500" />
                <span>{{ t('tools.svgEditor.rotate90Cw') }}</span>
              </button>

              <button
                type="button"
                @click="applyTransform('rotateMinus90')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <RotateCcw class="w-3.5 h-3.5 text-blue-500" />
                <span>{{ t('tools.svgEditor.rotate90Ccw') }}</span>
              </button>

              <button
                type="button"
                @click="applyTransform('flipH')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <FlipHorizontal class="w-3.5 h-3.5 text-indigo-500" />
                <span>{{ t('tools.svgEditor.flipH') }}</span>
              </button>

              <button
                type="button"
                @click="applyTransform('flipV')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <FlipVertical class="w-3.5 h-3.5 text-indigo-500" />
                <span>{{ t('tools.svgEditor.flipV') }}</span>
              </button>

              <button
                type="button"
                @click="applyTransform('invertColors')"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <RefreshCw class="w-3.5 h-3.5 text-amber-500" />
                <span>{{ t('tools.svgEditor.invertColors') }}</span>
              </button>
            </div>
          </div>
        </div>

        <!-- 选项卡 3：导出与多端代码生成面板 -->
        <div v-show="activeTab === 'export'" class="flex-1 overflow-y-auto p-4 space-y-4 text-xs text-zinc-700 dark:text-zinc-200">
          <!-- SVG 矢量源文件下载卡片 -->
          <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                <FileDown class="w-3.5 h-3.5 text-blue-500" />
                {{ t('tools.svgEditor.downloadSvgCardTitle') }}
              </span>
              <span class="text-[11px] text-zinc-400 font-mono">{{ formatBytes(stats.currentSize) }}</span>
            </div>

            <p class="text-[11px] text-zinc-500">{{ t('tools.svgEditor.downloadSvgCardDesc') }}</p>

            <div class="flex items-center gap-2">
              <div class="flex-1">
                <input
                  type="text"
                  v-model="customSvgFileName"
                  :placeholder="customSvgFileName || 'vector-graphic.svg'"
                  class="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs font-mono outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <button
                type="button"
                @click="handleDownloadSvg"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer shrink-0"
                :class="isSvgDownloaded ? 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-xs' : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'"
              >
                <component :is="isSvgDownloaded ? Check : Download" class="w-3.5 h-3.5" />
                <span>{{ isSvgDownloaded ? t('tools.svgEditor.downloaded') : t('tools.svgEditor.downloadSvg') }}</span>
              </button>
            </div>
          </div>

          <!-- 位图导出卡片 -->
          <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-3">
            <span class="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Download class="w-3.5 h-3.5 text-blue-500" />
              {{ t('tools.svgEditor.rasterExportTitle') }}
            </span>

            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              <!-- 格式 -->
              <div>
                <label class="block text-[11px] text-zinc-500 mb-1">{{ t('tools.svgEditor.exportFormat') }}</label>
                <select
                  v-model="exportFormat"
                  class="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none"
                >
                  <option value="png">PNG (透明图)</option>
                  <option value="jpeg">JPEG (照片压缩)</option>
                  <option value="webp">WebP (现代格式)</option>
                </select>
              </div>

              <!-- 分辨率倍率 -->
              <div>
                <label class="block text-[11px] text-zinc-500 mb-1">{{ t('tools.svgEditor.exportScale') }}</label>
                <select
                  v-model.number="exportScale"
                  class="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none"
                >
                  <option :value="1">1x 标准尺寸</option>
                  <option :value="2">2x 视网膜 Retina</option>
                  <option :value="4">4x 超清矢量光栅</option>
                  <option :value="8">8x 极致印刷级</option>
                </select>
              </div>

              <!-- 背景色 -->
              <div>
                <label class="block text-[11px] text-zinc-500 mb-1">{{ t('tools.svgEditor.exportBg') }}</label>
                <select
                  v-model="exportBgType"
                  class="w-full px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs outline-none"
                >
                  <option value="transparent">{{ t('tools.svgEditor.bgTransparent') }}</option>
                  <option value="white">{{ t('tools.svgEditor.bgWhite') }}</option>
                  <option value="dark">{{ t('tools.svgEditor.bgBlack') }}</option>
                  <option value="custom">{{ t('tools.svgEditor.bgCustom') }}</option>
                </select>
              </div>
            </div>

            <div class="flex items-center justify-between pt-1">
              <span v-if="exportStatus" class="text-xs text-blue-600 dark:text-blue-400 font-medium">{{ exportStatus }}</span>
              <span v-else class="text-zinc-400 text-[11px]">
                {{ t('tools.svgEditor.targetPixels', {
                  w: Math.round((stats.width || 120) * exportScale),
                  h: Math.round((stats.height || 120) * exportScale)
                }) }}
              </span>

              <button
                type="button"
                @click="handleExportRaster"
                :disabled="isExporting"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition-colors cursor-pointer disabled:opacity-50"
              >
                <Download class="w-3.5 h-3.5" />
                <span>{{ isExporting ? t('tools.svgEditor.exporting') : t('tools.svgEditor.downloadImage') }}</span>
              </button>
            </div>
          </div>

          <!-- 代码集成卡片列表 -->
          <div class="space-y-3">
            <span class="font-semibold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
              <Code2 class="w-3.5 h-3.5 text-blue-500" />
              {{ t('tools.svgEditor.snippetsTitle') }}
            </span>

            <!-- React JSX -->
            <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-medium text-zinc-800 dark:text-zinc-200">React (JSX / TSX) 组件</span>
                <button
                  type="button"
                  @click="copySnippet('react', reactSnippet)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <component :is="copiedCard === 'react' ? Check : Copy" class="w-3 h-3 text-blue-500" />
                  <span>{{ copiedCard === 'react' ? t('common.copied') : t('common.copy') }}</span>
                </button>
              </div>
              <pre class="p-2.5 rounded-lg bg-zinc-900 text-zinc-300 font-mono text-[11px] overflow-x-auto max-h-28">{{ reactSnippet }}</pre>
            </div>

            <!-- Vue 3 -->
            <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-medium text-zinc-800 dark:text-zinc-200">Vue 3 单文件组件</span>
                <button
                  type="button"
                  @click="copySnippet('vue', vueSnippet)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <component :is="copiedCard === 'vue' ? Check : Copy" class="w-3 h-3 text-blue-500" />
                  <span>{{ copiedCard === 'vue' ? t('common.copied') : t('common.copy') }}</span>
                </button>
              </div>
              <pre class="p-2.5 rounded-lg bg-zinc-900 text-zinc-300 font-mono text-[11px] overflow-x-auto max-h-28">{{ vueSnippet }}</pre>
            </div>

            <!-- Data URI (Base64) -->
            <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-medium text-zinc-800 dark:text-zinc-200">Data URI (Base64)</span>
                <button
                  type="button"
                  @click="copySnippet('dataUriBase64', dataUriBase64)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <component :is="copiedCard === 'dataUriBase64' ? Check : Copy" class="w-3 h-3 text-blue-500" />
                  <span>{{ copiedCard === 'dataUriBase64' ? t('common.copied') : t('common.copy') }}</span>
                </button>
              </div>
              <pre class="p-2.5 rounded-lg bg-zinc-900 text-zinc-300 font-mono text-[11px] overflow-x-auto max-h-20">{{ dataUriBase64 }}</pre>
            </div>

            <!-- Data URI (UTF-8) -->
            <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-1.5">
              <div class="flex items-center justify-between">
                <span class="font-medium text-zinc-800 dark:text-zinc-200">Data URI (UTF-8 字符编码)</span>
                <button
                  type="button"
                  @click="copySnippet('dataUriUtf8', dataUriUtf8)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <component :is="copiedCard === 'dataUriUtf8' ? Check : Copy" class="w-3 h-3 text-blue-500" />
                  <span>{{ copiedCard === 'dataUriUtf8' ? t('common.copied') : t('common.copy') }}</span>
                </button>
              </div>
              <pre class="p-2.5 rounded-lg bg-zinc-900 text-zinc-300 font-mono text-[11px] overflow-x-auto max-h-20">{{ dataUriUtf8 }}</pre>
            </div>

            <!-- HTML <img> 标签与 CSS background-image -->
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-zinc-800 dark:text-zinc-200">HTML &lt;img&gt; 标签</span>
                  <button
                    type="button"
                    @click="copySnippet('imgTag', htmlImgSnippet)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <component :is="copiedCard === 'imgTag' ? Check : Copy" class="w-3 h-3 text-blue-500" />
                    <span>{{ copiedCard === 'imgTag' ? t('common.copied') : t('common.copy') }}</span>
                  </button>
                </div>
                <pre class="p-2 rounded-lg bg-zinc-900 text-zinc-300 font-mono text-[11px] overflow-x-auto">{{ htmlImgSnippet }}</pre>
              </div>

              <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 space-y-1.5">
                <div class="flex items-center justify-between">
                  <span class="font-medium text-zinc-800 dark:text-zinc-200">CSS background-image</span>
                  <button
                    type="button"
                    @click="copySnippet('cssBg', cssBgSnippet)"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <component :is="copiedCard === 'cssBg' ? Check : Copy" class="w-3 h-3 text-blue-500" />
                    <span>{{ copiedCard === 'cssBg' ? t('common.copied') : t('common.copy') }}</span>
                  </button>
                </div>
                <pre class="p-2 rounded-lg bg-zinc-900 text-zinc-300 font-mono text-[11px] overflow-x-auto">{{ cssBgSnippet }}</pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>

<style scoped>
.svg-checkerboard-light {
  background-color: #ffffff;
  background-image:
    linear-gradient(45deg, #e4e4e7 25%, transparent 25%),
    linear-gradient(-45deg, #e4e4e7 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e4e4e7 75%),
    linear-gradient(-45deg, transparent 75%, #e4e4e7 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.svg-checkerboard-dark {
  background-color: #09090b;
  background-image:
    linear-gradient(45deg, #27272a 25%, transparent 25%),
    linear-gradient(-45deg, #27272a 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #27272a 75%),
    linear-gradient(-45deg, transparent 75%, #27272a 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

:deep(svg) {
  display: block;
  shape-rendering: geometricPrecision;
  text-rendering: geometricPrecision;
}
</style>
