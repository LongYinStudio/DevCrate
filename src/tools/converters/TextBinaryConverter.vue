<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  FileDigit,
  Sparkles,
  AlertCircle,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
  FileDown,
  Table2
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import { downloadFile } from '../../utils/download';
import {
  textToBinary,
  binaryToText,
  inspectTextBytes,
  type TextBinaryEncoding,
  type BinaryDelimiter
} from './textBinaryUtils';

const { t } = useI18n();

// 核心双向状态与真值来源追踪
const textValue = ref('');
const binaryValue = ref('');
const lastEdited = ref<'text' | 'binary'>('text');

// 编码与格式选项
const encoding = ref<TextBinaryEncoding>('utf-8');
const delimiter = ref<BinaryDelimiter>('space');
const padZero = ref(true);
const showPrefix = ref(false);

// 错误与状态信息
const errorMessage = ref('');
const byteCount = ref(0);
const bitCount = ref(0);

// 字节对照透视面板
const isBreakdownExpanded = ref(true);
const copiedItemKey = ref<string | null>(null);
const isDownloaded = ref(false);

const encodingOptions: { value: TextBinaryEncoding; label: string }[] = [
  { value: 'utf-8', label: 'UTF-8' },
  { value: 'ascii', label: 'ASCII' },
  { value: 'utf-16be', label: 'UTF-16 BE' },
  { value: 'utf-16le', label: 'UTF-16 LE' }
];

const delimiterOptions = computed<SelectOption[]>(() => [
  { label: t('tools.textBinaryConverter.delimiters.space'), value: 'space' },
  { label: t('tools.textBinaryConverter.delimiters.none'), value: 'none' },
  { label: t('tools.textBinaryConverter.delimiters.newline'), value: 'newline' },
  { label: t('tools.textBinaryConverter.delimiters.comma'), value: 'comma' },
  { label: t('tools.textBinaryConverter.delimiters.hyphen'), value: 'hyphen' }
]);

// 无分隔符且取消补零提示
const showUnpaddedWarning = computed(() => {
  return delimiter.value === 'none' && !padZero.value;
});

// 字符数（按 Unicode 码点计）
const charCount = computed(() => {
  return textValue.value ? Array.from(textValue.value).length : 0;
});

// 逐字符与字节拆解列表
const breakdown = computed(() => {
  return inspectTextBytes(textValue.value, encoding.value, 100);
});

// 从文本侧转换至二进制侧
function convertFromText() {
  errorMessage.value = '';
  if (!textValue.value) {
    binaryValue.value = '';
    byteCount.value = 0;
    bitCount.value = 0;
    return;
  }

  const res = textToBinary(textValue.value, {
    encoding: encoding.value,
    delimiter: delimiter.value,
    padZero: padZero.value,
    prefix: showPrefix.value
  });

  if (res.ok) {
    binaryValue.value = res.binary;
    byteCount.value = res.byteCount;
    bitCount.value = res.bitCount;
  } else {
    binaryValue.value = '';
    byteCount.value = 0;
    bitCount.value = 0;
    if (res.errorType === 'nonAscii') {
      errorMessage.value = t('tools.textBinaryConverter.errors.nonAscii', {
        detail: res.errorDetail || ''
      });
    }
  }
}

// 从二进制侧转换至文本侧
function convertFromBinary() {
  errorMessage.value = '';
  if (!binaryValue.value.trim()) {
    textValue.value = '';
    byteCount.value = 0;
    bitCount.value = 0;
    return;
  }

  const res = binaryToText(binaryValue.value, encoding.value);
  if (res.ok) {
    textValue.value = res.text;
    byteCount.value = res.byteCount;
    bitCount.value = res.bitCount;
  } else {
    byteCount.value = res.byteCount;
    bitCount.value = res.bitCount;
    if (res.errorType) {
      errorMessage.value = t(`tools.textBinaryConverter.errors.${res.errorType}`, {
        detail: res.errorDetail || ''
      });
    }
  }
}

