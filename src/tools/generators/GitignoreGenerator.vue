<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  FolderGit2,
  Search,
  X,
  Plus,
  Check,
  Sparkles,
  Sliders,
  Layers,
  ChevronDown,
  ChevronUp,
  FileDown
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import { downloadFile } from '../../utils/download';
import {
  gitignoreTemplates,
  presetStacks,
  buildGitignoreContent,
  type GitignoreTemplate,
  type GitignoreCategory
} from './data/gitignoreTemplates';

const { t, locale } = useI18n();

// 搜索关键词与分类筛选
const searchQuery = ref('');
const activeCategory = ref<'all' | GitignoreCategory>('all');

// 选中的模板 ID 列表（保持添加顺序）
const selectedIds = ref<string[]>(['node', 'vscode', 'macos', 'windows']);

// 高级配置与自定义规则
const includeHeaders = ref(true);
const deduplicate = ref(true);
const customRules = ref('');
const isCustomExpanded = ref(false);

// 文件名与输出内容
const outputFileName = ref('.gitignore');
const outputContent = ref('');
const isDownloaded = ref(false);

// 分类列表定义
const categoryTabs = [
  { id: 'all', nameKey: 'tools.gitignoreGenerator.categoryAll' },
  { id: 'languages', nameKey: 'tools.gitignoreGenerator.categoryLanguages' },
  { id: 'frameworks', nameKey: 'tools.gitignoreGenerator.categoryFrameworks' },
  { id: 'ides', nameKey: 'tools.gitignoreGenerator.categoryIdes' },
  { id: 'os', nameKey: 'tools.gitignoreGenerator.categoryOs' },
  { id: 'tools', nameKey: 'tools.gitignoreGenerator.categoryTools' },
] as const;

// 常用推荐快捷项
const quickPicks = computed(() => {
  return gitignoreTemplates.filter(t => t.popular);
});

// 计算各分类计数
const categoryCounts = computed(() => {
  const counts: Record<string, number> = {
    all: gitignoreTemplates.length
  };
  gitignoreTemplates.forEach(t => {
    counts[t.category] = (counts[t.category] || 0) + 1;
  });
  return counts;
});

// 筛选后的模板列表
const filteredTemplates = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return gitignoreTemplates.filter(tmpl => {
    // 1. 分类匹配
    if (activeCategory.value !== 'all' && tmpl.category !== activeCategory.value) {
      return false;
    }
    // 2. 搜索过滤
    if (q) {
      const matchName = tmpl.name.toLowerCase().includes(q);
      const matchId = tmpl.id.toLowerCase().includes(q);
      const matchDesc =
        tmpl.descriptionZh.toLowerCase().includes(q) ||
        tmpl.descriptionEn.toLowerCase().includes(q);
      const matchKeywords = tmpl.keywords.some(k => k.toLowerCase().includes(q));
      return matchName || matchId || matchDesc || matchKeywords;
    }
    return true;
  });
});

// 已选模板对象列表
const selectedTemplates = computed(() => {
  return selectedIds.value
    .map(id => gitignoreTemplates.find(t => t.id === id))
    .filter((t): t is GitignoreTemplate => !!t);
});

// 规则统计
const stats = computed(() => {
  const content = outputContent.value || '';
  const lines = content ? content.split('\n').length : 0;
  const rules = content
    ? content.split('\n').filter(l => {
        const t = l.trim();
        return t && !t.startsWith('#');
      }).length
    : 0;
  return {
    templateCount: selectedIds.value.length,
    lines,
    rules
  };
});

// 重新合成并更新输出内容
function regenerateOutput() {
  outputContent.value = buildGitignoreContent({
    selectedTemplateIds: selectedIds.value,
    customRules: customRules.value,
    includeHeaders: includeHeaders.value,
    deduplicate: deduplicate.value
  });
}

// 监听配置变更自动合成
watch(
  [selectedIds, customRules, includeHeaders, deduplicate],
  () => {
    regenerateOutput();
  },
  { deep: true, immediate: true }
);

