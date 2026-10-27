<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { ChevronDown, Check } from 'lucide-vue-next';

export interface SelectOption {
  label: string;
  value: string | number;
  desc?: string;
}

const props = withDefaults(
  defineProps<{
    modelValue: string | number;
    options: SelectOption[];
    placeholder?: string;
    disabled?: boolean;
    size?: 'sm' | 'md';
    align?: 'left' | 'right';
    fullWidth?: boolean;
  }>(),
  {
    placeholder: '',
    disabled: false,
    size: 'sm',
    align: 'left',
    fullWidth: false
  }
);

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void;
  (e: 'change', value: any): void;
}>();

const isOpen = ref(false);
const openUpwards = ref(false);
const containerRef = ref<HTMLDivElement | null>(null);

const currentOption = computed(() => {
  return props.options.find(opt => String(opt.value) === String(props.modelValue));
});

const currentLabel = computed(() => {
  return currentOption.value ? currentOption.value.label : props.placeholder || String(props.modelValue);
});

function toggleDropdown() {
  if (props.disabled) return;
  if (!isOpen.value && containerRef.value) {
    const rect = containerRef.value.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    openUpwards.value = spaceBelow < 190 && rect.top > spaceBelow;
  }
  isOpen.value = !isOpen.value;
}

function selectOption(option: SelectOption) {
  // 立即关闭下拉层，杜绝任何过渡期竞争与重绘闪烁
  isOpen.value = false;
  emit('update:modelValue', option.value);
  emit('change', option.value);
}

function handlePointerDownOutside(e: PointerEvent) {
  if (containerRef.value && !containerRef.value.contains(e.target as Node)) {
    isOpen.value = false;
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener('pointerdown', handlePointerDownOutside);
  window.addEventListener('keydown', handleKeydown);
});

onUnmounted(() => {
  document.removeEventListener('pointerdown', handlePointerDownOutside);
  window.removeEventListener('keydown', handleKeydown);
});
</script>

<template>
  <div
    ref="containerRef"
    class="relative inline-block text-left select-none"
    :class="{ 'w-full': fullWidth }"
  >
    <!-- 自定义触发按钮 -->
    <button
      type="button"
      @click.stop="toggleDropdown"
      :disabled="disabled"
      class="group inline-flex items-center justify-between gap-2 rounded-lg font-medium cursor-pointer border outline-none text-left"
      :class="[
        fullWidth ? 'w-full' : '',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs',
        isOpen
          ? 'border-blue-500 ring-2 ring-blue-500/10 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-xs'
          : 'border-zinc-200/90 dark:border-zinc-700/80 bg-zinc-100/90 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-200/70 dark:hover:bg-zinc-750 hover:border-zinc-300 dark:hover:border-zinc-600',
        disabled ? 'opacity-50 cursor-not-allowed' : ''
      ]"
    >
      <span class="truncate">{{ currentLabel }}</span>
      <ChevronDown
        class="w-3.5 h-3.5 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-transform duration-150 shrink-0"
        :class="{ 'rotate-180 text-blue-500 dark:text-blue-400': isOpen }"
      />
    </button>

    <!-- 弹出的选项面板（完全移除 Vue Transition 离场延迟与半透明残影，收起与选中即刻销毁，从根源杜绝闪烁） -->
    <div
      v-if="isOpen"
      class="dropdown-popover absolute min-w-[130px] max-h-60 overflow-y-auto z-50 p-1 rounded-xl border border-zinc-200/90 dark:border-zinc-700 bg-white dark:bg-zinc-900 shadow-lg shadow-black/5 dark:shadow-black/30"
      :class="[
        fullWidth ? 'w-full' : 'w-max',
        openUpwards ? 'bottom-full mb-1' : 'top-full mt-1',
        align === 'right' ? 'right-0' : 'left-0'
      ]"
    >
      <div class="flex flex-col gap-0.5">
        <div
          v-for="opt in options"
          :key="String(opt.value)"
          @click.stop="selectOption(opt)"
          class="flex items-center justify-between gap-3 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          :class="[
            String(opt.value) === String(modelValue)
              ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-semibold'
              : 'text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100'
          ]"
        >
          <div class="flex flex-col">
            <span>{{ opt.label }}</span>
            <span v-if="opt.desc" class="text-[10px] text-zinc-400 font-normal">
              {{ opt.desc }}
            </span>
          </div>
          <Check
            v-if="String(opt.value) === String(modelValue)"
            class="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0 ml-2"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.dropdown-popover {
  animation: dropdown-pop-in 0.08s ease-out;
}

@keyframes dropdown-pop-in {
  from {
    opacity: 0;
    transform: translateY(-2px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
