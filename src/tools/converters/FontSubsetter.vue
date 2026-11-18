<script setup lang="ts">
import { ref, computed, watch, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Scissors,
  Upload,
  Sparkles,
  Trash2,
  Download,
  AlertCircle,
  CheckCircle2,
  Info,
  SlidersHorizontal,
  Eye,
  Code2,
  Layers,
  ChevronDown,
  ChevronUp,
  Search,
  FileText,
  Check,
  Table2,
  Sun,
  Moon,
  ArrowRight,
  Loader2,
  RefreshCw,
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import { downloadFile } from '../../utils/download';
import {
  FONT_CHAR_PRESETS,
  UNICODE_BLOCKS,
  createSampleFontTtf,
  describeOpenTypeFeature,
  type FontCharPreset,
} from './fontPresets';
import {
  formatBytes,
  formatCodepointHex,
  generateFontFaceCss,
  resolveTargetCodepoints,
  uint8ArrayToBase64,
  type AxisSubsetConfig,
  type FeatureMode,
  type OutputFormat,
  type ParsedFontMetadata,
  type SubsetResult,
} from './fontSubsetUtils';
import { parseFontInWorker, subsetFontInWorker } from './fontSubsetClient';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// ==================== 文件与解析状态 ====================
const fontInputRef = ref<HTMLInputElement | null>(null);
const textFileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);
const isParsing = ref(false);
const isSubsetting = ref(false);
const errorMessage = ref('');
const noticeMessage = ref('');

const sourceFileName = ref('');
const sourceRawSize = ref(0);
const rawFileBytes = ref<Uint8Array | null>(null);
const sfntBytes = ref<Uint8Array | null>(null);
const metadata = ref<ParsedFontMetadata | null>(null);
const selectedFaceIndex = ref(0);

// ==================== 字符集裁剪状态 ====================
const keepAllGlyphs = ref(false);
const subsetText = ref('DevCrate 字体裁剪测试 Hello World 0123456789');
const unicodeRangeInput = ref('');
const pickedCodepoints = ref<number[]>([]);

// ==================== 裁剪参数配置 ====================
const outputFormat = ref<OutputFormat>('woff2');
const featureMode = ref<FeatureMode>('all');
const customFeatures = ref<string[]>([]);
const noHinting = ref(true);
const noLayoutClosure = ref(false);
const retainGids = ref(false);
const glyphNames = ref(false);
const desubroutinize = ref(false);
const dropDsigAndLegacyKern = ref(true);
const variationAxesConfig = ref<Record<string, AxisSubsetConfig>>({});

// ==================== 结果与预览状态 ====================
const subsetResult = ref<SubsetResult | null>(null);
const previewText = ref('DevCrate Font Subsetter 字体子集化预览 0123456789');
const previewFontSize = ref(28);
const previewSurface = ref<'light' | 'dark'>('light');
const previewCompareMode = ref<'split' | 'subset' | 'original'>('split');

// ==================== UI 折叠面板与导出标签 ====================
const showMetadataDrawer = ref(false);
const showGlyphBrowser = ref(false);
const showTableComparison = ref(false);
const glyphSearch = ref('');
const selectedBlockId = ref('all');
const glyphPage = ref(1);
const GLYPHS_PER_PAGE = 120;

const exportTab = ref<'css-url' | 'css-base64' | 'base64' | 'unicode-range'>('css-url');
const customFontFamily = ref('');
const customFontWeight = ref('400');
const customFontStyle = ref('normal');
const customFontDisplay = ref<'swap' | 'block' | 'fallback' | 'optional' | 'auto'>('swap');
const customCssUrl = ref('');

// ==================== 动态 FontFace 预览管理 ====================
const uid = Math.random().toString(36).slice(2, 8);
const origPreviewFamily = `__devcrate_orig_${uid}`;
const subPreviewFamily = `__devcrate_sub_${uid}`;
const origFontReady = ref(false);
const subFontReady = ref(false);
let activeOrigFace: FontFace | null = null;
let activeSubFace: FontFace | null = null;

function clearLoadedFontFaces() {
  if (activeOrigFace) {
    document.fonts.delete(activeOrigFace);
    activeOrigFace = null;
  }
  if (activeSubFace) {
    document.fonts.delete(activeSubFace);
    activeSubFace = null;
  }
  origFontReady.value = false;
  subFontReady.value = false;
}

async function registerPreviewFace(
  family: string,
  bytes: Uint8Array,
  target: 'orig' | 'sub'
) {
  try {
    const buffer = bytes.slice().buffer;
    const face = new FontFace(family, buffer);
    await face.load();
    if (target === 'orig') {
      if (activeOrigFace) document.fonts.delete(activeOrigFace);
      activeOrigFace = face;
      document.fonts.add(face);
      origFontReady.value = true;
    } else {
      if (activeSubFace) document.fonts.delete(activeSubFace);
      activeSubFace = face;
      document.fonts.add(face);
      subFontReady.value = true;
    }
  } catch {
    if (target === 'orig') origFontReady.value = false;
    else subFontReady.value = false;
  }
}

onUnmounted(() => {
  clearLoadedFontFaces();
});

// ==================== 派生计算属性 ====================
const faceOptions = computed<SelectOption[]>(() => {
  if (!metadata.value) return [];
  return metadata.value.faces.map(f => ({
    label: `${f.index}: ${f.fullName}`,
    value: f.index,
    desc: f.flavor.toUpperCase(),
  }));
});

const featureModeOptions = computed<SelectOption[]>(() => [
  {
    label: t('tools.fontSubsetter.features.all'),
    value: 'all',
  },
  {
    label: t('tools.fontSubsetter.features.essential'),
    value: 'essential',
  },
  {
    label: t('tools.fontSubsetter.features.none'),
    value: 'none',
  },
  {
    label: t('tools.fontSubsetter.features.custom'),
    value: 'custom',
  },
]);

const displayOptions: SelectOption[] = [
  { label: 'swap', value: 'swap' },
  { label: 'block', value: 'block' },
  { label: 'fallback', value: 'fallback' },
  { label: 'optional', value: 'optional' },
  { label: 'auto', value: 'auto' },
];

const pickedSet = computed(() => new Set(pickedCodepoints.value));

const coverage = computed(() => {
  return resolveTargetCodepoints({
    text: subsetText.value,
    rangeInput: unicodeRangeInput.value,
    pickedCodepoints: pickedCodepoints.value,
    fontCodepoints: metadata.value?.codepoints,
  });
});

const missingPreviewChars = computed(() => {
  return coverage.value.missingCodepoints.slice(0, 60).map(cp => ({
    cp,
    hex: formatCodepointHex(cp),
    char: cp >= 0x20 ? String.fromCodePoint(cp) : '·',
  }));
});

const outputBaseName = computed(() => {
  const base = (sourceFileName.value || 'font')
    .replace(/\.(ttf|otf|woff2?|ttc|otc)$/i, '')
    .trim();
  return `${base || 'font'}.subset`;
});

const outputFilename = computed(() => {
  const ext = subsetResult.value?.outputExt || (outputFormat.value === 'sfnt' ? metadata.value?.sfntFlavor || 'ttf' : outputFormat.value);
  return `${outputBaseName.value}.${ext}`;
});

const savingsPercent = computed(() => {
  if (!subsetResult.value || !sourceRawSize.value) return 0;
  return ((sourceRawSize.value - subsetResult.value.byteLength) / sourceRawSize.value) * 100;
});

