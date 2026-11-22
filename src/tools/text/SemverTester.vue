<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Tags,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  XCircle,
  AlertCircle,
  ArrowUpDown,
  ArrowRight,
  ArrowLeftRight,
  Copy,
  Check,
  BookOpen,
  TrendingUp,
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import {
  SEMVER_PRESETS,
  bumpSemVer,
  compareSemVer,
  diffSemVer,
  evaluateRangeMatch,
  parseSemVer,
  parseSemVerRange,
  type ParsedSemVer,
  type SemVerBumpType,
} from './semverUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// ==================== 状态 ====================
const activePresetId = ref(SEMVER_PRESETS[0].id);
const rangeInput = ref(SEMVER_PRESETS[0].range);
const versionsInput = ref(SEMVER_PRESETS[0].versions.join('\n'));
const includePrerelease = ref(false);
const looseMode = ref(true);
const resultFilter = ref<'all' | 'matched' | 'excluded'>('all');
const sortDirection = ref<'desc' | 'asc'>('desc');
const copiedMatched = ref(false);

// 版本对比器状态
const compareVersionA = ref('1.2.3');
const compareVersionB = ref('1.4.0-beta.1');

// 版本递增器状态
const bumpBaseInput = ref('1.2.3');
const bumpPreId = ref('alpha');

// ==================== 范围与批量匹配计算 ====================
const parsedRange = computed(() => parseSemVerRange(rangeInput.value));

interface EvaluatedVersionRow {
  raw: string;
  parsed: ParsedSemVer | null;
  satisfied: boolean;
  reasonZh: string;
  reasonEn: string;
}

const evaluatedRows = computed<EvaluatedVersionRow[]>(() => {
  const tokens = versionsInput.value
    .split(/[\n,;]+/)
    .map(s => s.trim())
    .filter(Boolean);

  return tokens.map(raw => {
    const parsed = parseSemVer(raw, looseMode.value);
    if (!parsed) {
      return {
        raw,
        parsed: null,
        satisfied: false,
        reasonZh: looseMode.value
          ? '无法解析为有效版本'
          : '不符合严格 SemVer 2.0.0 格式（如不能含 v 前缀或省略补丁号）',
        reasonEn: looseMode.value
          ? 'Invalid version syntax'
          : 'Invalid strict SemVer 2.0.0 format (no leading "v" or omitted patch)',
      };
    }
    const res = evaluateRangeMatch(parsed, parsedRange.value, includePrerelease.value);
    return {
      raw,
      parsed,
      satisfied: res.satisfied,
      reasonZh: res.reasonZh,
      reasonEn: res.reasonEn,
    };
  });
});

const matchedRows = computed(() => evaluatedRows.value.filter(r => r.satisfied && r.parsed));

const maxSatisfying = computed(() => {
  if (matchedRows.value.length === 0) return null;
  let best = matchedRows.value[0];
  for (const row of matchedRows.value) {
    if (row.parsed && best.parsed && compareSemVer(row.parsed, best.parsed) > 0) {
      best = row;
    }
  }
  return best.raw;
});

const minSatisfying = computed(() => {
  if (matchedRows.value.length === 0) return null;
  let best = matchedRows.value[0];
  for (const row of matchedRows.value) {
    if (row.parsed && best.parsed && compareSemVer(row.parsed, best.parsed) < 0) {
      best = row;
    }
  }
  return best.raw;
});

const filteredRows = computed(() => {
  if (resultFilter.value === 'matched') {
    return evaluatedRows.value.filter(r => r.satisfied);
  }
  if (resultFilter.value === 'excluded') {
    return evaluatedRows.value.filter(r => !r.satisfied);
  }
  return evaluatedRows.value;
});

// ==================== 对比器与递增器计算 ====================
const comparisonResult = computed(() => {
  const a = parseSemVer(compareVersionA.value, looseMode.value);
  const b = parseSemVer(compareVersionB.value, looseMode.value);
  if (!a || !b) return null;

  const diff = diffSemVer(a, b);
  const caretRange = parseSemVerRange(`^${a.canonical}`);
  const tildeRange = parseSemVerRange(`~${a.canonical}`);
  const caretSatisfies = evaluateRangeMatch(b, caretRange, includePrerelease.value).satisfied;
  const tildeSatisfies = evaluateRangeMatch(b, tildeRange, includePrerelease.value).satisfied;

  return {
    a,
    b,
    cmp: diff.cmp,
    kind: diff.kind,
    caretRange: `^${a.canonical}`,
    tildeRange: `~${a.canonical}`,
    caretSatisfies,
    tildeSatisfies,
  };
});

