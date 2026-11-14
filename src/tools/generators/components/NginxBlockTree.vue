<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ChevronDown,
  ChevronRight,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  CopyPlus,
  Info,
  FolderOpen,
  BookOpen,
} from 'lucide-vue-next';
import {
  ALLOWED_CHILD_BLOCKS,
  CONTEXT_QUICK_DIRECTIVES,
  lookupDirectiveDocs,
  type NginxBlockNode,
  type NginxDirectiveNode,
} from '../nginxUtils';

defineOptions({ name: 'NginxBlockTree' });

const props = withDefaults(
  defineProps<{
    node: NginxBlockNode;
    selectedBlockId: string;
    isRoot?: boolean;
    canMoveUp?: boolean;
    canMoveDown?: boolean;
    chain?: string[];
  }>(),
  {
    isRoot: false,
    canMoveUp: false,
    canMoveDown: false,
    chain: () => [],
  },
);

const emit = defineEmits<{
  (e: 'selectBlock', blockId: string): void;
  (e: 'addQuickDirective', blockId: string, name: string): void;
  (e: 'addChildBlock', blockId: string, name: string, defaultArgs: string): void;
  (e: 'removeNode', nodeId: string): void;
  (e: 'duplicateNode', nodeId: string): void;
  (e: 'moveNode', nodeId: string, direction: -1 | 1): void;
  (e: 'openCatalogForBlock', blockId: string): void;
}>();

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

const isCollapsed = ref(false);
const expandedHelpId = ref<string | null>(null);

const currentChain = computed(() => [...props.chain, props.node.name]);
const isSelected = computed(() => props.selectedBlockId === props.node.id);

const quickDirectives = computed(() => CONTEXT_QUICK_DIRECTIVES[props.node.name] ?? []);
const allowedChildBlocks = computed(() => ALLOWED_CHILD_BLOCKS[props.node.name] ?? []);

function getDirectiveHint(dir: NginxDirectiveNode) {
  const docs = lookupDirectiveDocs(dir.name);
  if (docs.length === 0) return null;
  if (currentChain.value.includes('stream')) {
    return docs.find((d) => d.scope === 'stream') ?? docs[0];
  }
  if (currentChain.value.includes('mail')) {
    return docs.find((d) => d.scope === 'mail') ?? docs[0];
  }
  if (currentChain.value.includes('http')) {
    return docs.find((d) => d.scope === 'http') ?? docs[0];
  }
  return docs[0];
}

function toggleHelp(dirId: string) {
  expandedHelpId.value = expandedHelpId.value === dirId ? null : dirId;
}
</script>

