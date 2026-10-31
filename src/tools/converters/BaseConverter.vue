<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Calculator,
  Copy,
  Check,
  RotateCcw,
  Shuffle,
  Binary,
  Cpu,
  ArrowLeftRight
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// 字符集定义
const CHARSETS: Record<number, string> = {
  2: '01',
  8: '01234567',
  10: '0123456789',
  16: '0123456789ABCDEF',
  32: '0123456789ABCDEFGHIJKLMNOPQRSTUV',
  36: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
  62: '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ',
  64: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
};

function getCharsetForRadix(radix: number): string {
  if (CHARSETS[radix]) return CHARSETS[radix];
  const full = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+/';
  return full.slice(0, radix);
}

// 核心数值状态：以 BigInt 作为唯一真值源
const currentVal = ref<bigint>(42n);

// 格式配置选项
const showPrefix = ref(true);
const hexUppercase = ref(true);
const binGrouping = ref<'none' | 'nibble' | 'byte'>('nibble');
const decGrouping = ref(true);
const customRadix = ref(62);

// 视图 Tab
const activeTab = ref<'matrix' | 'types' | 'ascii'>('matrix');
const bitWidth = ref<8 | 16 | 32 | 64>(32);

// 针对各个输入框的本地双向绑定文本
const binInput = ref('');
const octInput = ref('');
const decInput = ref('');
const hexInput = ref('');
const base32Input = ref('');
const base36Input = ref('');
const base62Input = ref('');
const customInput = ref('');

// 字段输入错误状态
const inputErrors = ref<Record<string, boolean>>({});

// 复制状态记录
const copiedKey = ref<string | null>(null);

function triggerCopied(key: string, text: string) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    copiedKey.value = key;
    setTimeout(() => {
      copiedKey.value = null;
    }, 1500);
  });
}

// BigInt 转换为任意进制字符串
function formatBigInt(val: bigint, radix: number, upper = true): string {
  if (val === 0n) return '0';
  const negative = val < 0n;
  let n = negative ? -val : val;
  const base = BigInt(radix);
  const charset = getCharsetForRadix(radix);
  let res = '';
  while (n > 0n) {
    const rem = Number(n % base);
    res = charset[rem] + res;
    n = n / base;
  }
  if (!upper && radix <= 36) {
    res = res.toLowerCase();
  }
  return (negative ? '-' : '') + res;
}

// 格式化数字分组
function groupDigits(str: string, groupSize: number): string {
  if (groupSize <= 0) return str;
  const negative = str.startsWith('-');
  const raw = negative ? str.slice(1) : str;
  const rem = raw.length % groupSize;
  const parts: string[] = [];
  if (rem > 0) {
    parts.push(raw.slice(0, rem));
  }
  for (let i = rem; i < raw.length; i += groupSize) {
    parts.push(raw.slice(i, i + groupSize));
  }
  return (negative ? '-' : '') + parts.join(' ');
}

// 解析任意进制字符串为 BigInt
function parseToBigInt(str: string, radix: number): bigint {
  let clean = str.trim().replace(/[\s_,]/g, '');
  if (!clean) return 0n;

  if (radix === 2 && (clean.startsWith('0b') || clean.startsWith('0B'))) clean = clean.slice(2);
  else if (radix === 8 && (clean.startsWith('0o') || clean.startsWith('0O'))) clean = clean.slice(2);
  else if (radix === 16 && (clean.startsWith('0x') || clean.startsWith('0X'))) clean = clean.slice(2);

  const negative = clean.startsWith('-');
  if (negative) clean = clean.slice(1);
  if (!clean) return 0n;

  const charset = getCharsetForRadix(radix);
  const map: Record<string, number> = {};
  for (let i = 0; i < charset.length; i++) {
    map[charset[i]] = i;
    if (radix <= 36) {
      map[charset[i].toLowerCase()] = i;
      map[charset[i].toUpperCase()] = i;
    }
  }

  const base = BigInt(radix);
  let result = 0n;
  for (let i = 0; i < clean.length; i++) {
    const ch = clean[i];
    const val = map[ch];
    if (val === undefined || val >= radix) {
      throw new Error(`Invalid digit "${ch}" for base ${radix}`);
    }
    result = result * base + BigInt(val);
  }
  return negative ? -result : result;
}