const bumpResults = computed(() => {
  const base = parseSemVer(bumpBaseInput.value, looseMode.value);
  if (!base) return null;
  const types: SemVerBumpType[] = [
    'patch',
    'minor',
    'major',
    'prerelease',
    'prepatch',
    'preminor',
    'premajor',
  ];
  return types.map(type => ({
    type,
    next: bumpSemVer(base, type, bumpPreId.value),
  }));
});

// ==================== 交互操作 ====================
function applyPreset(presetId: string) {
  const found = SEMVER_PRESETS.find(p => p.id === presetId);
  if (!found) return;
  activePresetId.value = presetId;
  rangeInput.value = found.range;
  versionsInput.value = found.versions.join('\n');
}

function resetCurrentPreset() {
  applyPreset(activePresetId.value);
}

function insertRangeExample(expr: string) {
  rangeInput.value = expr;
}

function sortCandidateVersions() {
  const dir = sortDirection.value === 'desc' ? -1 : 1;
  const valid: Array<{ raw: string; parsed: ParsedSemVer }> = [];
  const invalid: string[] = [];

  for (const row of evaluatedRows.value) {
    if (row.parsed) valid.push({ raw: row.raw, parsed: row.parsed });
    else invalid.push(row.raw);
  }

  valid.sort((a, b) => dir * compareSemVer(a.parsed, b.parsed));
  versionsInput.value = [...valid.map(v => v.raw), ...invalid].join('\n');
  sortDirection.value = sortDirection.value === 'desc' ? 'asc' : 'desc';
}

function deduplicateVersions() {
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const line of versionsInput.value.split(/[\n,;]+/)) {
    const tLine = line.trim();
    if (tLine && !seen.has(tLine)) {
      seen.add(tLine);
      unique.push(tLine);
    }
  }
  versionsInput.value = unique.join('\n');
}

async function copyMatchedVersions() {
  if (matchedRows.value.length === 0) return;
  try {
    await navigator.clipboard.writeText(matchedRows.value.map(r => r.raw).join('\n'));
    copiedMatched.value = true;
    setTimeout(() => {
      copiedMatched.value = false;
    }, 1800);
  } catch {
    // Ignore clipboard error
  }
}

function swapCompareVersions() {
  const tmp = compareVersionA.value;
  compareVersionA.value = compareVersionB.value;
  compareVersionB.value = tmp;
}
</script>

