<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { ChevronRight, Copy, Check } from 'lucide-vue-next';

const { locale } = useI18n();

const props = withDefaults(
  defineProps<{
    name?: string | number;
    value: any;
    depth?: number;
    isLast?: boolean;
    expandSignal?: number;
    collapseSignal?: number;
    filter?: string;
    path?: string;
  }>(),
  {
    depth: 0,
    isLast: true,
    expandSignal: 0,
    collapseSignal: 0,
    filter: '',
    path: ''
  }
);

const isExpanded = ref(props.depth < 2);
const copied = ref(false);

watch(() => props.expandSignal, () => {
  if (isComplex.value) {
    isExpanded.value = true;
  }
});

watch(() => props.collapseSignal, () => {
  if (isComplex.value) {
    isExpanded.value = false;
  }
});

const isArray = computed(() => Array.isArray(props.value));
const isObject = computed(() => props.value !== null && typeof props.value === 'object' && !isArray.value);
const isComplex = computed(() => isArray.value || isObject.value);

const childKeys = computed(() => {
  if (!isComplex.value || props.value === null) return [];
  return Object.keys(props.value);
});

const childCount = computed(() => childKeys.value.length);

const valueType = computed(() => {
  if (props.value === null) return 'null';
  if (isArray.value) return 'array';
  return typeof props.value;
});

function toggleExpand() {
  isExpanded.value = !isExpanded.value;
}

async function copyValue(e: MouseEvent) {
  e.stopPropagation();
  let text = '';
  if (isComplex.value) {
    text = JSON.stringify(props.value, null, 2);
  } else if (typeof props.value === 'string') {
    text = props.value;
  } else {
    text = String(props.value);
  }

  try {
    await navigator.clipboard.writeText(text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1500);
  } catch (err) {
    console.error('Failed to copy', err);
  }
}

// 搜索高亮与匹配过滤
const matchesFilter = computed(() => {
  if (!props.filter) return true;
  const f = props.filter.toLowerCase();
  const nameMatch = props.name !== undefined && String(props.name).toLowerCase().includes(f);
  if (nameMatch) return true;
  if (!isComplex.value) {
    return String(props.value).toLowerCase().includes(f);
  }
  return false;
});
</script>

<template>
  <div class="font-mono text-xs leading-relaxed select-text" :class="{ 'opacity-40': filter && !matchesFilter }">
    <!-- 当前行主体 -->
    <div
      class="group/row inline-flex items-center gap-1.5 py-0.5 px-1.5 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors w-full cursor-default"
      :style="{ paddingLeft: `${depth * 1.1 + 0.25}rem` }"
    >
      <!-- 复杂类型折叠指示器 -->
      <button
        v-if="isComplex"
        type="button"
        @click="toggleExpand"
        class="w-4 h-4 flex items-center justify-center -ml-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-transform cursor-pointer"
        :class="{ 'rotate-90': isExpanded }"
      >
        <ChevronRight class="w-3.5 h-3.5" />
      </button>
      <span v-else class="w-3 shrink-0"></span>

      <!-- 键名 / 索引 -->
      <span
        v-if="name !== undefined"
        class="font-semibold"
        :class="[
          typeof name === 'number'
            ? 'text-zinc-400 dark:text-zinc-500'
            : 'text-blue-700 dark:text-blue-400'
        ]"
      >
        {{ typeof name === 'number' ? `[${name}]` : `"${name}"` }}:
      </span>

      <!-- 复杂类型（数组 / 对象） -->
      <template v-if="isComplex">
        <span class="text-zinc-600 dark:text-zinc-400">{{ isArray ? '[' : '{' }}</span>

        <!-- 折叠时的概要信息徽章 -->
        <button
          v-if="!isExpanded"
          type="button"
          @click="toggleExpand"
          class="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-500 hover:text-blue-600 dark:hover:text-blue-400 border border-zinc-200/60 dark:border-zinc-700/60 transition-colors cursor-pointer"
        >
          <span>...</span>
          <span>{{ childCount }} {{ isArray ? 'items' : 'keys' }}</span>
        </button>

        <span v-if="!isExpanded" class="text-zinc-600 dark:text-zinc-400">
          {{ isArray ? ']' : '}' }}{{ isLast ? '' : ',' }}
        </span>
      </template>

      <!-- 简单类型数值 -->
      <template v-else>
        <!-- 字符串 -->
        <span v-if="valueType === 'string'" class="text-emerald-600 dark:text-emerald-400 break-all">
          "{{ value }}"
        </span>

        <!-- 数字 -->
        <span v-else-if="valueType === 'number'" class="text-sky-600 dark:text-sky-400 font-semibold">
          {{ value }}
        </span>

        <!-- 布尔 -->
        <span v-else-if="valueType === 'boolean'" class="text-amber-600 dark:text-amber-400 font-bold uppercase text-[11px]">
          {{ value }}
        </span>

        <!-- Null -->
        <span v-else-if="valueType === 'null'" class="text-zinc-400 italic">
          null
        </span>

        <!-- 其他 -->
        <span v-else class="text-zinc-500">
          {{ String(value) }}
        </span>

        <span v-if="!isLast" class="text-zinc-400 dark:text-zinc-500">,</span>
      </template>

      <!-- 悬停快捷复制按钮 -->
      <button
        type="button"
        @click="copyValue"
        class="opacity-0 group-hover/row:opacity-100 p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-opacity cursor-pointer ml-auto"
        :title="copied ? (locale.startsWith('zh') ? '已复制' : 'Copied') : (locale.startsWith('zh') ? '复制此项内容' : 'Copy item')"
      >
        <Check v-if="copied" class="w-3 h-3 text-emerald-500" />
        <Copy v-else class="w-3 h-3" />
      </button>
    </div>

    <!-- 展开的子节点 -->
    <div v-if="isComplex && isExpanded">
      <JsonTreeNode
        v-for="(key, index) in childKeys"
        :key="key"
        :name="isArray ? Number(key) : key"
        :value="value[key]"
        :depth="depth + 1"
        :isLast="index === childCount - 1"
        :expandSignal="expandSignal"
        :collapseSignal="collapseSignal"
        :filter="filter"
        :path="path ? `${path}.${key}` : key"
      />

      <!-- 闭合括号行 -->
      <div
        class="py-0.5 px-1.5 text-zinc-600 dark:text-zinc-400"
        :style="{ paddingLeft: `${depth * 1.1 + 0.25}rem` }"
      >
        <span class="w-3 inline-block"></span>
        <span>{{ isArray ? ']' : '}' }}{{ isLast ? '' : ',' }}</span>
      </div>
    </div>
  </div>
</template>
