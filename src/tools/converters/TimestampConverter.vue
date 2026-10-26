<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { Clock, Play, Pause, Calendar, RefreshCw } from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CopyButton from '../../components/common/CopyButton.vue';

const { t } = useI18n();

// 实时时钟
const now = ref(new Date());
const isClockRunning = ref(true);
let timer: any = null;

const currentSec = computed(() => Math.floor(now.value.getTime() / 1000).toString());
const currentMs = computed(() => now.value.getTime().toString());
const currentFormatted = computed(() => formatDateTime(now.value));

function toggleClock() {
  isClockRunning.value = !isClockRunning.value;
}

// 时间戳转日期时间部分
const inputTimestamp = ref<string>('');
const tsUnit = ref<'sec' | 'ms'>('sec');

interface TimeConvertResult {
  local: string;
  utc: string;
  iso: string;
  error?: string;
}

const convertedResults = computed<TimeConvertResult | null>(() => {
  const raw = inputTimestamp.value.trim();
  if (!raw) return null;

  let val = Number(raw);
  if (isNaN(val)) return { error: 'Invalid numeric timestamp', local: '', utc: '', iso: '' };

  // 智能识别：如果是 10 位，或者明确选了秒
  let date: Date;
  if (tsUnit.value === 'sec') {
    date = new Date(val * 1000);
  } else {
    date = new Date(val);
  }

  if (isNaN(date.getTime())) {
    return { error: 'Invalid Date', local: '', utc: '', iso: '' };
  }

  return {
    local: formatDateTime(date),
    utc: date.toUTCString(),
    iso: date.toISOString(),
  };
});

// 日期时间转时间戳部分
const inputDateStr = ref<string>('');

interface DateToTsResult {
  sec: string;
  ms: string;
  error?: string;
}

const dateToTsResult = computed<DateToTsResult | null>(() => {
  if (!inputDateStr.value) return null;
  const d = new Date(inputDateStr.value);
  if (isNaN(d.getTime())) return { error: 'Invalid date format', sec: '', ms: '' };
  return {
    sec: Math.floor(d.getTime() / 1000).toString(),
    ms: d.getTime().toString()
  };
});

function formatDateTime(d: Date): string {
  const pad = (n: number) => n.toString().padStart(2, '0');
  const y = d.getFullYear();
  const m = pad(d.getMonth() + 1);
  const day = pad(d.getDate());
  const h = pad(d.getHours());
  const min = pad(d.getMinutes());
  const s = pad(d.getSeconds());
  return `${y}-${m}-${day} ${h}:${min}:${s}`;
}

function setToCurrentTimestamp() {
  inputTimestamp.value = currentSec.value;
  tsUnit.value = 'sec';
}

function setToCurrentDate() {
  const d = new Date();
  inputDateStr.value = formatDateTime(d);
}

onMounted(() => {
  timer = setInterval(() => {
    if (isClockRunning.value) {
      now.value = new Date();
    }
  }, 1000);

  setToCurrentTimestamp();
  setToCurrentDate();
});

onUnmounted(() => {
  if (timer) clearInterval(timer);
});
</script>

