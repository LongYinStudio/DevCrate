<script setup lang="ts">
import { onMounted, computed, ref, watch, onErrorCaptured } from 'vue';
import { AlertCircle, RotateCcw } from 'lucide-vue-next';
import AppSidebar from './components/layout/AppSidebar.vue';
import AppHeader from './components/layout/AppHeader.vue';
import AllToolsView from './components/layout/AllToolsView.vue';
import SettingsView from './components/settings/SettingsView.vue';
import { currentView, activeToolId, selectCategory } from './stores/app';
import { initTheme } from './stores/theme';
import { getToolById } from './tools/registry';

const toolError = ref<string | null>(null);

const activeTool = computed(() => {
  if (!activeToolId.value) return null;
  return getToolById(activeToolId.value);
});

watch([activeToolId, currentView], () => {
  toolError.value = null;
});

onErrorCaptured((err, _instance, info) => {
  console.error('[DevCrate] Caught component render error:', err, info);
  toolError.value = err instanceof Error ? err.message : String(err);
  return false;
});

onMounted(() => {
  initTheme();
});
</script>

<template>
  <div class="flex h-screen w-screen overflow-hidden bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 font-sans antialiased">
    <!-- 左侧侧边栏 -->
    <AppSidebar />

    <!-- 右侧主体内容区 -->
    <div class="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
      <!-- 顶栏 -->
      <AppHeader />

      <!-- 主工作区视图切换 -->
      <main class="flex-1 flex min-h-0 overflow-hidden relative">
        <!-- 工具运行异常回退保护屏障 (Error Boundary) -->
        <div
          v-if="toolError"
          class="flex-1 flex flex-col items-center justify-center p-8 text-center bg-zinc-50/50 dark:bg-zinc-950"
        >
          <div class="max-w-md w-full p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-rose-200 dark:border-rose-900/60 shadow-lg flex flex-col items-center gap-4">
            <div class="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle class="w-6 h-6" />
            </div>
            <div class="space-y-1">
              <h3 class="text-base font-bold text-zinc-900 dark:text-zinc-100">工具加载或运行异常</h3>
              <p class="text-xs text-zinc-500 dark:text-zinc-400 font-mono break-all">{{ toolError }}</p>
            </div>
            <button
              type="button"
              @click="selectCategory('all')"
              class="px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <RotateCcw class="w-4 h-4" />
              <span>返回全部工具</span>
            </button>
          </div>
        </div>

        <!-- 工具详情视图 -->
        <component
          v-else-if="currentView === 'tool' && activeTool"
          :is="activeTool.component"
        />

        <!-- 设置视图 -->
        <SettingsView v-else-if="currentView === 'settings'" />

        <!-- 全部工具 / 分类过滤 / 收藏视图 -->
        <AllToolsView v-else />
      </main>
    </div>
  </div>
</template>
