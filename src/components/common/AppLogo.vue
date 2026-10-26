<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number | string;
    rounded?: 'none' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  }>(),
  {
    size: 32,
    rounded: 'xl'
  }
);
</script>

<template>
  <div
    class="relative flex items-center justify-center shrink-0 select-none overflow-hidden"
    :style="{ width: `${size}px`, height: `${size}px` }"
    :class="[
      rounded === 'xl'
        ? 'rounded-xl'
        : rounded === '2xl'
        ? 'rounded-2xl'
        : rounded === 'lg'
        ? 'rounded-lg'
        : rounded === 'md'
        ? 'rounded-md'
        : rounded === 'full'
        ? 'rounded-full'
        : ''
    ]"
  >
    <img
      src="/logo.png"
      alt="DevCrate Logo"
      class="w-full h-full object-contain pointer-events-none"
    />
  </div>
</template>
