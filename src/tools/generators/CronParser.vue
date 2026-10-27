<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  CalendarClock,
  Sparkles,
  Copy,
  Check,
  HelpCircle,
  Play,
  RotateCcw,
  Lightbulb
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';

const { t, locale } = useI18n();

const minuteOptions: SelectOption[] = [
  { label: '每一分钟 (*)', value: '*' },
  { label: '整点 00 分 (0)', value: '0' },
  { label: '每隔 5 分钟 (*/5)', value: '*/5' },
  { label: '每隔 10 分钟 (*/10)', value: '*/10' },
  { label: '每隔 15 分钟 (*/15)', value: '*/15' },
  { label: '每隔 30 分钟 (*/30)', value: '*/30' },
  { label: '0 和 30 分 (0,30)', value: '0,30' }
];

const hourOptions: SelectOption[] = [
  { label: '每一小时 (*)', value: '*' },
  { label: '午夜 00:00 (0)', value: '0' },
  { label: '早上 08:00 (8)', value: '8' },
  { label: '早晨 09:00 (9)', value: '9' },
  { label: '中午 12:00 (12)', value: '12' },
  { label: '下午 18:00 (18)', value: '18' },
  { label: '晚上 23:00 (23)', value: '23' },
  { label: '每隔 2 小时 (*/2)', value: '*/2' },
  { label: '每隔 4 小时 (*/4)', value: '*/4' },
  { label: '工作时间 (9-18)', value: '9-18' }
];

const dayOptions: SelectOption[] = [
  { label: '每天 (*)', value: '*' },
  { label: '每月 1 号 (1)', value: '1' },
  { label: '每月 15 号 (15)', value: '15' },
  { label: '每月 1 和 15 号 (1,15)', value: '1,15' },
  { label: '每隔 2 天 (*/2)', value: '*/2' }
];

const monthOptions: SelectOption[] = [
  { label: '每个月 (*)', value: '*' },
  { label: '一月 (1)', value: '1' },
  { label: '每季度首月 (1,4,7,10)', value: '1,4,7,10' },
  { label: '年中与年末 (6,12)', value: '6,12' }
];

const weekOptions: SelectOption[] = [
  { label: '每天 (*)', value: '*' },
  { label: '工作日 (周一至周五 1-5)', value: '1-5' },
  { label: '周末 (周六和周日 0,6)', value: '0,6' },
  { label: '仅周一 (1)', value: '1' },
  { label: '仅周五 (5)', value: '5' }
];

// 默认 5 位 Cron 表达式（每周一至周五 09:00）
const cronExpression = ref('0 9 * * 1-5');
const includeSeconds = ref(false);
const activeTab = ref<'presets' | 'builder' | 'nextRuns'>('presets');
const copiedExpr = ref(false);
const copiedExplain = ref(false);

const MONTH_NAMES: Record<string, number> = {
  JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6,
  JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12
};
const DAY_NAMES: Record<string, number> = {
  SUN: 0, MON: 1, TUE: 2, WED: 3, THU: 4, FRI: 5, SAT: 6
};