<template>
  <ToolContainer
    tool-id="semver-tester"
    name-key="tools.semverTester.name"
    desc-key="tools.semverTester.desc"
    :icon="Tags"
    :full-height="false"
    wide
  >
    <template #header-actions>
      <button
        type="button"
        @click="resetCurrentPreset"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>{{ t('common.reset') }}</span>
      </button>
    </template>

    <!-- 快捷场景预设 -->
    <div
      class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 px-3.5 py-2.5 flex flex-wrap items-center gap-2"
    >
      <span class="text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 flex items-center gap-1 mr-1">
        <Sparkles class="w-3.5 h-3.5 text-blue-500" />
        {{ t('tools.semverTester.presetsLabel') }}:
      </span>
      <button
        v-for="preset in SEMVER_PRESETS"
        :key="preset.id"
        type="button"
        @click="applyPreset(preset.id)"
        :title="isZh ? preset.descZh : preset.descEn"
        class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer border"
        :class="
          activePresetId === preset.id
            ? 'bg-blue-50 dark:bg-blue-950/50 border-blue-400/70 dark:border-blue-700 text-blue-700 dark:text-blue-300'
            : 'bg-zinc-50 dark:bg-zinc-800/70 border-zinc-200/80 dark:border-zinc-700/70 text-zinc-600 dark:text-zinc-300 hover:border-blue-400/60'
        "
      >
        {{ isZh ? preset.nameZh : preset.nameEn }}
      </button>
    </div>

    <!-- 主工作区 -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
      <!-- 左侧：范围测试与批量版本评估 (7 cols) -->
      <div class="xl:col-span-7 flex flex-col gap-3.5 min-w-0">
        <!-- 1. 范围表达式卡片 -->
        <section
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-3 text-xs"
        >
          <div class="flex flex-wrap items-center justify-between gap-2">
            <label class="font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
              {{ t('tools.semverTester.rangeExpressionLabel') }}
            </label>
            <div class="flex flex-wrap items-center gap-3">
              <label class="inline-flex items-center gap-1.5 cursor-pointer text-zinc-600 dark:text-zinc-300">
                <input v-model="includePrerelease" type="checkbox" class="accent-blue-600" />
                <span>{{ t('tools.semverTester.includePrerelease') }}</span>
              </label>
              <label class="inline-flex items-center gap-1.5 cursor-pointer text-zinc-600 dark:text-zinc-300">
                <input v-model="looseMode" type="checkbox" class="accent-blue-600" />
                <span>{{ t('tools.semverTester.looseMode') }}</span>
              </label>
            </div>
          </div>

          <input
            v-model="rangeInput"
            type="text"
            placeholder="^1.2.3 || >=2.0.0 <3.0.0"
            class="w-full min-w-0 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/70 px-3.5 py-2.5 text-sm font-mono text-zinc-900 dark:text-zinc-100 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
          />

          <!-- 语法错误提示 或 规范化展开结果 -->
          <div
            v-if="parsedRange.errors.length > 0"
            class="rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 px-3 py-2 text-rose-700 dark:text-rose-300 font-mono flex items-center gap-2"
          >
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ parsedRange.errors.join('; ') }}</span>
          </div>
          <div
            v-else
            class="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800 px-3 py-2"
          >
            <div class="flex items-center gap-2 min-w-0">
              <span class="text-[11px] text-zinc-400 shrink-0">{{ t('tools.semverTester.expandedBounds') }}:</span>
              <code class="font-mono text-blue-600 dark:text-blue-400 break-all">{{ parsedRange.normalized }}</code>
            </div>
            <CopyButton :text="parsedRange.normalized" />
          </div>

          <!-- 快捷语法模板条 -->
          <div class="flex flex-wrap items-center gap-1.5">
            <span class="text-[11px] text-zinc-400 mr-1">{{ t('tools.semverTester.quickSyntax') }}:</span>
            <button
              v-for="ex in ['^1.2.3', '~1.2.3', '^0.2.3', '>=1.2.0 <2.0.0', '1.2.x', '1.2.0 - 2.0.0', '^1.5.0 || ^2.0.0']"
              :key="ex"
              type="button"
              @click="insertRangeExample(ex)"
              class="px-2 py-0.5 rounded-md font-mono text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 dark:hover:text-blue-400 cursor-pointer"
            >
              {{ ex }}
            </button>
          </div>
        </section>

        <!-- 2. 候选版本输入与匹配明细 -->
        <section
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-3 text-xs"
        >
          <!-- 汇总指标栏 -->
          <div class="grid grid-cols-3 gap-2">
            <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border border-zinc-200/60 dark:border-zinc-800">
              <div class="text-[10px] text-zinc-400 uppercase">{{ t('tools.semverTester.matchedCount') }}</div>
              <div class="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {{ matchedRows.length }} / {{ evaluatedRows.length }}
              </div>
            </div>
            <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border border-zinc-200/60 dark:border-zinc-800">
              <div class="text-[10px] text-zinc-400 uppercase">{{ t('tools.semverTester.maxSatisfying') }}</div>
              <div class="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                {{ maxSatisfying || '-' }}
              </div>
            </div>
            <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 px-3 py-2 border border-zinc-200/60 dark:border-zinc-800">
              <div class="text-[10px] text-zinc-400 uppercase">{{ t('tools.semverTester.minSatisfying') }}</div>
              <div class="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 truncate">
                {{ minSatisfying || '-' }}
              </div>
            </div>
          </div>

          <!-- 候选版本列表输入 -->
          <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <div class="lg:col-span-5 flex flex-col gap-2">
              <div class="flex flex-wrap items-center justify-between gap-1">
                <span class="font-semibold text-zinc-700 dark:text-zinc-200">
                  {{ t('tools.semverTester.candidateVersions') }}
                </span>
                <div class="flex items-center gap-1">
                  <button
                    type="button"
                    @click="sortCandidateVersions"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300 hover:text-blue-600 cursor-pointer"
                    :title="t('tools.semverTester.sortHint')"
                  >
                    <ArrowUpDown class="w-3 h-3" />
                    <span>{{ sortDirection === 'desc' ? 'Desc' : 'Asc' }}</span>
                  </button>
                  <button
                    type="button"
                    @click="deduplicateVersions"
                    class="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300 hover:text-blue-600 cursor-pointer"
                  >
                    {{ t('tools.semverTester.dedup') }}
                  </button>
                </div>
              </div>
              <textarea
                v-model="versionsInput"
                rows="10"
                placeholder="1.0.0&#10;1.2.3&#10;2.0.0-alpha.1"
                class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950/70 p-2.5 font-mono text-xs text-zinc-800 dark:text-zinc-100 focus:outline-none focus:border-blue-500 resize-y"
              />
            </div>

            <!-- 匹配结果明细 -->
            <div class="lg:col-span-7 flex flex-col gap-2 min-w-0">
              <div class="flex flex-wrap items-center justify-between gap-2">
                <div class="inline-flex rounded-lg p-0.5 bg-zinc-100 dark:bg-zinc-800 text-[11px]">
                  <button
                    v-for="f in [
                      { id: 'all', label: t('tools.semverTester.filterAll') },
                      { id: 'matched', label: t('tools.semverTester.filterMatched') },
                      { id: 'excluded', label: t('tools.semverTester.filterExcluded') },
                    ]"
                    :key="f.id"
                    type="button"
                    @click="resultFilter = f.id as any"
                    class="px-2 py-0.5 rounded-md cursor-pointer"
                    :class="resultFilter === f.id ? 'bg-white dark:bg-zinc-700 font-medium shadow-2xs' : 'text-zinc-500'"
                  >
                    {{ f.label }}
                  </button>
                </div>

                <button
                  type="button"
                  @click="copyMatchedVersions"
                  :disabled="matchedRows.length === 0"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] text-zinc-600 dark:text-zinc-300 hover:text-blue-600 cursor-pointer disabled:opacity-40"
                >
                  <Check v-if="copiedMatched" class="w-3 h-3 text-emerald-500" />
                  <Copy v-else class="w-3 h-3" />
                  <span>{{ t('tools.semverTester.copyMatched') }}</span>
                </button>
              </div>

              <div class="space-y-1.5 max-h-[270px] overflow-y-auto pr-0.5">
                <div
                  v-for="(row, idx) in filteredRows"
                  :key="`${row.raw}-${idx}`"
                  class="rounded-xl border px-2.5 py-2 flex items-start justify-between gap-2"
                  :class="
                    !row.parsed
                      ? 'border-rose-200/80 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/20'
                      : row.satisfied
                        ? 'border-emerald-200/80 dark:border-emerald-900/50 bg-emerald-50/50 dark:bg-emerald-950/20'
                        : 'border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40'
                  "
                >
                  <div class="flex items-start gap-2 min-w-0">
                    <CheckCircle2
                      v-if="row.satisfied"
                      class="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                    />
                    <AlertCircle
                      v-else-if="!row.parsed"
                      class="w-4 h-4 text-rose-500 shrink-0 mt-0.5"
                    />
                    <XCircle
                      v-else
                      class="w-4 h-4 text-zinc-400 shrink-0 mt-0.5"
                    />
                    <div class="min-w-0">
                      <div class="flex flex-wrap items-center gap-1.5">
                        <span class="font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                          {{ row.raw }}
                        </span>
                        <span
                          v-if="row.raw === maxSatisfying"
                          class="px-1.5 py-0.2 rounded bg-emerald-600 text-white text-[10px] font-semibold"
                        >
                          MAX
                        </span>
                        <span
                          v-if="row.raw === minSatisfying && minSatisfying !== maxSatisfying"
                          class="px-1.5 py-0.2 rounded bg-blue-600 text-white text-[10px] font-semibold"
                        >
                          MIN
                        </span>
                      </div>
                      <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {{ isZh ? row.reasonZh : row.reasonEn }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- 右侧：双版本对比、Bump 递增计算与语法速查 (5 cols) -->
      <div class="xl:col-span-5 flex flex-col gap-3.5 min-w-0 xl:sticky xl:top-0">
        <!-- 1. 双版本大小对比与升级风险 -->
        <section
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-3 text-xs"
        >
          <div class="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
            <ArrowLeftRight class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{{ t('tools.semverTester.compareTitle') }}</span>
          </div>

          <div class="grid grid-cols-11 gap-2 items-center">
            <input
              v-model="compareVersionA"
              type="text"
              placeholder="1.2.3"
              class="col-span-5 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
            />
            <button
              type="button"
              @click="swapCompareVersions"
              class="col-span-1 p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 flex justify-center cursor-pointer"
              :title="t('tools.semverTester.swap')"
            >
              <ArrowLeftRight class="w-3.5 h-3.5 text-zinc-500" />
            </button>
            <input
              v-model="compareVersionB"
              type="text"
              placeholder="1.4.0-beta.1"
              class="col-span-5 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
            />
          </div>

          <div
            v-if="comparisonResult"
            class="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/70 dark:border-zinc-800 p-3 space-y-2"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="font-mono font-bold text-sm text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                <span>{{ comparisonResult.a.canonical }}</span>
                <span class="px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                  {{ comparisonResult.cmp < 0 ? '<' : comparisonResult.cmp > 0 ? '>' : '==' }}
                </span>
                <span>{{ comparisonResult.b.canonical }}</span>
              </div>
              <span
                class="px-2 py-0.5 rounded-full text-[11px] font-medium"
                :class="
                  comparisonResult.kind === 'major' || comparisonResult.kind === 'downgrade'
                    ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300'
                    : 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300'
                "
              >
                {{ t(`tools.semverTester.diffKinds.${comparisonResult.kind}`) }}
              </span>
            </div>

            <div class="grid grid-cols-2 gap-2 pt-1 text-[11px]">
              <div class="flex items-center gap-1.5">
                <CheckCircle2 v-if="comparisonResult.caretSatisfies" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <XCircle v-else class="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span class="font-mono truncate">{{ comparisonResult.caretRange }}</span>
              </div>
              <div class="flex items-center gap-1.5">
                <CheckCircle2 v-if="comparisonResult.tildeSatisfies" class="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <XCircle v-else class="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                <span class="font-mono truncate">{{ comparisonResult.tildeRange }}</span>
              </div>
            </div>
          </div>
          <div v-else class="text-rose-500 text-[11px]">
            {{ t('tools.semverTester.invalidCompareInput') }}
          </div>
        </section>

        <!-- 2. 版本号递增 (Bump) 计算器 -->
        <section
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-3 text-xs"
        >
          <div class="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
            <TrendingUp class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{{ t('tools.semverTester.bumpTitle') }}</span>
          </div>

          <div class="grid grid-cols-12 gap-2">
            <div class="col-span-7">
              <label class="block text-[10px] text-zinc-400 mb-1">{{ t('tools.semverTester.baseVersion') }}</label>
              <input
                v-model="bumpBaseInput"
                type="text"
                placeholder="1.2.3"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
              />
            </div>
            <div class="col-span-5">
              <label class="block text-[10px] text-zinc-400 mb-1">{{ t('tools.semverTester.preId') }}</label>
              <input
                v-model="bumpPreId"
                type="text"
                placeholder="alpha"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>

          <div v-if="bumpResults" class="grid grid-cols-2 gap-1.5">
            <div
              v-for="item in bumpResults"
              :key="item.type"
              class="flex items-center justify-between gap-2 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 px-2.5 py-1.5"
            >
              <button
                type="button"
                @click="bumpBaseInput = item.next"
                class="text-left min-w-0 flex-1 cursor-pointer group"
                :title="t('tools.semverTester.clickToSetBase')"
              >
                <div class="text-[10px] text-zinc-400 uppercase">{{ item.type }}</div>
                <div class="font-mono font-semibold text-zinc-800 dark:text-zinc-100 group-hover:text-blue-600 truncate">
                  {{ item.next }}
                </div>
              </button>
              <CopyButton :text="item.next" variant="icon" />
            </div>
          </div>
        </section>

        <!-- 3. 范围语法速查 -->
        <section
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-2.5 text-xs"
        >
          <div class="flex items-center gap-2 font-bold text-zinc-800 dark:text-zinc-100 uppercase tracking-wide">
            <BookOpen class="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{{ t('tools.semverTester.cheatSheetTitle') }}</span>
          </div>
          <div class="space-y-1.5 text-[11px]">
            <div
              v-for="row in [
                { expr: '^1.2.3', desc: '>=1.2.3 <2.0.0-0', note: t('tools.semverTester.cheatCaret') },
                { expr: '^0.2.3', desc: '>=0.2.3 <0.3.0-0', note: t('tools.semverTester.cheatCaretZero') },
                { expr: '^0.0.3', desc: '>=0.0.3 <0.0.4-0', note: t('tools.semverTester.cheatCaretZeroZero') },
                { expr: '~1.2.3', desc: '>=1.2.3 <1.3.0-0', note: t('tools.semverTester.cheatTilde') },
                { expr: '1.2.3 - 2.3.4', desc: '>=1.2.3 <=2.3.4', note: t('tools.semverTester.cheatHyphen') },
              ]"
              :key="row.expr"
              class="flex flex-wrap items-center justify-between gap-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 px-2.5 py-1.5"
            >
              <div class="flex items-center gap-1.5 font-mono">
                <span class="font-semibold text-blue-600 dark:text-blue-400">{{ row.expr }}</span>
                <ArrowRight class="w-3 h-3 text-zinc-400" />
                <span class="text-zinc-700 dark:text-zinc-200">{{ row.desc }}</span>
              </div>
              <span class="text-zinc-400">{{ row.note }}</span>
            </div>
          </div>
        </section>
      </div>
    </div>
  </ToolContainer>
</template>
