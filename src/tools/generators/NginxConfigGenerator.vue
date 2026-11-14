<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ServerCog,
  FileDown,
  Upload,
  RotateCcw,
  Layers,
  BookOpen,
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  X,
  Check,
  ExternalLink,
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import NginxBlockTree from './components/NginxBlockTree.vue';
import NginxDirectiveCatalog from './components/NginxDirectiveCatalog.vue';
import { downloadFile } from '../../utils/download';
import { openExternalLink } from '../../utils/openUrl';
import {
  NGINX_DIRECTIVES,
  NGINX_DOCS_BASE_URL,
  type NginxDirectiveDoc,
} from './data/nginxDirectives';
import {
  NGINX_PRESETS,
  createBlockNode,
  createDirectiveNode,
  findBlockAndPath,
  findParentBlock,
  generateNginxConfig,
  isDirectiveCompatibleWithBlock,
  lintNginxConfig,
  nextNodeId,
  parseNginxConfig,
  suggestDirectiveStarter,
  type NginxBlockNode,
  type NginxConfigNode,
  type NginxFormatOptions,
} from './nginxUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// 默认加载反向代理 + WebSocket 预设
const activePresetId = ref('reverse-proxy');
const configRoot = ref<NginxBlockNode>(NGINX_PRESETS[0].build());
const selectedBlockId = ref<string>(findFirstDefaultBlockId(configRoot.value));

// 左侧视图切换：结构树 / 官网 1009 全量指令库
const leftTab = ref<'structure' | 'catalog'>('structure');

// 快速搜索并添加官网指令（结构视图内联入口）
const quickSearch = ref('');

// 格式化选项
const indentSize = ref<NginxFormatOptions['indentSize']>(4);
const includeDisabledAsComments = ref(true);
const includeHeaderComment = ref(true);

// 反馈状态与弹窗状态
const addedFeedback = ref<string | null>(null);
const isExported = ref(false);
let exportTimer: ReturnType<typeof setTimeout> | null = null;
const showDiagnostics = ref(true);
const showImportModal = ref(false);
const importRawText = ref('');
const importErrors = ref<string[]>([]);

function findFirstDefaultBlockId(root: NginxBlockNode): string {
  // 优先选中第一个 location 或 server 块，方便用户直接开始修改常用指令
  for (const child of root.children) {
    if (child.kind === 'block' && child.name === 'http') {
      for (const sub of child.children) {
        if (sub.kind === 'block' && sub.name === 'server') {
          const loc = sub.children.find(
            (n): n is NginxBlockNode => n.kind === 'block' && n.name === 'location',
          );
          return loc ? loc.id : sub.id;
        }
      }
      return child.id;
    }
  }
  return root.id;
}

function cloneNode(node: NginxConfigNode): NginxConfigNode {
  if (node.kind === 'directive') {
    return {
      ...node,
      id: nextNodeId('dir'),
    };
  }
  return {
    ...node,
    id: nextNodeId('blk'),
    children: node.children.map(cloneNode),
  };
}

const activeBlockInfo = computed(() => {
  return (
    findBlockAndPath(configRoot.value, selectedBlockId.value) ?? {
      block: configRoot.value,
      chain: ['main'],
    }
  );
});

const activeBlockChain = computed(() => activeBlockInfo.value.chain);
const activeBlockLabel = computed(() => activeBlockChain.value.join(' > '));

const indentOptions = computed<SelectOption[]>(() => [
  { label: isZh.value ? '2 空格' : '2 Spaces', value: 2 },
  { label: isZh.value ? '4 空格' : '4 Spaces', value: 4 },
  { label: 'Tab', value: 'tab' },
]);

const generatedConfig = computed(() =>
  generateNginxConfig(configRoot.value, {
    indentSize: indentSize.value,
    includeDisabledAsComments: includeDisabledAsComments.value,
    includeHeaderComment: includeHeaderComment.value,
  }),
);

const diagnostics = computed(() => lintNginxConfig(configRoot.value));

const quickSearchMatches = computed(() => {
  const kw = quickSearch.value.trim().toLowerCase();
  if (!kw) return [];
  const exactMatches: NginxDirectiveDoc[] = [];
  const partialMatches: NginxDirectiveDoc[] = [];

  for (const doc of NGINX_DIRECTIVES) {
    if (!isDirectiveCompatibleWithBlock(doc, activeBlockChain.value)) continue;
    const lowerName = doc.name.toLowerCase();
    if (lowerName.startsWith(kw)) {
      exactMatches.push(doc);
    } else if (lowerName.includes(kw) || doc.module.toLowerCase().includes(kw)) {
      partialMatches.push(doc);
    }
    if (exactMatches.length + partialMatches.length >= 10) break;
  }

  return [...exactMatches, ...partialMatches].slice(0, 8);
});

