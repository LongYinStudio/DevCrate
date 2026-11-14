<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Search,
  Plus,
  ExternalLink,
  X,
  Filter,
  Wrench,
} from 'lucide-vue-next';
import CustomSelect, { type SelectOption } from '../../../components/common/CustomSelect.vue';
import { openExternalLink } from '../../../utils/openUrl';
import {
  NGINX_DIRECTIVES,
  NGINX_DOCS_BASE_URL,
  NGINX_MODULES,
  type NginxDirectiveDoc,
  type NginxScope,
} from '../data/nginxDirectives';
import { isDirectiveCompatibleWithBlock } from '../nginxUtils';

const props = defineProps<{
  activeBlockChain: string[];
}>();

const emit = defineEmits<{
  (e: 'addDirective', doc: NginxDirectiveDoc): void;
  (e: 'addCustomDirective', payload: { name: string; value: string; isBlock: boolean }): void;
}>();

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

const query = ref('');
const activeScope = ref<'all' | NginxScope>('all');
const activeModule = ref<string>('all');
const matchCurrentContextOnly = ref(true);
const displayLimit = ref(60);

const customName = ref('');
const customValue = ref('');
const customIsBlock = ref(false);

const activeBlockLabel = computed(() => props.activeBlockChain.join(' > ') || 'main');

const scopeTabs = computed(() => [
  { id: 'all' as const, label: t('tools.nginxConfig.scopeAll'), count: NGINX_DIRECTIVES.length },
  {
    id: 'core' as const,
    label: 'Core',
    count: NGINX_DIRECTIVES.filter((d) => d.scope === 'core').length,
  },
  {
    id: 'http' as const,
    label: 'HTTP',
    count: NGINX_DIRECTIVES.filter((d) => d.scope === 'http').length,
  },
  {
    id: 'stream' as const,
    label: 'Stream',
    count: NGINX_DIRECTIVES.filter((d) => d.scope === 'stream').length,
  },
  {
    id: 'mail' as const,
    label: 'Mail',
    count: NGINX_DIRECTIVES.filter((d) => d.scope === 'mail').length,
  },
]);

const moduleOptions = computed<SelectOption[]>(() => [
  { label: t('tools.nginxConfig.allModules'), value: 'all' },
  ...NGINX_MODULES.map((mod) => ({ label: mod, value: mod })),
]);

const filteredDirectives = computed(() => {
  const kw = query.value.trim().toLowerCase();
  return NGINX_DIRECTIVES.filter((doc) => {
    if (activeScope.value !== 'all' && doc.scope !== activeScope.value) return false;
    if (activeModule.value !== 'all' && doc.module !== activeModule.value) return false;
    if (
      matchCurrentContextOnly.value &&
      !isDirectiveCompatibleWithBlock(doc, props.activeBlockChain)
    ) {
      return false;
    }
    if (!kw) return true;
    return (
      doc.name.toLowerCase().includes(kw) ||
      doc.module.toLowerCase().includes(kw) ||
      doc.syntax.toLowerCase().includes(kw) ||
      doc.summary.toLowerCase().includes(kw)
    );
  });
});

const visibleDirectives = computed(() => filteredDirectives.value.slice(0, displayLimit.value));

function handleAddCustom() {
  const name = customName.value.trim();
  if (!name) return;
  emit('addCustomDirective', {
    name,
    value: customValue.value.trim(),
    isBlock: customIsBlock.value,
  });
  customName.value = '';
  customValue.value = '';
  customIsBlock.value = false;
}
</script>