// 根据当前值刷新所有输入框字符串（排除正在输入的源字段）
function syncInputsFromValue(sourceKey?: string) {
  const v = currentVal.value;

  if (sourceKey !== 'bin') {
    const raw = formatBigInt(v, 2);
    const grp = binGrouping.value === 'nibble' ? 4 : binGrouping.value === 'byte' ? 8 : 0;
    binInput.value = groupDigits(raw, grp);
  }

  if (sourceKey !== 'oct') {
    octInput.value = formatBigInt(v, 8);
  }

  if (sourceKey !== 'dec') {
    const raw = v.toString(10);
    decInput.value = decGrouping.value ? groupDigits(raw, 3) : raw;
  }

  if (sourceKey !== 'hex') {
    hexInput.value = formatBigInt(v, 16, hexUppercase.value);
  }

  if (sourceKey !== 'base32') {
    base32Input.value = formatBigInt(v, 32, true);
  }

  if (sourceKey !== 'base36') {
    base36Input.value = formatBigInt(v, 36, hexUppercase.value);
  }

  if (sourceKey !== 'base62') {
    base62Input.value = formatBigInt(v, 62);
  }

  if (sourceKey !== 'custom') {
    customInput.value = formatBigInt(v, customRadix.value, hexUppercase.value);
  }
}

// 当任意输入框发生变更时调用
function onFieldInput(fieldKey: string, rawVal: string, radix: number) {
  try {
    const parsed = parseToBigInt(rawVal, radix);
    currentVal.value = parsed;
    inputErrors.value[fieldKey] = false;
    syncInputsFromValue(fieldKey);
  } catch (_e) {
    inputErrors.value[fieldKey] = true;
  }
}

// 预设切换
function setPreset(v: bigint) {
  currentVal.value = v;
  inputErrors.value = {};
  syncInputsFromValue();
}

function setRandom(bits = 32) {
  let res = 0n;
  for (let i = 0; i < bits; i += 16) {
    const r = BigInt(Math.floor(Math.random() * 65536));
    res = (res << 16n) | r;
  }
  const mask = (1n << BigInt(bits)) - 1n;
  setPreset(res & mask);
}

// 复制某个进制的格式化结果（支持带前缀）
function copyRadixValue(key: string, radix: number, prefix: string) {
  let valStr = formatBigInt(currentVal.value, radix, hexUppercase.value);
  if (radix === 2 && binGrouping.value !== 'none') {
    valStr = groupDigits(valStr, binGrouping.value === 'nibble' ? 4 : 8);
  } else if (radix === 10 && decGrouping.value) {
    valStr = groupDigits(valStr, 3);
  }

  let full = valStr;
  if (showPrefix.value && prefix) {
    if (valStr.startsWith('-')) {
      full = '-' + prefix + valStr.slice(1);
    } else {
      full = prefix + valStr;
    }
  }
  triggerCopied(key, full);
}

// 初始化默认值
syncInputsFromValue();

// 自定义进制基数变动时重新计算
function onCustomRadixChange(newRadix: number) {
  customRadix.value = Math.max(2, Math.min(64, newRadix));
  customInput.value = formatBigInt(currentVal.value, customRadix.value, hexUppercase.value);
}

// 切换大写 Hex / 分组选项重新刷新展示
function onFormatOptionChange() {
  syncInputsFromValue();
}

// ==========================================
// 二进制位矩阵计算 (Interactive Bit Matrix)
// ==========================================
interface BitItem {
  index: number;
  isSet: boolean;
  weightLabel: string;
}

interface ByteRow {
  byteIndex: number;
  byteHex: string;
  byteDec: number;
  bits: BitItem[];
}

const bitRows = computed<ByteRow[]>(() => {
  const width = bitWidth.value;
  const numBytes = width / 8;
  const val = BigInt.asUintN(width, currentVal.value);
  const rows: ByteRow[] = [];

  for (let b = numBytes - 1; b >= 0; b--) {
    const shift = BigInt(b * 8);
    const byteVal = Number((val >> shift) & 0xffn);
    const bits: BitItem[] = [];

    for (let bitInByte = 7; bitInByte >= 0; bitInByte--) {
      const bitIndex = b * 8 + bitInByte;
      const bitWeight = 1n << BigInt(bitIndex);
      const isSet = (val & bitWeight) !== 0n;
      bits.push({
        index: bitIndex,
        isSet,
        weightLabel: `Bit ${bitIndex}: 2^${bitIndex} = ${bitWeight.toString(10)}`
      });
    }

    rows.push({
      byteIndex: b,
      byteHex: '0x' + byteVal.toString(16).padStart(2, '0').toUpperCase(),
      byteDec: byteVal,
      bits
    });
  }

  return rows;
});

// 点击单比特进行翻转
function toggleBit(index: number) {
  const mask = 1n << BigInt(index);
  currentVal.value = currentVal.value ^ mask;
  syncInputsFromValue();
}