// 切换模板选中状态
function toggleTemplate(id: string) {
  const index = selectedIds.value.indexOf(id);
  if (index >= 0) {
    selectedIds.value.splice(index, 1);
  } else {
    selectedIds.value.push(id);
  }
}

// 移除单个已选模板
function removeTemplate(id: string) {
  const index = selectedIds.value.indexOf(id);
  if (index >= 0) {
    selectedIds.value.splice(index, 1);
  }
}

// 清空全部已选
function clearAllSelection() {
  selectedIds.value = [];
  customRules.value = '';
}

// 应用预设技术栈
function applyPreset(templateIds: string[]) {
  selectedIds.value = [...templateIds];
}

// 检查某个预设是否与当前选择完全匹配
function isPresetActive(templateIds: string[]): boolean {
  if (templateIds.length !== selectedIds.value.length) return false;
  return templateIds.every(id => selectedIds.value.includes(id));
}

// 下载文件
function handleDownload() {
  let filename = outputFileName.value.trim() || '.gitignore';
  downloadFile(outputContent.value, filename, 'text/plain;charset=utf-8');
  isDownloaded.value = true;
  setTimeout(() => {
    isDownloaded.value = false;
  }, 2000);
}

// 计算模板包含的有效规则数
function getRuleCount(content: string): number {
  return content.split('\n').filter(l => {
    const t = l.trim();
    return t && !t.startsWith('#');
  }).length;
}

// 获取分类标签样式与文本
function getCategoryLabel(category: GitignoreCategory): string {
  const map: Record<GitignoreCategory, string> = {
    languages: t('tools.gitignoreGenerator.categoryLanguages'),
    frameworks: t('tools.gitignoreGenerator.categoryFrameworks'),
    ides: t('tools.gitignoreGenerator.categoryIdes'),
    os: t('tools.gitignoreGenerator.categoryOs'),
    tools: t('tools.gitignoreGenerator.categoryTools')
  };
  return map[category] || category;
}
</script>

