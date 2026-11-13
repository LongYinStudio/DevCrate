<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  FileImage,
  Upload,
  ArrowRightLeft,
  Sparkles,
  AlertCircle,
  FileDown,
  Check,
  Trash2,
  ClipboardPaste,
  SlidersHorizontal
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import { downloadFile } from '../../utils/download';
import {
  parseBase64ImageInput,
  base64ToBlob,
  formatOutputSnippet,
  formatBytes,
  getExtensionFromMime,
  SAMPLE_IMAGE_SVG,
  type Base64OutputFormat
} from './imageBase64Utils';

const { t } = useI18n();

type Mode = 'to-base64' | 'to-image';
type PreviewBg = 'checkerboard' | 'light' | 'dark';
type ReencodeTarget = 'original' | 'image/webp' | 'image/jpeg' | 'image/png';

const mode = ref<Mode>('to-base64');
const previewBg = ref<PreviewBg>('checkerboard');

// ==================== 图片 → Base64 状态 ====================
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const uploadError = ref('');

const sourceFilename = ref('');
const originalMime = ref('');
const originalSize = ref(0);
const originalDataUri = ref('');
const naturalWidth = ref(0);
const naturalHeight = ref(0);

// 重编码 / 输出格式设置
const reencodeTarget = ref<ReencodeTarget>('original');
const encodeQuality = ref(85);
const outputFormat = ref<Base64OutputFormat>('data-uri');

const encodedDataUri = ref('');
const encodedRawBase64 = ref('');
const encodedMime = ref('');
const encodedSize = ref(0);
const isEncoding = ref(false);
const isTxtDownloaded = ref(false);

// ==================== Base64 → 图片 状态 ====================
const base64Input = ref('');
const fallbackMime = ref('image/png');
const decodeRenderError = ref(false);
const decodedWidth = ref(0);
const decodedHeight = ref(0);
const isImgDownloaded = ref(false);

const outputFormatOptions: { value: Base64OutputFormat; labelKey: string }[] = [
  { value: 'data-uri', labelKey: 'tools.imageBase64Converter.formats.dataUri' },
  { value: 'raw-base64', labelKey: 'tools.imageBase64Converter.formats.rawBase64' },
  { value: 'html-img', labelKey: 'tools.imageBase64Converter.formats.htmlImg' },
  { value: 'css-bg', labelKey: 'tools.imageBase64Converter.formats.cssBg' },
  { value: 'markdown', labelKey: 'tools.imageBase64Converter.formats.markdown' }
];

const fallbackMimeOptions: SelectOption[] = [
  { label: 'PNG (image/png)', value: 'image/png' },
  { label: 'JPEG (image/jpeg)', value: 'image/jpeg' },
  { label: 'WebP (image/webp)', value: 'image/webp' },
  { label: 'GIF (image/gif)', value: 'image/gif' },
  { label: 'SVG (image/svg+xml)', value: 'image/svg+xml' },
  { label: 'ICO (image/x-icon)', value: 'image/x-icon' }
];

const reencodeOptions: { value: ReencodeTarget; labelKey?: string; label?: string }[] = [
  { value: 'original', labelKey: 'tools.imageBase64Converter.keepOriginal' },
  { value: 'image/webp', label: 'WebP' },
  { value: 'image/jpeg', label: 'JPEG' },
  { value: 'image/png', label: 'PNG' }
];

// 计算图片 → Base64 的最终展示文本
const formattedOutput = computed(() => {
  return formatOutputSnippet(
    encodedDataUri.value,
    encodedRawBase64.value,
    outputFormat.value,
    {
      filename: sourceFilename.value,
      width: naturalWidth.value,
      height: naturalHeight.value
    }
  );
});

// 体积变化百分比
const sizeDiffText = computed(() => {
  if (!originalSize.value || !encodedSize.value || reencodeTarget.value === 'original') return '';
  const ratio = ((encodedSize.value - originalSize.value) / originalSize.value) * 100;
  const sign = ratio > 0 ? '+' : '';
  return `${sign}${ratio.toFixed(1)}%`;
});