// 预设模板库
const presetGroups = [
  {
    category: '高频执行 (Minutes)',
    items: [
      { name: '每分钟执行一次', expr: '* * * * *', desc: '每分钟的第 00 秒' },
      { name: '每 5 分钟执行一次', expr: '*/5 * * * *', desc: '0, 5, 10, 15, 20...' },
      { name: '每 15 分钟执行一次', expr: '*/15 * * * *', desc: '0, 15, 30, 45 分' },
      { name: '每 30 分钟执行一次', expr: '*/30 * * * *', desc: '0, 30 分' }
    ]
  },
  {
    category: '整点与周期 (Hourly)',
    items: [
      { name: '每小时整点', expr: '0 * * * *', desc: '每小时 00 分 00 秒' },
      { name: '每 2 小时整点', expr: '0 */2 * * *', desc: '偶数小时整点' },
      { name: '每 4 小时整点', expr: '0 */4 * * *', desc: '0, 4, 8, 12, 16, 20 点' },
      { name: '每 6 小时整点', expr: '0 */6 * * *', desc: '0, 6, 12, 18 点' }
    ]
  },
  {
    category: '每日与工作日 (Daily & Workdays)',
    items: [
      { name: '工作日 09:00 (周一至周五)', expr: '0 9 * * 1-5', desc: '工作日早晨上班时' },
      { name: '工作日 18:00 (周一至周五)', expr: '0 18 * * 1-5', desc: '工作日傍晚下班时' },
      { name: '每天凌晨 00:00 (午夜)', expr: '0 0 * * *', desc: '跨天批处理任务' },
      { name: '每天早上 08:00', expr: '0 8 * * *', desc: '早间提醒/报表' },
      { name: '每天中午 12:00', expr: '0 12 * * *', desc: '午间定时任务' },
      { name: '每天晚上 23:00', expr: '0 23 * * *', desc: '晚间数据归档' }
    ]
  },
  {
    category: '每周、每月与季度 (Weekly & Monthly)',
    items: [
      { name: '每周一凌晨 00:00', expr: '0 0 * * 1', desc: '周常重置与汇总' },
      { name: '每周日晚上 23:00', expr: '0 23 * * 0', desc: '周末数据备份' },
      { name: '每月 1 号凌晨 00:00', expr: '0 0 1 * *', desc: '月度账单/统计' },
      { name: '每月 15 号中午 12:00', expr: '0 12 15 * *', desc: '月中任务' },
      { name: '每季度首日 0 点', expr: '0 0 1 1,4,7,10 *', desc: '季初报表' }
    ]
  }
];

// 解析单个字段的取值集合
function parseField(field: string, min: number, max: number, nameMap: Record<string, number> = {}): Set<number> {
  const allowed = new Set<number>();
  const normalized = field.toUpperCase().replace(/[A-Z]{3}/g, m => nameMap[m] !== undefined ? String(nameMap[m]) : m);
  const parts = normalized.split(',');

  for (const part of parts) {
    if (part === '*' || part === '?') {
      for (let i = min; i <= max; i++) allowed.add(i);
    } else if (part.includes('/')) {
      const [rangePart, stepStr] = part.split('/');
      const step = parseInt(stepStr, 10) || 1;
      let start = min;
      let end = max;
      if (rangePart && rangePart !== '*' && rangePart !== '?') {
        if (rangePart.includes('-')) {
          const [s, e] = rangePart.split('-');
          start = parseInt(s, 10);
          end = parseInt(e, 10);
        } else {
          start = parseInt(rangePart, 10);
        }
      }
      for (let i = start; i <= end; i += step) {
        if (i >= min && i <= max) allowed.add(i);
      }
    } else if (part.includes('-')) {
      const [s, e] = part.split('-');
      const start = parseInt(s, 10);
      const end = parseInt(e, 10);
      for (let i = start; i <= end; i++) {
        if (i >= min && i <= max) allowed.add(i);
      }
    } else {
      const val = parseInt(part, 10);
      if (!isNaN(val) && val >= min && val <= max) {
        allowed.add(val);
      }
    }
  }
  return allowed;
}

// 拆解字段标识
const fieldsInfo = computed(() => {
  const tokens = cronExpression.value.trim().split(/\s+/);
  if (includeSeconds.value) {
    return [
      { label: t('tools.cronParser.second'), val: tokens[0] || '*', range: '0-59', color: 'text-rose-500' },
      { label: t('tools.cronParser.minute'), val: tokens[1] || '*', range: '0-59', color: 'text-amber-500' },
      { label: t('tools.cronParser.hour'), val: tokens[2] || '*', range: '0-23', color: 'text-emerald-500' },
      { label: t('tools.cronParser.dayOfMonth'), val: tokens[3] || '*', range: '1-31', color: 'text-sky-500' },
      { label: t('tools.cronParser.month'), val: tokens[4] || '*', range: '1-12', color: 'text-indigo-500' },
      { label: t('tools.cronParser.dayOfWeek'), val: tokens[5] || '*', range: '0-6', color: 'text-purple-500' },
    ];
  }
  return [
    { label: t('tools.cronParser.minute'), val: tokens[0] || '*', range: '0-59', color: 'text-amber-500' },
    { label: t('tools.cronParser.hour'), val: tokens[1] || '*', range: '0-23', color: 'text-emerald-500' },
    { label: t('tools.cronParser.dayOfMonth'), val: tokens[2] || '*', range: '1-31', color: 'text-sky-500' },
    { label: t('tools.cronParser.month'), val: tokens[3] || '*', range: '1-12', color: 'text-indigo-500' },
    { label: t('tools.cronParser.dayOfWeek'), val: tokens[4] || '*', range: '0-6', color: 'text-purple-500' },
  ];
});

