<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  FileType,
  Search,
  X,
  Copy,
  Check,
  File,
  Sparkles,
  Upload,
  Layers,
  FileCode,
  FileImage,
  FileAudio,
  FileVideo,
  FileArchive,
  FileText,
  Box,
  ChevronDown,
  AlertCircle
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import {
  mimeItems,
  extractExtension,
  findByExtension,
  findByMime,
  type MimeCategory
} from './data/mimeTypesData';

const { t, locale } = useI18n();

// 搜索关键词与分类筛选
const searchQuery = ref('');
const activeCategory = ref<MimeCategory>('all');

// 文件快速探查器状态
const testFilename = ref('');
const fileInputRef = ref<HTMLInputElement | null>(null);
const isDragging = ref(false);

// 展开详情的条目 ID 集合
const expandedIds = ref<Set<string>>(new Set());

// 复制状态缓存 (key: string -> boolean)
const copiedMap = ref<Record<string, boolean>>({});

function triggerCopied(key: string, text: string) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    copiedMap.value[key] = true;
    setTimeout(() => {
      copiedMap.value[key] = false;
    }, 1500);
  });
}

function toggleExpand(id: string) {
  if (expandedIds.value.has(id)) {
    expandedIds.value.delete(id);
  } else {
    expandedIds.value.add(id);
  }
}

// 分类元数据定义
interface CategoryTab {
  id: MimeCategory;
  nameZh: string;
  nameEn: string;
  icon: any;
  colorClass: string;
}

const categoryTabs: CategoryTab[] = [
  { id: 'all', nameZh: '全部类型', nameEn: 'All', icon: Layers, colorClass: 'text-zinc-600 dark:text-zinc-400' },
  { id: 'common', nameZh: '常用精选', nameEn: 'Popular', icon: Sparkles, colorClass: 'text-amber-500' },
  { id: 'text', nameZh: '网页/文本', nameEn: 'Text & Web', icon: FileCode, colorClass: 'text-blue-500' },
  { id: 'image', nameZh: '图片', nameEn: 'Image', icon: FileImage, colorClass: 'text-emerald-500' },
  { id: 'audio', nameZh: '音频', nameEn: 'Audio', icon: FileAudio, colorClass: 'text-purple-500' },
  { id: 'video', nameZh: '视频', nameEn: 'Video', icon: FileVideo, colorClass: 'text-rose-500' },
  { id: 'document', nameZh: '文档/办公', nameEn: 'Document', icon: FileText, colorClass: 'text-indigo-500' },
  { id: 'font', nameZh: '字体', nameEn: 'Font', icon: FileType, colorClass: 'text-cyan-500' },
  { id: 'archive', nameZh: '压缩包', nameEn: 'Archive', icon: FileArchive, colorClass: 'text-yellow-600 dark:text-yellow-400' },
  { id: 'application', nameZh: '应用/数据', nameEn: 'Application', icon: File, colorClass: 'text-teal-500' },
  { id: 'model', nameZh: '3D/模型', nameEn: '3D Model', icon: Box, colorClass: 'text-violet-500' }
];

// 各分类计数
const categoryCounts = computed(() => {
  const counts: Record<string, number> = {
    all: mimeItems.length,
    common: mimeItems.filter(i => i.isCommon).length
  };
  mimeItems.forEach(item => {
    counts[item.category] = (counts[item.category] || 0) + 1;
  });
  return counts;
});

// 过滤后的 MIME 列表
const filteredList = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  const cleanExt = q.replace(/^\./, '');

  return mimeItems.filter(item => {
    // 1. 分类过滤
    if (activeCategory.value === 'common') {
      if (!item.isCommon) return false;
    } else if (activeCategory.value !== 'all') {
      if (item.category !== activeCategory.value) return false;
    }

    // 2. 搜索关键词过滤
    if (!q) return true;

    // 匹配 MIME
    if (item.mime.toLowerCase().includes(q)) return true;
    // 匹配别名
    if (item.aliases?.some(a => a.toLowerCase().includes(q))) return true;
    // 匹配扩展名（例如输入 .png 或 png）
    if (item.extensions.some(ext => ext.toLowerCase().includes(cleanExt))) return true;
    // 匹配中文描述
    if (item.descriptionZh.toLowerCase().includes(q)) return true;
    // 匹配英文描述
    if (item.descriptionEn.toLowerCase().includes(q)) return true;

    return false;
  });
});

