<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ClipboardPaste, Trash2 } from 'lucide-vue-next';
import CopyButton from './CopyButton.vue';

const props = withDefaults(
  defineProps<{
    modelValue: string;
    label?: string;
    placeholder?: string;
    readonly?: boolean;
    rows?: number;
    showStats?: boolean;
    showCopy?: boolean;
    showPaste?: boolean;
    showClear?: boolean;
  }>(),
  {
    label: '',
    placeholder: '',
    readonly: false,
    rows: 10,
    showStats: true,
    showCopy: true,
    showPaste: true,
    showClear: true
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'clear'): void;
}>();

const { t } = useI18n();

const stats = computed(() => {
  const text = props.modelValue || '';
  const chars = text.length;
  const lines = text ? text.split('\n').length : 0;
  return { chars, lines };
});

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText();
    emit('update:modelValue', text);
  } catch (e) {
    console.error('Failed to paste from clipboard', e);
  }
}

function handleClear() {
  emit('update:modelValue', '');
  emit('clear');
}
</script>

<template>
  <div class="flex flex-col flex-1 min-h-[220px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
    <!-- 头部工具条 -->
    <div class="flex items-center justify-between px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 text-xs">
      <div class="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-200">
        <span>{{ label }}</span>
        <span v-if="showStats" class="text-zinc-400 dark:text-zinc-500 font-mono text-[11px]">
          ({{ stats.lines }} {{ t('common.lines') }}, {{ stats.chars }} {{ t('common.chars') }})
        </span>
      </div>

      <div class="flex items-center gap-1">
        <slot name="actions" />
        <button
          v-if="showPaste && !readonly"
          type="button"
          @click="handlePaste"
          class="inline-flex items-center gap-1 px-2 py-1 rounded text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          :title="t('common.paste')"
        >
          <ClipboardPaste class="w-3.5 h-3.5" />
          <span>{{ t('common.paste') }}</span>
        </button>

        <CopyButton
          v-if="showCopy"
          :text="modelValue"
          variant="secondary"
          size="sm"
        />

        <button
          v-if="showClear && !readonly"
          type="button"
          @click="handleClear"
          :disabled="!modelValue"
          class="inline-flex items-center gap-1 px-2 py-1 rounded text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          :title="t('common.clear')"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 文本输入/只读显示区 -->
    <div class="relative flex-1 flex">
      <textarea
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        :readonly="readonly"
        :placeholder="placeholder"
        class="w-full flex-1 p-3.5 font-mono text-sm leading-relaxed bg-transparent text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none resize-none overflow-auto"
        :class="{ 'opacity-90': readonly }"
        spellcheck="false"
      />
    </div>
  </div>
</template>
