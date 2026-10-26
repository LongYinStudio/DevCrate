<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Star, SearchX } from 'lucide-vue-next';
import { tools, categories } from '../../tools/registry';
import type { ToolItem } from '../../tools/types';
import {
  currentView,
  activeCategoryId,
  searchQuery,
  favorites,
  toggleFavorite,
  isFavorite,
  selectTool,
} from '../../stores/app';

const { t } = useI18n();

// 当前视图标题
const viewTitle = computed(() => {
  if (searchQuery.value.trim()) {
    return `搜索: "${searchQuery.value.trim()}"`;
  }
  if (currentView.value === 'favorites') {
    return t('categories.favorites');
  }
  if (currentView.value === 'category') {
    const found = categories.find(c => c.id === activeCategoryId.value);
    return found ? t(found.nameKey) : t('categories.all');
  }
  return t('categories.all');
});

// 过滤后的工具列表
const filteredTools = computed(() => {
  let list = tools;

  // 1. 分类过滤
  if (currentView.value === 'favorites') {
    list = list.filter(item => favorites.value.includes(item.id));
  } else if (currentView.value === 'category' && activeCategoryId.value !== 'all') {
    list = list.filter(item => item.categoryId === activeCategoryId.value);
  }

  // 2. 搜索过滤
  const q = searchQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(item => {
      const name = t(item.nameKey).toLowerCase();
      const desc = t(item.descKey).toLowerCase();
      const matchKeyword = item.keywords.some(k => k.toLowerCase().includes(q));
      return name.includes(q) || desc.includes(q) || matchKeyword;
    });
  }

  return list;
});

function handleOpenTool(tool: ToolItem) {
  selectTool(tool.id);
}

function handleFavoriteClick(e: MouseEvent, toolId: string) {
  e.stopPropagation();
  toggleFavorite(toolId);
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50/50 dark:bg-zinc-950">
    <div class="max-w-6xl mx-auto flex flex-col gap-6">
      <!-- 页面顶部标题区 -->
      <div class="flex items-center justify-between pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <div>
          <h1 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">
            {{ viewTitle }}
          </h1>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            {{ t('common.allToolsCount', { count: filteredTools.length }) }}
          </p>
        </div>
      </div>

      <!-- 空状态 -->
      <div
        v-if="filteredTools.length === 0"
        class="flex flex-col items-center justify-center py-20 text-center"
      >
        <div class="w-12 h-12 rounded-2xl bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mb-3">
          <SearchX class="w-6 h-6" />
        </div>
        <div class="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
          {{ t('common.noResults') }}
        </div>
        <div class="text-xs text-zinc-400 dark:text-zinc-500 mt-1">
          尝试不同的关键词搜索，或清除搜索条件
        </div>
      </div>

      <!-- 工具卡片网格 -->
      <div
        v-else
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <div
          v-for="tool in filteredTools"
          :key="tool.id"
          @click="handleOpenTool(tool)"
          class="group relative flex flex-col justify-between p-5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/90 hover:border-blue-400 dark:hover:border-blue-600/60 hover:shadow-lg hover:shadow-blue-500/5 transition-all duration-200 cursor-pointer select-none"
        >
          <!-- 头部：图标与收藏星标 -->
          <div class="flex items-start justify-between mb-3.5">
            <div class="flex items-center justify-center w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/60 dark:border-blue-900/40 group-hover:scale-105 transition-transform">
              <component :is="tool.icon" class="w-5 h-5" />
            </div>

            <button
              type="button"
              @click="handleFavoriteClick($event, tool.id)"
              class="p-2 -mr-1.5 -mt-1.5 rounded-lg text-zinc-400 hover:text-amber-500 transition-colors cursor-pointer"
              :title="isFavorite(tool.id) ? t('common.unfavorite') : t('common.favorite')"
            >
              <Star
                class="w-4 h-4 transition-transform hover:scale-125"
                :class="isFavorite(tool.id) ? 'fill-amber-400 text-amber-500' : 'text-zinc-300 dark:text-zinc-600'"
              />
            </button>
          </div>

          <!-- 文本区 -->
          <div>
            <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {{ t(tool.nameKey) }}
            </h3>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
              {{ t(tool.descKey) }}
            </p>
          </div>

          <!-- 底部标签 -->
          <div class="flex items-center justify-between pt-4 mt-2 border-t border-zinc-100 dark:border-zinc-800/60 text-[11px] text-zinc-400 dark:text-zinc-500">
            <span class="capitalize">{{ tool.categoryId }}</span>
            <span class="group-hover:translate-x-1 group-hover:text-blue-500 transition-all font-medium">
              {{ t('common.openTool') }} →
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
