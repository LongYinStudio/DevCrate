<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Type, Sparkles } from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import CopyButton from '../../components/common/CopyButton.vue';

const { t } = useI18n();

const inputText = ref('');

// 统计信息
const stats = computed(() => {
  const str = inputText.value;
  const chars = str.length;
  const charsNoSpaces = str.replace(/\s+/g, '').length;
  const words = str.trim() ? str.trim().split(/\s+/).length : 0;
  const lines = str ? str.split('\n').length : 0;
  const bytes = new TextEncoder().encode(str).length;
  return { chars, charsNoSpaces, words, lines, bytes };
});

function toWords(str: string): string[] {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_\-]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

const transformations = computed(() => {
  const str = inputText.value;
  if (!str.trim()) return [];

  const words = toWords(str);

  const uppercase = str.toUpperCase();
  const lowercase = str.toLowerCase();

  const camelCase = words
    .map((w, idx) =>
      idx === 0
        ? w.toLowerCase()
        : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()
    )
    .join('');

  const pascalCase = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');

  const snakeCase = words.map(w => w.toLowerCase()).join('_');
  const kebabCase = words.map(w => w.toLowerCase()).join('-');
  const constantCase = words.map(w => w.toUpperCase()).join('_');
  const titleCase = words
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(' ');

  return [
    { label: t('tools.textInspector.uppercase'), val: uppercase },
    { label: t('tools.textInspector.lowercase'), val: lowercase },
    { label: t('tools.textInspector.camelCase'), val: camelCase },
    { label: t('tools.textInspector.pascalCase'), val: pascalCase },
    { label: t('tools.textInspector.snakeCase'), val: snakeCase },
    { label: t('tools.textInspector.kebabCase'), val: kebabCase },
    { label: t('tools.textInspector.constantCase'), val: constantCase },
    { label: t('tools.textInspector.titleCase'), val: titleCase },
  ];
});

function applyTransform(val: string) {
  inputText.value = val;
}

function loadSample() {
  inputText.value = 'DevCrate is an awesome cross-platform developer toolbox';
}
</script>

<template>
  <ToolContainer
    toolId="text-inspector"
    nameKey="tools.textInspector.name"
    descKey="tools.textInspector.desc"
    :icon="Type"
  >
    <!-- 输入文本 -->
    <div class="flex flex-col gap-2">
      <div class="flex items-center justify-between">
        <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {{ t('common.input') }}
        </label>
        <button
          type="button"
          @click="loadSample"
          class="inline-flex items-center gap-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ t('common.loadSample') }}</span>
        </button>
      </div>

      <TextEditorBox
        v-model="inputText"
        :rows="6"
        placeholder="Type or paste text to inspect and transform..."
      />
    </div>

    <!-- 核心统计指标卡片 -->
    <div class="grid grid-cols-2 sm:grid-cols-5 gap-3">
      <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col">
        <span class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{{ t('common.chars') }}</span>
        <span class="font-mono text-xl font-bold text-zinc-800 dark:text-zinc-100 mt-1">{{ stats.chars }}</span>
      </div>

      <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col">
        <span class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">不含空格</span>
        <span class="font-mono text-xl font-bold text-zinc-800 dark:text-zinc-100 mt-1">{{ stats.charsNoSpaces }}</span>
      </div>

      <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col">
        <span class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{{ t('common.words') }}</span>
        <span class="font-mono text-xl font-bold text-zinc-800 dark:text-zinc-100 mt-1">{{ stats.words }}</span>
      </div>

      <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col">
        <span class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{{ t('common.lines') }}</span>
        <span class="font-mono text-xl font-bold text-zinc-800 dark:text-zinc-100 mt-1">{{ stats.lines }}</span>
      </div>

      <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col col-span-2 sm:col-span-1">
        <span class="text-[11px] font-medium text-zinc-400 uppercase tracking-wider">{{ t('common.bytes') }}</span>
        <span class="font-mono text-xl font-bold text-zinc-800 dark:text-zinc-100 mt-1">{{ stats.bytes }}</span>
      </div>
    </div>

    <!-- 大小写及命名规范转换表 -->
    <div v-if="transformations.length" class="flex flex-col gap-3">
      <h3 class="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
        {{ t('tools.textInspector.transformations') }}
      </h3>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div
          v-for="item in transformations"
          :key="item.label"
          class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex items-center justify-between gap-3"
        >
          <div class="flex flex-col min-w-0 flex-1">
            <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ item.label }}</span>
            <span class="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate mt-0.5" :title="item.val">
              {{ item.val }}
            </span>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              @click="applyTransform(item.val)"
              class="px-2 py-1 text-xs rounded font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
              title="应用到输入框"
            >
              应用
            </button>
            <CopyButton :text="item.val" variant="secondary" />
          </div>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