const totalLines = computed(() => generatedConfig.value.split('\n').length);

function notifyAdded(label: string) {
  addedFeedback.value = isZh.value
    ? `已添加 ${label} 到 ${activeBlockLabel.value}`
    : `Added ${label} to ${activeBlockLabel.value}`;
  setTimeout(() => {
    addedFeedback.value = null;
  }, 2200);
}

function applyPreset(presetId: string) {
  const preset = NGINX_PRESETS.find((p) => p.id === presetId);
  if (!preset) return;
  activePresetId.value = presetId;
  configRoot.value = preset.build();
  selectedBlockId.value = findFirstDefaultBlockId(configRoot.value);
}

function handleSelectBlock(blockId: string) {
  selectedBlockId.value = blockId;
}

function insertNodeIntoBlock(blockId: string, node: NginxConfigNode, selectIfBlock = true) {
  const found = findBlockAndPath(configRoot.value, blockId);
  const target = found ? found.block : configRoot.value;
  target.children.push(node);
  if (node.kind === 'block' && selectIfBlock) {
    selectedBlockId.value = node.id;
  }
}

function handleAddDirectiveDoc(doc: NginxDirectiveDoc, targetBlockId = activeBlockInfo.value.block.id) {
  const starter = suggestDirectiveStarter(doc);
  if (starter.isBlock) {
    const newBlk = createBlockNode(doc.name, starter.args, starter.children ?? []);
    insertNodeIntoBlock(targetBlockId, newBlk, true);
    notifyAdded(`${doc.name} { }`);
  } else {
    const newDir = createDirectiveNode(doc.name, starter.value);
    insertNodeIntoBlock(targetBlockId, newDir, false);
    notifyAdded(doc.name);
  }
}

function handleAddQuickDirective(blockId: string, name: string) {
  const docs = NGINX_DIRECTIVES.filter((d) => d.name === name);
  const matched =
    docs.find((d) => isDirectiveCompatibleWithBlock(d, activeBlockChain.value)) ?? docs[0];
  if (matched) {
    handleAddDirectiveDoc(matched, blockId);
  } else {
    insertNodeIntoBlock(blockId, createDirectiveNode(name, ''), false);
    notifyAdded(name);
  }
}

function handleAddChildBlock(blockId: string, name: string, defaultArgs: string) {
  const docs = NGINX_DIRECTIVES.filter((d) => d.name === name && d.isBlock);
  const matched =
    docs.find((d) => isDirectiveCompatibleWithBlock(d, activeBlockChain.value)) ?? docs[0];
  if (matched) {
    const starter = suggestDirectiveStarter(matched);
    const blk = createBlockNode(name, defaultArgs || starter.args, starter.children ?? []);
    insertNodeIntoBlock(blockId, blk, true);
  } else {
    insertNodeIntoBlock(blockId, createBlockNode(name, defaultArgs, []), true);
  }
  notifyAdded(`${name} { }`);
}

function handleAddCustomDirective(payload: { name: string; value: string; isBlock: boolean }) {
  const targetId = activeBlockInfo.value.block.id;
  if (payload.isBlock) {
    insertNodeIntoBlock(targetId, createBlockNode(payload.name, payload.value, []), true);
    notifyAdded(`${payload.name} { }`);
  } else {
    insertNodeIntoBlock(targetId, createDirectiveNode(payload.name, payload.value), false);
    notifyAdded(payload.name);
  }
}

function handleRemoveNode(nodeId: string) {
  const found = findParentBlock(configRoot.value, nodeId);
  if (!found) return;
  found.parent.children.splice(found.index, 1);
  if (selectedBlockId.value === nodeId || !findBlockAndPath(configRoot.value, selectedBlockId.value)) {
    selectedBlockId.value = found.parent.id;
  }
}

function handleDuplicateNode(nodeId: string) {
  const found = findParentBlock(configRoot.value, nodeId);
  if (!found) return;
  const copy = cloneNode(found.parent.children[found.index]);
  found.parent.children.splice(found.index + 1, 0, copy);
}

