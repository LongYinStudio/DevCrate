<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  BookOpenCheck,
  Search,
  X,
  Copy,
  Check,
  Sparkles,
  Compass,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Wrench,
  Tag,
  RefreshCw,
  Database,
  Code2
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import {
  HTTP_STATUS_CODES,
  HTTP_STATUS_ADVISOR,
  QUICK_JUMP_CODES,
  type HttpStatusFilter,
  type HttpStatusItem,
  type HttpStatusCategory
} from './httpStatusData';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

const searchQuery = ref('');
const activeFilter = ref<HttpStatusFilter>('all');
const selectedCode = ref<number>(200);
const showAdvisor = ref(false);
const copiedKey = ref<string | null>(null);

interface FilterTab {
  id: HttpStatusFilter;
  labelKey: string;
  dotClass: string;
}

const filterTabs: FilterTab[] = [
  { id: 'all', labelKey: 'tools.httpStatusCodes.filters.all', dotClass: 'bg-zinc-400' },
  { id: 'common', labelKey: 'tools.httpStatusCodes.filters.common', dotClass: 'bg-amber-400' },
  { id: '1xx', labelKey: 'tools.httpStatusCodes.filters.1xx', dotClass: 'bg-cyan-500' },
  { id: '2xx', labelKey: 'tools.httpStatusCodes.filters.2xx', dotClass: 'bg-emerald-500' },
  { id: '3xx', labelKey: 'tools.httpStatusCodes.filters.3xx', dotClass: 'bg-blue-500' },
  { id: '4xx', labelKey: 'tools.httpStatusCodes.filters.4xx', dotClass: 'bg-amber-500' },
  { id: '5xx', labelKey: 'tools.httpStatusCodes.filters.5xx', dotClass: 'bg-rose-500' },
  { id: 'unofficial', labelKey: 'tools.httpStatusCodes.filters.unofficial', dotClass: 'bg-purple-500' }
];

const filterCounts = computed(() => {
  const counts: Record<HttpStatusFilter, number> = {
    all: HTTP_STATUS_CODES.length,
    common: HTTP_STATUS_CODES.filter(i => i.isCommon).length,
    '1xx': 0,
    '2xx': 0,
    '3xx': 0,
    '4xx': 0,
    '5xx': 0,
    unofficial: HTTP_STATUS_CODES.filter(i => i.isUnofficial).length
  };
  for (const item of HTTP_STATUS_CODES) {
    counts[item.category]++;
  }
  return counts;
});

const filteredList = computed<HttpStatusItem[]>(() => {
  const q = searchQuery.value.trim().toLowerCase();

  return HTTP_STATUS_CODES.filter(item => {
    if (activeFilter.value === 'common') {
      if (!item.isCommon) return false;
    } else if (activeFilter.value === 'unofficial') {
      if (!item.isUnofficial) return false;
    } else if (activeFilter.value !== 'all') {
      if (item.category !== activeFilter.value) return false;
    }

    if (!q) return true;

    if (String(item.code).includes(q)) return true;
    if (item.phrase.toLowerCase().includes(q)) return true;
    if (item.spec.toLowerCase().includes(q)) return true;
    if (item.summaryZh.toLowerCase().includes(q) || item.summaryEn.toLowerCase().includes(q)) return true;
    if (item.detailZh.toLowerCase().includes(q) || item.detailEn.toLowerCase().includes(q)) return true;
    if (item.relatedHeaders.some(h => h.toLowerCase().includes(q))) return true;
    if (item.keywords.some(k => k.toLowerCase().includes(q))) return true;

    return false;
  });
});

const activeItem = computed<HttpStatusItem>(() => {
  const exact = HTTP_STATUS_CODES.find(i => i.code === selectedCode.value);
  if (exact) return exact;
  return filteredList.value[0] || HTTP_STATUS_CODES[0];
});

function selectStatusCode(code: number) {
  selectedCode.value = code;
  const inFiltered = filteredList.value.some(i => i.code === code);
  if (!inFiltered) {
    activeFilter.value = 'all';
    searchQuery.value = '';
  }
}

