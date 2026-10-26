<script setup lang="ts">
import { onMounted, computed } from 'vue';
import AppSidebar from './components/layout/AppSidebar.vue';
import AppHeader from './components/layout/AppHeader.vue';
import AllToolsView from './components/layout/AllToolsView.vue';
import SettingsView from './components/settings/SettingsView.vue';
import { currentView, activeToolId } from './stores/app';
import { initTheme } from './stores/theme';
import { getToolById } from './tools/registry';

const activeTool = computed(() => {
  if (!activeToolId.value) return null;
  return getToolById(activeToolId.value);
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
        <!-- 工具详情视图 -->
        <component
          v-if="currentView === 'tool' && activeTool"
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
