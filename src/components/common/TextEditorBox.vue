<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { ClipboardPaste, Trash2, WrapText } from 'lucide-vue-next';
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
    showLineNumbers?: boolean;
    showWrapToggle?: boolean;
    defaultWrap?: boolean;
  }>(),
  {
    label: '',
    placeholder: '',
    readonly: false,
    rows: 10,
    showStats: true,
    showCopy: true,
    showPaste: true,
    showClear: true,
    showLineNumbers: false,
    showWrapToggle: false,
    defaultWrap: false
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void;
  (e: 'clear'): void;
}>();

const { t } = useI18n();

const isWrap = ref(props.defaultWrap);
const textareaRef = ref<HTMLTextAreaElement | null>(null);
const gutterRef = ref<HTMLDivElement | null>(null);

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

function handleScroll(e: Event) {
  if (gutterRef.value) {
    gutterRef.value.scrollTop = (e.target as HTMLElement).scrollTop;
  }
}

function scrollToLine(lineNumber: number) {
  if (!textareaRef.value) return;
  const lineIndex = Math.max(0, lineNumber - 1);
  const lineHeight = 26; // font-size 14px * leading 1.625 ≈ 26px
  textareaRef.value.scrollTop = lineIndex * lineHeight;
  textareaRef.value.focus();
}

defineExpose({
  scrollToLine,
  textareaRef
});
</script>

<template>
  <div class="flex flex-col flex-1 h-full min-h-[260px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
    <!-- 头部工具条 -->
    <div class="flex items-center justify-between px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 text-xs shrink-0 select-none">
      <div class="flex items-center gap-2 font-medium text-zinc-700 dark:text-zinc-200">
        <span>{{ label }}</span>
        <span v-if="showStats" class="text-zinc-400 dark:text-zinc-500 font-mono text-[11px]">
          ({{ stats.lines }} {{ t('common.lines') }}, {{ stats.chars }} {{ t('common.chars') }})
        </span>
      </div>

      <div class="flex items-center gap-1">
        <slot name="actions" />

        <!-- 换行切换按钮 -->
        <button
          v-if="showWrapToggle"
          type="button"
          @click="isWrap = !isWrap"
          class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs transition-colors cursor-pointer"
          :class="isWrap ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-medium' : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
          :title="isWrap ? '换行模式已开启' : '换行模式已关闭 (单行水平滚动)'"
        >
          <WrapText class="w-3.5 h-3.5" />
          <span>{{ isWrap ? '换行' : '不换行' }}</span>
        </button>

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
    <div class="relative flex-1 flex min-h-0 overflow-hidden bg-white dark:bg-zinc-900">
      <!-- 同步像素对齐行号槽 -->
      <div
        v-if="showLineNumbers"
        ref="gutterRef"
        class="select-none py-3.5 pl-3 pr-2 font-mono text-xs text-zinc-400 dark:text-zinc-500 bg-zinc-50/70 dark:bg-zinc-950/40 border-r border-zinc-100 dark:border-zinc-800 text-right overflow-hidden shrink-0"
        :style="{ width: `${Math.max(2, String(stats.lines).length) * 8 + 24}px` }"
      >
        <div
          v-for="n in Math.max(1, stats.lines)"
          :key="n"
          class="leading-[1.625rem]"
        >
          {{ n }}
        </div>
      </div>

      <!-- 文本输入框 -->
      <textarea
        ref="textareaRef"
        :value="modelValue"
        @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
        @scroll="handleScroll"
        :readonly="readonly"
        :placeholder="placeholder"
        :wrap="isWrap ? 'soft' : 'off'"
        class="w-full flex-1 p-3.5 font-mono text-sm leading-[1.625rem] bg-transparent text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none resize-none overflow-auto"
        :class="[
          readonly ? 'opacity-90' : '',
          isWrap ? 'whitespace-pre-wrap' : 'whitespace-pre'
        ]"
        spellcheck="false"
      />
    </div>
  </div>
</template>
