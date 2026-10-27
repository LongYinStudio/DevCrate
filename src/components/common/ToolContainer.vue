<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Star, ChevronLeft } from 'lucide-vue-next';
import { isFavorite, toggleFavorite, selectCategory } from '../../stores/app';

const props = withDefaults(
  defineProps<{
    toolId: string;
    nameKey: string;
    descKey: string;
    icon?: any;
    wide?: boolean;
    fullHeight?: boolean;
  }>(),
  {
    wide: false,
    fullHeight: true
  }
);

const { t } = useI18n();

const favorited = computed(() => isFavorite(props.toolId));

function onToggleFavorite() {
  toggleFavorite(props.toolId);
}

function backToAll() {
  selectCategory('all');
}
</script>

<template>
  <div class="flex-1 flex flex-col h-full overflow-hidden bg-zinc-50/50 dark:bg-zinc-950">
    <!-- 工具标题栏与操作 -->
    <header class="px-6 pt-4 pb-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 backdrop-blur-md shrink-0">
      <div class="flex items-center justify-between mb-1">
        <div class="flex items-center gap-3">
          <button
            type="button"
            @click="backToAll"
            class="p-1.5 -ml-1 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
            :title="t('common.backToAll')"
          >
            <ChevronLeft class="w-5 h-5" />
          </button>

          <div
            v-if="icon"
            class="flex items-center justify-center w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/40"
          >
            <component :is="icon" class="w-5 h-5" />
          </div>

          <div>
            <h1 class="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {{ t(nameKey) }}
            </h1>
            <p class="text-xs text-zinc-500 dark:text-zinc-400">
              {{ t(descKey) }}
            </p>
          </div>
        </div>

        <div class="flex items-center gap-2">
          <slot name="header-actions" />

          <!-- 收藏按钮 -->
          <button
            type="button"
            @click="onToggleFavorite"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all cursor-pointer"
            :class="[
              favorited
                ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60'
                : 'bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-750'
            ]"
            :title="favorited ? t('common.unfavorite') : t('common.favorite')"
          >
            <Star
              class="w-4 h-4 transition-colors"
              :class="favorited ? 'fill-amber-400 text-amber-500' : 'text-zinc-400'"
            />
            <span>{{ favorited ? t('common.unfavorite') : t('common.favorite') }}</span>
          </button>
        </div>
      </div>
    </header>

    <!-- 工具主内容滚动区 -->
    <main class="flex-1 overflow-y-auto p-4 sm:p-5 flex flex-col min-h-0">
      <div
        class="mx-auto flex flex-col gap-3.5 w-full"
        :class="[
          wide ? 'max-w-[1750px]' : 'max-w-6xl',
          fullHeight ? 'flex-1 min-h-0' : ''
        ]"
      >
        <slot />
      </div>
    </main>
  </div>
</template>