function handleMoveNode(nodeId: string, direction: -1 | 1) {
  const found = findParentBlock(configRoot.value, nodeId);
  if (!found) return;
  const { parent, index } = found;
  const nextIndex = index + direction;
  if (nextIndex < 0 || nextIndex >= parent.children.length) return;
  const [item] = parent.children.splice(index, 1);
  parent.children.splice(nextIndex, 0, item);
}

function handleOpenCatalogForBlock(blockId: string) {
  selectedBlockId.value = blockId;
  leftTab.value = 'catalog';
}

function handleDownloadConfig() {
  downloadFile(generatedConfig.value, 'nginx.conf', 'text/plain;charset=utf-8');
  isExported.value = true;
  if (exportTimer) clearTimeout(exportTimer);
  exportTimer = setTimeout(() => {
    isExported.value = false;
    exportTimer = null;
  }, 2600);
}

function handleOpenImport() {
  importRawText.value = generatedConfig.value;
  importErrors.value = [];
  showImportModal.value = true;
}

function handleConfirmImport() {
  const { root, errors } = parseNginxConfig(importRawText.value);
  importErrors.value = errors;
  if (errors.length === 0) {
    configRoot.value = root;
    selectedBlockId.value = findFirstDefaultBlockId(root);
    showImportModal.value = false;
  }
}

function handleResetPreset() {
  applyPreset(activePresetId.value);
}
</script>