function searchByHeader(header: string) {
  activeFilter.value = 'all';
  searchQuery.value = header;
}

function copyText(key: string, text: string) {
  navigator.clipboard.writeText(text).then(() => {
    copiedKey.value = key;
    setTimeout(() => {
      if (copiedKey.value === key) copiedKey.value = null;
    }, 1500);
  });
}

function getCategoryStyle(category: HttpStatusCategory) {
  switch (category) {
    case '1xx':
      return {
        badge: 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60',
        codeBg: 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border-cyan-500/20',
        accent: 'text-cyan-600 dark:text-cyan-400'
      };
    case '2xx':
      return {
        badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
        codeBg: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20',
        accent: 'text-emerald-600 dark:text-emerald-400'
      };
    case '3xx':
      return {
        badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
        codeBg: 'bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20',
        accent: 'text-blue-600 dark:text-blue-400'
      };
    case '4xx':
      return {
        badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
        codeBg: 'bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20',
        accent: 'text-amber-600 dark:text-amber-400'
      };
    case '5xx':
      return {
        badge: 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
        codeBg: 'bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/20',
        accent: 'text-rose-600 dark:text-rose-400'
      };
  }
}

const jsonSnippet = computed(() => {
  const item = activeItem.value;
  return JSON.stringify(
    {
      status: item.code,
      error: item.phrase,
      message: isZh.value ? item.summaryZh : item.summaryEn
    },
    null,
    2
  );
});

const httpLineSnippet = computed(() => {
  return `HTTP/1.1 ${activeItem.value.code} ${activeItem.value.phrase}`;
});
</script>

