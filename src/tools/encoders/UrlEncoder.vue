<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { Link, ArrowRightLeft, Sparkles } from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';

const { t } = useI18n();

const mode = ref<'encode' | 'decode'>('encode');
const encodeType = ref<'component' | 'uri'>('component');
const inputText = ref('');
const outputText = ref('');
const error = ref('');

function process() {
  if (!inputText.value) {
    outputText.value = '';
    error.value = '';
    return;
  }

  try {
    if (mode.value === 'encode') {
      if (encodeType.value === 'component') {
        outputText.value = encodeURIComponent(inputText.value);
      } else {
        outputText.value = encodeURI(inputText.value);
      }
      error.value = '';
    } else {
      if (encodeType.value === 'component') {
        outputText.value = decodeURIComponent(inputText.value);
      } else {
        outputText.value = decodeURI(inputText.value);
      }
      error.value = '';
    }
  } catch (err: any) {
    outputText.value = '';
    error.value = err.message || 'URI Malformed';
  }
}

function switchMode() {
  mode.value = mode.value === 'encode' ? 'decode' : 'encode';
  const temp = inputText.value;
  inputText.value = outputText.value;
  outputText.value = temp;
  process();
}

function loadSample() {
  if (mode.value === 'encode') {
    inputText.value = 'https://example.com/search?q=开发者工具箱&category=tauri 2&token=xyz#hash';
  } else {
    inputText.value = 'https://example.com/search?q=%E5%BC%80%E5%8F%91%E8%80%85%E5%B7%A5%E5%85%B7%E7%AE%B1&category=tauri%202&token=xyz#hash';
  }
  process();
}

watch([inputText, mode, encodeType], () => {
  process();
});
</script>

<template>
  <ToolContainer
    toolId="url-encoder"
    nameKey="tools.urlEncoder.name"
    descKey="tools.urlEncoder.desc"
    :icon="Link"
  >
    <!-- 控制栏 -->
    <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-3">
        <!-- 编码/解码切换 -->
        <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700">
          <button
            type="button"
            @click="mode = 'encode'"
            class="px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
            :class="mode === 'encode' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
          >
            {{ t('tools.urlEncoder.encode') }}
          </button>
          <button
            type="button"
            @click="mode = 'decode'"
            class="px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
            :class="mode === 'decode' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
          >
            {{ t('tools.urlEncoder.decode') }}
          </button>
        </div>

        <button
          type="button"
          @click="switchMode"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
          title="切换输入输出"
        >
          <ArrowRightLeft class="w-3.5 h-3.5" />
        </button>

        <!-- 编码模式选择 -->
        <div class="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
          <span>{{ t('tools.urlEncoder.encodeMode') }}:</span>
          <select
            v-model="encodeType"
            class="px-2 py-1 rounded-md text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="component">{{ t('tools.urlEncoder.componentMode') }}</option>
            <option value="uri">{{ t('tools.urlEncoder.fullUriMode') }}</option>
          </select>
        </div>
      </div>

      <div>
        <button
          type="button"
          @click="loadSample"
          class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ t('common.loadSample') }}</span>
        </button>
      </div>
    </div>

    <!-- 错误提示 -->
    <div
      v-if="error"
      class="p-3 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
    >
      {{ error }}
    </div>

    <!-- 左右分栏 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
      <TextEditorBox
        v-model="inputText"
        :label="t('common.input')"
        placeholder="Type or paste URL string here..."
        @clear="outputText = ''; error = ''"
      />

      <TextEditorBox
        v-model="outputText"
        :label="t('common.output')"
        :readonly="true"
        placeholder="Processed result will appear here..."
        :showPaste="false"
        :showClear="false"
      />
    </div>
  </ToolContainer>
</template>