<template>
  <ToolContainer
    tool-id="nginx-config"
    name-key="tools.nginxConfig.name"
    desc-key="tools.nginxConfig.desc"
    :icon="ServerCog"
    wide
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          @click="openExternalLink(`${NGINX_DOCS_BASE_URL}dirindex.html`)"
        >
          <ExternalLink class="w-3.5 h-3.5 text-blue-500" />
          <span>{{ t('tools.nginxConfig.officialDocsBtn') }}</span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          @click="handleOpenImport"
        >
          <Upload class="w-3.5 h-3.5" />
          <span>{{ t('tools.nginxConfig.importBtn') }}</span>
        </button>

        <button
          type="button"
          class="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          @click="handleResetPreset"
        >
          <RotateCcw class="w-3.5 h-3.5" />
          <span>{{ t('common.reset') }}</span>
        </button>
      </div>
    </template>

    <div class="flex-1 flex flex-col min-h-0 gap-3 overflow-hidden">
      <!-- 场景预设栏 -->
      <div class="flex flex-wrap items-center gap-1.5 shrink-0">
        <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1">
          {{ t('tools.nginxConfig.presetsLabel') }}:
        </span>
        <button
          v-for="preset in NGINX_PRESETS"
          :key="preset.id"
          type="button"
          class="px-2.5 py-1 text-xs font-medium rounded-lg border transition-all cursor-pointer"
          :class="
            activePresetId === preset.id
              ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
              : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'
          "
          :title="t(preset.descKey)"
          @click="applyPreset(preset.id)"
        >
          {{ t(preset.nameKey) }}
        </button>

        <span
          v-if="addedFeedback"
          class="ml-auto inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
        >
          <Check class="w-3.5 h-3.5" />
          <span>{{ addedFeedback }}</span>
        </span>
      </div>

      <!-- 主工作区：左侧可视化树/全量指令库 + 右侧实时配置输出与诊断 -->
      <div class="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-4 overflow-hidden">
        <!-- 左侧面板（7 列） -->
        <div class="lg:col-span-7 flex flex-col min-h-0 gap-3 overflow-hidden">
          <!-- 视图标签切换 + 目标块提示 -->
          <div class="flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div class="inline-flex p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80">
              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer"
                :class="
                  leftTab === 'structure'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                "
                @click="leftTab = 'structure'"
              >
                <Layers class="w-3.5 h-3.5 text-blue-500" />
                <span>{{ t('tools.nginxConfig.tabStructure') }}</span>
              </button>

              <button
                type="button"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg transition-all cursor-pointer"
                :class="
                  leftTab === 'catalog'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
                "
                @click="leftTab = 'catalog'"
              >
                <BookOpen class="w-3.5 h-3.5 text-blue-500" />
                <span>{{ t('tools.nginxConfig.tabCatalog', { count: NGINX_DIRECTIVES.length }) }}</span>
              </button>
            </div>

            <div class="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/60 dark:border-blue-800/60 text-xs">
              <span class="text-zinc-500 dark:text-zinc-400">{{ t('tools.nginxConfig.targetLabel') }}:</span>
              <span class="font-mono font-semibold text-blue-700 dark:text-blue-300">{{ activeBlockLabel }}</span>
            </div>
          </div>

          <!-- 标签1：配置结构树 -->
          <div v-if="leftTab === 'structure'" class="flex-1 min-h-0 flex flex-col gap-2.5 overflow-hidden">
            <!-- 内联搜索官网全部指令直接添加到当前块 -->
            <div class="relative shrink-0">
              <div class="relative">
                <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  v-model="quickSearch"
                  type="text"
                  :placeholder="t('tools.nginxConfig.quickSearchPlaceholder', { block: activeBlockChain[activeBlockChain.length - 1] || 'main' })"
                  class="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500 shadow-2xs"
                />
                <button
                  v-if="quickSearch"
                  type="button"
                  class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
                  @click="quickSearch = ''"
                >
                  <X class="w-3.5 h-3.5" />
                </button>
              </div>

              <!-- 实时匹配下拉列表 -->
              <div
                v-if="quickSearchMatches.length > 0"
                class="absolute z-20 left-0 right-0 mt-1 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-700 shadow-lg max-h-72 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800"
              >
                <div
                  v-for="doc in quickSearchMatches"
                  :key="doc.docPath"
                  class="flex items-center justify-between gap-2 px-3 py-2 hover:bg-blue-50/60 dark:hover:bg-blue-950/30"
                >
                  <div class="min-w-0 flex-1">
                    <div class="flex items-center gap-2">
                      <span class="font-mono text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                        {{ doc.name }}
                      </span>
                      <span class="text-[10px] font-mono text-zinc-400">{{ doc.module }}</span>
                    </div>
                    <div class="text-[11px] font-mono text-zinc-500 dark:text-zinc-400 truncate">
                      {{ doc.syntax }}
                    </div>
                  </div>
                  <button
                    type="button"
                    class="inline-flex items-center gap-1 px-2 py-1 text-[11px] font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white shrink-0 cursor-pointer"
                    @click="handleAddDirectiveDoc(doc); quickSearch = ''"
                  >
                    <Plus class="w-3 h-3" />
                    <span>{{ t('tools.nginxConfig.addButton') }}</span>
                  </button>
                </div>
              </div>
            </div>

            <!-- 递归配置树 -->
            <div class="flex-1 min-h-0 overflow-y-auto pr-1">
              <NginxBlockTree
                :node="configRoot"
                :selected-block-id="selectedBlockId"
                is-root
                @select-block="handleSelectBlock"
                @add-quick-directive="handleAddQuickDirective"
                @add-child-block="handleAddChildBlock"
                @remove-node="handleRemoveNode"
                @duplicate-node="handleDuplicateNode"
                @move-node="handleMoveNode"
                @open-catalog-for-block="handleOpenCatalogForBlock"
              />
            </div>
          </div>

          <!-- 标签2：全量官网 1009 条指令库 -->
          <NginxDirectiveCatalog
            v-else
            :active-block-chain="activeBlockChain"
            @add-directive="handleAddDirectiveDoc"
            @add-custom-directive="handleAddCustomDirective"
          />
        </div>

        <!-- 右侧面板：实时输出 + 语法/上下文校验（5 列） -->
        <div class="lg:col-span-5 flex flex-col min-h-0 gap-3 overflow-hidden">
          <!-- 诊断校验栏 -->
          <div class="rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden shrink-0">
            <button
              type="button"
              class="w-full flex items-center justify-between px-3 py-2 text-xs font-medium cursor-pointer"
              :class="
                diagnostics.length === 0
                  ? 'text-emerald-700 dark:text-emerald-400 bg-emerald-50/60 dark:bg-emerald-950/20'
                  : 'text-amber-800 dark:text-amber-300 bg-amber-50/70 dark:bg-amber-950/25'
              "
              @click="showDiagnostics = !showDiagnostics"
            >
              <div class="flex items-center gap-2">
                <CheckCircle2 v-if="diagnostics.length === 0" class="w-4 h-4 shrink-0" />
                <AlertTriangle v-else class="w-4 h-4 shrink-0" />
                <span>
                  {{
                    diagnostics.length === 0
                      ? t('tools.nginxConfig.lintPassed')
                      : t('tools.nginxConfig.lintCount', { count: diagnostics.length })
                  }}
                </span>
              </div>
              <span v-if="diagnostics.length > 0" class="text-[11px] opacity-75">
                {{ showDiagnostics ? t('common.collapse') : t('common.expand') }}
              </span>
            </button>

            <div
              v-if="diagnostics.length > 0 && showDiagnostics"
              class="max-h-32 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 px-3 py-1"
            >
              <div
                v-for="(diag, i) in diagnostics"
                :key="i"
                class="flex items-start gap-2 py-1.5 text-[11px]"
              >
                <XCircle
                  v-if="diag.level === 'error'"
                  class="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5"
                />
                <AlertTriangle
                  v-else
                  class="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5"
                />
                <span class="text-zinc-700 dark:text-zinc-300">
                  {{ isZh ? diag.messageZh : diag.messageEn }}
                </span>
              </div>
            </div>
          </div>

          <!-- 输出预览卡片 -->
          <div class="flex-1 min-h-0 flex flex-col rounded-xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 overflow-hidden shadow-xs">
            <div class="flex flex-wrap items-center justify-between gap-2 px-3 py-2 border-b border-zinc-200/70 dark:border-zinc-800/70 bg-zinc-50/70 dark:bg-zinc-900/90 shrink-0">
              <div class="flex items-center gap-2">
                <span class="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                  nginx.conf
                </span>
                <span class="text-[11px] font-mono text-zinc-400">
                  {{ totalLines }} {{ isZh ? '行' : 'lines' }}
                </span>
              </div>

              <div class="flex flex-wrap items-center gap-2">
                <CustomSelect v-model="indentSize" :options="indentOptions" size="sm" />

                <label class="inline-flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-300 cursor-pointer">
                  <input
                    v-model="includeDisabledAsComments"
                    type="checkbox"
                    class="accent-blue-600 rounded"
                  />
                  <span>{{ t('tools.nginxConfig.keepDisabledComments') }}</span>
                </label>

                <CopyButton :text="generatedConfig" variant="secondary" size="sm" />

                <button
                  type="button"
                  class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-md text-white transition-colors cursor-pointer"
                  :class="
                    isExported
                      ? 'bg-emerald-600 hover:bg-emerald-600'
                      : 'bg-blue-600 hover:bg-blue-700'
                  "
                  @click="handleDownloadConfig"
                >
                  <Check v-if="isExported" class="w-3.5 h-3.5" />
                  <FileDown v-else class="w-3.5 h-3.5" />
                  <span>{{ isExported ? t('tools.nginxConfig.downloadedBtn') : t('tools.nginxConfig.downloadBtn') }}</span>
                </button>
              </div>
            </div>

            <div
              v-if="isExported"
              class="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 dark:bg-emerald-950/40 border-b border-emerald-200/70 dark:border-emerald-800/50 text-xs text-emerald-700 dark:text-emerald-300 shrink-0"
            >
              <CheckCircle2 class="w-3.5 h-3.5 shrink-0" />
              <span>{{ t('tools.nginxConfig.downloadedNotice') }}</span>
            </div>

            <textarea
              :value="generatedConfig"
              readonly
              spellcheck="false"
              class="flex-1 w-full p-4 font-mono text-xs leading-relaxed bg-zinc-50/40 dark:bg-zinc-950 text-zinc-800 dark:text-zinc-200 resize-none focus:outline-none select-all"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- 导入现有 nginx.conf 弹窗 -->
    <div
      v-if="showImportModal"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4"
      @click.self="showImportModal = false"
    >
      <div class="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl flex flex-col overflow-hidden">
        <div class="flex items-center justify-between px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800">
          <h3 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {{ t('tools.nginxConfig.importModalTitle') }}
          </h3>
          <button
            type="button"
            class="p-1 text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer"
            @click="showImportModal = false"
          >
            <X class="w-4 h-4" />
          </button>
        </div>

        <div class="p-4 flex flex-col gap-3">
          <textarea
            v-model="importRawText"
            rows="14"
            spellcheck="false"
            :placeholder="t('tools.nginxConfig.importPlaceholder')"
            class="w-full p-3 font-mono text-xs rounded-xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-200 focus:outline-none focus:border-blue-500"
          />

          <div
            v-if="importErrors.length > 0"
            class="p-2.5 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-xs text-rose-700 dark:text-rose-300 flex flex-col gap-1"
          >
            <span v-for="(err, idx) in importErrors" :key="idx">{{ err }}</span>
          </div>
        </div>

        <div class="flex items-center justify-end gap-2 px-5 py-3 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900">
          <button
            type="button"
            class="px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
            @click="showImportModal = false"
          >
            {{ t('common.cancel') }}
          </button>
          <button
            type="button"
            class="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white cursor-pointer"
            @click="handleConfirmImport"
          >
            {{ t('tools.nginxConfig.importConfirm') }}
          </button>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
