<script setup lang="ts">
import { ref } from 'vue';
import { Copy, Check } from 'lucide-vue-next';
import { useI18n } from 'vue-i18n';

const props = withDefaults(
  defineProps<{
    text: string;
    label?: string;
    variant?: 'primary' | 'secondary' | 'ghost' | 'icon';
    size?: 'sm' | 'md';
  }>(),
  {
    label: '',
    variant: 'secondary',
    size: 'sm'
  }
);

const { t } = useI18n();
const copied = ref(false);

async function handleCopy() {
  if (!props.text) return;
  try {
    await navigator.clipboard.writeText(props.text);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 1800);
  } catch (e) {
    console.error('Failed to copy', e);
  }
}
</script>

<template>
  <button
    type="button"
    @click="handleCopy"
    :title="copied ? t('common.copied') : t('common.copy')"
    class="inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
    :class="[
      size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-sm',
      variant === 'primary'
        ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
        : variant === 'secondary'
        ? 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700'
        : variant === 'ghost'
        ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
        : 'p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300'
    ]"
  >
    <Check v-if="copied" class="w-3.5 h-3.5 text-emerald-500" />
    <Copy v-else class="w-3.5 h-3.5" />
    <span v-if="label">{{ copied ? t('common.copied') : label }}</span>
    <span v-else-if="variant !== 'icon'">{{ copied ? t('common.copied') : t('common.copy') }}</span>
  </button>
</template>