// ==================== 字形浏览器过滤与分页 ====================
const blockFilterOptions = computed<SelectOption[]>(() => {
  if (!metadata.value) return [];
  const cps = metadata.value.codepoints;
  const counts = new Map<string, number>();
  for (const cp of cps) {
    for (const block of UNICODE_BLOCKS) {
      if (cp >= block.start && cp <= block.end) {
        counts.set(block.id, (counts.get(block.id) || 0) + 1);
        break;
      }
    }
  }
  const opts: SelectOption[] = [
    {
      label: `${t('tools.fontSubsetter.blocks.all')} (${cps.length})`,
      value: 'all',
    },
  ];
  for (const block of UNICODE_BLOCKS) {
    const c = counts.get(block.id) || 0;
    if (c > 0) {
      opts.push({
        label: `${t(block.labelKey)} (${c})`,
        value: block.id,
      });
    }
  }
  return opts;
});

const filteredBrowserCodepoints = computed(() => {
  if (!metadata.value) return [];
  let list = metadata.value.codepoints;

  if (selectedBlockId.value !== 'all') {
    const block = UNICODE_BLOCKS.find(b => b.id === selectedBlockId.value);
    if (block) {
      list = list.filter(cp => cp >= block.start && cp <= block.end);
    }
  }

  const q = glyphSearch.value.trim();
  if (q) {
    const upper = q.toUpperCase().replace(/^U\+/, '').replace(/^0X/, '');
    const isHex = /^[0-9A-F]{1,6}$/.test(upper);
    list = list.filter(cp => {
      const ch = String.fromCodePoint(cp);
      if (ch === q || ch.toLowerCase() === q.toLowerCase()) return true;
      if (isHex) {
        return cp.toString(16).toUpperCase().includes(upper);
      }
      return false;
    });
  }

  return list;
});

const totalGlyphPages = computed(() =>
  Math.max(1, Math.ceil(filteredBrowserCodepoints.value.length / GLYPHS_PER_PAGE))
);

const pagedGlyphs = computed(() => {
  const page = Math.min(glyphPage.value, totalGlyphPages.value);
  const start = (page - 1) * GLYPHS_PER_PAGE;
  return filteredBrowserCodepoints.value.slice(start, start + GLYPHS_PER_PAGE);
});

watch([selectedBlockId, glyphSearch], () => {
  glyphPage.value = 1;
});

// ==================== 导出代码生成 ====================
const subsetBase64 = computed(() => {
  if (!subsetResult.value) return '';
  return uint8ArrayToBase64(subsetResult.value.bytes);
});

const activeExportCode = computed(() => {
  if (!subsetResult.value) return '';
  const family = customFontFamily.value || metadata.value?.familyName || 'CustomFont';
  if (exportTab.value === 'unicode-range') {
    return subsetResult.value.unicodeRangeCss;
  }
  if (exportTab.value === 'base64') {
    return subsetBase64.value;
  }
  if (exportTab.value === 'css-base64') {
    const dataUri = `data:${subsetResult.value.mimeType};base64,${subsetBase64.value}`;
    return generateFontFaceCss({
      familyName: family,
      urlOrDataUri: dataUri,
      cssFormat: subsetResult.value.cssFormat,
      unicodeRange: subsetResult.value.unicodeRangeCss,
      weight: customFontWeight.value,
      style: customFontStyle.value,
      display: customFontDisplay.value,
    });
  }
  return generateFontFaceCss({
    familyName: family,
    urlOrDataUri: customCssUrl.value || `./${outputFilename.value}`,
    cssFormat: subsetResult.value.cssFormat,
    unicodeRange: subsetResult.value.unicodeRangeCss,
    weight: customFontWeight.value,
    style: customFontStyle.value,
    display: customFontDisplay.value,
  });
});

// ==================== 前后 SFNT 表体积对比 ====================
const tableComparisonRows = computed(() => {
  if (!metadata.value || !subsetResult.value) return [];
  const afterMap = new Map(subsetResult.value.tables.map(tb => [tb.tag, tb.length]));
  const seen = new Set<string>();
  const rows: Array<{ tag: string; before: number; after: number }> = [];

  for (const tb of metadata.value.tables) {
    seen.add(tb.tag);
    rows.push({
      tag: tb.tag,
      before: tb.length,
      after: afterMap.get(tb.tag) || 0,
    });
  }
  for (const tb of subsetResult.value.tables) {
    if (!seen.has(tb.tag)) {
      rows.push({ tag: tb.tag, before: 0, after: tb.length });
    }
  }
  return rows.sort((a, b) => b.before - a.before);
});

// ==================== 字体加载与处理方法 ====================
function showNotice(msg: string) {
  noticeMessage.value = msg;
  setTimeout(() => {
    if (noticeMessage.value === msg) noticeMessage.value = '';
  }, 3200);
}

function initSettingsFromMetadata(meta: ParsedFontMetadata) {
  customFontFamily.value = meta.familyName || 'CustomFont';
  customFontWeight.value = meta.axes.some(a => a.tag === 'wght')
    ? `${Math.round(meta.axes.find(a => a.tag === 'wght')!.minValue)} ${Math.round(meta.axes.find(a => a.tag === 'wght')!.maxValue)}`
    : String(meta.weightClass || 400);
  customFontStyle.value = /italic|oblique/i.test(meta.subfamilyName) ? 'italic' : 'normal';
  customCssUrl.value = `./${outputFilename.value}`;

  // 初始化 OpenType 特性与可变轴
  customFeatures.value = meta.features.map(f => f.tag);
  const axesCfg: Record<string, AxisSubsetConfig> = {};
  for (const axis of meta.axes) {
    axesCfg[axis.tag] = {
      mode: 'keep',
      value: axis.defaultValue,
      min: axis.minValue,
      max: axis.maxValue,
    };
  }
  variationAxesConfig.value = axesCfg;
}

async function loadFontBuffer(bytes: Uint8Array, filename: string, faceIndex = 0) {
  errorMessage.value = '';
  isParsing.value = true;
  subsetResult.value = null;

  try {
    const parsed = await parseFontInWorker(bytes, faceIndex);
    rawFileBytes.value = bytes;
    sourceFileName.value = filename;
    sourceRawSize.value = bytes.byteLength;
    sfntBytes.value = parsed.sfntBytes;
    metadata.value = parsed.metadata;
    selectedFaceIndex.value = parsed.metadata.faceIndex;

    initSettingsFromMetadata(parsed.metadata);
    await registerPreviewFace(origPreviewFamily, parsed.sfntBytes, 'orig');

    // 自动根据字体支持的字符调整默认裁剪测试文本（避免纯拉丁字体默认包含中文导致迷惑）
    const fontSet = new Set(parsed.metadata.codepoints);
    const hasCjk = parsed.metadata.codepoints.some(cp => cp >= 0x4e00 && cp <= 0x9fff);
    if (hasCjk) {
      subsetText.value = 'DevCrate 字体裁剪测试 Hello World 0123456789';
      previewText.value = 'DevCrate 字体裁剪效果对比 Hello World 0123456789';
    } else if (fontSet.has(0x41) && fontSet.has(0x61)) {
      subsetText.value = 'DevCrate Font Subsetter Hello World 0123456789!';
      previewText.value = 'DevCrate Font Subsetter 0123456789!';
    } else {
      const sampleChars = parsed.metadata.codepoints
        .filter(cp => cp >= 0x20)
        .slice(0, 32)
        .map(cp => String.fromCodePoint(cp))
        .join('');
      if (sampleChars) {
        subsetText.value = sampleChars;
        previewText.value = sampleChars;
      }
    }

    // 默认自动执行一次子集化以便立即看到对比效果
    await runSubset();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg === 'UNSUPPORTED_FORMAT') {
      errorMessage.value = t('tools.fontSubsetter.errors.unsupportedFormat');
    } else {
      errorMessage.value = `${t('tools.fontSubsetter.errors.parseFailed')}: ${msg}`;
    }
  } finally {
    isParsing.value = false;
  }
}