// 位运算快捷功能
function bitwiseNot() {
  const width = BigInt(bitWidth.value);
  const max = (1n << width) - 1n;
  const unsigned = BigInt.asUintN(bitWidth.value, currentVal.value);
  currentVal.value = unsigned ^ max;
  syncInputsFromValue();
}

function bitwiseShl() {
  const width = bitWidth.value;
  const next = BigInt.asUintN(width, currentVal.value << 1n);
  currentVal.value = next;
  syncInputsFromValue();
}

function bitwiseShr() {
  const width = bitWidth.value;
  const next = BigInt.asUintN(width, currentVal.value >> 1n);
  currentVal.value = next;
  syncInputsFromValue();
}

function bitwiseFill() {
  const width = BigInt(bitWidth.value);
  currentVal.value = (1n << width) - 1n;
  syncInputsFromValue();
}

function bitwiseClear() {
  currentVal.value = 0n;
  syncInputsFromValue();
}

function bitwiseReverse() {
  const width = bitWidth.value;
  const val = BigInt.asUintN(width, currentVal.value);
  let res = 0n;
  for (let i = 0; i < width; i++) {
    if ((val & (1n << BigInt(i))) !== 0n) {
      res = res | (1n << BigInt(width - 1 - i));
    }
  }
  currentVal.value = res;
  syncInputsFromValue();
}

// ==========================================
// 整型类型与大小端序拆解 (Integer Types)
// ==========================================
const integerTypes = computed(() => {
  const v = currentVal.value;

  const u8 = Number(BigInt.asUintN(8, v));
  const i8 = Number(BigInt.asIntN(8, v));

  const u16 = Number(BigInt.asUintN(16, v));
  const i16 = Number(BigInt.asIntN(16, v));

  const u32 = Number(BigInt.asUintN(32, v));
  const i32 = Number(BigInt.asIntN(32, v));

  const u64 = BigInt.asUintN(64, v);
  const i64 = BigInt.asIntN(64, v);

  // 4 字节与 8 字节的大小端字节序
  const u32Val = BigInt.asUintN(32, v);
  const bytes4: number[] = [];
  for (let i = 0; i < 4; i++) {
    bytes4.push(Number((u32Val >> BigInt(i * 8)) & 0xffn));
  }
  const leHex4 = bytes4.map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase());
  const beHex4 = [...bytes4].reverse().map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase());

  const u64Val = BigInt.asUintN(64, v);
  const bytes8: number[] = [];
  for (let i = 0; i < 8; i++) {
    bytes8.push(Number((u64Val >> BigInt(i * 8)) & 0xffn));
  }
  const leHex8 = bytes8.map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase());
  const beHex8 = [...bytes8].reverse().map(b => '0x' + b.toString(16).padStart(2, '0').toUpperCase());

  return {
    u8,
    i8,
    u16,
    i16,
    u32,
    i32,
    u64: u64.toString(10),
    i64: i64.toString(10),
    beHex4,
    leHex4,
    beHex8,
    leHex8
  };
});

// ==========================================
// 字符映射 (ASCII / Text)
// ==========================================
const asciiCharInfo = computed(() => {
  const uval = BigInt.asUintN(32, currentVal.value);
  const code = Number(uval);

  let charDisplay = '';
  let isPrintable = false;

  if (code >= 32 && code <= 126) {
    charDisplay = String.fromCharCode(code);
    isPrintable = true;
  } else if (code === 9) {
    charDisplay = '\\t (Tab)';
  } else if (code === 10) {
    charDisplay = '\\n (LF)';
  } else if (code === 13) {
    charDisplay = '\\r (CR)';
  } else if (code === 0) {
    charDisplay = '\\0 (NUL)';
  } else if (code > 127 && code <= 0x10ffff) {
    try {
      charDisplay = String.fromCodePoint(code);
      isPrintable = true;
    } catch {
      charDisplay = 'N/A';
    }
  } else {
    charDisplay = 'N/A';
  }

  return { code, charDisplay, isPrintable };
});
</script>