function onTextInput(val: string) {
  lastEdited.value = 'text';
  textValue.value = val;
  convertFromText();
}

function onBinaryInput(val: string) {
  lastEdited.value = 'binary';
  binaryValue.value = val;
  convertFromBinary();
}

function handleClearAll() {
  textValue.value = '';
  binaryValue.value = '';
  errorMessage.value = '';
  byteCount.value = 0;
  bitCount.value = 0;
}

function loadSample() {
  lastEdited.value = 'text';
  textValue.value = 'Hello DevCrate! 你好 🚀';
  convertFromText();
}

function applyFormatPreset(preset: 'standard' | 'compact' | 'array') {
  if (preset === 'standard') {
    delimiter.value = 'space';
    padZero.value = true;
    showPrefix.value = false;
  } else if (preset === 'compact') {
    delimiter.value = 'none';
    padZero.value = true;
    showPrefix.value = false;
  } else if (preset === 'array') {
    delimiter.value = 'comma';
    padZero.value = true;
    showPrefix.value = true;
  }
}

function copyBreakdownValue(key: string, val: string) {
  if (!val) return;
  navigator.clipboard.writeText(val).then(() => {
    copiedItemKey.value = key;
    setTimeout(() => {
      if (copiedItemKey.value === key) {
        copiedItemKey.value = null;
      }
    }, 1400);
  });
}

function handleDownloadBinary() {
  if (!binaryValue.value) return;
  downloadFile(binaryValue.value, 'binary-output.txt', 'text/plain;charset=utf-8');
  isDownloaded.value = true;
  setTimeout(() => {
    isDownloaded.value = false;
  }, 1800);
}

// 监听配置参数变动：按最近编辑侧重新生成；若修改了格式选项且最近编辑为二进制，
// 则在成功解码出文本后重排二进制显示（如果二进制无效则仅尝试解码）
watch([delimiter, padZero, showPrefix], () => {
  if (textValue.value && !errorMessage.value) {
    convertFromText();
  }
});

watch(encoding, () => {
  if (lastEdited.value === 'text') {
    convertFromText();
  } else {
    convertFromBinary();
  }
});
</script>

