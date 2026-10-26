<script setup lang="ts">
import { ref, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { FileJson, CheckCircle2, AlertCircle, Sparkles, Minimize2, ArrowRightLeft } from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';

const { t } = useI18n();

const inputJson = ref('');
const outputJson = ref('');
const indentType = ref<'2' | '4' | 'tab'>('2');
const errorMessage = ref('');
const isValid = ref<boolean | null>(null);

const sampleJson = `{
  "name": "DevCrate",
  "version": "1.0.0",
  "description": "Developer toolbox built with Tauri 2 and Vue 3",
  "features": [
    "Offline native speed",
    "Dark and light theme",
    "Multi-language i18n",
    "Privacy first"
  ],
  "author": {
    "name": "Developer",
    "active": true
  }
}`;

function loadSample() {
  inputJson.value = sampleJson;
  formatJson();
}

function getIndent(): string | number {
  if (indentType.value === 'tab') return '\t';
  return Number(indentType.value);
}

function formatJson() {
  if (!inputJson.value.trim()) {
    outputJson.value = '';
    errorMessage.value = '';
    isValid.value = null;
    return;
  }

  try {
    const parsed = JSON.parse(inputJson.value);
    outputJson.value = JSON.stringify(parsed, null, getIndent());
    errorMessage.value = '';
    isValid.value = true;
  } catch (err: any) {
    isValid.value = false;
    errorMessage.value = err.message || 'Invalid JSON';
  }
}

function minifyJson() {
  if (!inputJson.value.trim()) return;
  try {
    const parsed = JSON.parse(inputJson.value);
    outputJson.value = JSON.stringify(parsed);
    errorMessage.value = '';
    isValid.value = true;
  } catch (err: any) {
    isValid.value = false;
    errorMessage.value = err.message || 'Invalid JSON';
  }
}

function escapeJson() {
  if (!inputJson.value) return;
  outputJson.value = JSON.stringify(inputJson.value);
}

function unescapeJson() {
  if (!inputJson.value) return;
  try {
    outputJson.value = JSON.parse(inputJson.value);
  } catch {
    // 简单替换反斜杠
    outputJson.value = inputJson.value.replace(/\\"/g, '"').replace(/\\\\/g, '\\');
  }
}

function swapInputOutput() {
  if (!outputJson.value) return;
  const temp = inputJson.value;
  inputJson.value = outputJson.value;
  outputJson.value = temp;
  formatJson();
}

watch(indentType, () => {
  if (inputJson.value.trim()) {
    formatJson();
  }
});
</script>

<template>
  <ToolContainer
    toolId="json-formatter"
    nameKey="tools.jsonFormatter.name"
    descKey="tools.jsonFormatter.desc"
    :icon="FileJson"
  >
    <!-- 操作面板与选项 -->
    <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-wrap items-center justify-between gap-3">
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          @click="formatJson"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer"
        >
          <Sparkles class="w-3.5 h-3.5" />
          <span>{{ t('tools.jsonFormatter.beautify') }}</span>
        </button>

        <button
          type="button"
          @click="minifyJson"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
        >
          <Minimize2 class="w-3.5 h-3.5" />
          <span>{{ t('tools.jsonFormatter.minify') }}</span>
        </button>

        <button
          type="button"
          @click="escapeJson"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
        >
          <span>{{ t('tools.jsonFormatter.escape') }}</span>
        </button>

        <button
          type="button"
          @click="unescapeJson"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
        >
          <span>{{ t('tools.jsonFormatter.unescape') }}</span>
        </button>

        <div class="h-4 w-px bg-zinc-200 dark:bg-zinc-800 mx-1"></div>

        <button
          type="button"
          @click="swapInputOutput"
          :disabled="!outputJson"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-40"
          title="互换输入和输出"
        >
          <ArrowRightLeft class="w-3.5 h-3.5" />
        </button>
      </div>

      <div class="flex items-center gap-3">
        <!-- 缩进选项 -->
        <div class="flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300">
          <span>{{ t('tools.jsonFormatter.indentation') }}:</span>
          <select
            v-model="indentType"
            class="px-2 py-1 rounded-md text-xs bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
          >
            <option value="2">{{ t('tools.jsonFormatter.indent2') }}</option>
            <option value="4">{{ t('tools.jsonFormatter.indent4') }}</option>
            <option value="tab">{{ t('tools.jsonFormatter.indentTab') }}</option>
          </select>
        </div>

        <button
          type="button"
          @click="loadSample"
          class="px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
        >
          {{ t('common.loadSample') }}
        </button>
      </div>
    </div>

    <!-- 状态反馈条 -->
    <div
      v-if="isValid !== null"
      class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs"
      :class="[
        isValid
          ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
          : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
      ]"
    >
      <CheckCircle2 v-if="isValid" class="w-4 h-4 text-emerald-500 shrink-0" />
      <AlertCircle v-else class="w-4 h-4 text-rose-500 shrink-0" />
      <span class="font-medium">
        {{ isValid ? t('tools.jsonFormatter.validJson') : t('tools.jsonFormatter.invalidJson') + errorMessage }}
      </span>
    </div>

    <!-- 编辑区分栏 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 flex-1">
      <TextEditorBox
        v-model="inputJson"
        :label="t('common.input')"
        placeholder="Paste JSON string here..."
        @clear="outputJson = ''; isValid = null; errorMessage = ''"
      />

      <TextEditorBox
        v-model="outputJson"
        :label="t('common.output')"
        :readonly="true"
        placeholder="Formatted JSON will appear here..."
        :showPaste="false"
        :showClear="false"
      />
    </div>
  </ToolContainer>
</template>