// 文件探查器解析结果
const detectiveResult = computed(() => {
  const raw = testFilename.value.trim();
  if (!raw) return null;

  const ext = extractExtension(raw);
  if (!ext) {
    // 尝试直接作为 MIME 查询
    const byMime = findByMime(raw);
    if (byMime) {
      return {
        matched: true,
        type: 'mime-input',
        item: byMime,
        ext: byMime.extensions[0] || '?',
        fullHeader: byMime.headerExample || `Content-Type: ${byMime.mime}${byMime.charsetNeeded ? '; charset=utf-8' : ''}`
      };
    }
    return {
      matched: false,
      type: 'unknown',
      ext: '',
      message: locale.value.startsWith('zh')
        ? '未能从输入中提取到有效的文件扩展名或 MIME 类型'
        : 'Could not extract a valid file extension or MIME type'
    };
  }

  const found = findByExtension(ext);
  if (found) {
    return {
      matched: true,
      type: 'file',
      item: found,
      ext: `.${ext}`,
      fullHeader: found.headerExample || `Content-Type: ${found.mime}${found.charsetNeeded ? '; charset=utf-8' : ''}`
    };
  }

  return {
    matched: false,
    type: 'unregistered',
    ext: `.${ext}`,
    fallbackMime: 'application/octet-stream',
    message: locale.value.startsWith('zh')
      ? `未收录扩展名 .${ext}，网络传输或下载建议默认使用 application/octet-stream`
      : `Unregistered extension .${ext}, standard fallback is application/octet-stream`
  };
});

// 拖拽文件处理
function handleDrop(e: DragEvent) {
  isDragging.value = false;
  if (e.dataTransfer && e.dataTransfer.files.length > 0) {
    const file = e.dataTransfer.files[0];
    testFilename.value = file.name;
  }
}

// 触发本地文件选择
function triggerFileSelect() {
  fileInputRef.value?.click();
}

function handleFileChange(e: Event) {
  const target = e.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    testFilename.value = target.files[0].name;
  }
}

function selectSample(filename: string) {
  testFilename.value = filename;
}

// 分类色彩标识
function getCategoryBadgeColor(cat: string) {
  switch (cat) {
    case 'text':
      return 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-900/50';
    case 'image':
      return 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/50';
    case 'audio':
      return 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-300 border-purple-200 dark:border-purple-900/50';
    case 'video':
      return 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-900/50';
    case 'document':
      return 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-900/50';
    case 'font':
      return 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-900/50';
    case 'archive':
      return 'bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300 border-orange-200 dark:border-orange-900/50';
    case 'application':
      return 'bg-teal-50 text-teal-700 dark:bg-teal-950/40 dark:text-teal-300 border-teal-200 dark:border-teal-900/50';
    case 'model':
      return 'bg-violet-50 text-violet-700 dark:bg-violet-950/40 dark:text-violet-300 border-violet-200 dark:border-violet-900/50';
    default:
      return 'bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700';
  }
}
</script>

