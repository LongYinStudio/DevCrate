<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { Search, Sun, Moon, Laptop, Languages, X, PanelLeft, Github } from 'lucide-vue-next';
import { searchQuery, currentView, isSidebarCollapsed } from '../../stores/app';
import { themeMode, toggleTheme } from '../../stores/theme';
import { setLocale } from '../../locales';
import { openExternalLink } from '../../utils/openUrl';

const { t, locale } = useI18n();

const searchInputRef = ref<HTMLInputElement | null>(null);

function handleKeydown(e: KeyboardEvent) {
  // 监听 Ctrl+K 或 ⌘+K 聚焦搜索框
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    searchInputRef.value?.focus();
    searchInputRef.value?.select();
  }
  // 监听 Esc 键清空搜索
  if (e.key === 'Escape' && document.activeElement === searchInputRef.value) {
    searchQuery.value = '';
    searchInputRef.value?.blur();
  }
}

function handleSearchInput() {
  if (searchQuery.value.trim() && currentView.value === 'tool') {
    currentView.value = 'all';
  }
}

function clearSearch() {
  searchQuery.value = '';
  searchInputRef.value?.focus();
}

function toggleLanguage() {
  const nextLang = locale.value === 'zh-CN' ? 'en-US' : 'zh-CN';
  setLocale(nextLang);
}

onMounted(() => {
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <header class="flex items-center justify-between px-5 h-14 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md select-none shrink-0 z-10">
    <!-- 左侧：侧边栏唤起按钮 + 搜索栏 -->
    <div class="flex items-center gap-2.5">
      <button
        v-if="isSidebarCollapsed"
        type="button"
        @click="isSidebarCollapsed = false"
        class="flex items-center justify-center w-8 h-8 rounded-lg text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer"
        :title="t('common.expand')"
      >
        <PanelLeft class="w-4 h-4" />
      </button>

      <!-- 搜索栏 -->
      <div class="relative w-72 sm:w-80">
      <Search class="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 pointer-events-none" />
      <input
        ref="searchInputRef"
        v-model="searchQuery"
        @input="handleSearchInput"
        type="text"
        :placeholder="t('common.searchPlaceholder')"
        class="w-full pl-9 pr-14 py-1.5 text-xs rounded-xl bg-zinc-100/90 dark:bg-zinc-800/90 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 dark:placeholder-zinc-500 outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
      />
      <!-- 清空按钮 或 快捷键提示 -->
      <div class="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
        <button
          v-if="searchQuery"
          type="button"
          @click="clearSearch"
          class="p-0.5 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded cursor-pointer"
        >
          <X class="w-3.5 h-3.5" />
        </button>
        <kbd
          v-else
          class="hidden sm:inline-flex items-center px-1.5 py-0.5 text-[10px] font-mono text-zinc-400 dark:text-zinc-500 bg-zinc-200/60 dark:bg-zinc-700/60 rounded border border-zinc-300/60 dark:border-zinc-600/60"
        >
          ⌘K
        </kbd>
      </div>
    </div>
  </div>

  <!-- 右侧操作区：语言切换 & 主题切换 -->
    <div class="flex items-center gap-2">
      <!-- GitHub 开源仓库 -->
      <button
        type="button"
        @click="openExternalLink()"
        class="inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer"
        title="GitHub 仓库: LongYinStudio/DevCrate"
      >
        <Github class="w-4 h-4" />
      </button>

      <!-- 语言切换 -->
      <button
        type="button"
        @click="toggleLanguage"
        class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer"
        :title="t('settings.language')"
      >
        <Languages class="w-3.5 h-3.5 text-blue-500" />
        <span>{{ locale === 'zh-CN' ? '中文' : 'EN' }}</span>
      </button>

      <!-- 主题切换 -->
      <button
        type="button"
        @click="toggleTheme($event)"
        class="relative inline-flex items-center justify-center w-8 h-8 rounded-lg text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer overflow-hidden"
        :title="`${t('settings.theme')}: ${themeMode}`"
      >
        <Transition name="theme-icon" mode="out-in">
          <Sun v-if="themeMode === 'light'" key="light" class="w-4 h-4 text-amber-500" />
          <Moon v-else-if="themeMode === 'dark'" key="dark" class="w-4 h-4 text-indigo-400" />
          <Laptop v-else key="system" class="w-4 h-4 text-zinc-500" />
        </Transition>
      </button>
    </div>
  </header>
</template>

<style scoped>
.theme-icon-enter-active,
.theme-icon-leave-active {
  transition: transform 0.22s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.18s ease;
}

.theme-icon-enter-from {
  opacity: 0;
  transform: rotate(-60deg) scale(0.5);
}

.theme-icon-leave-to {
  opacity: 0;
  transform: rotate(60deg) scale(0.5);
}
</style>
