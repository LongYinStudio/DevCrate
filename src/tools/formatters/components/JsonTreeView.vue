<script setup lang="ts">
import { ref, computed } from 'vue';
import { Search, ChevronDown, ChevronRight, Copy, Check } from 'lucide-vue-next';
import JsonTreeNode from './JsonTreeNode.vue';

const props = defineProps<{
  data: any;
}>();

const filterText = ref('');
const expandSignal = ref(0);
const collapseSignal = ref(0);
const copiedAll = ref(false);

function expandAll() {
  expandSignal.value++;
}

function collapseAll() {
  collapseSignal.value++;
}

async function copyAll() {
  try {
    await navigator.clipboard.writeText(JSON.stringify(props.data, null, 2));
    copiedAll.value = true;
    setTimeout(() => {
      copiedAll.value = false;
    }, 1500);
  } catch (e) {
    console.error('Failed to copy JSON', e);
  }
}

const isDataEmpty = computed(() => {
  return props.data === undefined || props.data === null || props.data === '';
});
</script>

<template>
  <div class="flex flex-col flex-1 h-full min-h-[260px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
    <!-- 树形工具栏 -->
    <div class="flex items-center justify-between px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 text-xs shrink-0 select-none gap-2 flex-wrap">
      <div class="flex items-center gap-1.5 flex-1 min-w-[140px] max-w-[260px]">
        <div class="relative w-full">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-2 top-1/2 -translate-y-1/2" />
          <input
            v-model="filterText"
            type="text"
            placeholder="搜索节点或值..."
            class="w-full pl-7 pr-2 py-1 text-xs rounded-md bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 outline-none focus:border-blue-500"
          />
        </div>
      </div>

      <div class="flex items-center gap-1">
        <button
          type="button"
          @click="expandAll"
          class="inline-flex items-center gap-1 px-2 py-1 rounded text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-xs"
          title="全部展开"
        >
          <ChevronDown class="w-3.5 h-3.5" />
          <span>展开</span>
        </button>

        <button
          type="button"
          @click="collapseAll"
          class="inline-flex items-center gap-1 px-2 py-1 rounded text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-xs"
          title="全部折叠"
        >
          <ChevronRight class="w-3.5 h-3.5" />
          <span>折叠</span>
        </button>

        <button
          type="button"
          @click="copyAll"
          class="inline-flex items-center gap-1 px-2 py-1 rounded text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer text-xs"
          title="复制完整 JSON"
        >
          <Check v-if="copiedAll" class="w-3.5 h-3.5 text-emerald-500" />
          <Copy v-else class="w-3.5 h-3.5" />
          <span>{{ copiedAll ? '已复制' : '复制' }}</span>
        </button>
      </div>
    </div>

    <!-- 树形节点主渲染区 -->
    <div class="flex-1 overflow-auto p-3 select-text bg-white dark:bg-zinc-900">
      <div v-if="isDataEmpty" class="h-full flex items-center justify-center text-xs text-zinc-400">
        无可用 JSON 数据
      </div>
      <JsonTreeNode
        v-else
        :value="data"
        :expandSignal="expandSignal"
        :collapseSignal="collapseSignal"
        :filter="filterText"
      />
    </div>
  </div>
</template>