async function handleFaceIndexChange(newIndex: number) {
  if (!sfntBytes.value || !rawFileBytes.value) return;
  selectedFaceIndex.value = Number(newIndex);
  await loadFontBuffer(rawFileBytes.value, sourceFileName.value, selectedFaceIndex.value);
}

function handleFontFileInput(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  readUploadedFontFile(file);
}

function readUploadedFontFile(file: File) {
  const reader = new FileReader();
  reader.onload = () => {
    if (reader.result instanceof ArrayBuffer) {
      loadFontBuffer(new Uint8Array(reader.result), file.name, 0);
    }
  };
  reader.readAsArrayBuffer(file);
}

function handleDrop(e: DragEvent) {
  e.preventDefault();
  isDragging.value = false;
  const file = e.dataTransfer?.files?.[0];
  if (!file) return;
  readUploadedFontFile(file);
}

async function loadSampleFont() {
  const sampleTtf = createSampleFontTtf();
  await loadFontBuffer(sampleTtf, 'DevCratePixelSans-Regular.ttf', 0);
  showNotice(t('tools.fontSubsetter.sampleLoaded'));
}

function resetAll() {
  clearLoadedFontFaces();
  rawFileBytes.value = null;
  sfntBytes.value = null;
  metadata.value = null;
  subsetResult.value = null;
  sourceFileName.value = '';
  sourceRawSize.value = 0;
  unicodeRangeInput.value = '';
  pickedCodepoints.value = [];
  errorMessage.value = '';
}

// ==================== 字符集快捷操作 ====================
function applyPreset(preset: FontCharPreset) {
  if (preset.mode === 'all') {
    keepAllGlyphs.value = true;
    return;
  }
  keepAllGlyphs.value = false;
  if (preset.mode === 'text') {
    const merged = Array.from(subsetText.value + preset.value);
    subsetText.value = Array.from(new Set(merged)).join('');
    return;
  }
  const current = unicodeRangeInput.value.trim();
  if (!current) {
    unicodeRangeInput.value = preset.value;
  } else if (!current.includes(preset.value)) {
    unicodeRangeInput.value = `${current}, ${preset.value}`;
  }
}

function deduplicateSubsetText() {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const ch of subsetText.value) {
    if (!seen.has(ch)) {
      seen.add(ch);
      out.push(ch);
    }
  }
  subsetText.value = out.join('');
}

function clearCharSelection() {
  keepAllGlyphs.value = false;
  subsetText.value = '';
  unicodeRangeInput.value = '';
  pickedCodepoints.value = [];
}

function handleTextFileImport(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = '';
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    if (typeof reader.result === 'string') {
      const seen = new Set<string>(Array.from(subsetText.value));
      for (const ch of reader.result) {
        const cp = ch.codePointAt(0);
        if (cp !== undefined && cp >= 0x20) {
          seen.add(ch);
        }
      }
      subsetText.value = Array.from(seen).join('');
      keepAllGlyphs.value = false;
      showNotice(
        t('tools.fontSubsetter.importedCharsCount', {
          count: seen.size,
          file: file.name,
        })
      );
    }
  };
  reader.readAsText(file);
}

function togglePickedGlyph(cp: number) {
  const idx = pickedCodepoints.value.indexOf(cp);
  if (idx >= 0) {
    pickedCodepoints.value.splice(idx, 1);
  } else {
    pickedCodepoints.value.push(cp);
  }
  keepAllGlyphs.value = false;
}

function toggleCustomFeature(tag: string) {
  const idx = customFeatures.value.indexOf(tag);
  if (idx >= 0) {
    customFeatures.value.splice(idx, 1);
  } else {
    customFeatures.value.push(tag);
  }
}

// ==================== 执行子集化 ====================
async function runSubset() {
  if (!sfntBytes.value || !metadata.value) return;
  errorMessage.value = '';

  const targetCodepoints = keepAllGlyphs.value
    ? []
    : coverage.value.presentCodepoints;

  if (!keepAllGlyphs.value && targetCodepoints.length === 0) {
    errorMessage.value = t('tools.fontSubsetter.errors.emptySelection');
    return;
  }

  isSubsetting.value = true;
  try {
    const dropTables = dropDsigAndLegacyKern.value ? ['DSIG', 'VDMX', 'hdmx', 'LTSH'] : [];
    const result = await subsetFontInWorker(sfntBytes.value, {
      faceIndex: selectedFaceIndex.value,
      outputFormat: outputFormat.value,
      keepAllGlyphs: keepAllGlyphs.value,
      codepoints: targetCodepoints,
      featureMode: featureMode.value,
      customFeatures: [...customFeatures.value],
      noHinting: noHinting.value,
      noLayoutClosure: noLayoutClosure.value,
      retainGids: retainGids.value,
      glyphNames: glyphNames.value,
      desubroutinize: desubroutinize.value,
      dropTables,
      variationAxes: JSON.parse(JSON.stringify(variationAxesConfig.value)),
    });

    subsetResult.value = result;
    customCssUrl.value = `./${outputBaseName.value}.${result.outputExt}`;
    await registerPreviewFace(subPreviewFamily, result.bytes, 'sub');
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    errorMessage.value =
      msg === 'EMPTY_CODEPOINTS'
        ? t('tools.fontSubsetter.errors.emptySelection')
        : `${t('tools.fontSubsetter.errors.subsetFailed')}: ${msg}`;
  } finally {
    isSubsetting.value = false;
  }
}

function downloadSubsetFont() {
  if (!subsetResult.value) return;
  const blob = new Blob([subsetResult.value.bytes.slice().buffer], {
    type: subsetResult.value.mimeType,
  });
  downloadFile(blob, outputFilename.value, subsetResult.value.mimeType);
  showNotice(
    t('tools.fontSubsetter.downloadedNotice', { filename: outputFilename.value })
  );
}

function downloadCssFile() {
  if (!activeExportCode.value) return;
  const name = `${outputBaseName.value}.css`;
  downloadFile(activeExportCode.value, name, 'text/css;charset=utf-8');
  showNotice(t('tools.fontSubsetter.downloadedNotice', { filename: name }));
}
</script>

