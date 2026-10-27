<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-vue-next';
import AppLogo from '../common/AppLogo.vue';
import { categories, tools } from '../../tools/registry';
import {
  currentView,
  activeCategoryId,
  activeToolId,
  isSidebarCollapsed,
  favorites,
  selectCategory,
  openSettings,
} from '../../stores/app';

const { t } = useI18n();

function getCategoryCount(catId: string): number {
  if (catId === 'all') return tools.length;
  if (catId === 'favorites') return favorites.value.length;
  return tools.filter(t => t.categoryId === catId).length;
}

function handleCategoryClick(catId: string) {
  selectCategory(catId);
}

function toggleCollapse() {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
}
</script>

<template>
  <aside
    class="relative flex flex-col h-full bg-zinc-100/80 dark:bg-zinc-900/90 border-r border-zinc-200/80 dark:border-zinc-800/80 transition-all duration-200 select-none z-10 backdrop-blur-md"
    :class="isSidebarCollapsed ? 'w-16' : 'w-60'"
  >
    <!-- Logo 区域：折叠时严格水平居中 -->
    <div
      class="flex items-center h-14 border-b border-zinc-200/60 dark:border-zinc-800/60 transition-all"
      :class="isSidebarCollapsed ? 'justify-center px-0' : 'px-4 gap-3'"
    >
      <AppLogo :size="32" rounded="xl" />
      <div v-if="!isSidebarCollapsed" class="flex flex-col min-w-0">
        <span class="font-bold text-sm text-zinc-900 dark:text-zinc-100 tracking-tight">DevCrate</span>
        <span class="text-[10px] text-zinc-400 dark:text-zinc-500 truncate leading-none">Developer Box</span>
      </div>
    </div>

    <!-- 导航菜单：折叠时采用居中图标卡片 -->
    <nav
      class="flex-1 overflow-y-auto py-3 space-y-1.5 transition-all"
      :class="isSidebarCollapsed ? 'px-2 flex flex-col items-center' : 'px-2.5'"
    >
      <button
        v-for="cat in categories"
        :key="cat.id"
        type="button"
        @click="handleCategoryClick(cat.id)"
        class="transition-colors cursor-pointer group relative"
        :class="[
          isSidebarCollapsed
            ? 'w-10 h-10 flex items-center justify-center rounded-xl'
            : 'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium',
          (currentView === 'all' && cat.id === 'all' && !activeToolId) ||
          (currentView === 'favorites' && cat.id === 'favorites' && !activeToolId) ||
          (currentView === 'category' && activeCategoryId === cat.id && !activeToolId)
            ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
            : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-200'
        ]"
        :title="isSidebarCollapsed ? t(cat.nameKey) : undefined"
      >
        <component
          :is="cat.icon"
          class="shrink-0 transition-transform group-hover:scale-110"
          :class="isSidebarCollapsed ? 'w-[18px] h-[18px]' : 'w-4 h-4'"
        />
        <span v-if="!isSidebarCollapsed" class="flex-1 text-left truncate">
          {{ t(cat.nameKey) }}
        </span>
        <span
          v-if="!isSidebarCollapsed && getCategoryCount(cat.id) > 0"
          class="px-1.5 py-0.5 rounded-full text-[10px] font-mono leading-none"
          :class="[
            (currentView === 'all' && cat.id === 'all') ||
            (currentView === 'category' && activeCategoryId === cat.id)
              ? 'bg-blue-600 text-white dark:bg-blue-500'
              : 'bg-zinc-200/80 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
          ]"
        >
          {{ getCategoryCount(cat.id) }}
        </span>
      </button>
    </nav>

    <!-- 底部功能栏 (现代化并排与卡片化设计) -->
    <div class="p-2 border-t border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/40 dark:bg-zinc-900/40">
      <!-- 展开模式：单行并排紧凑设计 -->
      <div v-if="!isSidebarCollapsed" class="flex items-center gap-1.5">
        <button
          type="button"
          @click="openSettings"
          class="flex-1 flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-150 cursor-pointer group"
          :class="[
            currentView === 'settings'
              ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold shadow-2xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
          ]"
          :title="t('categories.settings')"
        >
          <Settings class="w-4 h-4 shrink-0 transition-transform duration-300 group-hover:rotate-45 text-zinc-500 dark:text-zinc-400 group-hover:text-blue-600 dark:group-hover:text-blue-400" />
          <span class="truncate">{{ t('categories.settings') }}</span>
          <span class="ml-auto text-[10px] font-mono text-zinc-400 dark:text-zinc-500">v0.2.0</span>
        </button>

        <button
          type="button"
          @click="toggleCollapse"
          class="flex items-center justify-center w-8 h-8 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer shrink-0"
          :title="t('common.collapse')"
        >
          <PanelLeftClose class="w-4 h-4" />
        </button>
      </div>

      <!-- 收起模式：居中对齐，与上方图标完全统一 -->
      <div v-else class="flex flex-col items-center gap-1.5">
        <button
          type="button"
          @click="openSettings"
          class="flex items-center justify-center w-10 h-10 rounded-xl transition-colors cursor-pointer group"
          :class="[
            currentView === 'settings'
              ? 'bg-blue-600/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 hover:text-zinc-900 dark:hover:text-zinc-100'
          ]"
          :title="t('categories.settings')"
        >
          <Settings class="w-[18px] h-[18px] transition-transform duration-300 group-hover:rotate-45" />
        </button>

        <button
          type="button"
          @click="toggleCollapse"
          class="flex items-center justify-center w-10 h-10 rounded-xl text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
          :title="t('common.expand')"
        >
          <PanelLeftOpen class="w-[18px] h-[18px]" />
        </button>
      </div>
    </div>
  </aside>
</template>