<template>
  <ToolContainer
    toolId="gitignore-generator"
    nameKey="tools.gitignoreGenerator.name"
    descKey="tools.gitignoreGenerator.desc"
    :icon="FolderGit2"
    :wide="true"
    :fullHeight="true"
  >
    <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 h-full overflow-hidden">
      <!-- 左侧：选择模板与配置区域 -->
      <div class="lg:col-span-5 xl:col-span-5 flex flex-col min-h-0 gap-3.5 overflow-hidden">
        <!-- 1. 快捷技术栈组合 -->
        <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs shrink-0">
          <div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200 mb-2.5">
            <Sparkles class="w-3.5 h-3.5 text-amber-500" />
            <span>{{ t('tools.gitignoreGenerator.quickPresets') }}</span>
          </div>
          <div class="flex flex-wrap gap-1.5">
            <button
              v-for="preset in presetStacks"
              :key="preset.id"
              type="button"
              @click="applyPreset(preset.templateIds)"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border"
              :class="isPresetActive(preset.templateIds)
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 shadow-xs'
                : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
            >
              <Check v-if="isPresetActive(preset.templateIds)" class="w-3 h-3 text-blue-600 dark:text-blue-400" />
              <span>{{ t(preset.nameKey) }}</span>
            </button>
          </div>
        </div>

        <!-- 2. 搜索与分类导航 -->
        <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs shrink-0 space-y-3">
          <!-- 搜索输入框 -->
          <div class="relative">
            <Search class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('tools.gitignoreGenerator.searchPlaceholder')"
              class="w-full pl-9 pr-8 py-1.5 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded cursor-pointer"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- 分类选项卡 -->
          <div class="flex items-center gap-1 overflow-x-auto pb-0.5 text-xs no-scrollbar">
            <button
              v-for="cat in categoryTabs"
              :key="cat.id"
              type="button"
              @click="activeCategory = cat.id"
              class="px-2.5 py-1 rounded-lg shrink-0 font-medium transition-colors cursor-pointer"
              :class="activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
            >
              <span>{{ t(cat.nameKey) }}</span>
              <span class="ml-1 text-[10px] opacity-75 font-mono">({{ categoryCounts[cat.id] || 0 }})</span>
            </button>
          </div>

          <!-- 热门快速点选 -->
          <div class="flex items-center gap-1.5 overflow-x-auto pt-1 border-t border-zinc-100 dark:border-zinc-800/80 no-scrollbar">
            <span class="text-[11px] text-zinc-400 dark:text-zinc-500 shrink-0">{{ t('tools.gitignoreGenerator.popularTag') }}:</span>
            <button
              v-for="pick in quickPicks"
              :key="pick.id"
              type="button"
              @click="toggleTemplate(pick.id)"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium shrink-0 transition-colors cursor-pointer"
              :class="selectedIds.includes(pick.id)
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300'"
            >
              <component :is="selectedIds.includes(pick.id) ? Check : Plus" class="w-2.5 h-2.5" />
              <span>{{ pick.name }}</span>
            </button>
          </div>
        </div>

        <!-- 3. 已选标签栏 -->
        <div
          v-if="selectedIds.length > 0"
          class="p-3 rounded-xl border border-blue-100 dark:border-blue-900/40 bg-blue-50/40 dark:bg-blue-950/20 shrink-0"
        >
          <div class="flex items-center justify-between text-xs mb-2">
            <span class="font-semibold text-blue-900 dark:text-blue-200">
              {{ t('tools.gitignoreGenerator.selectedTitle', { count: selectedIds.length }) }}
            </span>
            <button
              type="button"
              @click="clearAllSelection"
              class="text-blue-600 hover:text-rose-600 dark:text-blue-400 dark:hover:text-rose-400 font-medium transition-colors cursor-pointer"
            >
              {{ t('tools.gitignoreGenerator.clearAll') }}
            </button>
          </div>
          <div class="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1">
            <span
              v-for="tmpl in selectedTemplates"
              :key="tmpl.id"
              class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs bg-white dark:bg-zinc-800 border border-blue-200 dark:border-blue-800/60 text-zinc-800 dark:text-zinc-200 shadow-2xs"
            >
              <span>{{ tmpl.name }}</span>
              <button
                type="button"
                @click="removeTemplate(tmpl.id)"
                class="text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 rounded-sm cursor-pointer"
                title="Remove"
              >
                <X class="w-3 h-3" />
              </button>
            </span>
          </div>
        </div>

        <!-- 4. 模板库列表（可滚动卡片区） -->
        <div class="flex-1 min-h-0 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs p-2.5 space-y-2">
          <div
            v-if="filteredTemplates.length === 0"
            class="h-full flex flex-col items-center justify-center p-6 text-center text-zinc-400 dark:text-zinc-500"
          >
            <Layers class="w-8 h-8 mb-2 opacity-50" />
            <p class="text-xs">{{ t('tools.gitignoreGenerator.noTemplatesFound') }}</p>
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {{ t('tools.gitignoreGenerator.clearSearch') }}
            </button>
          </div>

          <div
            v-for="tmpl in filteredTemplates"
            :key="tmpl.id"
            @click="toggleTemplate(tmpl.id)"
            class="p-2.5 rounded-lg border transition-all cursor-pointer flex items-start gap-2.5 select-none"
            :class="selectedIds.includes(tmpl.id)
              ? 'border-blue-400 dark:border-blue-700 bg-blue-50/50 dark:bg-blue-950/20 shadow-xs'
              : 'border-zinc-100 dark:border-zinc-800/80 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800/50'"
          >
            <!-- 勾选复选框 -->
            <div
              class="w-4 h-4 mt-0.5 rounded flex items-center justify-center border transition-colors shrink-0"
              :class="selectedIds.includes(tmpl.id)
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800'"
            >
              <Check v-if="selectedIds.includes(tmpl.id)" class="w-3 h-3 stroke-[3]" />
            </div>

            <!-- 卡片信息 -->
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-1.5 mb-1">
                <span class="font-medium text-xs text-zinc-900 dark:text-zinc-100 truncate">
                  {{ tmpl.name }}
                </span>
                <div class="flex items-center gap-1 shrink-0">
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                    {{ getCategoryLabel(tmpl.category) }}
                  </span>
                  <span class="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-mono">
                    {{ getRuleCount(tmpl.content) }} {{ t('tools.gitignoreGenerator.ruleCountUnit') }}
                  </span>
                </div>
              </div>
              <p class="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-1">
                {{ locale.startsWith('zh') ? tmpl.descriptionZh : tmpl.descriptionEn }}
              </p>
            </div>
          </div>
        </div>

        <!-- 5. 生成配置与自定义规则 -->
        <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs shrink-0 space-y-2.5">
          <div class="flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200">
            <span class="flex items-center gap-1.5">
              <Sliders class="w-3.5 h-3.5 text-blue-500" />
              {{ t('tools.gitignoreGenerator.optionsTitle') }}
            </span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            <label class="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
              <input
                v-model="includeHeaders"
                type="checkbox"
                class="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span class="text-[11px]">{{ t('tools.gitignoreGenerator.includeHeaders') }}</span>
            </label>

            <label class="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
              <input
                v-model="deduplicate"
                type="checkbox"
                class="rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span class="text-[11px]">{{ t('tools.gitignoreGenerator.deduplicate') }}</span>
            </label>
          </div>

          <!-- 自定义规则折叠栏 -->
          <div class="pt-2 border-t border-zinc-100 dark:border-zinc-800/80">
            <button
              type="button"
              @click="isCustomExpanded = !isCustomExpanded"
              class="w-full flex items-center justify-between text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            >
              <span>{{ t('tools.gitignoreGenerator.customRulesTitle') }}</span>
              <component :is="isCustomExpanded ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
            </button>

            <div v-if="isCustomExpanded" class="mt-2">
              <textarea
                v-model="customRules"
                rows="3"
                :placeholder="t('tools.gitignoreGenerator.customRulesPlaceholder')"
                class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
              ></textarea>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：输出与编辑区域 -->
      <div class="lg:col-span-7 xl:col-span-7 flex flex-col min-h-0 h-full">
        <TextEditorBox
          v-model="outputContent"
          :label="t('tools.gitignoreGenerator.editorTitle')"
          :placeholder="'# .gitignore'"
          :showLineNumbers="true"
          :showWrapToggle="true"
          :showCopy="true"
          :showPaste="false"
          :showClear="true"
          @clear="clearAllSelection"
        >
          <template #actions>
            <!-- 统计标签 -->
            <div class="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono mr-1">
              <span>{{ t('tools.gitignoreGenerator.statsSelected', { count: stats.templateCount }) }}</span>
              <span>·</span>
              <span>{{ t('tools.gitignoreGenerator.rulesCount', { rules: stats.rules }) }}</span>
            </div>

            <!-- 文件名编辑 -->
            <input
              v-model="outputFileName"
              type="text"
              class="w-24 px-1.5 py-0.5 text-[11px] font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 mr-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
              :placeholder="t('tools.gitignoreGenerator.filename')"
            />

            <!-- 一键下载按钮 -->
            <button
              type="button"
              @click="handleDownload"
              :disabled="!outputContent"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed mr-1"
              :class="isDownloaded
                ? 'bg-emerald-600 text-white'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-xs'"
              :title="t('tools.gitignoreGenerator.downloadBtn')"
            >
              <component :is="isDownloaded ? Check : FileDown" class="w-3.5 h-3.5" />
              <span>{{ isDownloaded ? t('tools.gitignoreGenerator.downloaded') : t('tools.gitignoreGenerator.downloadBtn') }}</span>
            </button>
          </template>
        </TextEditorBox>
      </div>
    </div>
  </ToolContainer>
</template>