// 解析 Base64 → 图片的结果
const decodedImage = computed(() => {
  if (!base64Input.value.trim()) return null;
  return parseBase64ImageInput(base64Input.value, fallbackMime.value);
});

watch(base64Input, () => {
  decodeRenderError.value = false;
  decodedWidth.value = 0;
  decodedHeight.value = 0;
});

// 加载本地 File 对象并读取原始 Data URI 及分辨率
function processImageFile(file: File) {
  uploadError.value = '';
  const isSvgByName = file.name.toLowerCase().endsWith('.svg');
  if (!file.type.startsWith('image/') && !isSvgByName) {
    uploadError.value = t('tools.imageBase64Converter.notImageFile');
    return;
  }

  const mime = file.type || (isSvgByName ? 'image/svg+xml' : 'image/png');
  sourceFilename.value = file.name || `image.${getExtensionFromMime(mime)}`;
  originalMime.value = mime;
  originalSize.value = file.size;

  const reader = new FileReader();
  reader.onload = () => {
    const result = typeof reader.result === 'string' ? reader.result : '';
    if (!result) return;
    originalDataUri.value = result;

    // 解析图像原始尺寸
    const img = new Image();
    img.onload = () => {
      naturalWidth.value = img.naturalWidth;
      naturalHeight.value = img.naturalHeight;
      applyEncodeSettings();
    };
    img.onerror = () => {
      naturalWidth.value = 0;
      naturalHeight.value = 0;
      applyEncodeSettings();
    };
    img.src = result;
  };
  reader.readAsDataURL(file);
}

// 根据“原图直出”或“Canvas 重编码”生成最终 Base64
function applyEncodeSettings() {
  if (!originalDataUri.value) {
    encodedDataUri.value = '';
    encodedRawBase64.value = '';
    encodedMime.value = '';
    encodedSize.value = 0;
    return;
  }

  if (reencodeTarget.value === 'original') {
    const commaIdx = originalDataUri.value.indexOf(',');
    encodedDataUri.value = originalDataUri.value;
    encodedRawBase64.value = commaIdx >= 0 ? originalDataUri.value.slice(commaIdx + 1) : '';
    encodedMime.value = originalMime.value;
    encodedSize.value = originalSize.value;
    return;
  }

  isEncoding.value = true;
  const img = new Image();
  img.onload = () => {
    const w = img.naturalWidth || 128;
    const h = img.naturalHeight || 128;
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (reencodeTarget.value === 'image/jpeg') {
        // JPEG 不支持透明通道，先铺白底避免透明变黑
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, w, h);
      }
      ctx.drawImage(img, 0, 0, w, h);
      const q = Math.min(1, Math.max(0.1, encodeQuality.value / 100));
      const dataUrl = canvas.toDataURL(reencodeTarget.value, q);
      const commaIdx = dataUrl.indexOf(',');
      const raw = commaIdx >= 0 ? dataUrl.slice(commaIdx + 1) : '';
      encodedDataUri.value = dataUrl;
      encodedRawBase64.value = raw;
      encodedMime.value = reencodeTarget.value;
      try {
        encodedSize.value = atob(raw).length;
      } catch {
        encodedSize.value = 0;
      }
    }
    isEncoding.value = false;
  };
  img.onerror = () => {
    isEncoding.value = false;
  };
  img.src = originalDataUri.value;
}

watch([reencodeTarget, encodeQuality], () => {
  if (originalDataUri.value) {
    applyEncodeSettings();
  }
});

function triggerFilePick() {
  fileInputRef.value?.click();
}

function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  if (file) {
    processImageFile(file);
  }
  input.value = '';
}

function onDrop(e: DragEvent) {
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (file) {
    processImageFile(file);
  }
}