<template>
  <div
    class="rounded-xl border transition-all duration-150"
    :class="[
      isSelected
        ? 'border-blue-500/80 dark:border-blue-500/70 bg-blue-50/20 dark:bg-blue-950/15 shadow-xs'
        : 'border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70',
      !node.enabled ? 'opacity-60' : '',
    ]"
  >
    <!-- 块标题栏 -->
    <div
      class="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-zinc-200/60 dark:border-zinc-800/60 cursor-pointer select-none"
      @click="emit('selectBlock', node.id)"
    >
      <button
        type="button"
        class="p-0.5 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 rounded cursor-pointer"
        @click.stop="isCollapsed = !isCollapsed"
      >
        <ChevronDown v-if="!isCollapsed" class="w-3.5 h-3.5" />
        <ChevronRight v-else class="w-3.5 h-3.5" />
      </button>

      <input
        v-if="!isRoot"
        v-model="node.enabled"
        type="checkbox"
        class="w-3.5 h-3.5 accent-blue-600 rounded cursor-pointer"
        @click.stop
        :title="t('tools.nginxConfig.toggleEnabled')"
      />

      <FolderOpen
        class="w-3.5 h-3.5 shrink-0"
        :class="isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-zinc-400'"
      />

      <span class="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
        {{ isRoot ? 'main (nginx.conf)' : node.name }}
      </span>

      <input
        v-if="!isRoot && (node.args || ['location', 'upstream', 'if', 'limit_except', 'map', 'geo', 'split_clients', 'match', 'acme_issuer', 'oidc_provider', 'charset_map', 'num_map'].includes(node.name))"
        v-model="node.args"
        type="text"
        :placeholder="t('tools.nginxConfig.blockArgsPlaceholder')"
        class="min-w-[110px] flex-1 max-w-[260px] px-2 py-0.5 text-xs font-mono rounded-md bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
        @click.stop
        @focus="emit('selectBlock', node.id)"
      />

      <span
        v-if="isSelected"
        class="px-1.5 py-0.5 text-[10px] font-medium rounded bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300"
      >
        {{ t('tools.nginxConfig.activeBlockBadge') }}
      </span>

      <div class="ml-auto flex items-center gap-1" @click.stop>
        <button
          type="button"
          class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[11px] font-medium rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 cursor-pointer"
          :title="t('tools.nginxConfig.browseCatalogForBlock')"
          @click="emit('openCatalogForBlock', node.id)"
        >
          <BookOpen class="w-3 h-3" />
          <span class="hidden sm:inline">+1009</span>
        </button>

        <template v-if="!isRoot">
          <button
            type="button"
            :disabled="!canMoveUp"
            class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            :title="t('tools.nginxConfig.moveUp')"
            @click="emit('moveNode', node.id, -1)"
          >
            <ArrowUp class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            :disabled="!canMoveDown"
            class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
            :title="t('tools.nginxConfig.moveDown')"
            @click="emit('moveNode', node.id, 1)"
          >
            <ArrowDown class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            :title="t('tools.nginxConfig.duplicate')"
            @click="emit('duplicateNode', node.id)"
          >
            <CopyPlus class="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            class="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
            :title="t('tools.nginxConfig.deleteNode')"
            @click="emit('removeNode', node.id)"
          >
            <Trash2 class="w-3.5 h-3.5" />
          </button>
        </template>
      </div>
    </div>

    <!-- 块内容区域 -->
    <div v-if="!isCollapsed" class="p-2.5 flex flex-col gap-2">
      <!-- 选中块时的快捷操作栏：子块 & 常用指令 -->
      <div
        v-if="isSelected && (allowedChildBlocks.length > 0 || quickDirectives.length > 0)"
        class="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60 flex flex-col gap-1.5"
      >
        <div v-if="allowedChildBlocks.length > 0" class="flex flex-wrap items-center gap-1">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mr-1">
            {{ t('tools.nginxConfig.addChildBlock') }}
          </span>
          <button
            v-for="childBlk in allowedChildBlocks"
            :key="childBlk.name"
            type="button"
            class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-mono rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors cursor-pointer"
            @click="emit('addChildBlock', node.id, childBlk.name, childBlk.defaultArgs)"
          >
            <Plus class="w-2.5 h-2.5" />
            <span>{{ childBlk.name }} {}</span>
          </button>
        </div>

        <div v-if="quickDirectives.length > 0" class="flex flex-wrap items-center gap-1">
          <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 mr-1">
            {{ t('tools.nginxConfig.quickDirectives') }}
          </span>
          <button
            v-for="qDir in quickDirectives"
            :key="qDir"
            type="button"
            class="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[11px] font-mono rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-zinc-700 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 border border-transparent hover:border-blue-300 dark:hover:border-blue-800 transition-colors cursor-pointer"
            @click="emit('addQuickDirective', node.id, qDir)"
          >
            <Plus class="w-2.5 h-2.5" />
            <span>{{ qDir }}</span>
          </button>
        </div>
      </div>

      <!-- 子节点列表 -->
      <div v-if="node.children.length === 0" class="py-2 px-3 text-xs text-zinc-400 italic">
        {{ isZh ? '当前块暂无指令，可通过上方快捷标签或「官网指令库」添加。' : 'No directives in this block yet. Use quick picks or the official catalog.' }}
      </div>

      <template v-for="(child, index) in node.children" :key="child.id">
        <!-- 指令行 -->
        <div
          v-if="child.kind === 'directive'"
          class="flex flex-col gap-1 rounded-lg border border-zinc-200/70 dark:border-zinc-800/80 bg-zinc-50/70 dark:bg-zinc-900/50 px-2.5 py-1.5"
          :class="!child.enabled ? 'opacity-55' : ''"
        >
          <div class="flex flex-wrap sm:flex-nowrap items-center gap-1.5">
            <input
              v-model="child.enabled"
              type="checkbox"
              class="w-3.5 h-3.5 accent-blue-600 rounded shrink-0 cursor-pointer"
              :title="t('tools.nginxConfig.toggleEnabled')"
            />

            <input
              v-model="child.name"
              type="text"
              placeholder="directive"
              class="w-36 sm:w-44 shrink-0 px-2 py-1 text-xs font-mono font-medium rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-blue-700 dark:text-blue-300 focus:outline-none focus:border-blue-500"
            />

            <input
              v-model="child.value"
              type="text"
              :placeholder="t('tools.nginxConfig.directiveValuePlaceholder')"
              class="min-w-0 flex-1 px-2 py-1 text-xs font-mono rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
            />

            <div class="flex items-center gap-0.5 shrink-0">
              <button
                v-if="getDirectiveHint(child)"
                type="button"
                class="p-1 text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
                :title="t('tools.nginxConfig.viewSyntaxHint')"
                @click="toggleHelp(child.id)"
              >
                <Info class="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                :disabled="index === 0"
                class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                @click="emit('moveNode', child.id, -1)"
              >
                <ArrowUp class="w-3 h-3" />
              </button>
              <button
                type="button"
                :disabled="index === node.children.length - 1"
                class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                @click="emit('moveNode', child.id, 1)"
              >
                <ArrowDown class="w-3 h-3" />
              </button>
              <button
                type="button"
                class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
                @click="emit('duplicateNode', child.id)"
              >
                <CopyPlus class="w-3 h-3" />
              </button>
              <button
                type="button"
                class="p-1 text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 cursor-pointer"
                @click="emit('removeNode', child.id)"
              >
                <Trash2 class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- 展开官方文档语法/默认值提示 -->
          <div
            v-if="expandedHelpId === child.id && getDirectiveHint(child)"
            class="mt-1 p-2 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-[11px] flex flex-col gap-1"
          >
            <div class="font-mono text-zinc-700 dark:text-zinc-200 break-all">
              <span class="text-zinc-400">Syntax:</span> {{ getDirectiveHint(child)?.syntax }}
            </div>
            <div class="flex flex-wrap gap-3 text-zinc-500 dark:text-zinc-400">
              <span><strong>Default:</strong> {{ getDirectiveHint(child)?.default }}</span>
              <span><strong>Context:</strong> {{ getDirectiveHint(child)?.contexts.join(', ') }}</span>
              <span><strong>Module:</strong> {{ getDirectiveHint(child)?.module }}</span>
            </div>
            <p v-if="getDirectiveHint(child)?.summary" class="text-zinc-600 dark:text-zinc-300 leading-relaxed">
              {{ getDirectiveHint(child)?.summary }}
            </p>
          </div>
        </div>

        <!-- 递归子块 -->
        <NginxBlockTree
          v-else
          :node="child"
          :selected-block-id="selectedBlockId"
          :can-move-up="index > 0"
          :can-move-down="index < node.children.length - 1"
          :chain="currentChain"
          @select-block="emit('selectBlock', $event)"
          @add-quick-directive="(bid, name) => emit('addQuickDirective', bid, name)"
          @add-child-block="(bid, name, args) => emit('addChildBlock', bid, name, args)"
          @remove-node="emit('removeNode', $event)"
          @duplicate-node="emit('duplicateNode', $event)"
          @move-node="(nid, dir) => emit('moveNode', nid, dir)"
          @open-catalog-for-block="emit('openCatalogForBlock', $event)"
        />
      </template>
    </div>
  </div>
</template>