<template>
  <ToolContainer
    toolId="mime-types"
    nameKey="tools.mimeTypes.name"
    descKey="tools.mimeTypes.desc"
    :icon="FileType"
    :wide="true"
    :fullHeight="true"
  >
    <div class="flex flex-col h-full overflow-hidden p-6 gap-5">
      <!-- 隐藏的文件选择器 -->
      <input
        ref="fileInputRef"
        type="file"
        class="hidden"
        @change="handleFileChange"
      />

      <!-- 顶部：文件快速探查器卡片 (File Detective) -->
      <div
        class="p-4 rounded-xl border transition-all"
        :class="[
          isDragging
            ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/30 ring-2 ring-blue-500/20'
            : 'border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900/70 shadow-xs'
        ]"
        @dragover.prevent="isDragging = true"
        @dragleave.prevent="isDragging = false"
        @drop.prevent="handleDrop"
      >
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-amber-500" />
            <h2 class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              {{ t('tools.mimeTypes.detectiveTitle') }}
            </h2>
            <span class="text-[11px] text-zinc-400 font-normal">
              ({{ t('tools.mimeTypes.detectiveDesc') }})
            </span>
          </div>

          <div class="flex items-center gap-2">
            <!-- 示例快捷点击 -->
            <div class="hidden sm:flex items-center gap-1.5 text-xs text-zinc-400">
              <span>{{ t('tools.mimeTypes.samples') }}:</span>
              <button
                v-for="sample in ['app.wasm', 'banner.webp', 'data.json', 'video.m3u8', 'report.docx']"
                :key="sample"
                type="button"
                @click="selectSample(sample)"
                class="px-1.5 py-0.5 rounded bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 font-mono text-[11px] transition-colors cursor-pointer"
              >
                {{ sample }}
              </button>
            </div>

            <button
              type="button"
              @click="triggerFileSelect"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              <Upload class="w-3.5 h-3.5" />
              <span>{{ t('tools.mimeTypes.selectFile') }}</span>
            </button>
          </div>
        </div>

        <div class="flex flex-col gap-3">
          <!-- 输入框 -->
          <div class="relative flex items-center">
            <input
              v-model="testFilename"
              type="text"
              class="w-full px-3.5 py-2 pl-9 rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/80 text-sm font-mono text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
              :placeholder="t('tools.mimeTypes.detectiveDesc')"
            />
            <File class="w-4 h-4 text-zinc-400 absolute left-3 pointer-events-none" />
            <button
              v-if="testFilename"
              type="button"
              @click="testFilename = ''"
              class="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 absolute right-2.5 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- 探查结果卡片 -->
          <div
            v-if="detectiveResult"
            class="p-3.5 rounded-xl border text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 animate-fade-in"
            :class="[
              detectiveResult.matched
                ? 'bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/40 text-blue-950 dark:text-blue-100'
                : 'bg-zinc-100/70 dark:bg-zinc-800/60 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300'
            ]"
          >
            <div v-if="detectiveResult.matched && detectiveResult.item" class="flex flex-col gap-1.5 flex-1 min-w-0">
              <div class="flex items-center gap-2 flex-wrap">
                <span class="font-bold text-sm text-blue-700 dark:text-blue-300 font-mono">
                  {{ detectiveResult.item.mime }}
                </span>
                <span
                  class="px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase border"
                  :class="getCategoryBadgeColor(detectiveResult.item.category)"
                >
                  {{ detectiveResult.item.category }}
                </span>
                <span
                  class="px-2 py-0.5 rounded-md text-[10px] font-mono border"
                  :class="detectiveResult.item.isBinary ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'"
                >
                  {{ detectiveResult.item.isBinary ? 'Binary (二进制)' : 'Text (文本)' }}
                </span>
                <span
                  v-if="detectiveResult.item.charsetNeeded"
                  class="px-2 py-0.5 rounded-md text-[10px] font-mono bg-blue-100/70 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800"
                >
                  charset=utf-8
                </span>
              </div>

              <div class="text-zinc-600 dark:text-zinc-300 text-xs flex items-center gap-2">
                <span>{{ locale.startsWith('zh') ? detectiveResult.item.descriptionZh : detectiveResult.item.descriptionEn }}</span>
                <span class="text-zinc-400">·</span>
                <span class="font-mono text-zinc-500">扩展名: {{ detectiveResult.item.extensions.map(e => `.${e}`).join(', ') }}</span>
              </div>

              <div class="mt-1 flex items-center gap-2 font-mono text-[11px] bg-white dark:bg-zinc-900 px-2.5 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 select-all">
                <span class="text-zinc-400 select-none">HTTP Header:</span>
                <span class="font-semibold text-blue-600 dark:text-blue-400">{{ detectiveResult.fullHeader }}</span>
              </div>
            </div>

            <!-- 未匹配到的状态 -->
            <div v-else class="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
              <AlertCircle class="w-4 h-4 text-amber-500 shrink-0" />
              <span>{{ detectiveResult.message }}</span>
            </div>

            <!-- 快捷复制按钮组 -->
            <div v-if="detectiveResult.matched && detectiveResult.item" class="flex items-center gap-2 shrink-0">
              <button
                type="button"
                @click="triggerCopied('detective-mime', detectiveResult.item.mime)"
                class="px-3 py-1.5 rounded-lg text-xs font-medium border border-blue-300 dark:border-blue-700 bg-white dark:bg-zinc-800 text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-950 transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Check v-if="copiedMap['detective-mime']" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedMap['detective-mime'] ? '已复制 MIME' : '复制 MIME' }}</span>
              </button>

              <button
                type="button"
                @click="triggerCopied('detective-header', detectiveResult.fullHeader)"
                class="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors flex items-center gap-1.5 cursor-pointer shadow-2xs"
              >
                <Check v-if="copiedMap['detective-header']" class="w-3.5 h-3.5" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedMap['detective-header'] ? '已复制 Header' : '复制 HTTP Header' }}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- 中间：搜索栏与分类标签 -->
      <div class="flex flex-col gap-3 shrink-0">
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <!-- 搜索框 -->
          <div class="relative flex-1 max-w-xl">
            <input
              v-model="searchQuery"
              type="text"
              class="w-full px-3.5 py-2 pl-9 pr-8 rounded-xl border border-zinc-200 dark:border-zinc-700/80 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 shadow-2xs transition-all"
              :placeholder="t('tools.mimeTypes.searchPlaceholder')"
            />
            <Search class="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="p-1 rounded-md text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 absolute right-2.5 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              <X class="w-4 h-4" />
            </button>
          </div>

          <!-- 搜索命中计数 -->
          <div class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <span>{{ locale.startsWith('zh') ? `共收录 ${mimeItems.length} 个条目` : `${mimeItems.length} MIME items` }}</span>
            <span class="text-zinc-300 dark:text-zinc-700">|</span>
            <span class="font-medium text-blue-600 dark:text-blue-400">
              {{ locale.startsWith('zh') ? `匹配 ${filteredList.length} 项` : `${filteredList.length} matched` }}
            </span>
          </div>
        </div>

        <!-- 分类切换 Pills -->
        <div class="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <button
            v-for="cat in categoryTabs"
            :key="cat.id"
            type="button"
            @click="activeCategory = cat.id"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0 cursor-pointer"
            :class="[
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-2xs font-semibold'
                : 'bg-zinc-100/90 dark:bg-zinc-800/80 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/80 dark:hover:bg-zinc-700/80 hover:text-zinc-900 dark:hover:text-zinc-200'
            ]"
          >
            <component :is="cat.icon" class="w-3.5 h-3.5" :class="activeCategory === cat.id ? 'text-white' : cat.colorClass" />
            <span>{{ locale.startsWith('zh') ? cat.nameZh : cat.nameEn }}</span>
            <span
              class="px-1.5 py-0.2 rounded-full text-[10px] font-mono leading-none"
              :class="activeCategory === cat.id ? 'bg-white/20 text-white' : 'bg-zinc-200/70 dark:bg-zinc-700/70 text-zinc-500 dark:text-zinc-400'"
            >
              {{ categoryCounts[cat.id] || 0 }}
            </span>
          </button>
        </div>
      </div>

      <!-- 底部：MIME 数据列表 -->
      <div class="flex-1 overflow-y-auto pr-1 min-h-0 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 shadow-xs">
        <!-- 空状态 -->
        <div
          v-if="filteredList.length === 0"
          class="flex flex-col items-center justify-center h-64 text-center p-6"
        >
          <div class="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-zinc-400 mb-3">
            <Search class="w-6 h-6" />
          </div>
          <p class="text-sm font-semibold text-zinc-700 dark:text-zinc-300 mb-1">
            {{ locale.startsWith('zh') ? '未找到匹配的 MIME 类型' : 'No matching MIME types found' }}
          </p>
          <p class="text-xs text-zinc-400 max-w-sm mb-4">
            {{ locale.startsWith('zh') ? '您可以尝试调整关键词，或点击下方按钮重置搜索' : 'Try adjusting keywords or reset filters below' }}
          </p>
          <button
            type="button"
            @click="searchQuery = ''; activeCategory = 'all'"
            class="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
          >
            {{ locale.startsWith('zh') ? '清除搜索并查看全部' : 'Clear Search and Show All' }}
          </button>
        </div>

        <!-- 列表容器 -->
        <div v-else class="divide-y divide-zinc-100 dark:divide-zinc-800/80">
          <div
            v-for="item in filteredList"
            :key="item.id"
            class="p-3.5 transition-colors hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40"
          >
            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <!-- 左侧：扩展名徽标 + MIME 类型 + 描述 -->
              <div class="flex items-start gap-3 flex-1 min-w-0">
                <!-- 扩展名主标 -->
                <div
                  class="flex items-center justify-center w-12 h-10 rounded-lg font-mono text-xs font-bold border shrink-0 uppercase select-none tracking-tight"
                  :class="getCategoryBadgeColor(item.category)"
                >
                  {{ item.extensions[0] ? `.${item.extensions[0]}` : '/*' }}
                </div>

                <!-- 核心详情 -->
                <div class="flex flex-col gap-1 min-w-0 flex-1">
                  <div class="flex items-center gap-2 flex-wrap">
                    <!-- MIME 类型名 -->
                    <span class="font-mono font-semibold text-sm text-zinc-900 dark:text-zinc-100 selection:bg-blue-100">
                      {{ item.mime }}
                    </span>

                    <!-- 分类小标 -->
                    <span
                      class="px-2 py-0.5 rounded text-[10px] font-medium uppercase border"
                      :class="getCategoryBadgeColor(item.category)"
                    >
                      {{ item.category }}
                    </span>

                    <!-- 属性标签 -->
                    <span
                      class="px-1.5 py-0.5 rounded text-[10px] font-mono border"
                      :class="item.isBinary ? 'bg-purple-50 dark:bg-purple-950/30 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900/40' : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900/40'"
                    >
                      {{ item.isBinary ? 'Binary' : 'Text' }}
                    </span>

                    <span
                      v-if="item.isCommon"
                      class="px-1.5 py-0.5 rounded text-[10px] bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40 font-medium"
                    >
                      ★ {{ locale.startsWith('zh') ? '常用' : 'Popular' }}
                    </span>
                  </div>

                  <!-- 描述与全部扩展名 -->
                  <div class="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300 flex-wrap">
                    <span>{{ locale.startsWith('zh') ? item.descriptionZh : item.descriptionEn }}</span>
                    <span v-if="item.extensions.length > 1" class="text-zinc-400">·</span>
                    <span v-if="item.extensions.length > 1" class="text-zinc-400 font-mono text-[11px]">
                      {{ locale.startsWith('zh') ? '关联扩展名:' : 'Exts:' }}
                      <span class="text-zinc-700 dark:text-zinc-300 font-medium">
                        {{ item.extensions.map(e => `.${e}`).join(', ') }}
                      </span>
                    </span>
                  </div>

                  <!-- 别名 (如有) -->
                  <div v-if="item.aliases && item.aliases.length > 0" class="text-[11px] text-zinc-400 font-mono flex items-center gap-1.5">
                    <span class="text-zinc-400">{{ locale.startsWith('zh') ? '历史/备选 MIME:' : 'Aliases:' }}</span>
                    <span class="text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      {{ item.aliases.join(', ') }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- 右侧：快捷操作按钮 -->
              <div class="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                <!-- 复制 MIME -->
                <button
                  type="button"
                  @click="triggerCopied(item.id + '-mime', item.mime)"
                  :title="copiedMap[item.id + '-mime'] ? (locale.startsWith('zh') ? '已复制' : 'Copied') : (locale.startsWith('zh') ? '复制 MIME' : 'Copy MIME')"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Check v-if="copiedMap[item.id + '-mime']" class="w-3.5 h-3.5 text-emerald-500" />
                  <Copy v-else class="w-3.5 h-3.5 text-zinc-400" />
                  <span>{{ copiedMap[item.id + '-mime'] ? (locale.startsWith('zh') ? '已复制' : 'Copied') : 'MIME' }}</span>
                </button>

                <!-- 复制完整 HTTP Header -->
                <button
                  type="button"
                  @click="triggerCopied(item.id + '-header', item.headerExample || `Content-Type: ${item.mime}${item.charsetNeeded ? '; charset=utf-8' : ''}`)"
                  :title="locale.startsWith('zh') ? '复制完整 Content-Type 标头' : 'Copy Full Content-Type Header'"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer"
                >
                  <Check v-if="copiedMap[item.id + '-header']" class="w-3.5 h-3.5 text-emerald-500" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  <span>{{ copiedMap[item.id + '-header'] ? (locale.startsWith('zh') ? '已复制' : 'Copied') : 'Header' }}</span>
                </button>

                <!-- 展开配置与代码片段 -->
                <button
                  type="button"
                  @click="toggleExpand(item.id)"
                  class="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  :title="expandedIds.has(item.id) ? (locale.startsWith('zh') ? '收起详情' : 'Collapse') : (locale.startsWith('zh') ? '展开配置片段' : 'Expand Snippets')"
                >
                  <ChevronDown
                    class="w-4 h-4 transition-transform duration-200"
                    :class="{ 'rotate-180 text-blue-600 dark:text-blue-400': expandedIds.has(item.id) }"
                  />
                </button>
              </div>
            </div>

            <!-- 展开区域：代码与服务配置片段 (Nginx / Express / FastAPI) -->
            <div
              v-if="expandedIds.has(item.id)"
              class="mt-3 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex flex-col gap-2.5 bg-zinc-50/70 dark:bg-zinc-950/40 p-3 rounded-lg animate-fade-in"
            >
              <!-- HTTP Header 详情 -->
              <div class="flex flex-col gap-1">
                <span class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  HTTP Response Header
                </span>
                <div class="flex items-center justify-between bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-200/80 dark:border-zinc-800 font-mono text-xs text-blue-600 dark:text-blue-400 select-all">
                  <span>{{ item.headerExample || `Content-Type: ${item.mime}${item.charsetNeeded ? '; charset=utf-8' : ''}` }}</span>
                  <button
                    type="button"
                    @click="triggerCopied(item.id + '-sub-header', item.headerExample || `Content-Type: ${item.mime}${item.charsetNeeded ? '; charset=utf-8' : ''}`)"
                    class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs cursor-pointer ml-2"
                  >
                    <Check v-if="copiedMap[item.id + '-sub-header']" class="w-3.5 h-3.5 text-emerald-500" />
                    <Copy v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- Nginx 配置片段 (如有) -->
              <div v-if="item.nginxConfig" class="flex flex-col gap-1">
                <span class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                  Nginx mime.types
                </span>
                <div class="flex items-center justify-between bg-white dark:bg-zinc-900 px-3 py-1.5 rounded-md border border-zinc-200/80 dark:border-zinc-800 font-mono text-xs text-emerald-600 dark:text-emerald-400 select-all">
                  <span>{{ item.nginxConfig }}</span>
                  <button
                    type="button"
                    @click="triggerCopied(item.id + '-nginx', item.nginxConfig)"
                    class="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs cursor-pointer ml-2"
                  >
                    <Check v-if="copiedMap[item.id + '-nginx']" class="w-3.5 h-3.5 text-emerald-500" />
                    <Copy v-else class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- 后端代码示例 (Node.js & Python) -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-[11px] font-mono">
                <!-- Node.js / Express -->
                <div class="bg-white dark:bg-zinc-900 p-2.5 rounded-md border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
                  <div class="flex items-center justify-between text-zinc-400 mb-1">
                    <span>Node.js / Express</span>
                    <button
                      type="button"
                      @click="triggerCopied(item.id + '-node', `res.setHeader('Content-Type', '${item.mime}${item.charsetNeeded ? '; charset=utf-8' : ''}');`)"
                      class="hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      <Check v-if="copiedMap[item.id + '-node']" class="w-3 h-3 text-emerald-500" />
                      <Copy v-else class="w-3 h-3" />
                    </button>
                  </div>
                  <code class="text-zinc-800 dark:text-zinc-200 select-all">
                    res.setHeader('Content-Type', '{{ item.mime }}{{ item.charsetNeeded ? '; charset=utf-8' : '' }}');
                  </code>
                </div>

                <!-- Python / FastAPI -->
                <div class="bg-white dark:bg-zinc-900 p-2.5 rounded-md border border-zinc-200/80 dark:border-zinc-800 flex flex-col justify-between">
                  <div class="flex items-center justify-between text-zinc-400 mb-1">
                    <span>Python / FastAPI</span>
                    <button
                      type="button"
                      @click="triggerCopied(item.id + '-py', `Response(content=data, media_type='${item.mime}')`)"
                      class="hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
                    >
                      <Check v-if="copiedMap[item.id + '-py']" class="w-3 h-3 text-emerald-500" />
                      <Copy v-else class="w-3 h-3" />
                    </button>
                  </div>
                  <code class="text-zinc-800 dark:text-zinc-200 select-all">
                    Response(content=data, media_type='{{ item.mime }}')
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fadeIn 0.15s ease-out;
}
</style>