<template>
  <div class="flex flex-col h-full min-h-0 gap-3">
    <!-- 自定义指令快捷添加 -->
    <div class="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-2 shrink-0">
      <div class="flex items-center justify-between gap-2">
        <div class="flex items-center gap-1.5 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
          <Wrench class="w-3.5 h-3.5 text-blue-500" />
          <span>{{ t('tools.nginxConfig.customDirectiveTitle') }}</span>
        </div>
        <span class="text-[11px] font-mono text-zinc-400">
          {{ t('tools.nginxConfig.targetLabel') }}: {{ activeBlockLabel }}
        </span>
      </div>

      <div class="flex flex-wrap sm:flex-nowrap items-center gap-2">
        <input
          v-model="customName"
          type="text"
          :placeholder="t('tools.nginxConfig.customNamePlaceholder')"
          class="w-40 shrink-0 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
          @keydown.enter="handleAddCustom"
        />
        <input
          v-model="customValue"
          type="text"
          :placeholder="customIsBlock ? t('tools.nginxConfig.blockArgsPlaceholder') : t('tools.nginxConfig.customValuePlaceholder')"
          class="min-w-0 flex-1 px-2.5 py-1.5 text-xs font-mono rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
          @keydown.enter="handleAddCustom"
        />
        <label class="inline-flex items-center gap-1 text-xs text-zinc-600 dark:text-zinc-300 shrink-0 cursor-pointer">
          <input v-model="customIsBlock" type="checkbox" class="accent-blue-600 rounded" />
          <span class="font-mono">{ }</span>
        </label>
        <button
          type="button"
          :disabled="!customName.trim()"
          class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-40 transition-colors cursor-pointer disabled:cursor-not-allowed shrink-0"
          @click="handleAddCustom"
        >
          <Plus class="w-3.5 h-3.5" />
          <span>{{ t('tools.nginxConfig.addButton') }}</span>
        </button>
      </div>
    </div>

    <!-- 搜索与筛选栏 -->
    <div class="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 flex flex-col gap-2.5 shrink-0">
      <div class="flex flex-wrap items-center gap-2">
        <div class="relative flex-1 min-w-[200px]">
          <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            v-model="query"
            type="text"
            :placeholder="t('tools.nginxConfig.searchCatalogPlaceholder')"
            class="w-full pl-8 pr-7 py-1.5 text-xs rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
          />
          <button
            v-if="query"
            type="button"
            class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
            @click="query = ''"
          >
            <X class="w-3.5 h-3.5" />
          </button>
        </div>

        <CustomSelect
          v-model="activeModule"
          :options="moduleOptions"
          size="sm"
          class="w-56"
        />
      </div>

      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex flex-wrap items-center gap-1">
          <button
            v-for="tab in scopeTabs"
            :key="tab.id"
            type="button"
            class="px-2 py-1 text-[11px] font-medium rounded-lg transition-colors cursor-pointer"
            :class="
              activeScope === tab.id
                ? 'bg-blue-600 text-white'
                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700'
            "
            @click="activeScope = tab.id"
          >
            {{ tab.label }} ({{ tab.count }})
          </button>
        </div>

        <label class="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 cursor-pointer select-none">
          <input v-model="matchCurrentContextOnly" type="checkbox" class="accent-blue-600 rounded" />
          <Filter class="w-3 h-3 text-blue-500" />
          <span>{{ t('tools.nginxConfig.filterByContext', { context: activeBlockChain[activeBlockChain.length - 1] || 'main' }) }}</span>
        </label>
      </div>
    </div>

    <!-- 指令结果列表 -->
    <div class="flex-1 min-h-0 overflow-y-auto flex flex-col gap-2 pr-1">
      <div class="flex items-center justify-between px-1 text-[11px] text-zinc-500 dark:text-zinc-400">
        <span>
          {{ isZh ? `匹配 ${filteredDirectives.length} 条官网指令（共 ${NGINX_DIRECTIVES.length} 条）` : `${filteredDirectives.length} matching directives (out of ${NGINX_DIRECTIVES.length} official)` }}
        </span>
      </div>

      <div
        v-for="doc in visibleDirectives"
        :key="doc.docPath"
        class="p-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-blue-300 dark:hover:border-blue-700/80 transition-colors flex flex-col gap-1.5"
      >
        <div class="flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">
              {{ doc.name }}
            </span>
            <span
              class="px-1.5 py-0.5 text-[10px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300"
            >
              {{ doc.isBlock ? '{ block }' : ';' }}
            </span>
            <span
              class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
            >
              {{ doc.scope }}
            </span>
            <span class="text-[10px] font-mono text-zinc-400">
              {{ doc.module }}
            </span>
          </div>

          <div class="flex items-center gap-1.5">
            <button
              type="button"
              class="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 rounded cursor-pointer"
              :title="t('tools.nginxConfig.openOfficialDoc')"
              @click="openExternalLink(`${NGINX_DOCS_BASE_URL}${doc.docPath}`)"
            >
              <ExternalLink class="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              @click="emit('addDirective', doc)"
            >
              <Plus class="w-3 h-3" />
              <span>{{ t('tools.nginxConfig.addToTarget') }}</span>
            </button>
          </div>
        </div>

        <div class="text-[11px] font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-950 px-2 py-1 rounded border border-zinc-200/60 dark:border-zinc-800/80 break-all">
          {{ doc.syntax }}
        </div>

        <div class="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-zinc-500 dark:text-zinc-400">
          <span><strong>Default:</strong> <code class="font-mono">{{ doc.default }}</code></span>
          <span><strong>Context:</strong> <code class="font-mono">{{ doc.contexts.join(', ') }}</code></span>
        </div>

        <p v-if="doc.summary" class="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {{ doc.summary }}
        </p>
      </div>

      <button
        v-if="visibleDirectives.length < filteredDirectives.length"
        type="button"
        class="py-2 px-4 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
        @click="displayLimit += 120"
      >
        {{ isZh ? `加载更多（剩余 ${filteredDirectives.length - visibleDirectives.length} 条）` : `Load More (${filteredDirectives.length - visibleDirectives.length} remaining)` }}
      </button>
    </div>
  </div>
</template>