// 监听全局剪贴板贴图（仅在 图片 → Base64 模式下截获图像粘贴）
function handleWindowPaste(e: ClipboardEvent) {
  if (mode.value !== 'to-base64') return;
  const items = e.clipboardData?.items;
  if (!items) return;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === 'file' && item.type.startsWith('image/')) {
      const file = item.getAsFile();
      if (file) {
        e.preventDefault();
        processImageFile(file);
        return;
      }
    }
  }
}

function clearSourceImage() {
  originalDataUri.value = '';
  sourceFilename.value = '';
  originalMime.value = '';
  originalSize.value = 0;
  naturalWidth.value = 0;
  naturalHeight.value = 0;
  encodedDataUri.value = '';
  encodedRawBase64.value = '';
  encodedMime.value = '';
  encodedSize.value = 0;
  uploadError.value = '';
}

function loadSample() {
  const bytes = new TextEncoder().encode(SAMPLE_IMAGE_SVG);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  const b64 = btoa(bin);
  const sampleUri = `data:image/svg+xml;base64,${b64}`;

  if (mode.value === 'to-base64') {
    const file = new File([SAMPLE_IMAGE_SVG], 'devcrate-sample.svg', { type: 'image/svg+xml' });
    reencodeTarget.value = 'original';
    processImageFile(file);
  } else {
    base64Input.value = sampleUri;
  }
}

function switchDirection() {
  if (mode.value === 'to-base64') {
    if (encodedDataUri.value) {
      base64Input.value = encodedDataUri.value;
    }
    mode.value = 'to-image';
  } else {
    if (decodedImage.value && decodedImage.value.ok) {
      const blob = base64ToBlob(decodedImage.value.rawBase64, decodedImage.value.mimeType);
      const ext = decodedImage.value.extension;
      const file = new File([blob], `decoded-image.${ext}`, {
        type: decodedImage.value.mimeType
      });
      reencodeTarget.value = 'original';
      processImageFile(file);
    }
    mode.value = 'to-base64';
  }
}

function handleDownloadTxt() {
  if (!formattedOutput.value) return;
  const baseName = (sourceFilename.value || 'image').replace(/\.[^.]+$/, '');
  downloadFile(formattedOutput.value, `${baseName}-base64.txt`, 'text/plain;charset=utf-8');
  isTxtDownloaded.value = true;
  setTimeout(() => {
    isTxtDownloaded.value = false;
  }, 1800);
}

function handleDownloadDecodedImage() {
  if (!decodedImage.value || !decodedImage.value.ok) return;
  const blob = base64ToBlob(decodedImage.value.rawBase64, decodedImage.value.mimeType);
  downloadFile(blob, `decoded-image.${decodedImage.value.extension}`, decodedImage.value.mimeType);
  isImgDownloaded.value = true;
  setTimeout(() => {
    isImgDownloaded.value = false;
  }, 1800);
}

function onDecodedImgLoad(e: Event) {
  const img = e.target as HTMLImageElement;
  decodedWidth.value = img.naturalWidth;
  decodedHeight.value = img.naturalHeight;
  decodeRenderError.value = false;
}

function onDecodedImgError() {
  decodeRenderError.value = true;
  decodedWidth.value = 0;
  decodedHeight.value = 0;
}

onMounted(() => {
  window.addEventListener('paste', handleWindowPaste);
});

onUnmounted(() => {
  window.removeEventListener('paste', handleWindowPaste);
});
</script>