// 自然语言解读
const humanExplanation = computed(() => {
  const tokens = cronExpression.value.trim().split(/\s+/);
  const isZh = locale.value === 'zh-CN';

  const expectedLength = includeSeconds.value ? 6 : 5;
  if (tokens.length !== expectedLength) {
    return isZh
      ? `格式错误：当前需要 ${expectedLength} 个字段（用空格分隔），实际输入了 ${tokens.length} 个`
      : `Format error: Expected ${expectedLength} fields separated by space, got ${tokens.length}`;
  }

  const hasSec = includeSeconds.value;
  const sec = hasSec ? tokens[0] : '';
  const min = hasSec ? tokens[1] : tokens[0];
  const hour = hasSec ? tokens[2] : tokens[1];
  const dom = hasSec ? tokens[3] : tokens[2];
  const mon = hasSec ? tokens[4] : tokens[3];
  const dow = hasSec ? tokens[5] : tokens[4];

  const DOW_NAMES_ZH = ['周日', '周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const DOW_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

  // 极简全匹配
  if (min === '*' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return isZh ? '每分钟执行一次' : 'Every minute';
  }
  if (min.startsWith('*/') && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    const step = min.slice(2);
    return isZh ? `每 ${step} 分钟执行一次` : `Every ${step} minutes`;
  }
  if (min === '0' && hour === '*' && dom === '*' && mon === '*' && dow === '*') {
    return isZh ? '每小时整点执行一次' : 'Every hour on the hour';
  }
  if (min === '0' && hour.startsWith('*/') && dom === '*' && mon === '*' && dow === '*') {
    const step = hour.slice(2);
    return isZh ? `每 ${step} 小时整点执行一次` : `Every ${step} hours on the hour`;
  }

  // 星期语义
  let dowDesc = '';
  if (dow !== '*' && dow !== '?') {
    if (dow === '1-5') {
      dowDesc = isZh ? '每周一至周五 (工作日)' : 'Monday through Friday';
    } else if (dow === '0,6' || dow === '6,0') {
      dowDesc = isZh ? '每周六和周日 (周末)' : 'Saturday and Sunday';
    } else {
      const parts = dow.split(',').map(d => {
        const n = parseInt(d, 10);
        return isZh ? (DOW_NAMES_ZH[n] || d) : (DOW_NAMES_EN[n] || d);
      });
      dowDesc = (isZh ? '每' : 'every ') + parts.join(isZh ? '、' : ', ');
    }
  }

  // 月份语义
  let monDesc = '';
  if (mon !== '*' && mon !== '?') {
    monDesc = isZh ? `在 ${mon} 月` : `in month ${mon}`;
  }

  // 日期语义
  let domDesc = '';
  if (dom !== '*' && dom !== '?') {
    domDesc = isZh ? `每月 ${dom} 日` : `on day ${dom} of the month`;
  }

  // 时间语义
  let timeDesc = '';
  const pad = (s: string) => s.length === 1 ? '0' + s : s;

  if (min.includes('/') && !hour.includes('/')) {
    const step = min.split('/')[1];
    timeDesc = isZh ? `在 ${hour} 点每隔 ${step} 分钟` : `every ${step} minutes during hour ${hour}`;
  } else if (!min.includes('*') && !hour.includes('*') && !min.includes('/') && !hour.includes('/')) {
    const timeStr = `${pad(hour)}:${pad(min)}${hasSec && sec !== '0' ? `:${pad(sec)}` : ''}`;
    timeDesc = isZh ? `在 ${timeStr}` : `at ${timeStr}`;
  } else {
    timeDesc = isZh ? `分: ${min}, 时: ${hour}` : `minute: ${min}, hour: ${hour}`;
  }

  if (isZh) {
    const list = [monDesc, domDesc, dowDesc, timeDesc, '执行一次'].filter(Boolean);
    return list.join(' ');
  } else {
    const list = [timeDesc, dowDesc, domDesc, monDesc].filter(Boolean);
    return list.join(', ');
  }
});

// 计算未来若干次执行时刻
interface NextRunItem {
  index: number;
  dateStr: string;
  dayOfWeek: string;
  relativeTime: string;
}

const nextRuns = computed<NextRunItem[]>(() => {
  const tokens = cronExpression.value.trim().split(/\s+/);
  const expectedLength = includeSeconds.value ? 6 : 5;
  if (tokens.length !== expectedLength) return [];

  try {
    let secAllowed = new Set([0]);
    let minAllowed: Set<number>;
    let hourAllowed: Set<number>;
    let domAllowed: Set<number>;
    let monAllowed: Set<number>;
    let dowAllowed: Set<number>;

    if (includeSeconds.value) {
      secAllowed = parseField(tokens[0], 0, 59);
      minAllowed = parseField(tokens[1], 0, 59);
      hourAllowed = parseField(tokens[2], 0, 23);
      domAllowed = parseField(tokens[3], 1, 31);
      monAllowed = parseField(tokens[4], 1, 12, MONTH_NAMES);
      dowAllowed = parseField(tokens[5], 0, 7, DAY_NAMES);
    } else {
      minAllowed = parseField(tokens[0], 0, 59);
      hourAllowed = parseField(tokens[1], 0, 23);
      domAllowed = parseField(tokens[2], 1, 31);
      monAllowed = parseField(tokens[3], 1, 12, MONTH_NAMES);
      dowAllowed = parseField(tokens[4], 0, 7, DAY_NAMES);
    }

    if (dowAllowed.has(7)) dowAllowed.add(0);

    const results: Date[] = [];
    const current = new Date();
    if (includeSeconds.value) {
      current.setSeconds(current.getSeconds() + 1);
      current.setMilliseconds(0);
    } else {
      current.setMinutes(current.getMinutes() + 1);
      current.setSeconds(0);
      current.setMilliseconds(0);
    }

    const maxIters = 60000;
    let iters = 0;

    const count = 5;
    while (results.length < count && iters < maxIters) {
      iters++;
      const mon = current.getMonth() + 1;
      if (!monAllowed.has(mon)) {
        current.setMonth(current.getMonth() + 1, 1);
        current.setHours(0, 0, 0, 0);
        continue;
      }

      const dom = current.getDate();
      const dow = current.getDay();
      const domToken = includeSeconds.value ? tokens[3] : tokens[2];
      const dowToken = includeSeconds.value ? tokens[5] : tokens[4];
      const domRestricted = domToken !== '*' && domToken !== '?';
      const dowRestricted = dowToken !== '*' && dowToken !== '?';

      let dayMatch = false;
      if (domRestricted && dowRestricted) {
        dayMatch = domAllowed.has(dom) || dowAllowed.has(dow);
      } else if (domRestricted) {
        dayMatch = domAllowed.has(dom);
      } else if (dowRestricted) {
        dayMatch = dowAllowed.has(dow);
      } else {
        dayMatch = true;
      }

      if (!dayMatch) {
        current.setDate(current.getDate() + 1);
        current.setHours(0, 0, 0, 0);
        continue;
      }

      const hour = current.getHours();
      if (!hourAllowed.has(hour)) {
        current.setHours(current.getHours() + 1, 0, 0, 0);
        continue;
      }

      const min = current.getMinutes();
      if (!minAllowed.has(min)) {
        current.setMinutes(current.getMinutes() + 1, 0, 0);
        continue;
      }

      if (includeSeconds.value) {
        const secVal = current.getSeconds();
        if (!secAllowed.has(secVal)) {
          current.setSeconds(current.getSeconds() + 1, 0);
          continue;
        }
      }

      results.push(new Date(current.getTime()));

      if (includeSeconds.value) {
        current.setSeconds(current.getSeconds() + 1);
      } else {
        current.setMinutes(current.getMinutes() + 1);
      }
    }

    const DOW_FULL = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
    const pad = (n: number) => String(n).padStart(2, '0');

    return results.map((d, index) => {
      const year = d.getFullYear();
      const m = pad(d.getMonth() + 1);
      const day = pad(d.getDate());
      const h = pad(d.getHours());
      const min = pad(d.getMinutes());
      const s = pad(d.getSeconds());

      const dateStr = `${year}-${m}-${day} ${h}:${min}:${s}`;
      const dayOfWeek = DOW_FULL[d.getDay()];

      const diffSec = Math.max(0, Math.floor((d.getTime() - Date.now()) / 1000));
      let rel = '';
      if (diffSec < 60) {
        rel = `${diffSec} 秒后`;
      } else if (diffSec < 3600) {
        rel = `${Math.floor(diffSec / 60)} 分钟后`;
      } else if (diffSec < 86400) {
        const hr = Math.floor(diffSec / 3600);
        const mn = Math.floor((diffSec % 3600) / 60);
        rel = `${hr} 小时 ${mn} 分钟后`;
      } else {
        const dy = Math.floor(diffSec / 86400);
        const hr = Math.floor((diffSec % 86400) / 3600);
        rel = `${dy} 天 ${hr} 小时后`;
      }

      return {
        index: index + 1,
        dateStr,
        dayOfWeek,
        relativeTime: rel
      };
    });
  } catch (err) {
    console.warn('Calculate next runs error', err);
    return [];
  }
});

function applyPreset(expr: string) {
  includeSeconds.value = false;
  cronExpression.value = expr;
}

async function copyExpression() {
  try {
    await navigator.clipboard.writeText(cronExpression.value);
    copiedExpr.value = true;
    setTimeout(() => {
      copiedExpr.value = false;
    }, 1500);
  } catch (err) {
    console.error('Copy expression error', err);
  }
}

async function copyExplanation() {
  try {
    await navigator.clipboard.writeText(humanExplanation.value);
    copiedExplain.value = true;
    setTimeout(() => {
      copiedExplain.value = false;
    }, 1500);
  } catch (err) {
    console.error('Copy explanation error', err);
  }
}

function resetDefault() {
  includeSeconds.value = false;
  cronExpression.value = '0 9 * * 1-5';
}

// 可视化生成器字段状态
const bMinute = ref('0');
const bHour = ref('9');
const bDay = ref('*');
const bMonth = ref('*');
const bWeek = ref('1-5');

function updateFromBuilder() {
  if (includeSeconds.value) {
    cronExpression.value = `0 ${bMinute.value} ${bHour.value} ${bDay.value} ${bMonth.value} ${bWeek.value}`;
  } else {
    cronExpression.value = `${bMinute.value} ${bHour.value} ${bDay.value} ${bMonth.value} ${bWeek.value}`;
  }
}
</script>

<template>
  <ToolContainer
    toolId="cron-parser"
    nameKey="tools.cronParser.name"
    descKey="tools.cronParser.desc"
    :icon="CalendarClock"
    :wide="true"
    :fullHeight="true"
  >
    <!-- 核心表达式面板与即时拆解 -->
    <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-3.5 shrink-0">
      <div class="flex flex-wrap items-center justify-between gap-2.5">
        <div class="flex items-center gap-2">
          <CalendarClock class="w-4 h-4 text-blue-500" />
          <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {{ t('tools.cronParser.expression') }}
          </span>
        </div>

        <div class="flex items-center gap-2">
          <!-- 6位秒级精度开关 -->
          <label class="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 select-none cursor-pointer">
            <input
              type="checkbox"
              v-model="includeSeconds"
              class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
            <span>{{ t('tools.cronParser.includeSeconds') }}</span>
          </label>

          <button
            type="button"
            @click="copyExpression"
            class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white transition-colors cursor-pointer shadow-xs"
          >
            <Check v-if="copiedExpr" class="w-3.5 h-3.5 text-white" />
            <Copy v-else class="w-3.5 h-3.5" />
            <span>{{ copiedExpr ? '已复制' : t('common.copy') }}</span>
          </button>

          <button
            type="button"
            @click="resetDefault"
            class="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
            title="重置为默认值"
          >
            <RotateCcw class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- 表达式大字号输入框 -->
      <div class="relative">
        <input
          v-model="cronExpression"
          type="text"
          placeholder="* * * * *"
          class="w-full px-4 py-2.5 font-mono text-base md:text-lg tracking-wider font-semibold rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
        />
      </div>

      <!-- 字段分段指示器 Pills -->
      <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-6 gap-2">
        <div
          v-for="field in fieldsInfo"
          :key="field.label"
          class="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 flex flex-col"
        >
          <div class="flex items-center justify-between text-[11px] text-zinc-400">
            <span>{{ field.label }}</span>
            <span class="font-mono text-[10px]">{{ field.range }}</span>
          </div>
          <div class="font-mono text-sm font-bold mt-0.5 truncate" :class="field.color">
            {{ field.val }}
          </div>
        </div>
      </div>

      <!-- 自然语言执行计划解读 -->
      <div class="flex items-center justify-between p-3 rounded-lg bg-emerald-50/80 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 text-xs">
        <div class="flex items-center gap-2 overflow-hidden">
          <Sparkles class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span class="font-medium text-emerald-800 dark:text-emerald-300">
            {{ humanExplanation }}
          </span>
        </div>

        <button
          type="button"
          @click="copyExplanation"
          class="inline-flex items-center gap-1 text-[11px] text-emerald-700 dark:text-emerald-300 hover:underline cursor-pointer shrink-0 ml-2"
          title="复制自然语言说明"
        >
          <Copy class="w-3 h-3" />
          <span>{{ copiedExplain ? '已复制' : '复制解读' }}</span>
        </button>
      </div>
    </div>

    <!-- 中部功能区：预设 / 可视化配置 / 未来运行计划 -->
    <div class="flex-1 flex flex-col gap-3 min-h-0">
      <!-- 标签页切换 -->
      <div class="flex items-center justify-between border-b border-zinc-200/80 dark:border-zinc-800/80 pb-2 shrink-0">
        <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80 select-none">
          <button
            type="button"
            @click="activeTab = 'presets'"
            class="px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
            :class="activeTab === 'presets' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'"
          >
            {{ t('tools.cronParser.presets') }}
          </button>
          <button
            type="button"
            @click="activeTab = 'builder'"
            class="px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
            :class="activeTab === 'builder' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'"
          >
            {{ t('tools.cronParser.customBuilder') }}
          </button>
          <button
            type="button"
            @click="activeTab = 'nextRuns'"
            class="px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
            :class="activeTab === 'nextRuns' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100'"
          >
            {{ t('tools.cronParser.nextRuns') }} ({{ nextRuns.length }})
          </button>
        </div>
      </div>

      <!-- Tab 1: 常用预设模板 -->
      <div v-if="activeTab === 'presets'" class="flex-1 overflow-y-auto pr-1 flex flex-col gap-4">
        <div
          v-for="group in presetGroups"
          :key="group.category"
          class="flex flex-col gap-2"
        >
          <div class="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
            {{ group.category }}
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              v-for="item in group.items"
              :key="item.expr"
              type="button"
              @click="applyPreset(item.expr)"
              class="group flex flex-col p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:border-blue-500 hover:shadow-xs transition-all text-left cursor-pointer"
            >
              <div class="flex items-center justify-between w-full">
                <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  {{ item.name }}
                </span>
                <Play class="w-3 h-3 text-zinc-300 group-hover:text-blue-500 transition-colors shrink-0" />
              </div>
              <div class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 mt-1">
                {{ item.expr }}
              </div>
              <div class="text-[11px] text-zinc-400 mt-0.5">
                {{ item.desc }}
              </div>
            </button>
          </div>
        </div>
      </div>

      <!-- Tab 2: 可视化配置构建器 -->
      <div v-else-if="activeTab === 'builder'" class="flex-1 overflow-y-auto pr-1 flex flex-col gap-3">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <!-- 分钟 -->
          <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-2">
            <span class="text-xs font-semibold text-amber-600 dark:text-amber-400">
              分钟 (Minute: 0-59)
            </span>
            <CustomSelect
              v-model="bMinute"
              :options="minuteOptions"
              :fullWidth="true"
              @change="updateFromBuilder"
            />
          </div>

          <!-- 小时 -->
          <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-2">
            <span class="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              小时 (Hour: 0-23)
            </span>
            <CustomSelect
              v-model="bHour"
              :options="hourOptions"
              :fullWidth="true"
              @change="updateFromBuilder"
            />
          </div>

          <!-- 日期 -->
          <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-2">
            <span class="text-xs font-semibold text-sky-600 dark:text-sky-400">
              日期 (Day: 1-31)
            </span>
            <CustomSelect
              v-model="bDay"
              :options="dayOptions"
              :fullWidth="true"
              @change="updateFromBuilder"
            />
          </div>

          <!-- 月份 -->
          <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-2">
            <span class="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              月份 (Month: 1-12)
            </span>
            <CustomSelect
              v-model="bMonth"
              :options="monthOptions"
              :fullWidth="true"
              @change="updateFromBuilder"
            />
          </div>

          <!-- 星期 -->
          <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col gap-2">
            <span class="text-xs font-semibold text-purple-600 dark:text-purple-400">
              星期 (Weekday: 0-6)
            </span>
            <CustomSelect
              v-model="bWeek"
              :options="weekOptions"
              :fullWidth="true"
              @change="updateFromBuilder"
            />
          </div>
        </div>

        <div class="flex items-center gap-2 p-2.5 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-800/40 text-xs text-amber-800 dark:text-amber-300">
          <Lightbulb class="w-4 h-4 text-amber-500 shrink-0" />
          <span>在上方调整任何字段，主表达式框与下方未来执行时间将实时联动更新。</span>
        </div>

        <!-- 实时执行计划预测卡片（解决空白并提供即时反馈） -->
        <div class="flex flex-col gap-2 pt-1">
          <div class="flex items-center justify-between text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            <div class="flex items-center gap-1.5">
              <CalendarClock class="w-3.5 h-3.5 text-blue-500" />
              <span>实时执行计划预测 (Next 5 Runs)</span>
            </div>
            <span class="text-[11px] text-zinc-400 font-normal">基于配置实时推算</span>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
            <div
              v-for="item in nextRuns"
              :key="item.index"
              class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col justify-between gap-1"
            >
              <div class="flex items-center justify-between text-[11px]">
                <span class="font-bold text-blue-600 dark:text-blue-400">#{{ item.index }}</span>
                <span class="text-zinc-400">{{ item.dayOfWeek }}</span>
              </div>
              <div class="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                {{ item.dateStr }}
              </div>
              <div class="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium bg-zinc-50 dark:bg-zinc-800/60 px-2 py-0.5 rounded text-center">
                {{ item.relativeTime }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Tab 3: 未来运行计划预测 -->
      <div v-else class="flex-1 overflow-y-auto pr-1 flex flex-col gap-2.5">
        <div v-if="nextRuns.length === 0" class="p-8 text-center text-xs text-zinc-400">
          {{ t('tools.cronParser.invalidExpression') }}
        </div>

        <div
          v-for="item in nextRuns"
          :key="item.index"
          class="flex items-center justify-between p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs"
        >
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 font-mono text-xs font-bold">
              #{{ item.index }}
            </div>
            <div class="flex flex-col">
              <span class="font-mono text-sm font-semibold text-zinc-800 dark:text-zinc-100">
                {{ item.dateStr }}
              </span>
              <span class="text-[11px] text-zinc-400">
                {{ item.dayOfWeek }}
              </span>
            </div>
          </div>

          <div class="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
            {{ item.relativeTime }}
          </div>
        </div>
      </div>
    </div>

    <!-- 底部：Cron 符号语法速查表 -->
    <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-2 shrink-0 select-none">
      <div class="flex items-center gap-2 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
        <HelpCircle class="w-3.5 h-3.5 text-blue-500" />
        <span>{{ t('tools.cronParser.syntaxCheatSheet') }}</span>
      </div>

      <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px]">
        <div class="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <span class="font-mono font-bold text-blue-600 dark:text-blue-400">*</span>
          <span class="text-zinc-500 dark:text-zinc-400 ml-1">匹配任意合法值</span>
        </div>
        <div class="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <span class="font-mono font-bold text-blue-600 dark:text-blue-400">,</span>
          <span class="text-zinc-500 dark:text-zinc-400 ml-1">枚举分隔 (如 1,3,5)</span>
        </div>
        <div class="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <span class="font-mono font-bold text-blue-600 dark:text-blue-400">-</span>
          <span class="text-zinc-500 dark:text-zinc-400 ml-1">指定范围 (如 1-5)</span>
        </div>
        <div class="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <span class="font-mono font-bold text-blue-600 dark:text-blue-400">/</span>
          <span class="text-zinc-500 dark:text-zinc-400 ml-1">步长递增 (如 */15)</span>
        </div>
        <div class="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <span class="font-mono font-bold text-blue-600 dark:text-blue-400">?</span>
          <span class="text-zinc-500 dark:text-zinc-400 ml-1">不指定具体值</span>
        </div>
        <div class="p-1.5 rounded bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <span class="font-mono font-bold text-purple-600 dark:text-purple-400">0-6</span>
          <span class="text-zinc-500 dark:text-zinc-400 ml-1">0=周日, 1-6=周一至六</span>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