<template>
  <ToolContainer
    toolId="http-status-codes"
    nameKey="tools.httpStatusCodes.name"
    descKey="tools.httpStatusCodes.desc"
    :icon="BookOpenCheck"
    :wide="true"
    :fullHeight="true"
  >
    <template #header-actions>
      <button
        type="button"
        @click="showAdvisor = !showAdvisor"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer"
        :class="
          showAdvisor
            ? 'bg-blue-600 text-white border-blue-600'
            : 'bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 border-zinc-200 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-700'
        "
      >
        <Compass class="w-3.5 h-3.5" />
        <span>{{ t('tools.httpStatusCodes.advisorToggle') }}</span>
        <component :is="showAdvisor ? ChevronUp : ChevronDown" class="w-3.5 h-3.5" />
      </button>
    </template>

    <div class="flex flex-col flex-1 min-h-0 gap-3.5">
      <!-- 场景选码向导（可折叠） -->
      <div
        v-if="showAdvisor"
        class="p-3.5 rounded-xl border border-blue-200/80 dark:border-blue-900/50 bg-blue-50/40 dark:bg-blue-950/20 shrink-0 space-y-2.5"
      >
        <div class="flex items-center gap-2 text-xs font-semibold text-blue-900 dark:text-blue-200">
          <Compass class="w-4 h-4 text-blue-500" />
          <span>{{ t('tools.httpStatusCodes.advisorTitle') }}</span>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
          <div
            v-for="sc in HTTP_STATUS_ADVISOR"
            :key="sc.id"
            class="p-2.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 space-y-1.5"
          >
            <div class="flex items-center justify-between gap-2">
              <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                {{ isZh ? sc.questionZh : sc.questionEn }}
              </span>
              <div class="flex items-center gap-1 shrink-0">
                <button
                  v-for="rc in sc.recommendedCodes"
                  :key="rc"
                  type="button"
                  @click="selectStatusCode(rc)"
                  class="px-1.5 py-0.5 rounded font-mono text-[11px] font-bold bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/60 hover:bg-blue-600 hover:text-white transition-colors cursor-pointer"
                >
                  {{ rc }}
                </button>
              </div>
            </div>
            <p class="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {{ isZh ? sc.noteZh : sc.noteEn }}
            </p>
          </div>
        </div>
      </div>

      <!-- 搜索与快捷跳转条 -->
      <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-2.5 shrink-0">
        <div class="flex flex-col md:flex-row md:items-center gap-2.5">
          <!-- 搜索框 -->
          <div class="relative flex-1">
            <Search class="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="searchQuery"
              type="text"
              :placeholder="t('tools.httpStatusCodes.searchPlaceholder')"
              class="w-full pl-9 pr-8 py-2 text-xs sm:text-sm rounded-lg border border-zinc-200 dark:border-zinc-700/80 bg-zinc-50 dark:bg-zinc-800/80 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
            />
            <button
              v-if="searchQuery"
              type="button"
              @click="searchQuery = ''"
              class="p-1 rounded text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer"
            >
              <X class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- 常见状态码快捷定位 -->
          <div class="flex flex-wrap items-center gap-1 select-none">
            <span class="text-[11px] text-zinc-400 mr-1 hidden sm:inline">{{ t('tools.httpStatusCodes.quickJump') }}:</span>
            <button
              v-for="qCode in QUICK_JUMP_CODES"
              :key="qCode"
              type="button"
              @click="selectStatusCode(qCode)"
              class="px-1.5 py-0.5 rounded font-mono text-[11px] font-semibold border transition-colors cursor-pointer"
              :class="
                activeItem.code === qCode
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-zinc-100/80 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700 hover:border-blue-400'
              "
            >
              {{ qCode }}
            </button>
          </div>
        </div>

        <!-- 分类筛选 Tabs -->
        <div class="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/80 select-none">
          <button
            v-for="tab in filterTabs"
            :key="tab.id"
            type="button"
            @click="activeFilter = tab.id"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer"
            :class="
              activeFilter === tab.id
                ? 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 border-zinc-900 dark:border-zinc-100 shadow-xs'
                : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700/80 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            "
          >
            <span class="w-1.5 h-1.5 rounded-full" :class="tab.dotClass"></span>
            <span>{{ t(tab.labelKey) }}</span>
            <span class="text-[10px] opacity-70 font-mono">{{ filterCounts[tab.id] }}</span>
          </button>
        </div>
      </div>

      <!-- 主双栏内容区：左侧列表 + 右侧详情透视 -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3.5 flex-1 min-h-0">
        <!-- 左侧状态码列表 -->
        <div class="lg:col-span-5 flex flex-col min-h-[260px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
          <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/70 flex items-center justify-between text-xs text-zinc-500 dark:text-zinc-400 shrink-0 select-none">
            <span>{{ t('tools.httpStatusCodes.listCount', { count: filteredList.length }) }}</span>
            <span v-if="searchQuery" class="text-[11px] font-mono text-blue-600 dark:text-blue-400 truncate max-w-[180px]">
              "{{ searchQuery }}"
            </span>
          </div>

          <div class="flex-1 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/70">
            <div
              v-if="filteredList.length === 0"
              class="py-12 px-4 text-center text-xs text-zinc-400"
            >
              {{ t('tools.httpStatusCodes.noResults') }}
            </div>

            <div
              v-for="item in filteredList"
              :key="item.code"
              @click="selectedCode = item.code"
              class="px-3.5 py-2.5 flex items-start justify-between gap-2.5 cursor-pointer transition-colors group"
              :class="
                activeItem.code === item.code
                  ? 'bg-blue-50/80 dark:bg-blue-950/30 border-l-2 border-l-blue-600'
                  : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40'
              "
            >
              <div class="flex items-start gap-2.5 min-w-0">
                <span
                  class="px-2 py-0.5 rounded-md font-mono text-xs font-bold border shrink-0 mt-0.5"
                  :class="getCategoryStyle(item.category).codeBg"
                >
                  {{ item.code }}
                </span>

                <div class="min-w-0">
                  <div class="flex items-center gap-1.5 flex-wrap">
                    <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      {{ item.phrase }}
                    </span>
                    <Sparkles v-if="item.isCommon" class="w-3 h-3 text-amber-500 shrink-0" />
                    <span
                      v-if="item.isUnofficial"
                      class="px-1.5 py-0 rounded text-[10px] bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 border border-purple-200/70 dark:border-purple-800/60"
                    >
                      Ext
                    </span>
                  </div>
                  <p class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 line-clamp-2">
                    {{ isZh ? item.summaryZh : item.summaryEn }}
                  </p>
                </div>
              </div>

              <button
                type="button"
                @click.stop="copyText(`list-${item.code}`, String(item.code))"
                class="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-200/60 dark:hover:bg-zinc-700 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 cursor-pointer"
                :class="{ 'opacity-100 text-emerald-500': copiedKey === `list-${item.code}` }"
                :title="t('common.copy')"
              >
                <Check v-if="copiedKey === `list-${item.code}`" class="w-3.5 h-3.5 text-emerald-500" />
                <Copy v-else class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>

        <!-- 右侧详情参考面板 -->
        <div class="lg:col-span-7 flex flex-col min-h-[300px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
          <div class="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
            <!-- Hero Header -->
            <div class="flex flex-wrap items-start justify-between gap-3 pb-3.5 border-b border-zinc-100 dark:border-zinc-800">
              <div class="space-y-1.5">
                <div class="flex items-center gap-2.5 flex-wrap">
                  <span
                    class="px-2.5 py-1 rounded-lg font-mono text-xl font-bold border"
                    :class="getCategoryStyle(activeItem.category).codeBg"
                  >
                    {{ activeItem.code }}
                  </span>
                  <h2 class="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                    {{ activeItem.phrase }}
                  </h2>
                </div>
                <p class="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                  {{ isZh ? activeItem.summaryZh : activeItem.summaryEn }}
                </p>
              </div>

              <!-- 规范与属性标签 -->
              <div class="flex flex-wrap items-center gap-1.5 text-[11px]">
                <span
                  class="px-2 py-0.5 rounded-full font-semibold border"
                  :class="getCategoryStyle(activeItem.category).badge"
                >
                  {{ activeItem.category }}
                </span>
                <span class="px-2 py-0.5 rounded-full font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
                  {{ activeItem.spec }}
                </span>
                <span
                  v-if="activeItem.isUnofficial"
                  class="px-2 py-0.5 rounded-full font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60"
                >
                  {{ t('tools.httpStatusCodes.unofficialBadge') }}
                </span>
              </div>
            </div>

            <!-- 语义属性 + 一键复制片段 -->
            <div class="flex flex-wrap items-center justify-between gap-2.5">
              <div class="flex flex-wrap items-center gap-2 text-xs">
                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300">
                  <Database class="w-3.5 h-3.5" :class="activeItem.cacheable ? 'text-emerald-500' : 'text-zinc-400'" />
                  <span>{{ activeItem.cacheable ? t('tools.httpStatusCodes.cacheableYes') : t('tools.httpStatusCodes.cacheableNo') }}</span>
                </span>

                <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-zinc-50 dark:bg-zinc-800/70 border border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-300">
                  <RefreshCw class="w-3.5 h-3.5" :class="activeItem.retryable === 'yes' ? 'text-emerald-500' : activeItem.retryable === 'conditional' ? 'text-amber-500' : 'text-zinc-400'" />
                  <span>{{ t(`tools.httpStatusCodes.retryable.${activeItem.retryable}`) }}</span>
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-1.5 text-xs">
                <button
                  type="button"
                  @click="copyText('code-only', String(activeItem.code))"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-mono text-[11px] cursor-pointer"
                >
                  <component :is="copiedKey === 'code-only' ? Check : Copy" class="w-3 h-3" :class="copiedKey === 'code-only' ? 'text-emerald-500' : ''" />
                  <span>{{ activeItem.code }}</span>
                </button>
                <button
                  type="button"
                  @click="copyText('code-phrase', `${activeItem.code} ${activeItem.phrase}`)"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-mono text-[11px] cursor-pointer"
                >
                  <component :is="copiedKey === 'code-phrase' ? Check : Copy" class="w-3 h-3" :class="copiedKey === 'code-phrase' ? 'text-emerald-500' : ''" />
                  <span>{{ activeItem.code }} {{ activeItem.phrase }}</span>
                </button>
                <button
                  type="button"
                  @click="copyText('http-line', httpLineSnippet)"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 font-mono text-[11px] cursor-pointer"
                >
                  <component :is="copiedKey === 'http-line' ? Check : Copy" class="w-3 h-3" :class="copiedKey === 'http-line' ? 'text-emerald-500' : ''" />
                  <span>HTTP/1.1</span>
                </button>
              </div>
            </div>

            <!-- 详细语义解读 -->
            <div class="p-3.5 rounded-xl bg-zinc-50/80 dark:bg-zinc-950/50 border border-zinc-200/70 dark:border-zinc-800 text-xs sm:text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {{ isZh ? activeItem.detailZh : activeItem.detailEn }}
            </div>

            <!-- 常见成因与排查建议 -->
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div class="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-2">
                <div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                  <AlertTriangle class="w-3.5 h-3.5 text-amber-500" />
                  <span>{{ t('tools.httpStatusCodes.causesTitle') }}</span>
                </div>
                <ul class="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                  <li v-for="(c, idx) in (isZh ? activeItem.causesZh : activeItem.causesEn)" :key="idx">
                    {{ c }}
                  </li>
                </ul>
              </div>

              <div class="p-3.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-900/60 space-y-2">
                <div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-100">
                  <Wrench class="w-3.5 h-3.5 text-blue-500" />
                  <span>{{ t('tools.httpStatusCodes.solutionsTitle') }}</span>
                </div>
                <ul class="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-400 list-disc pl-4">
                  <li v-for="(s, idx) in (isZh ? activeItem.solutionsZh : activeItem.solutionsEn)" :key="idx">
                    {{ s }}
                  </li>
                </ul>
              </div>
            </div>

            <!-- 关联 HTTP Headers -->
            <div v-if="activeItem.relatedHeaders.length > 0" class="space-y-1.5">
              <div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                <Tag class="w-3.5 h-3.5 text-zinc-400" />
                <span>{{ t('tools.httpStatusCodes.relatedHeaders') }}</span>
              </div>
              <div class="flex flex-wrap items-center gap-1.5">
                <button
                  v-for="hdr in activeItem.relatedHeaders"
                  :key="hdr"
                  type="button"
                  @click="searchByHeader(hdr)"
                  class="px-2 py-0.5 rounded-md font-mono text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 border border-indigo-200/70 dark:border-indigo-800/60 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors cursor-pointer"
                  :title="t('tools.httpStatusCodes.filterByHeader')"
                >
                  {{ hdr }}
                </button>
              </div>
            </div>

            <!-- API 响应 JSON 示例模板 -->
            <div class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 overflow-hidden">
              <div class="flex items-center justify-between px-3 py-1.5 border-b border-zinc-200/70 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span class="inline-flex items-center gap-1.5 font-medium">
                  <Code2 class="w-3.5 h-3.5" />
                  {{ t('tools.httpStatusCodes.jsonSampleTitle') }}
                </span>
                <button
                  type="button"
                  @click="copyText('json-sample', jsonSnippet)"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800 text-zinc-600 dark:text-zinc-300 cursor-pointer"
                >
                  <component :is="copiedKey === 'json-sample' ? Check : Copy" class="w-3 h-3" :class="copiedKey === 'json-sample' ? 'text-emerald-500' : ''" />
                  <span>{{ copiedKey === 'json-sample' ? t('common.copied') : t('common.copy') }}</span>
                </button>
              </div>
              <pre class="p-3 font-mono text-xs text-zinc-800 dark:text-zinc-200 overflow-x-auto">{{ jsonSnippet }}</pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