<template>
  <ToolContainer
    toolId="text-binary-converter"
    nameKey="tools.textBinaryConverter.name"
    descKey="tools.textBinaryConverter.desc"
    :icon="FileDigit"
    :wide="true"
    :fullHeight="true"
  >
    <div class="flex flex-col flex-1 min-h-0 gap-3.5 h-full">
      <!-- 顶部控制栏 -->
      <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div class="flex flex-wrap items-center gap-3">
          <!-- 编码方式 Segmented Control -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {{ t('tools.textBinaryConverter.encoding') }}
            </span>
            <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
              <button
                v-for="opt in encodingOptions"
                :key="opt.value"
                type="button"
                @click="encoding = opt.value"
                class="px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
                :class="encoding === opt.value
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
              >
                {{ opt.label }}
              </button>
            </div>
          </div>

          <!-- 分隔符选择 -->
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-zinc-500 dark:text-zinc-400">
              {{ t('tools.textBinaryConverter.delimiter') }}
            </span>
            <div class="w-36">
              <CustomSelect
                v-model="delimiter"
                :options="delimiterOptions"
                size="sm"
              />
            </div>
          </div>

          <!-- 8位补零 & 0b前缀 -->
          <div class="flex items-center gap-3.5 pl-1">
            <label class="inline-flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                v-model="padZero"
                type="checkbox"
                class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>{{ t('tools.textBinaryConverter.padZero') }}</span>
            </label>

            <label class="inline-flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300 cursor-pointer select-none">
              <input
                v-model="showPrefix"
                type="checkbox"
                class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>{{ t('tools.textBinaryConverter.showPrefix') }}</span>
            </label>
          </div>
        </div>

        <!-- 快捷预设与示例 -->
        <div class="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            @click="applyFormatPreset('standard')"
            class="px-2 py-1 rounded-md text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            {{ t('tools.textBinaryConverter.presetStandard') }}
          </button>
          <button
            type="button"
            @click="applyFormatPreset('compact')"
            class="px-2 py-1 rounded-md text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            {{ t('tools.textBinaryConverter.presetCompact') }}
          </button>
          <button
            type="button"
            @click="applyFormatPreset('array')"
            class="px-2 py-1 rounded-md text-[11px] font-medium border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
          >
            {{ t('tools.textBinaryConverter.presetArray') }}
          </button>

          <button
            type="button"
            @click="loadSample"
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer ml-1"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ t('common.loadSample') }}</span>
          </button>
        </div>
      </div>

      <!-- 错误或警告提示 -->
      <div
        v-if="errorMessage"
        class="flex items-center gap-2 px-3.5 py-2.5 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60 shrink-0"
      >
        <AlertCircle class="w-4 h-4 shrink-0" />
        <span>{{ errorMessage }}</span>
      </div>

      <div
        v-else-if="showUnpaddedWarning"
        class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/50 shrink-0"
      >
        <AlertTriangle class="w-4 h-4 shrink-0" />
        <span>{{ t('tools.textBinaryConverter.unpaddedWarning') }}</span>
      </div>

      <!-- 双向编辑主工作区 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 flex-1 min-h-[240px]">
        <!-- 文本输入框 -->
        <TextEditorBox
          :modelValue="textValue"
          @update:modelValue="onTextInput"
          :label="t('tools.textBinaryConverter.textLabel')"
          :placeholder="t('tools.textBinaryConverter.textPlaceholder')"
          :showStats="false"
          :showWrapToggle="true"
          :defaultWrap="true"
          @clear="handleClearAll"
        >
          <template #actions>
            <div class="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono mr-1">
              <span>{{ t('tools.textBinaryConverter.charsCount', { count: charCount }) }}</span>
              <span>·</span>
              <span>{{ t('tools.textBinaryConverter.bytesCount', { count: byteCount }) }}</span>
            </div>
          </template>
        </TextEditorBox>

        <!-- 二进制输入框 -->
        <TextEditorBox
          :modelValue="binaryValue"
          @update:modelValue="onBinaryInput"
          :label="t('tools.textBinaryConverter.binaryLabel')"
          :placeholder="t('tools.textBinaryConverter.binaryPlaceholder')"
          :showStats="false"
          :showWrapToggle="true"
          :defaultWrap="true"
          @clear="handleClearAll"
        >
          <template #actions>
            <div class="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-mono mr-1">
              <span>{{ t('tools.textBinaryConverter.bitsCount', { count: bitCount }) }}</span>
            </div>

            <button
              type="button"
              @click="handleDownloadBinary"
              :disabled="!binaryValue"
              class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              :title="t('tools.textBinaryConverter.downloadBinary')"
            >
              <component :is="isDownloaded ? Check : FileDown" class="w-3.5 h-3.5" :class="isDownloaded ? 'text-emerald-500' : ''" />
              <span class="hidden md:inline">{{ t('tools.textBinaryConverter.downloadBinary') }}</span>
            </button>
          </template>
        </TextEditorBox>
      </div>

      <!-- 逐字符与字节对照透视面板 -->
      <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs shrink-0 overflow-hidden">
        <button
          type="button"
          @click="isBreakdownExpanded = !isBreakdownExpanded"
          class="w-full px-3.5 py-2 flex items-center justify-between bg-zinc-50/80 dark:bg-zinc-900/60 border-b border-zinc-100 dark:border-zinc-800/80 text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100/70 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
        >
          <div class="flex items-center gap-2">
            <Table2 class="w-3.5 h-3.5 text-blue-500" />
            <span>{{ t('tools.textBinaryConverter.breakdownTitle') }}</span>
            <span
              v-if="breakdown.truncated"
              class="text-[11px] font-normal text-amber-600 dark:text-amber-400"
            >
              ({{ t('tools.textBinaryConverter.breakdownTruncated', { max: 100, total: breakdown.totalChars }) }})
            </span>
          </div>
          <component :is="isBreakdownExpanded ? ChevronDown : ChevronUp" class="w-4 h-4 text-zinc-400" />
        </button>

        <div v-if="isBreakdownExpanded" class="max-h-52 overflow-y-auto">
          <div
            v-if="breakdown.items.length === 0"
            class="py-6 px-4 text-center text-xs text-zinc-400 dark:text-zinc-500"
          >
            {{ t('tools.textBinaryConverter.breakdownEmpty') }}
          </div>

          <table v-else class="w-full text-left border-collapse text-xs">
            <thead class="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
              <tr>
                <th class="py-1.5 px-3 font-medium w-10">#</th>
                <th class="py-1.5 px-3 font-medium w-24">{{ t('tools.textBinaryConverter.colChar') }}</th>
                <th class="py-1.5 px-3 font-medium w-28">{{ t('tools.textBinaryConverter.colCodePoint') }}</th>
                <th class="py-1.5 px-3 font-medium w-32">{{ t('tools.textBinaryConverter.colDec') }}</th>
                <th class="py-1.5 px-3 font-medium w-32">{{ t('tools.textBinaryConverter.colHex') }}</th>
                <th class="py-1.5 px-3 font-medium">{{ t('tools.textBinaryConverter.colBinary') }}</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
              <tr
                v-for="item in breakdown.items"
                :key="item.index"
                class="hover:bg-zinc-50/80 dark:hover:bg-zinc-800/40 transition-colors"
              >
                <td class="py-1.5 px-3 text-[11px] text-zinc-400">{{ item.index + 1 }}</td>
                <td class="py-1.5 px-3">
                  <span
                    class="inline-flex items-center px-1.5 py-0.5 rounded text-xs"
                    :class="item.isControl
                      ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/70 dark:border-amber-800/50 text-[10px]'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 font-sans'"
                  >
                    {{ item.displayChar }}
                  </span>
                </td>
                <td class="py-1.5 px-3 text-[11px] text-zinc-500 dark:text-zinc-400">{{ item.codePoint }}</td>
                <td class="py-1.5 px-3 text-[11px] text-zinc-600 dark:text-zinc-300">
                  <span v-if="item.outOfAsciiRange" class="text-rose-500">-</span>
                  <span v-else>{{ item.bytes.map(b => b.dec).join(' ') }}</span>
                </td>
                <td class="py-1.5 px-3 text-[11px] text-indigo-600 dark:text-indigo-400">
                  <span v-if="item.outOfAsciiRange" class="text-rose-500">-</span>
                  <span v-else>{{ item.bytes.map(b => b.hex).join(' ') }}</span>
                </td>
                <td class="py-1.5 px-3">
                  <span v-if="item.outOfAsciiRange" class="text-[11px] text-rose-500 font-sans">Out of ASCII</span>
                  <button
                    v-else
                    type="button"
                    @click="copyBreakdownValue(`bin-${item.index}`, item.bytes.map(b => b.bin).join(' '))"
                    class="inline-flex items-center gap-1.5 px-1.5 py-0.5 rounded hover:bg-blue-50 dark:hover:bg-blue-950/40 text-[11px] text-zinc-800 dark:text-zinc-200 transition-colors cursor-pointer group"
                    :title="t('tools.textBinaryConverter.copyBin')"
                  >
                    <span>{{ item.bytes.map(b => b.bin).join(' ') }}</span>
                    <component
                      :is="copiedItemKey === `bin-${item.index}` ? Check : Copy"
                      class="w-3 h-3 transition-opacity"
                      :class="copiedItemKey === `bin-${item.index}` ? 'text-emerald-500 opacity-100' : 'text-zinc-400 opacity-0 group-hover:opacity-100'"
                    />
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