<template>
  <ToolContainer
    toolId="image-base64-converter"
    nameKey="tools.imageBase64Converter.name"
    descKey="tools.imageBase64Converter.desc"
    :icon="FileImage"
    :wide="true"
    :fullHeight="true"
  >
    <div class="flex flex-col flex-1 min-h-0 gap-3.5 h-full">
      <!-- 顶部模式切换与操作栏 -->
      <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div class="flex items-center gap-2">
          <!-- 转换方向 Segmented Control -->
          <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
            <button
              type="button"
              @click="mode = 'to-base64'"
              class="px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
              :class="mode === 'to-base64'
                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            >
              {{ t('tools.imageBase64Converter.modeImageToBase64') }}
            </button>
            <button
              type="button"
              @click="mode = 'to-image'"
              class="px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
              :class="mode === 'to-image'
                ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            >
              {{ t('tools.imageBase64Converter.modeBase64ToImage') }}
            </button>
          </div>

          <!-- 互换方向 -->
          <button
            type="button"
            @click="switchDirection"
            class="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
            :title="t('tools.imageBase64Converter.modeImageToBase64') + ' / ' + t('tools.imageBase64Converter.modeBase64ToImage')"
          >
            <ArrowRightLeft class="w-3.5 h-3.5" />
          </button>

          <span
            v-if="mode === 'to-base64'"
            class="hidden md:inline-flex items-center gap-1 text-[11px] text-zinc-400 dark:text-zinc-500 ml-1"
          >
            <ClipboardPaste class="w-3.5 h-3.5" />
            <span>{{ t('tools.imageBase64Converter.pasteTip') }}</span>
          </span>
        </div>

        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="loadSample"
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ t('common.loadSample') }}</span>
          </button>
        </div>
      </div>

      <!-- 隐藏文件选择器 -->
      <input
        ref="fileInputRef"
        type="file"
        accept="image/*"
        class="hidden"
        @change="onFileChange"
      />

      <!-- ==================== 模式一：图片 → Base64 ==================== -->
      <div
        v-if="mode === 'to-base64'"
        class="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0"
      >
        <!-- 左侧：上传区 / 预览与元信息 / 压缩重编码 -->
        <div class="lg:col-span-5 flex flex-col gap-3.5 min-h-0 overflow-y-auto pr-0.5">
          <!-- 上传错误提示 -->
          <div
            v-if="uploadError"
            class="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shrink-0"
          >
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ uploadError }}</span>
          </div>

          <!-- 未选图片时显示拖拽上传区 -->
          <div
            v-if="!originalDataUri"
            @click="triggerFilePick"
            @dragover.prevent="isDragging = true"
            @dragleave.prevent="isDragging = false"
            @drop.prevent="onDrop"
            class="flex-1 min-h-[260px] rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center cursor-pointer select-none"
            :class="isDragging
              ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
              : 'border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:border-blue-400 dark:hover:border-blue-600 hover:bg-zinc-50/70 dark:hover:bg-zinc-800/40'"
          >
            <div class="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-3 border border-blue-100 dark:border-blue-900/50">
              <Upload class="w-6 h-6" />
            </div>
            <p class="text-sm font-medium text-zinc-800 dark:text-zinc-200 mb-1.5">
              {{ t('tools.imageBase64Converter.dropzoneTitle') }}
            </p>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs">
              {{ t('tools.imageBase64Converter.dropzoneSubtitle') }}
            </p>
          </div>

          <!-- 已选图片时显示预览卡片、元信息及重编码选项 -->
          <template v-else>
            <div
              @dragover.prevent="isDragging = true"
              @dragleave.prevent="isDragging = false"
              @drop.prevent="onDrop"
              class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden flex flex-col shrink-0"
              :class="isDragging ? 'ring-2 ring-blue-500' : ''"
            >
              <!-- 预览头部栏 -->
              <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between gap-2 text-xs">
                <div class="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80">
                  <button
                    type="button"
                    @click="previewBg = 'checkerboard'"
                    class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
                    :class="previewBg === 'checkerboard' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
                  >
                    {{ t('tools.imageBase64Converter.bgCheckerboard') }}
                  </button>
                  <button
                    type="button"
                    @click="previewBg = 'light'"
                    class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
                    :class="previewBg === 'light' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
                  >
                    {{ t('tools.imageBase64Converter.bgLight') }}
                  </button>
                  <button
                    type="button"
                    @click="previewBg = 'dark'"
                    class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
                    :class="previewBg === 'dark' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
                  >
                    {{ t('tools.imageBase64Converter.bgDark') }}
                  </button>
                </div>

                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    @click="triggerFilePick"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                  >
                    <Upload class="w-3.5 h-3.5" />
                    <span>{{ t('tools.imageBase64Converter.reupload') }}</span>
                  </button>
                  <button
                    type="button"
                    @click="clearSourceImage"
                    class="inline-flex items-center p-1 rounded text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
                    :title="t('common.clear')"
                  >
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- 图像展示区 -->
              <div
                class="h-48 p-4 flex items-center justify-center overflow-hidden"
                :class="[
                  previewBg === 'checkerboard' ? 'img-checkerboard-light dark:img-checkerboard-dark' : '',
                  previewBg === 'light' ? 'bg-white' : '',
                  previewBg === 'dark' ? 'bg-zinc-950' : ''
                ]"
              >
                <img
                  :src="encodedDataUri || originalDataUri"
                  :alt="sourceFilename"
                  class="max-w-full max-h-full object-contain rounded shadow-xs"
                />
              </div>

              <!-- 元数据信息网格 -->
              <div class="p-3 border-t border-zinc-100 dark:border-zinc-800/80 grid grid-cols-2 gap-2 text-xs">
                <div class="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
                  <div class="text-[10px] text-zinc-400 uppercase mb-0.5">{{ t('tools.imageBase64Converter.metaFilename') }}</div>
                  <div class="font-medium text-zinc-800 dark:text-zinc-200 truncate" :title="sourceFilename">{{ sourceFilename }}</div>
                </div>
                <div class="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
                  <div class="text-[10px] text-zinc-400 uppercase mb-0.5">{{ t('tools.imageBase64Converter.metaDimensions') }}</div>
                  <div class="font-mono font-medium text-zinc-800 dark:text-zinc-200">
                    {{ naturalWidth && naturalHeight ? `${naturalWidth} × ${naturalHeight} px` : '-' }}
                  </div>
                </div>
                <div class="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
                  <div class="text-[10px] text-zinc-400 uppercase mb-0.5">{{ t('tools.imageBase64Converter.metaMime') }}</div>
                  <div class="font-mono font-medium text-indigo-600 dark:text-indigo-400 truncate">{{ encodedMime || originalMime }}</div>
                </div>
                <div class="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-100 dark:border-zinc-800/80">
                  <div class="text-[10px] text-zinc-400 uppercase mb-0.5">
                    {{ reencodeTarget === 'original' ? t('tools.imageBase64Converter.metaOriginalSize') : t('tools.imageBase64Converter.metaEncodedSize') }}
                  </div>
                  <div class="font-mono font-medium text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
                    <span>{{ formatBytes(encodedSize || originalSize) }}</span>
                    <span
                      v-if="sizeDiffText"
                      class="text-[10px] px-1 py-0.2 rounded"
                      :class="sizeDiffText.startsWith('-') ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'"
                    >
                      {{ sizeDiffText }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 重编码与压缩选项 -->
            <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3 shrink-0">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <SlidersHorizontal class="w-3.5 h-3.5 text-blue-500" />
                <span>{{ t('tools.imageBase64Converter.encodeSettings') }}</span>
              </div>

              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="opt in reencodeOptions"
                  :key="opt.value"
                  type="button"
                  @click="reencodeTarget = opt.value"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer"
                  :class="reencodeTarget === opt.value
                    ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                    : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
                >
                  {{ opt.labelKey ? t(opt.labelKey) : opt.label }}
                </button>
              </div>

              <div
                v-if="reencodeTarget === 'image/webp' || reencodeTarget === 'image/jpeg'"
                class="flex items-center gap-3 pt-1"
              >
                <span class="text-xs text-zinc-500 dark:text-zinc-400 shrink-0">{{ t('tools.imageBase64Converter.quality') }}</span>
                <input
                  v-model.number="encodeQuality"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  class="flex-1 accent-blue-600 cursor-pointer"
                />
                <span class="text-xs font-mono font-medium text-zinc-700 dark:text-zinc-200 w-10 text-right">{{ encodeQuality }}%</span>
              </div>
            </div>
          </template>
        </div>

        <!-- 右侧：Base64 / 代码片段输出框 -->
        <div class="lg:col-span-7 flex flex-col gap-3 min-h-[260px] h-full">
          <!-- 输出格式选择栏 -->
          <div class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div class="flex items-center gap-1.5 flex-wrap">
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400 px-1">
                {{ t('tools.imageBase64Converter.outputFormat') }}:
              </span>
              <button
                v-for="fmt in outputFormatOptions"
                :key="fmt.value"
                type="button"
                @click="outputFormat = fmt.value"
                class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                :class="outputFormat === fmt.value
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'"
              >
                {{ t(fmt.labelKey) }}
              </button>
            </div>

            <div
              v-if="encodedRawBase64"
              class="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 px-1.5"
            >
              {{ t('tools.imageBase64Converter.metaBase64Length') }}: {{ encodedRawBase64.length.toLocaleString() }}
            </div>
          </div>

          <TextEditorBox
            :modelValue="formattedOutput"
            :label="t('tools.imageBase64Converter.base64OutputLabel')"
            :placeholder="t('tools.imageBase64Converter.dropzoneTitle')"
            :readonly="true"
            :showPaste="false"
            :showClear="false"
            :showWrapToggle="true"
            :defaultWrap="true"
          >
            <template #actions>
              <button
                type="button"
                @click="handleDownloadTxt"
                :disabled="!formattedOutput || isEncoding"
                class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <component :is="isTxtDownloaded ? Check : FileDown" class="w-3.5 h-3.5" :class="isTxtDownloaded ? 'text-emerald-500' : ''" />
                <span class="hidden sm:inline">{{ t('tools.imageBase64Converter.downloadTxt') }}</span>
              </button>
            </template>
          </TextEditorBox>
        </div>
      </div>

      <!-- ==================== 模式二：Base64 → 图片 ==================== -->
      <div
        v-else
        class="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0"
      >
        <!-- 左侧：Base64 / Data URI 输入框 -->
        <div class="lg:col-span-6 flex flex-col gap-3 min-h-[260px] h-full">
          <div class="p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {{ t('tools.imageBase64Converter.fallbackMimeLabel') }}:
              </span>
              <div class="w-48">
                <CustomSelect
                  v-model="fallbackMime"
                  :options="fallbackMimeOptions"
                  size="sm"
                />
              </div>
            </div>

            <span
              v-if="decodedImage && decodedImage.ok && decodedImage.isDetectedMime"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
            >
              <Check class="w-3 h-3" />
              <span>{{ t('tools.imageBase64Converter.detectedMimeBadge') }}: {{ decodedImage.mimeType }}</span>
            </span>
          </div>

          <TextEditorBox
            v-model="base64Input"
            :label="t('tools.imageBase64Converter.base64InputLabel')"
            :placeholder="t('tools.imageBase64Converter.base64InputPlaceholder')"
            :showWrapToggle="true"
            :defaultWrap="true"
            @clear="decodeRenderError = false"
          />
        </div>

        <!-- 右侧：图像还原预览与下载 -->
        <div class="lg:col-span-6 flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden min-h-[260px] h-full">
          <!-- 预览头部栏 -->
          <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 text-xs shrink-0">
            <span class="font-medium text-zinc-700 dark:text-zinc-200">
              {{ t('tools.imageBase64Converter.previewTitle') }}
            </span>

            <div class="flex items-center gap-2">
              <div class="inline-flex items-center p-0.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80">
                <button
                  type="button"
                  @click="previewBg = 'checkerboard'"
                  class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  :class="previewBg === 'checkerboard' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
                >
                  {{ t('tools.imageBase64Converter.bgCheckerboard') }}
                </button>
                <button
                  type="button"
                  @click="previewBg = 'light'"
                  class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  :class="previewBg === 'light' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
                >
                  {{ t('tools.imageBase64Converter.bgLight') }}
                </button>
                <button
                  type="button"
                  @click="previewBg = 'dark'"
                  class="px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer"
                  :class="previewBg === 'dark' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
                >
                  {{ t('tools.imageBase64Converter.bgDark') }}
                </button>
              </div>

              <button
                type="button"
                @click="handleDownloadDecodedImage"
                :disabled="!decodedImage || !decodedImage.ok || decodeRenderError"
                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                :class="isImgDownloaded
                  ? 'bg-emerald-600 text-white'
                  : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'"
              >
                <component :is="isImgDownloaded ? Check : FileDown" class="w-3.5 h-3.5" />
                <span>{{ isImgDownloaded ? t('tools.imageBase64Converter.downloaded') : t('tools.imageBase64Converter.downloadImage') }}</span>
              </button>
            </div>
          </div>

          <!-- 主预览画布 -->
          <div
            class="flex-1 min-h-0 p-4 flex items-center justify-center overflow-auto"
            :class="[
              decodedImage && decodedImage.ok && !decodeRenderError
                ? (previewBg === 'checkerboard' ? 'img-checkerboard-light dark:img-checkerboard-dark' : previewBg === 'light' ? 'bg-white' : 'bg-zinc-950')
                : 'bg-zinc-50/40 dark:bg-zinc-950/30'
            ]"
          >
            <div v-if="!base64Input.trim()" class="text-center max-w-xs text-zinc-400 dark:text-zinc-500">
              <FileImage class="w-10 h-10 mx-auto mb-2.5 opacity-45" />
              <p class="text-xs leading-relaxed">{{ t('tools.imageBase64Converter.previewEmpty') }}</p>
            </div>

            <div
              v-else-if="decodedImage && !decodedImage.ok"
              class="flex flex-col items-center text-center max-w-xs text-rose-600 dark:text-rose-400"
            >
              <AlertCircle class="w-8 h-8 mb-2" />
              <p class="text-xs font-medium">{{ t('tools.imageBase64Converter.invalidBase64') }}</p>
            </div>

            <div
              v-else-if="decodeRenderError"
              class="flex flex-col items-center text-center max-w-xs text-rose-600 dark:text-rose-400"
            >
              <AlertCircle class="w-8 h-8 mb-2" />
              <p class="text-xs font-medium">{{ t('tools.imageBase64Converter.imageLoadFailed') }}</p>
            </div>

            <img
              v-else-if="decodedImage && decodedImage.ok"
              :src="decodedImage.dataUri"
              alt="Decoded Preview"
              @load="onDecodedImgLoad"
              @error="onDecodedImgError"
              class="max-w-full max-h-full object-contain rounded shadow-sm"
            />
          </div>

          <!-- 底部还原元信息 -->
          <div
            v-if="decodedImage && decodedImage.ok"
            class="px-3.5 py-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-600 dark:text-zinc-400 shrink-0"
          >
            <div class="flex items-center gap-3">
              <span>{{ decodedImage.mimeType }}</span>
              <span v-if="decodedWidth && decodedHeight">{{ decodedWidth }} × {{ decodedHeight }} px</span>
            </div>
            <div class="flex items-center gap-3">
              <span>{{ formatBytes(decodedImage.byteSize) }}</span>
              <span class="uppercase px-1.5 py-0.5 rounded bg-zinc-200/70 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300">
                .{{ decodedImage.extension }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>

<style scoped>
.img-checkerboard-light {
  background-color: #ffffff;
  background-image:
    linear-gradient(45deg, #e4e4e7 25%, transparent 25%),
    linear-gradient(-45deg, #e4e4e7 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #e4e4e7 75%),
    linear-gradient(-45deg, transparent 75%, #e4e4e7 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}

.img-checkerboard-dark {
  background-color: #09090b;
  background-image:
    linear-gradient(45deg, #27272a 25%, transparent 25%),
    linear-gradient(-45deg, #27272a 25%, transparent 25%),
    linear-gradient(45deg, transparent 75%, #27272a 75%),
    linear-gradient(-45deg, transparent 75%, #27272a 75%);
  background-size: 16px 16px;
  background-position: 0 0, 0 8px, 8px -8px, -8px 0;
}
</style>