<template>
  <ToolContainer
    tool-id="font-subsetter"
    name-key="tools.fontSubsetter.name"
    desc-key="tools.fontSubsetter.desc"
    :icon="Scissors"
    wide
  >
    <template #header-actions>
      <button
        type="button"
        @click="loadSampleFont"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
      >
        <Sparkles class="w-3.5 h-3.5 text-blue-500" />
        <span>{{ t('common.loadSample') }}</span>
      </button>

      <button
        type="button"
        @click="fontInputRef?.click()"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer"
      >
        <Upload class="w-3.5 h-3.5" />
        <span>{{ t('tools.fontSubsetter.importFont') }}</span>
      </button>

      <button
        v-if="metadata"
        type="button"
        @click="resetAll"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
        :title="t('common.clear')"
      >
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </template>

    <!-- 隐藏的文件选择器 -->
    <input
      ref="fontInputRef"
      type="file"
      accept=".ttf,.otf,.woff,.woff2,.ttc,.otc"
      class="hidden"
      @change="handleFontFileInput"
    />
    <input
      ref="textFileInputRef"
      type="file"
      accept=".txt,.html,.htm,.vue,.tsx,.jsx,.ts,.js,.css,.json,.md,.xml,.svg"
      class="hidden"
      @change="handleTextFileImport"
    />

    <!-- 全局提示与错误横幅 -->
    <div
      v-if="noticeMessage"
      class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300 text-xs"
    >
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      <span>{{ noticeMessage }}</span>
    </div>

    <div
      v-if="errorMessage"
      class="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 text-rose-700 dark:text-rose-300 text-xs"
    >
      <AlertCircle class="w-4 h-4 shrink-0" />
      <span class="flex-1">{{ errorMessage }}</span>
    </div>

    <!-- 空状态拖拽上传区 -->
    <div
      v-if="!metadata"
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop="handleDrop"
      class="flex-1 flex flex-col items-center justify-center min-h-[420px] rounded-2xl border-2 border-dashed transition-all p-8 text-center"
      :class="[
        isDragging
          ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30'
          : 'border-zinc-300/80 dark:border-zinc-700/80 bg-white dark:bg-zinc-900/60 hover:border-blue-400/70 dark:hover:border-blue-600/60',
      ]"
    >
      <div
        class="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50 flex items-center justify-center mb-4"
      >
        <Loader2 v-if="isParsing" class="w-8 h-8 animate-spin" />
        <Scissors v-else class="w-8 h-8" />
      </div>

      <h2 class="text-base font-semibold text-zinc-900 dark:text-zinc-100">
        {{ isParsing ? t('tools.fontSubsetter.parsing') : t('tools.fontSubsetter.dropTitle') }}
      </h2>
      <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 max-w-lg leading-relaxed">
        {{ t('tools.fontSubsetter.dropSubtitle') }}
      </p>

      <div class="flex flex-wrap items-center justify-center gap-2 mt-4">
        <span
          v-for="fmt in ['TTF', 'OTF', 'WOFF', 'WOFF2', 'TTC', 'Variable Font']"
          :key="fmt"
          class="px-2.5 py-1 rounded-full text-[11px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700/60"
        >
          {{ fmt }}
        </span>
      </div>

      <div class="flex flex-wrap items-center justify-center gap-3 mt-6">
        <button
          type="button"
          @click="fontInputRef?.click()"
          :disabled="isParsing"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors cursor-pointer disabled:opacity-50"
        >
          <Upload class="w-4 h-4" />
          <span>{{ t('tools.fontSubsetter.selectFileBtn') }}</span>
        </button>

        <button
          type="button"
          @click="loadSampleFont"
          :disabled="isParsing"
          class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer disabled:opacity-50"
        >
          <Sparkles class="w-4 h-4 text-blue-500" />
          <span>{{ t('tools.fontSubsetter.trySampleBtn') }}</span>
        </button>
      </div>
    </div>

    <!-- 主工作区：左侧裁剪配置 / 右侧结果对比与导出 -->
    <div
      v-else
      @dragover.prevent="isDragging = true"
      @dragleave.prevent="isDragging = false"
      @drop="handleDrop"
      class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start"
      :class="{ 'ring-2 ring-blue-500/40 rounded-2xl': isDragging }"
    >
      <!-- 左侧栏 (7 cols) -->
      <div class="xl:col-span-7 flex flex-col gap-3.5">
        <!-- 1. 源字体信息卡片 -->
        <section
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 flex flex-col gap-3"
        >
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div class="min-w-0">
              <div class="flex flex-wrap items-center gap-2">
                <h2 class="text-sm font-bold text-zinc-900 dark:text-zinc-100 truncate">
                  {{ metadata.familyName }}
                </h2>
                <span
                  class="px-2 py-0.5 rounded-md text-[10px] font-mono font-semibold uppercase bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/50"
                >
                  {{ metadata.sourceFormat }}
                </span>
                <span
                  v-if="metadata.axes.length > 0"
                  class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200/60 dark:border-violet-800/50"
                >
                  {{ t('tools.fontSubsetter.variableBadge', { count: metadata.axes.length }) }}
                </span>
                <span
                  v-if="metadata.hasHinting"
                  class="px-2 py-0.5 rounded-md text-[10px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400"
                >
                  Hinting
                </span>
              </div>
              <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span class="font-mono truncate max-w-[260px]">{{ sourceFileName }}</span>
                <span>{{ metadata.subfamilyName }}</span>
                <span>UPM: {{ metadata.unitsPerEm }}</span>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <CustomSelect
                v-if="metadata.isCollection && metadata.faceCount > 1"
                :model-value="selectedFaceIndex"
                :options="faceOptions"
                @change="handleFaceIndexChange"
              />
              <button
                type="button"
                @click="showMetadataDrawer = !showMetadataDrawer"
                class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                <Info class="w-3.5 h-3.5" />
                <span>{{ t('tools.fontSubsetter.fontDetails') }}</span>
                <ChevronUp v-if="showMetadataDrawer" class="w-3.5 h-3.5" />
                <ChevronDown v-else class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 关键指标栏 -->
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border border-zinc-200/60 dark:border-zinc-800">
              <div class="text-[10px] text-zinc-400 uppercase tracking-wide">
                {{ t('tools.fontSubsetter.fileSize') }}
              </div>
              <div class="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {{ formatBytes(sourceRawSize) }}
              </div>
            </div>
            <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border border-zinc-200/60 dark:border-zinc-800">
              <div class="text-[10px] text-zinc-400 uppercase tracking-wide">
                {{ t('tools.fontSubsetter.glyphCount') }}
              </div>
              <div class="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {{ metadata.numGlyphs.toLocaleString() }}
              </div>
            </div>
            <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border border-zinc-200/60 dark:border-zinc-800">
              <div class="text-[10px] text-zinc-400 uppercase tracking-wide">
                {{ t('tools.fontSubsetter.supportedChars') }}
              </div>
              <div class="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {{ metadata.codepoints.length.toLocaleString() }}
              </div>
            </div>
            <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border border-zinc-200/60 dark:border-zinc-800">
              <div class="text-[10px] text-zinc-400 uppercase tracking-wide">
                {{ t('tools.fontSubsetter.otFeaturesCount') }}
              </div>
              <div class="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5">
                {{ metadata.features.length }}
              </div>
            </div>
          </div>

          <!-- 展开的字体元信息与 SFNT 表清单 -->
          <div
            v-if="showMetadataDrawer"
            class="pt-3 border-t border-zinc-200/70 dark:border-zinc-800/70 flex flex-col gap-2.5 text-xs"
          >
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-600 dark:text-zinc-300">
              <div v-if="metadata.postScriptName">
                <span class="text-zinc-400">PostScript: </span>
                <span class="font-mono">{{ metadata.postScriptName }}</span>
              </div>
              <div v-if="metadata.version">
                <span class="text-zinc-400">{{ t('tools.fontSubsetter.version') }}: </span>
                <span class="font-mono">{{ metadata.version }}</span>
              </div>
              <div v-if="metadata.designer">
                <span class="text-zinc-400">{{ t('tools.fontSubsetter.designer') }}: </span>
                <span>{{ metadata.designer }}</span>
              </div>
              <div>
                <span class="text-zinc-400">Metrics: </span>
                <span class="font-mono">Asc {{ metadata.ascender }} / Desc {{ metadata.descender }} / Gap {{ metadata.lineGap }}</span>
              </div>
            </div>
            <div v-if="metadata.copyright" class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {{ metadata.copyright }}
            </div>
            <div class="flex flex-wrap gap-1.5">
              <span
                v-for="tb in metadata.tables"
                :key="tb.tag"
                class="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-300"
              >
                {{ tb.tag }} · {{ formatBytes(tb.length) }}
              </span>
            </div>
          </div>
        </section>

        <!-- 2. 保留字符集配置卡片 -->
        <section
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 flex flex-col gap-3.5"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <FileText class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 class="text-xs font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
                {{ t('tools.fontSubsetter.charSelectionTitle') }}
              </h3>
            </div>

            <!-- 裁剪模式切换 -->
            <div class="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/70 dark:border-zinc-700/70">
              <button
                type="button"
                @click="keepAllGlyphs = false"
                class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
                :class="!keepAllGlyphs ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
              >
                {{ t('tools.fontSubsetter.modeSubset') }}
              </button>
              <button
                type="button"
                @click="keepAllGlyphs = true"
                class="px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer"
                :class="keepAllGlyphs ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-xs' : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
              >
                {{ t('tools.fontSubsetter.modeKeepAll') }}
              </button>
            </div>
          </div>

          <div
            v-if="keepAllGlyphs"
            class="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 px-3.5 py-3 text-xs text-blue-700 dark:text-blue-300 leading-relaxed"
          >
            {{ t('tools.fontSubsetter.keepAllNotice') }}
          </div>

          <template v-else>
            <!-- 快捷预设条 -->
            <div>
              <div class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">
                {{ t('tools.fontSubsetter.quickPresets') }}
              </div>
              <div class="flex flex-wrap gap-1.5">
                <button
                  v-for="preset in FONT_CHAR_PRESETS"
                  :key="preset.id"
                  type="button"
                  @click="applyPreset(preset)"
                  :title="t(preset.descKey)"
                  class="px-2.5 py-1 rounded-lg text-[11px] font-medium border border-zinc-200/80 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-700 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                >
                  + {{ t(preset.labelKey) }}
                </button>
              </div>
            </div>

            <!-- 文本输入区 -->
            <div>
              <div class="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                <label class="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                  {{ t('tools.fontSubsetter.textInputLabel') }}
                </label>
                <div class="flex items-center gap-1.5">
                  <button
                    type="button"
                    @click="textFileInputRef?.click()"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    {{ t('tools.fontSubsetter.extractFromFile') }}
                  </button>
                  <button
                    type="button"
                    @click="deduplicateSubsetText"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
                  >
                    {{ t('tools.fontSubsetter.deduplicate') }}
                  </button>
                  <button
                    type="button"
                    @click="clearCharSelection"
                    class="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-rose-600 dark:hover:text-rose-400 transition-colors cursor-pointer"
                  >
                    {{ t('common.clear') }}
                  </button>
                </div>
              </div>
              <textarea
                v-model="subsetText"
                rows="3"
                :placeholder="t('tools.fontSubsetter.textPlaceholder')"
                class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-950/60 px-3 py-2 text-xs text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 resize-y font-sans leading-relaxed"
              />
            </div>

            <!-- Unicode 范围输入 -->
            <div>
              <label class="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                {{ t('tools.fontSubsetter.unicodeRangeLabel') }}
              </label>
              <input
                v-model="unicodeRangeInput"
                type="text"
                placeholder="U+0020-007E, U+4E00-9FFF, U+3000-303F"
                class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50/70 dark:bg-zinc-950/60 px-3 py-2 text-xs font-mono text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
              />
              <p
                v-if="coverage.invalidRangeTokens.length > 0"
                class="text-[11px] text-rose-600 dark:text-rose-400 mt-1 font-mono"
              >
                {{ t('tools.fontSubsetter.invalidRanges') }}: {{ coverage.invalidRangeTokens.join(', ') }}
              </p>
            </div>

            <!-- 覆盖率统计与缺失字形警告 -->
            <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 px-3 py-2.5 flex flex-col gap-2">
              <div class="flex flex-wrap items-center justify-between gap-2 text-xs">
                <div class="flex flex-wrap items-center gap-3">
                  <span class="text-zinc-500 dark:text-zinc-400">
                    {{ t('tools.fontSubsetter.requestedCount') }}:
                    <strong class="font-mono text-zinc-800 dark:text-zinc-200">{{ coverage.requestedCodepoints.length }}</strong>
                  </span>
                  <span class="text-emerald-600 dark:text-emerald-400">
                    {{ t('tools.fontSubsetter.matchedCount') }}:
                    <strong class="font-mono">{{ coverage.presentCodepoints.length }}</strong>
                  </span>
                  <span
                    v-if="coverage.missingCodepoints.length > 0"
                    class="text-amber-600 dark:text-amber-400"
                  >
                    {{ t('tools.fontSubsetter.missingCount') }}:
                    <strong class="font-mono">{{ coverage.missingCodepoints.length }}</strong>
                  </span>
                  <span
                    v-if="pickedCodepoints.length > 0"
                    class="text-blue-600 dark:text-blue-400"
                  >
                    {{ t('tools.fontSubsetter.pickedCount', { count: pickedCodepoints.length }) }}
                  </span>
                </div>

                <button
                  type="button"
                  @click="showGlyphBrowser = !showGlyphBrowser"
                  class="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  <span>{{ showGlyphBrowser ? t('tools.fontSubsetter.hideGlyphBrowser') : t('tools.fontSubsetter.openGlyphBrowser') }}</span>
                  <ChevronUp v-if="showGlyphBrowser" class="w-3.5 h-3.5" />
                  <ChevronDown v-else class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- 缺失字形列表提示 -->
              <div
                v-if="missingPreviewChars.length > 0"
                class="flex flex-wrap items-center gap-1 pt-1.5 border-t border-zinc-200/60 dark:border-zinc-700/60"
              >
                <span class="text-[10px] text-amber-600 dark:text-amber-400 mr-1">
                  {{ t('tools.fontSubsetter.missingHint') }}:
                </span>
                <span
                  v-for="item in missingPreviewChars"
                  :key="item.cp"
                  :title="item.hex"
                  class="px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-800/50 text-[11px] font-mono text-amber-700 dark:text-amber-300"
                >
                  {{ item.char }} <span class="opacity-60 text-[9px]">{{ item.hex }}</span>
                </span>
                <span
                  v-if="coverage.missingCodepoints.length > 60"
                  class="text-[10px] text-zinc-400 ml-1"
                >
                  +{{ coverage.missingCodepoints.length - 60 }}
                </span>
              </div>
            </div>

            <!-- 交互式字形浏览器 -->
            <div
              v-if="showGlyphBrowser"
              class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/40 p-3 flex flex-col gap-2.5"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="flex flex-wrap items-center gap-2">
                  <CustomSelect
                    v-model="selectedBlockId"
                    :options="blockFilterOptions"
                  />
                  <div class="relative">
                    <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      v-model="glyphSearch"
                      type="text"
                      :placeholder="t('tools.fontSubsetter.glyphSearchPlaceholder')"
                      class="pl-8 pr-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500 w-44"
                    />
                  </div>
                </div>
                <div class="flex items-center gap-1.5 text-[11px] text-zinc-500">
                  <button
                    type="button"
                    :disabled="glyphPage <= 1"
                    @click="glyphPage--"
                    class="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer"
                  >
                    ‹
                  </button>
                  <span class="font-mono">{{ glyphPage }} / {{ totalGlyphPages }}</span>
                  <button
                    type="button"
                    :disabled="glyphPage >= totalGlyphPages"
                    @click="glyphPage++"
                    class="px-2 py-0.5 rounded border border-zinc-200 dark:border-zinc-700 disabled:opacity-40 cursor-pointer"
                  >
                    ›
                  </button>
                </div>
              </div>

              <div class="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-12 gap-1.5 max-h-60 overflow-y-auto pr-1">
                <button
                  v-for="cp in pagedGlyphs"
                  :key="cp"
                  type="button"
                  @click="togglePickedGlyph(cp)"
                  :title="formatCodepointHex(cp)"
                  class="flex flex-col items-center justify-center p-1.5 rounded-lg border text-center transition-all cursor-pointer"
                  :class="
                    pickedSet.has(cp)
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 ring-1 ring-blue-500/30'
                      : 'border-zinc-200/70 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 hover:border-blue-400'
                  "
                >
                  <span
                    class="text-base leading-tight h-6 flex items-center justify-center"
                    :style="origFontReady ? { fontFamily: `'${origPreviewFamily}', sans-serif` } : undefined"
                  >
                    {{ cp >= 0x20 ? String.fromCodePoint(cp) : '␣' }}
                  </span>
                  <span class="text-[9px] font-mono text-zinc-400 mt-0.5">
                    {{ cp.toString(16).toUpperCase().padStart(4, '0') }}
                  </span>
                </button>
              </div>
            </div>
          </template>
        </section>

        <!-- 3. 格式、特性与高级优化配置 -->
        <section
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 flex flex-col gap-4"
        >
          <div class="flex items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <SlidersHorizontal class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 class="text-xs font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
                {{ t('tools.fontSubsetter.optionsTitle') }}
              </h3>
            </div>
          </div>

          <!-- 输出格式选择 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                {{ t('tools.fontSubsetter.outputFormat') }}
              </label>
              <div class="grid grid-cols-3 gap-1.5">
                <button
                  v-for="fmt in [
                    { id: 'woff2', label: 'WOFF2', hint: 'Smallest' },
                    { id: 'woff', label: 'WOFF', hint: 'Legacy' },
                    { id: 'sfnt', label: metadata.sfntFlavor.toUpperCase(), hint: 'Desktop' },
                  ]"
                  :key="fmt.id"
                  type="button"
                  @click="outputFormat = fmt.id as OutputFormat"
                  class="flex flex-col items-center py-2 px-2 rounded-xl border text-xs transition-all cursor-pointer"
                  :class="
                    outputFormat === fmt.id
                      ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 font-semibold'
                      : 'border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-800/40 text-zinc-600 dark:text-zinc-300 hover:border-zinc-300 dark:hover:border-zinc-600'
                  "
                >
                  <span class="font-mono">{{ fmt.label }}</span>
                  <span class="text-[10px] opacity-70 font-normal">{{ fmt.hint }}</span>
                </button>
              </div>
            </div>

            <!-- OpenType 排版特性模式 -->
            <div>
              <label class="block text-[11px] font-medium text-zinc-600 dark:text-zinc-300 mb-1.5">
                {{ t('tools.fontSubsetter.layoutFeatures') }}
              </label>
              <CustomSelect
                v-model="featureMode"
                :options="featureModeOptions"
                full-width
                size="md"
              />
              <p class="text-[10px] text-zinc-400 mt-1">
                {{ t('tools.fontSubsetter.layoutFeaturesHint') }}
              </p>
            </div>
          </div>

          <!-- 自定义 OpenType Feature 标签点选 -->
          <div
            v-if="featureMode === 'custom' && metadata.features.length > 0"
            class="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 p-3"
          >
            <div class="flex items-center justify-between mb-2 text-[11px] text-zinc-500">
              <span>{{ t('tools.fontSubsetter.selectFeatures') }} ({{ customFeatures.length }} / {{ metadata.features.length }})</span>
              <div class="flex gap-2">
                <button
                  type="button"
                  @click="customFeatures = metadata.features.map(f => f.tag)"
                  class="text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                >
                  {{ t('tools.fontSubsetter.selectAll') }}
                </button>
                <button
                  type="button"
                  @click="customFeatures = []"
                  class="text-zinc-500 hover:underline cursor-pointer"
                >
                  {{ t('common.clear') }}
                </button>
              </div>
            </div>
            <div class="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              <button
                v-for="feat in metadata.features"
                :key="feat.tag"
                type="button"
                @click="toggleCustomFeature(feat.tag)"
                :title="`${feat.tables.join('/')} · ${describeOpenTypeFeature(feat.tag, isZh)}`"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer"
                :class="
                  customFeatures.includes(feat.tag)
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                    : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500'
                "
              >
                <Check v-if="customFeatures.includes(feat.tag)" class="w-3 h-3" />
                <span>{{ feat.tag }}</span>
              </button>
            </div>
          </div>

          <!-- 可变字体轴配置 (fvar) -->
          <div
            v-if="metadata.axes.length > 0"
            class="rounded-xl bg-violet-50/40 dark:bg-violet-950/20 border border-violet-200/70 dark:border-violet-800/40 p-3 flex flex-col gap-2.5"
          >
            <div class="flex items-center gap-2 text-xs font-semibold text-violet-800 dark:text-violet-300">
              <Layers class="w-3.5 h-3.5" />
              <span>{{ t('tools.fontSubsetter.variableAxesTitle') }}</span>
            </div>

            <div
              v-for="axis in metadata.axes"
              :key="axis.tag"
              class="rounded-lg bg-white/80 dark:bg-zinc-900/70 border border-violet-200/50 dark:border-zinc-800 p-2.5 flex flex-col gap-2"
            >
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="text-xs">
                  <span class="font-mono font-semibold text-zinc-800 dark:text-zinc-100">{{ axis.tag }}</span>
                  <span class="text-zinc-500 dark:text-zinc-400 ml-1.5">{{ axis.name }}</span>
                  <span class="text-[10px] font-mono text-zinc-400 ml-2">
                    [{{ axis.minValue }} .. {{ axis.maxValue }}] (default {{ axis.defaultValue }})
                  </span>
                </div>
                <div class="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 text-[11px]">
                  <button
                    v-for="m in [
                      { id: 'keep', label: t('tools.fontSubsetter.axisKeep') },
                      { id: 'pin', label: t('tools.fontSubsetter.axisPin') },
                      { id: 'range', label: t('tools.fontSubsetter.axisRange') },
                    ]"
                    :key="m.id"
                    type="button"
                    @click="variationAxesConfig[axis.tag].mode = m.id as any"
                    class="px-2 py-0.5 rounded-md transition-colors cursor-pointer"
                    :class="
                      variationAxesConfig[axis.tag]?.mode === m.id
                        ? 'bg-white dark:bg-zinc-700 text-violet-700 dark:text-violet-300 font-semibold shadow-2xs'
                        : 'text-zinc-500'
                    "
                  >
                    {{ m.label }}
                  </button>
                </div>
              </div>

              <div
                v-if="variationAxesConfig[axis.tag]?.mode === 'pin'"
                class="flex items-center gap-3"
              >
                <input
                  v-model.number="variationAxesConfig[axis.tag].value"
                  type="range"
                  :min="axis.minValue"
                  :max="axis.maxValue"
                  :step="axis.maxValue - axis.minValue <= 10 ? 0.1 : 1"
                  class="flex-1 accent-violet-600"
                />
                <input
                  v-model.number="variationAxesConfig[axis.tag].value"
                  type="number"
                  :min="axis.minValue"
                  :max="axis.maxValue"
                  class="w-20 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 text-xs font-mono"
                />
              </div>

              <div
                v-if="variationAxesConfig[axis.tag]?.mode === 'range'"
                class="flex flex-wrap items-center gap-2 text-xs"
              >
                <span class="text-zinc-400">Min</span>
                <input
                  v-model.number="variationAxesConfig[axis.tag].min"
                  type="number"
                  :min="axis.minValue"
                  :max="axis.maxValue"
                  class="w-24 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 text-xs font-mono"
                />
                <span class="text-zinc-400">Max</span>
                <input
                  v-model.number="variationAxesConfig[axis.tag].max"
                  type="number"
                  :min="axis.minValue"
                  :max="axis.maxValue"
                  class="w-24 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 text-xs font-mono"
                />
              </div>
            </div>
          </div>

          <!-- 压缩优化开关 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <label
              class="flex items-start gap-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
            >
              <input v-model="noHinting" type="checkbox" class="mt-0.5 accent-blue-600" />
              <div>
                <div class="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {{ t('tools.fontSubsetter.flags.noHinting') }}
                </div>
                <div class="text-[10px] text-zinc-400">
                  {{ t('tools.fontSubsetter.flags.noHintingDesc') }}
                </div>
              </div>
            </label>

            <label
              class="flex items-start gap-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
            >
              <input v-model="dropDsigAndLegacyKern" type="checkbox" class="mt-0.5 accent-blue-600" />
              <div>
                <div class="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {{ t('tools.fontSubsetter.flags.dropRedundant') }}
                </div>
                <div class="text-[10px] text-zinc-400">
                  {{ t('tools.fontSubsetter.flags.dropRedundantDesc') }}
                </div>
              </div>
            </label>

            <label
              class="flex items-start gap-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
            >
              <input v-model="noLayoutClosure" type="checkbox" class="mt-0.5 accent-blue-600" />
              <div>
                <div class="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {{ t('tools.fontSubsetter.flags.noLayoutClosure') }}
                </div>
                <div class="text-[10px] text-zinc-400">
                  {{ t('tools.fontSubsetter.flags.noLayoutClosureDesc') }}
                </div>
              </div>
            </label>

            <label
              class="flex items-start gap-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
            >
              <input v-model="retainGids" type="checkbox" class="mt-0.5 accent-blue-600" />
              <div>
                <div class="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {{ t('tools.fontSubsetter.flags.retainGids') }}
                </div>
                <div class="text-[10px] text-zinc-400">
                  {{ t('tools.fontSubsetter.flags.retainGidsDesc') }}
                </div>
              </div>
            </label>

            <label
              class="flex items-start gap-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
            >
              <input v-model="glyphNames" type="checkbox" class="mt-0.5 accent-blue-600" />
              <div>
                <div class="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {{ t('tools.fontSubsetter.flags.glyphNames') }}
                </div>
                <div class="text-[10px] text-zinc-400">
                  {{ t('tools.fontSubsetter.flags.glyphNamesDesc') }}
                </div>
              </div>
            </label>

            <label
              v-if="metadata.sfntFlavor === 'otf'"
              class="flex items-start gap-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 px-3 py-2 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/40"
            >
              <input v-model="desubroutinize" type="checkbox" class="mt-0.5 accent-blue-600" />
              <div>
                <div class="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {{ t('tools.fontSubsetter.flags.desubroutinize') }}
                </div>
                <div class="text-[10px] text-zinc-400">
                  {{ t('tools.fontSubsetter.flags.desubroutinizeDesc') }}
                </div>
              </div>
            </label>
          </div>

          <!-- 执行裁剪按钮 -->
          <button
            type="button"
            @click="runSubset"
            :disabled="isSubsetting || (!keepAllGlyphs && coverage.presentCodepoints.length === 0)"
            class="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Loader2 v-if="isSubsetting" class="w-4 h-4 animate-spin" />
            <Scissors v-else class="w-4 h-4" />
            <span>
              {{ isSubsetting ? t('tools.fontSubsetter.running') : t('tools.fontSubsetter.runSubset') }}
            </span>
          </button>
        </section>
      </div>

      <!-- 右侧栏 (5 cols)：结果统计、渲染对比与导出 -->
      <div class="xl:col-span-5 flex flex-col gap-3.5">
        <!-- 1. 裁剪结果与体积压缩统计 -->
        <section
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 flex flex-col gap-3"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <RefreshCw class="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 class="text-xs font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
                {{ t('tools.fontSubsetter.resultTitle') }}
              </h3>
            </div>
            <span
              v-if="subsetResult"
              class="text-[11px] font-mono text-zinc-400"
            >
              {{ subsetResult.elapsedMs }} ms
            </span>
          </div>

          <div
            v-if="subsetResult"
            class="flex flex-col gap-3"
          >
            <!-- 体积前后对比横幅 -->
            <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800 p-3">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2 text-xs">
                  <span class="font-mono text-zinc-500">{{ formatBytes(sourceRawSize) }}</span>
                  <ArrowRight class="w-3.5 h-3.5 text-zinc-400" />
                  <span class="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100">
                    {{ formatBytes(subsetResult.byteLength) }}
                  </span>
                </div>
                <span
                  class="px-2 py-0.5 rounded-full text-xs font-mono font-semibold"
                  :class="
                    savingsPercent >= 0
                      ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400'
                      : 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400'
                  "
                >
                  {{ savingsPercent >= 0 ? `-${savingsPercent.toFixed(2)}%` : `+${Math.abs(savingsPercent).toFixed(2)}%` }}
                </span>
              </div>

              <!-- 进度对比条 -->
              <div class="h-1.5 w-full rounded-full bg-zinc-200 dark:bg-zinc-700 mt-2.5 overflow-hidden">
                <div
                  class="h-full rounded-full bg-emerald-500 transition-all duration-300"
                  :style="{
                    width: `${Math.max(2, Math.min(100, (subsetResult.byteLength / Math.max(1, sourceRawSize)) * 100))}%`,
                  }"
                />
              </div>

              <div class="grid grid-cols-3 gap-2 mt-3 text-[11px]">
                <div>
                  <div class="text-zinc-400">{{ t('tools.fontSubsetter.outputExt') }}</div>
                  <div class="font-mono font-semibold text-zinc-800 dark:text-zinc-200 uppercase">
                    .{{ subsetResult.outputExt }}
                  </div>
                </div>
                <div>
                  <div class="text-zinc-400">{{ t('tools.fontSubsetter.subsetGlyphs') }}</div>
                  <div class="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                    {{ subsetResult.numGlyphs }} / {{ metadata.numGlyphs }}
                  </div>
                </div>
                <div>
                  <div class="text-zinc-400">{{ t('tools.fontSubsetter.subsetChars') }}</div>
                  <div class="font-mono font-semibold text-zinc-800 dark:text-zinc-200">
                    {{ subsetResult.codepoints.length }}
                  </div>
                </div>
              </div>
            </div>

            <!-- 下载按钮与表对比开关 -->
            <div class="flex flex-wrap items-center gap-2">
              <button
                type="button"
                @click="downloadSubsetFont"
                class="flex-1 inline-flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-sm transition-colors cursor-pointer"
              >
                <Download class="w-4 h-4" />
                <span class="truncate">{{ t('tools.fontSubsetter.downloadFont') }} ({{ outputFilename }})</span>
              </button>

              <button
                type="button"
                @click="showTableComparison = !showTableComparison"
                class="inline-flex items-center gap-1.5 py-2 px-3 rounded-xl text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
              >
                <Table2 class="w-3.5 h-3.5" />
                <span>{{ t('tools.fontSubsetter.tablesDiff') }}</span>
              </button>
            </div>

            <!-- SFNT 表级体积对比表 -->
            <div
              v-if="showTableComparison"
              class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden"
            >
              <div class="max-h-52 overflow-y-auto">
                <table class="w-full text-[11px] font-mono">
                  <thead class="bg-zinc-100 dark:bg-zinc-800/80 text-zinc-500 sticky top-0">
                    <tr>
                      <th class="text-left px-3 py-1.5 font-medium">Table</th>
                      <th class="text-right px-3 py-1.5 font-medium">{{ t('tools.fontSubsetter.before') }}</th>
                      <th class="text-right px-3 py-1.5 font-medium">{{ t('tools.fontSubsetter.after') }}</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800/60">
                    <tr v-for="row in tableComparisonRows" :key="row.tag">
                      <td class="px-3 py-1 font-semibold text-zinc-700 dark:text-zinc-200">{{ row.tag }}</td>
                      <td class="px-3 py-1 text-right text-zinc-500">{{ formatBytes(row.before) }}</td>
                      <td
                        class="px-3 py-1 text-right"
                        :class="row.after === 0 ? 'text-zinc-400 line-through' : 'text-emerald-600 dark:text-emerald-400'"
                      >
                        {{ row.after === 0 ? 'dropped' : formatBytes(row.after) }}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </section>

        <!-- 2. 实时渲染效果对比 -->
        <section
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 flex flex-col gap-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Eye class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 class="text-xs font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
                {{ t('tools.fontSubsetter.livePreviewTitle') }}
              </h3>
            </div>

            <div class="flex items-center gap-1.5">
              <div class="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 text-[11px]">
                <button
                  v-for="m in [
                    { id: 'split', label: t('tools.fontSubsetter.previewCompare') },
                    { id: 'subset', label: t('tools.fontSubsetter.previewSubsetOnly') },
                    { id: 'original', label: t('tools.fontSubsetter.previewOriginalOnly') },
                  ]"
                  :key="m.id"
                  type="button"
                  @click="previewCompareMode = m.id as any"
                  class="px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                  :class="previewCompareMode === m.id ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 font-medium shadow-2xs' : 'text-zinc-500'"
                >
                  {{ m.label }}
                </button>
              </div>

              <button
                type="button"
                @click="previewSurface = previewSurface === 'light' ? 'dark' : 'light'"
                class="p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                :title="t('tools.fontSubsetter.togglePreviewSurface')"
              >
                <Sun v-if="previewSurface === 'dark'" class="w-3.5 h-3.5" />
                <Moon v-else class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div class="flex flex-wrap items-center gap-3">
            <input
              v-model="previewText"
              type="text"
              :placeholder="t('tools.fontSubsetter.previewPlaceholder')"
              class="flex-1 min-w-[180px] rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/60 px-2.5 py-1.5 text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500"
            />
            <div class="flex items-center gap-2 text-[11px] font-mono text-zinc-500">
              <span>{{ previewFontSize }}px</span>
              <input
                v-model.number="previewFontSize"
                type="range"
                min="14"
                max="64"
                class="w-24 accent-blue-600"
              />
            </div>
          </div>

          <div
            class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 p-3.5 flex flex-col gap-3 transition-colors"
            :class="previewSurface === 'dark' ? 'bg-zinc-950 text-zinc-100' : 'bg-white text-zinc-900'"
          >
            <div v-if="previewCompareMode !== 'subset'">
              <div class="text-[10px] font-mono uppercase tracking-wider opacity-50 mb-1">
                {{ t('tools.fontSubsetter.originalFontLabel') }}
              </div>
              <div
                class="break-words leading-snug"
                :style="{
                  fontFamily: origFontReady ? `'${origPreviewFamily}', sans-serif` : 'sans-serif',
                  fontSize: `${previewFontSize}px`,
                }"
              >
                {{ previewText || 'AaBbCc 0123' }}
              </div>
            </div>

            <div
              v-if="previewCompareMode === 'split'"
              class="border-t"
              :class="previewSurface === 'dark' ? 'border-zinc-800' : 'border-zinc-200'"
            />

            <div v-if="previewCompareMode !== 'original'">
              <div class="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider opacity-60 mb-1">
                <span>{{ t('tools.fontSubsetter.subsetFontLabel') }}</span>
                <span v-if="!subFontReady" class="text-amber-500">{{ t('tools.fontSubsetter.waitingSubset') }}</span>
              </div>
              <div
                class="break-words leading-snug"
                :style="{
                  fontFamily: subFontReady ? `'${subPreviewFamily}', sans-serif` : 'sans-serif',
                  fontSize: `${previewFontSize}px`,
                }"
              >
                {{ previewText || 'AaBbCc 0123' }}
              </div>
            </div>
          </div>
        </section>

        <!-- 3. CSS @font-face 与 Base64 导出 -->
        <section
          v-if="subsetResult"
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 flex flex-col gap-3"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <div class="flex items-center gap-2">
              <Code2 class="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <h3 class="text-xs font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
                {{ t('tools.fontSubsetter.exportCssTitle') }}
              </h3>
            </div>
            <div class="flex items-center gap-1.5">
              <CopyButton :text="activeExportCode" />
              <button
                v-if="exportTab === 'css-url' || exportTab === 'css-base64'"
                type="button"
                @click="downloadCssFile"
                class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
              >
                <Download class="w-3.5 h-3.5" />
                <span>.css</span>
              </button>
            </div>
          </div>

          <div class="flex flex-wrap gap-1 rounded-xl p-1 bg-zinc-100 dark:bg-zinc-800/80 text-xs">
            <button
              v-for="tab in [
                { id: 'css-url', label: '@font-face (URL)' },
                { id: 'css-base64', label: '@font-face (Base64)' },
                { id: 'base64', label: 'Base64' },
                { id: 'unicode-range', label: 'unicode-range' },
              ]"
              :key="tab.id"
              type="button"
              @click="exportTab = tab.id as any"
              class="flex-1 px-2.5 py-1 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap"
              :class="
                exportTab === tab.id
                  ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs'
                  : 'text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
              "
            >
              {{ tab.label }}
            </button>
          </div>

          <div
            v-if="exportTab === 'css-url' || exportTab === 'css-base64'"
            class="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs"
          >
            <div class="col-span-2">
              <label class="block text-[10px] text-zinc-400 mb-1">font-family</label>
              <input
                v-model="customFontFamily"
                type="text"
                class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1 text-xs font-mono"
              />
            </div>
            <div>
              <label class="block text-[10px] text-zinc-400 mb-1">font-weight</label>
              <input
                v-model="customFontWeight"
                type="text"
                class="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1 text-xs font-mono"
              />
            </div>
            <div>
              <label class="block text-[10px] text-zinc-400 mb-1">font-display</label>
              <CustomSelect
                v-model="customFontDisplay"
                :options="displayOptions"
                full-width
              />
            </div>
          </div>

          <pre
            class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/70 p-3 text-[11px] font-mono text-zinc-800 dark:text-zinc-200 overflow-x-auto max-h-56 whitespace-pre-wrap break-all leading-relaxed"
          >{{ activeExportCode }}</pre>
        </section>
      </div>
    </div>
  </ToolContainer>
</template>