<template>
  <ToolContainer
    toolId="base-converter"
    nameKey="tools.baseConverter.name"
    descKey="tools.baseConverter.desc"
    :icon="Calculator"
    :wide="true"
    :fullHeight="true"
  >
    <div class="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-white dark:bg-zinc-900">
      <!-- 顶部控制条：预设与格式选项 -->
      <div class="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-900/60 shrink-0 flex flex-col gap-3">
        <!-- 常用数值预设 Buttons -->
        <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1 select-none">
              {{ t('tools.baseConverter.presets') }}:
            </span>

            <button
              type="button"
              @click="setPreset(0n)"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
            >
              0
            </button>

            <button
              type="button"
              @click="setPreset(255n)"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
            >
              255 (0xFF)
            </button>

            <button
              type="button"
              @click="setPreset(65535n)"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
            >
              65535 (u16)
            </button>

            <button
              type="button"
              @click="setPreset(2147483647n)"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
            >
              2147483647 (i32)
            </button>

            <button
              type="button"
              @click="setPreset(4294967295n)"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
            >
              4294967295 (u32)
            </button>

            <button
              type="button"
              @click="setPreset(18446744073709551615n)"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
            >
              2^64-1 (u64)
            </button>
          </div>

          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              @click="setRandom(32)"
              class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-900/50 transition-colors cursor-pointer"
              :title="t('tools.baseConverter.random')"
            >
              <Shuffle class="w-3.5 h-3.5" />
              <span>{{ t('tools.baseConverter.random') }}</span>
            </button>

            <button
              type="button"
              @click="setPreset(0n)"
              class="p-1.5 rounded-lg text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
              :title="t('tools.baseConverter.clear')"
            >
              <RotateCcw class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 格式选项配置栏 -->
        <div class="flex items-center justify-between flex-wrap gap-3 pt-2 border-t border-zinc-200/70 dark:border-zinc-800 text-xs">
          <div class="flex items-center gap-4 flex-wrap">
            <!-- 显示前缀开关 -->
            <label class="flex items-center gap-1.5 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
              <input
                v-model="showPrefix"
                type="checkbox"
                class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>{{ t('tools.baseConverter.showPrefix') }}</span>
            </label>

            <!-- 大写 Hex 开关 -->
            <label class="flex items-center gap-1.5 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
              <input
                v-model="hexUppercase"
                type="checkbox"
                @change="onFormatOptionChange"
                class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>{{ t('tools.baseConverter.uppercaseHex') }}</span>
            </label>

            <!-- 十进制千分位分隔 -->
            <label class="flex items-center gap-1.5 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
              <input
                v-model="decGrouping"
                type="checkbox"
                @change="onFormatOptionChange"
                class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-3.5 h-3.5"
              />
              <span>{{ t('tools.baseConverter.decGrouping') }}</span>
            </label>
          </div>

          <!-- 二进制分组模式 -->
          <div class="flex items-center gap-1.5 text-xs">
            <span class="text-zinc-500 dark:text-zinc-400">{{ t('tools.baseConverter.binGrouping') }}:</span>
            <select
              v-model="binGrouping"
              @change="onFormatOptionChange"
              class="px-2 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer text-xs"
            >
              <option value="none">{{ t('tools.baseConverter.groupNone') }}</option>
              <option value="nibble">{{ t('tools.baseConverter.groupNibble') }}</option>
              <option value="byte">{{ t('tools.baseConverter.groupByte') }}</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 中间核心进制卡片网格 (双栏响应式对齐) -->
      <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          <!-- 1. 二进制 (Binary) -->
          <div
            class="p-3.5 rounded-2xl border transition-all bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-2"
            :class="inputErrors.bin ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10' : 'border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-850'"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded font-mono font-bold bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300">
                  BIN (2)
                </span>
                <span class="font-semibold text-zinc-700 dark:text-zinc-300">{{ t('tools.baseConverter.radix2') }}</span>
              </div>
              <button
                type="button"
                @click="copyRadixValue('bin', 2, '0b')"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Check v-if="copiedKey === 'bin'" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedKey === 'bin' ? t('common.copied') : t('common.copy') }}</span>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="showPrefix" class="font-mono text-xs font-bold text-zinc-400 select-none">0b</span>
              <input
                v-model="binInput"
                type="text"
                @input="onFieldInput('bin', binInput, 2)"
                placeholder="01010101"
                class="flex-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none bg-transparent"
                spellcheck="false"
              />
            </div>
          </div>

          <!-- 2. 八进制 (Octal) -->
          <div
            class="p-3.5 rounded-2xl border transition-all bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-2"
            :class="inputErrors.oct ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10' : 'border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-850'"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded font-mono font-bold bg-amber-100 dark:bg-amber-900/50 text-amber-700 dark:text-amber-300">
                  OCT (8)
                </span>
                <span class="font-semibold text-zinc-700 dark:text-zinc-300">{{ t('tools.baseConverter.radix8') }}</span>
              </div>
              <button
                type="button"
                @click="copyRadixValue('oct', 8, '0o')"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Check v-if="copiedKey === 'oct'" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedKey === 'oct' ? t('common.copied') : t('common.copy') }}</span>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="showPrefix" class="font-mono text-xs font-bold text-zinc-400 select-none">0o</span>
              <input
                v-model="octInput"
                type="text"
                @input="onFieldInput('oct', octInput, 8)"
                placeholder="755"
                class="flex-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none bg-transparent"
                spellcheck="false"
              />
            </div>
          </div>

          <!-- 3. 十进制 (Decimal) -->
          <div
            class="p-3.5 rounded-2xl border transition-all bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-2"
            :class="inputErrors.dec ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10' : 'border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-850'"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded font-mono font-bold bg-emerald-100 dark:bg-emerald-900/50 text-emerald-700 dark:text-emerald-300">
                  DEC (10)
                </span>
                <span class="font-semibold text-zinc-700 dark:text-zinc-300">{{ t('tools.baseConverter.radix10') }}</span>
              </div>
              <button
                type="button"
                @click="copyRadixValue('dec', 10, '')"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Check v-if="copiedKey === 'dec'" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedKey === 'dec' ? t('common.copied') : t('common.copy') }}</span>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-bold text-zinc-400 select-none">#</span>
              <input
                v-model="decInput"
                type="text"
                @input="onFieldInput('dec', decInput, 10)"
                placeholder="42"
                class="flex-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none bg-transparent"
                spellcheck="false"
              />
            </div>
          </div>

          <!-- 4. 十六进制 (Hexadecimal) -->
          <div
            class="p-3.5 rounded-2xl border transition-all bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-2"
            :class="inputErrors.hex ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10' : 'border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-850'"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded font-mono font-bold bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300">
                  HEX (16)
                </span>
                <span class="font-semibold text-zinc-700 dark:text-zinc-300">{{ t('tools.baseConverter.radix16') }}</span>
              </div>
              <button
                type="button"
                @click="copyRadixValue('hex', 16, '0x')"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Check v-if="copiedKey === 'hex'" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedKey === 'hex' ? t('common.copied') : t('common.copy') }}</span>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span v-if="showPrefix" class="font-mono text-xs font-bold text-zinc-400 select-none">0x</span>
              <input
                v-model="hexInput"
                type="text"
                @input="onFieldInput('hex', hexInput, 16)"
                placeholder="2A"
                class="flex-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none bg-transparent uppercase"
                spellcheck="false"
              />
            </div>
          </div>

          <!-- 5. 32 进制 (Base32) -->
          <div
            class="p-3.5 rounded-2xl border transition-all bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-2"
            :class="inputErrors.base32 ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10' : 'border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-850'"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded font-mono font-bold bg-teal-100 dark:bg-teal-900/50 text-teal-700 dark:text-teal-300">
                  BASE32 (32)
                </span>
                <span class="font-semibold text-zinc-700 dark:text-zinc-300">{{ t('tools.baseConverter.radix32') }}</span>
              </div>
              <button
                type="button"
                @click="copyRadixValue('base32', 32, '')"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Check v-if="copiedKey === 'base32'" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedKey === 'base32' ? t('common.copied') : t('common.copy') }}</span>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-bold text-zinc-400 select-none">b32</span>
              <input
                v-model="base32Input"
                type="text"
                @input="onFieldInput('base32', base32Input, 32)"
                placeholder="1A"
                class="flex-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none bg-transparent"
                spellcheck="false"
              />
            </div>
          </div>

          <!-- 6. 36 进制 (Base36) -->
          <div
            class="p-3.5 rounded-2xl border transition-all bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-2"
            :class="inputErrors.base36 ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10' : 'border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-850'"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded font-mono font-bold bg-cyan-100 dark:bg-cyan-900/50 text-cyan-700 dark:text-cyan-300">
                  BASE36 (36)
                </span>
                <span class="font-semibold text-zinc-700 dark:text-zinc-300">{{ t('tools.baseConverter.radix36') }}</span>
              </div>
              <button
                type="button"
                @click="copyRadixValue('base36', 36, '')"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Check v-if="copiedKey === 'base36'" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedKey === 'base36' ? t('common.copied') : t('common.copy') }}</span>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-bold text-zinc-400 select-none">b36</span>
              <input
                v-model="base36Input"
                type="text"
                @input="onFieldInput('base36', base36Input, 36)"
                placeholder="16"
                class="flex-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none bg-transparent"
                spellcheck="false"
              />
            </div>
          </div>

          <!-- 7. 62 进制 (Base62) -->
          <div
            class="p-3.5 rounded-2xl border transition-all bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-2"
            :class="inputErrors.base62 ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10' : 'border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-850'"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded font-mono font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300">
                  BASE62 (62)
                </span>
                <span class="font-semibold text-zinc-700 dark:text-zinc-300">{{ t('tools.baseConverter.radix62') }}</span>
              </div>
              <button
                type="button"
                @click="copyRadixValue('base62', 62, '')"
                class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
              >
                <Check v-if="copiedKey === 'base62'" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5" />
                <span>{{ copiedKey === 'base62' ? t('common.copied') : t('common.copy') }}</span>
              </button>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-bold text-zinc-400 select-none">b62</span>
              <input
                v-model="base62Input"
                type="text"
                @input="onFieldInput('base62', base62Input, 62)"
                placeholder="G"
                class="flex-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none bg-transparent"
                spellcheck="false"
              />
            </div>
          </div>

          <!-- 8. 自定义进制 (Custom Base 2 ~ 64) -->
          <div
            class="p-3.5 rounded-2xl border transition-all bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-2"
            :class="inputErrors.custom ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10' : 'border-zinc-200 dark:border-zinc-800 focus-within:border-blue-500 focus-within:bg-white dark:focus-within:bg-zinc-850'"
          >
            <div class="flex items-center justify-between text-xs">
              <div class="flex items-center gap-2">
                <span class="px-2 py-0.5 rounded font-mono font-bold bg-zinc-200 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200">
                  BASE ({{ customRadix }})
                </span>
                <span class="font-semibold text-zinc-700 dark:text-zinc-300">
                  {{ t('tools.baseConverter.radixCustom', { radix: customRadix }) }}
                </span>
              </div>
              <div class="flex items-center gap-2">
                <input
                  v-model.number="customRadix"
                  type="range"
                  min="2"
                  max="64"
                  @input="onCustomRadixChange(customRadix)"
                  class="w-20 accent-blue-600 cursor-pointer hidden sm:block"
                />
                <button
                  type="button"
                  @click="copyRadixValue('custom', customRadix, '')"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 transition-colors cursor-pointer"
                >
                  <Check v-if="copiedKey === 'custom'" class="w-3.5 h-3.5 text-emerald-500" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  <span>{{ copiedKey === 'custom' ? t('common.copied') : t('common.copy') }}</span>
                </button>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <span class="font-mono text-xs font-bold text-zinc-400 select-none">R{{ customRadix }}</span>
              <input
                v-model="customInput"
                type="text"
                @input="onFieldInput('custom', customInput, customRadix)"
                placeholder="Custom base value..."
                class="flex-1 font-mono text-sm font-semibold text-zinc-900 dark:text-zinc-100 outline-none bg-transparent"
                spellcheck="false"
              />
            </div>
          </div>
        </div>

        <!-- 错误提示横幅 -->
        <div
          v-if="Object.values(inputErrors).some(Boolean)"
          class="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2"
        >
          <span>{{ t('tools.baseConverter.invalidInput') }}</span>
        </div>

        <!-- 底部深度检查分析工作区 (Tabbed) -->
        <div class="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden mt-2">
          <!-- Tab 标头 -->
          <div class="px-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900 flex items-center justify-between flex-wrap gap-2 text-xs font-semibold">
            <div class="flex items-center gap-1 -mb-px">
              <button
                type="button"
                @click="activeTab = 'matrix'"
                class="px-3.5 py-3 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5"
                :class="activeTab === 'matrix' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
              >
                <Binary class="w-4 h-4" />
                <span>{{ t('tools.baseConverter.bitMatrixTab') }}</span>
              </button>

              <button
                type="button"
                @click="activeTab = 'types'"
                class="px-3.5 py-3 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5"
                :class="activeTab === 'types' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
              >
                <Cpu class="w-4 h-4" />
                <span>{{ t('tools.baseConverter.intTypesTab') }}</span>
              </button>

              <button
                type="button"
                @click="activeTab = 'ascii'"
                class="px-3.5 py-3 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5"
                :class="activeTab === 'ascii' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
              >
                <ArrowLeftRight class="w-4 h-4" />
                <span>{{ t('tools.baseConverter.charMapTab') }}</span>
              </button>
            </div>

            <!-- 位宽选择器 (用于位矩阵) -->
            <div v-if="activeTab === 'matrix'" class="flex items-center gap-1 py-1.5">
              <span class="text-zinc-400 text-[11px] mr-1">{{ t('tools.baseConverter.bitWidth') }}:</span>
              <div class="inline-flex rounded-lg bg-zinc-200/60 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700 text-xs font-mono">
                <button
                  v-for="w in [8, 16, 32, 64]"
                  :key="w"
                  type="button"
                  @click="bitWidth = w as any"
                  class="px-2 py-0.5 rounded text-[11px] font-medium transition-all cursor-pointer"
                  :class="bitWidth === w ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs' : 'text-zinc-600 dark:text-zinc-400'"
                >
                  {{ w }}b
                </button>
              </div>
            </div>
          </div>

          <!-- TAB 1: 二进制位图矩阵 (Interactive Bit Matrix) -->
          <div v-if="activeTab === 'matrix'" class="p-4 sm:p-5 flex flex-col gap-4">
            <!-- 位操作快捷工具栏 -->
            <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  @click="bitwiseNot"
                  class="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 font-mono transition-colors cursor-pointer"
                >
                  {{ t('tools.baseConverter.bitNot') }}
                </button>
                <button
                  type="button"
                  @click="bitwiseShl"
                  class="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 font-mono transition-colors cursor-pointer"
                >
                  {{ t('tools.baseConverter.bitShl') }}
                </button>
                <button
                  type="button"
                  @click="bitwiseShr"
                  class="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 font-mono transition-colors cursor-pointer"
                >
                  {{ t('tools.baseConverter.bitShr') }}
                </button>
                <button
                  type="button"
                  @click="bitwiseReverse"
                  class="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 font-mono transition-colors cursor-pointer"
                >
                  {{ t('tools.baseConverter.bitReverse') }}
                </button>
              </div>

              <div class="flex items-center gap-1.5">
                <button
                  type="button"
                  @click="bitwiseFill"
                  class="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 font-mono transition-colors cursor-pointer"
                >
                  {{ t('tools.baseConverter.bitFill1') }}
                </button>
                <button
                  type="button"
                  @click="bitwiseClear"
                  class="px-2.5 py-1 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-750 font-mono transition-colors cursor-pointer"
                >
                  {{ t('tools.baseConverter.bitClear0') }}
                </button>
              </div>
            </div>

            <!-- 可视化比特矩阵列表 -->
            <div class="space-y-3 font-mono">
              <div
                v-for="row in bitRows"
                :key="row.byteIndex"
                class="p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
              >
                <!-- 字节标头 -->
                <div class="flex items-center gap-2 text-xs shrink-0 select-none">
                  <span class="font-bold text-zinc-700 dark:text-zinc-300">Byte {{ row.byteIndex }}</span>
                  <span class="px-1.5 py-0.5 rounded text-[11px] bg-zinc-200/60 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                    {{ row.byteHex }}
                  </span>
                  <span class="text-zinc-400 text-[11px]">({{ row.byteDec }})</span>
                </div>

                <!-- 单字节 8 比特按键 -->
                <div class="grid grid-cols-8 gap-1.5 w-full sm:w-auto">
                  <button
                    v-for="bit in row.bits"
                    :key="bit.index"
                    type="button"
                    @click="toggleBit(bit.index)"
                    :title="bit.weightLabel"
                    class="h-9 sm:w-9 rounded-lg border flex flex-col items-center justify-center transition-all cursor-pointer select-none"
                    :class="[
                      bit.isSet
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xs font-bold'
                        : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-400 dark:text-zinc-500 hover:border-blue-400 hover:text-blue-500'
                    ]"
                  >
                    <span class="text-xs font-bold leading-none">{{ bit.isSet ? '1' : '0' }}</span>
                    <span class="text-[9px] opacity-70 leading-none mt-0.5">{{ bit.index }}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 2: 有符号 / 无符号整型与端序解析 (Integer Types & Endianness) -->
          <div v-else-if="activeTab === 'types'" class="p-4 sm:p-5 space-y-5">
            <!-- 8/16/32/64 位数据类型映射表 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <!-- 8-bit -->
              <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span class="font-bold text-zinc-900 dark:text-zinc-100">8-bit Integer</span>
                <div class="flex items-center justify-between font-mono">
                  <span class="text-zinc-500">int8:</span>
                  <span class="font-bold text-zinc-800 dark:text-zinc-200 select-all">{{ integerTypes.i8 }}</span>
                </div>
                <div class="flex items-center justify-between font-mono">
                  <span class="text-zinc-500">uint8:</span>
                  <span class="font-bold text-blue-600 dark:text-blue-400 select-all">{{ integerTypes.u8 }}</span>
                </div>
              </div>

              <!-- 16-bit -->
              <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span class="font-bold text-zinc-900 dark:text-zinc-100">16-bit Integer</span>
                <div class="flex items-center justify-between font-mono">
                  <span class="text-zinc-500">int16:</span>
                  <span class="font-bold text-zinc-800 dark:text-zinc-200 select-all">{{ integerTypes.i16 }}</span>
                </div>
                <div class="flex items-center justify-between font-mono">
                  <span class="text-zinc-500">uint16:</span>
                  <span class="font-bold text-blue-600 dark:text-blue-400 select-all">{{ integerTypes.u16 }}</span>
                </div>
              </div>

              <!-- 32-bit -->
              <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span class="font-bold text-zinc-900 dark:text-zinc-100">32-bit Integer</span>
                <div class="flex items-center justify-between font-mono">
                  <span class="text-zinc-500">int32:</span>
                  <span class="font-bold text-zinc-800 dark:text-zinc-200 select-all">{{ integerTypes.i32 }}</span>
                </div>
                <div class="flex items-center justify-between font-mono">
                  <span class="text-zinc-500">uint32:</span>
                  <span class="font-bold text-blue-600 dark:text-blue-400 select-all">{{ integerTypes.u32 }}</span>
                </div>
              </div>

              <!-- 64-bit -->
              <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col gap-2">
                <span class="font-bold text-zinc-900 dark:text-zinc-100">64-bit Integer</span>
                <div class="flex items-center justify-between font-mono">
                  <span class="text-zinc-500">int64:</span>
                  <span class="font-bold text-zinc-800 dark:text-zinc-200 select-all truncate max-w-[140px]" :title="integerTypes.i64">{{ integerTypes.i64 }}</span>
                </div>
                <div class="flex items-center justify-between font-mono">
                  <span class="text-zinc-500">uint64:</span>
                  <span class="font-bold text-blue-600 dark:text-blue-400 select-all truncate max-w-[140px]" :title="integerTypes.u64">{{ integerTypes.u64 }}</span>
                </div>
              </div>
            </div>

            <!-- 端序字节分解 (Endianness breakdown) -->
            <div class="space-y-3 pt-2">
              <h4 class="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                {{ isZh ? '字节端序 (Endianness)' : 'Byte Endianness' }}
              </h4>

              <div class="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <!-- 32 位端序 -->
                <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/20 space-y-2">
                  <span class="text-zinc-500 font-sans font-semibold text-[11px]">32-bit Bytes</span>
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-zinc-400 text-[11px]">{{ t('tools.baseConverter.bigEndian') }}:</span>
                    <span class="font-bold text-zinc-800 dark:text-zinc-200 select-all">
                      {{ integerTypes.beHex4.join(' ') }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-zinc-400 text-[11px]">{{ t('tools.baseConverter.littleEndian') }}:</span>
                    <span class="font-bold text-zinc-800 dark:text-zinc-200 select-all">
                      {{ integerTypes.leHex4.join(' ') }}
                    </span>
                  </div>
                </div>

                <!-- 64 位端序 -->
                <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/20 space-y-2">
                  <span class="text-zinc-500 font-sans font-semibold text-[11px]">64-bit Bytes</span>
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-zinc-400 text-[11px]">{{ t('tools.baseConverter.bigEndian') }}:</span>
                    <span class="font-bold text-zinc-800 dark:text-zinc-200 select-all text-[11px]">
                      {{ integerTypes.beHex8.join(' ') }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between gap-2">
                    <span class="text-zinc-400 text-[11px]">{{ t('tools.baseConverter.littleEndian') }}:</span>
                    <span class="font-bold text-zinc-800 dark:text-zinc-200 select-all text-[11px]">
                      {{ integerTypes.leHex8.join(' ') }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB 3: ASCII 字符与单字节映射 (Char & Encoding Map) -->
          <div v-else-if="activeTab === 'ascii'" class="p-4 sm:p-5 flex flex-col gap-3 text-xs">
            <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/40 dark:bg-zinc-800/20 flex items-center justify-between">
              <div class="flex items-center gap-3">
                <div class="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono font-bold text-xl flex items-center justify-center">
                  {{ asciiCharInfo.isPrintable ? asciiCharInfo.charDisplay : '?' }}
                </div>
                <div>
                  <h4 class="font-bold text-zinc-900 dark:text-zinc-100">{{ t('tools.baseConverter.asciiChar') }}</h4>
                  <p class="text-zinc-400 text-[11px] font-mono mt-0.5">
                    Code: {{ asciiCharInfo.code }} (0x{{ asciiCharInfo.code.toString(16).toUpperCase() }})
                  </p>
                </div>
              </div>

              <div class="text-right">
                <span class="font-mono font-semibold text-zinc-700 dark:text-zinc-300">
                  {{ asciiCharInfo.charDisplay }}
                </span>
                <p class="text-[11px] text-zinc-400 mt-0.5">
                  {{ asciiCharInfo.isPrintable ? 'Printable Char' : t('tools.baseConverter.notPrintable') }}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