<template>
  <ToolContainer
    toolId="timestamp"
    nameKey="tools.timestamp.name"
    descKey="tools.timestamp.desc"
    :icon="Clock"
  >
    <!-- 顶部当前动态时钟卡片 -->
    <div class="p-5 rounded-2xl border border-blue-200/60 dark:border-blue-900/40 bg-gradient-to-r from-blue-50/50 via-indigo-50/20 to-sky-50/40 dark:from-blue-950/20 dark:via-zinc-900 dark:to-indigo-950/20 shadow-xs flex flex-wrap items-center justify-between gap-4">
      <div class="flex items-center gap-3.5">
        <div class="w-10 h-10 rounded-xl bg-blue-600 dark:bg-blue-500 text-white flex items-center justify-center shadow-sm">
          <Clock class="w-5 h-5 animate-pulse" />
        </div>
        <div>
          <div class="text-xs font-semibold uppercase tracking-wider text-blue-600 dark:text-blue-400">
            {{ t('tools.timestamp.currentTimestamp') }}
          </div>
          <div class="flex items-center gap-2 mt-0.5">
            <span class="font-mono text-xl font-bold text-zinc-900 dark:text-zinc-100">
              {{ currentSec }}
            </span>
            <span class="text-xs text-zinc-400 font-mono">(s)</span>
            <span class="text-zinc-300 dark:text-zinc-700">/</span>
            <span class="font-mono text-base font-semibold text-zinc-700 dark:text-zinc-300">
              {{ currentMs }}
            </span>
            <span class="text-xs text-zinc-400 font-mono">(ms)</span>
          </div>
          <div class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {{ currentFormatted }}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2">
        <CopyButton :text="currentSec" :label="t('common.copy') + ' (s)'" variant="secondary" />
        <CopyButton :text="currentMs" :label="t('common.copy') + ' (ms)'" variant="secondary" />
        <button
          type="button"
          @click="toggleClock"
          class="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
          :title="isClockRunning ? 'Pause' : 'Resume'"
        >
          <Pause v-if="isClockRunning" class="w-4 h-4" />
          <Play v-else class="w-4 h-4 text-emerald-500" />
        </button>
      </div>
    </div>

    <!-- 核心卡片网格 -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
      <!-- 卡片1: 时间戳转日期 -->
      <div class="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 font-medium text-sm text-zinc-900 dark:text-zinc-100">
            <Calendar class="w-4 h-4 text-blue-500" />
            <span>{{ t('tools.timestamp.toDateTime') }}</span>
          </div>
          <button
            type="button"
            @click="setToCurrentTimestamp"
            class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            {{ t('tools.timestamp.now') }}
          </button>
        </div>

        <!-- 输入区域 -->
        <div class="flex items-center gap-2">
          <input
            v-model="inputTimestamp"
            type="text"
            :placeholder="t('tools.timestamp.toDatePlaceholder')"
            class="flex-1 px-3 py-2 text-sm font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500"
          />
          <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700">
            <button
              type="button"
              @click="tsUnit = 'sec'"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer"
              :class="tsUnit === 'sec' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400'"
            >
              秒 (s)
            </button>
            <button
              type="button"
              @click="tsUnit = 'ms'"
              class="px-2.5 py-1 text-xs font-medium rounded-md transition-all cursor-pointer"
              :class="tsUnit === 'ms' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400'"
            >
              毫秒 (ms)
            </button>
          </div>
        </div>

        <!-- 转换展示结果 -->
        <div v-if="convertedResults" class="flex flex-col gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div v-if="convertedResults.error" class="text-xs text-rose-500">
            {{ convertedResults.error }}
          </div>
          <template v-else>
            <div class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div>
                <div class="text-[11px] text-zinc-400 uppercase">{{ t('tools.timestamp.localTime') }}</div>
                <div class="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">{{ convertedResults.local }}</div>
              </div>
              <CopyButton :text="convertedResults.local" variant="ghost" />
            </div>

            <div class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div>
                <div class="text-[11px] text-zinc-400 uppercase">{{ t('tools.timestamp.isoTime') }}</div>
                <div class="font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">{{ convertedResults.iso }}</div>
              </div>
              <CopyButton :text="convertedResults.iso" variant="ghost" />
            </div>

            <div class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div>
                <div class="text-[11px] text-zinc-400 uppercase">{{ t('tools.timestamp.utcTime') }}</div>
                <div class="font-mono text-xs font-medium text-zinc-700 dark:text-zinc-300">{{ convertedResults.utc }}</div>
              </div>
              <CopyButton :text="convertedResults.utc" variant="ghost" />
            </div>
          </template>
        </div>
      </div>

      <!-- 卡片2: 日期时间转时间戳 -->
      <div class="p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-4">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2 font-medium text-sm text-zinc-900 dark:text-zinc-100">
            <RefreshCw class="w-4 h-4 text-indigo-500" />
            <span>{{ t('tools.timestamp.toTimestamp') }}</span>
          </div>
          <button
            type="button"
            @click="setToCurrentDate"
            class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
          >
            {{ t('tools.timestamp.now') }}
          </button>
        </div>

        <!-- 输入区域 -->
        <div>
          <input
            v-model="inputDateStr"
            type="text"
            placeholder="YYYY-MM-DD HH:mm:ss 或任意 ISO 时间格式"
            class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500"
          />
        </div>

        <!-- 转换展示结果 -->
        <div v-if="dateToTsResult" class="flex flex-col gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <div v-if="dateToTsResult.error" class="text-xs text-rose-500">
            {{ dateToTsResult.error }}
          </div>
          <template v-else>
            <div class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div>
                <div class="text-[11px] text-zinc-400 uppercase">秒时间戳 (Seconds / 10位)</div>
                <div class="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">{{ dateToTsResult.sec }}</div>
              </div>
              <CopyButton :text="dateToTsResult.sec" variant="ghost" />
            </div>

            <div class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
              <div>
                <div class="text-[11px] text-zinc-400 uppercase">毫秒时间戳 (Milliseconds / 13位)</div>
                <div class="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-200">{{ dateToTsResult.ms }}</div>
              </div>
              <CopyButton :text="dateToTsResult.ms" variant="ghost" />
            </div>
          </template>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
