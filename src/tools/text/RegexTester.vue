<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Regex,
  Replace,
  Code2,
  BookOpen,
  RotateCcw,
  Check,
  Copy,
  AlertCircle,
  X,
  Plus,
  ArrowRight,
  Bookmark
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import {
  REGEX_PRESETS,
  CHEATSHEET_DATA,
  generateCodeSnippet,
  type RegexPreset
} from './regexPresets';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// 核心正则状态
const pattern = ref('[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}');
const flagGlobal = ref(true);
const flagIgnoreCase = ref(false);
const flagMultiline = ref(false);
const flagDotAll = ref(false);
const flagUnicode = ref(false);

// 组合 flags
const flagsStr = computed(() => {
  let f = '';
  if (flagGlobal.value) f += 'g';
  if (flagIgnoreCase.value) f += 'i';
  if (flagMultiline.value) f += 'm';
  if (flagDotAll.value) f += 's';
  if (flagUnicode.value) f += 'u';
  return f;
});

// 测试文本与替换文本
const testText = ref(`Contact our support team at support@devcrate.dev or billing@service.com.
Follow updates on Twitter @devcrate or visit https://devcrate.dev.
Invalid emails: test@.com, user@invalid_domain, test@domain`);
const replacePattern = ref('[$&]');

// 视图 Tab
const activeTab = ref<'matches' | 'replace' | 'code' | 'cheatsheet'>('matches');
const activeCodeLang = ref<'javascript' | 'python' | 'go' | 'rust' | 'java' | 'php'>('javascript');

// 预设弹窗与过滤
const isPresetModalOpen = ref(false);
const selectedPresetCategory = ref<'all' | 'common' | 'network' | 'developer' | 'format'>('all');
const presetSearch = ref('');

// 反馈提示
const copiedRegex = ref(false);
const copiedReplaced = ref(false);

// 编译正则表达式
const compiledRegexInfo = computed(() => {
  const p = pattern.value;
  if (!p) {
    return { regex: null, error: null };
  }
  try {
    const rx = new RegExp(p, flagsStr.value);
    return { regex: rx, error: null };
  } catch (err: any) {
    return { regex: null, error: err.message || 'Invalid regular expression' };
  }
});

// 计算所有匹配项
interface MatchItem {
  index: number;
  start: number;
  end: number;
  fullMatch: string;
  groups: string[];
  namedGroups: Record<string, string> | null;
}

const matchResults = computed(() => {
  const p = pattern.value;
  const text = testText.value;
  const flags = flagsStr.value;

  if (!p || !text) {
    return {
      matches: [] as MatchItem[],
      count: 0,
      executionMs: 0
    };
  }

  const startTime = performance.now();
  const matches: MatchItem[] = [];

  try {
    const rx = new RegExp(p, flags);
    if (flagGlobal.value) {
      // 循环匹配以防零长度死循环
      let match: RegExpExecArray | null;
      let lastIndex = 0;
      let loopCount = 0;
      const maxLoops = 2000;

      rx.lastIndex = 0;
      while ((match = rx.exec(text)) !== null) {
        loopCount++;
        if (loopCount > maxLoops) break;

        const start = match.index;
        const end = start + match[0].length;
        const groups: string[] = [];
        for (let i = 1; i < match.length; i++) {
          groups.push(match[i]);
        }

        matches.push({
          index: matches.length + 1,
          start,
          end,
          fullMatch: match[0],
          groups,
          namedGroups: match.groups ? { ...match.groups } : null
        });

        // 避免零长匹配原地死循环
        if (match[0].length === 0) {
          rx.lastIndex = match.index + 1;
        }
        if (rx.lastIndex <= lastIndex) {
          rx.lastIndex = lastIndex + 1;
        }
        lastIndex = rx.lastIndex;
        if (rx.lastIndex > text.length) break;
      }
    } else {
      // 单次匹配
      const match = rx.exec(text);
      if (match) {
        const start = match.index;
        const end = start + match[0].length;
        const groups: string[] = [];
        for (let i = 1; i < match.length; i++) {
          groups.push(match[i]);
        }
        matches.push({
          index: 1,
          start,
          end,
          fullMatch: match[0],
          groups,
          namedGroups: match.groups ? { ...match.groups } : null
        });
      }
    }
  } catch (e) {
    // 语法错误已在 compiledRegexInfo 中捕获并展示
  }

  const executionMs = Math.round((performance.now() - startTime) * 100) / 100;

  return {
    matches,
    count: matches.length,
    executionMs
  };
});

// 计算高亮分段
interface TextSegment {
  text: string;
  isMatch: boolean;
  matchIndex?: number;
}

const highlightedSegments = computed<TextSegment[]>(() => {
  const text = testText.value;
  const matches = matchResults.value.matches;

  if (matches.length === 0 || !text) {
    return [{ text, isMatch: false }];
  }

  const segments: TextSegment[] = [];
  let currentIdx = 0;

  for (const m of matches) {
    if (m.start < currentIdx) continue;

    if (m.start > currentIdx) {
      segments.push({
        text: text.slice(currentIdx, m.start),
        isMatch: false
      });
    }

    const clampedEnd = Math.min(m.end, text.length);
    segments.push({
      text: text.slice(m.start, clampedEnd),
      isMatch: true,
      matchIndex: m.index
    });

    currentIdx = clampedEnd;
  }

  if (currentIdx < text.length) {
    segments.push({
      text: text.slice(currentIdx),
      isMatch: false
    });
  }

  return segments;
});

// 替换后结果计算
const replacedTextResult = computed(() => {
  const p = pattern.value;
  const text = testText.value;
  if (!p || !text) return text;
  try {
    const rx = new RegExp(p, flagsStr.value);
    return text.replace(rx, replacePattern.value);
  } catch (err: any) {
    return `Error: ${err.message}`;
  }
});

// 复制完整正则表达式
async function copyRegexLiteral() {
  const literal = `/${pattern.value}/${flagsStr.value}`;
  try {
    await navigator.clipboard.writeText(literal);
    copiedRegex.value = true;
    setTimeout(() => {
      copiedRegex.value = false;
    }, 1500);
  } catch (err) {
    console.error('Failed to copy regex', err);
  }
}

// 复制替换文本结果
async function copyReplacedText() {
  try {
    await navigator.clipboard.writeText(replacedTextResult.value);
    copiedReplaced.value = true;
    setTimeout(() => {
      copiedReplaced.value = false;
    }, 1500);
  } catch (err) {
    console.error('Failed to copy replaced text', err);
  }
}

// 将替换结果应用到输入文本
function applyReplacedToInput() {
  testText.value = replacedTextResult.value;
}

// 加载预设
function loadPreset(preset: RegexPreset) {
  pattern.value = preset.pattern;
  flagGlobal.value = preset.flags.includes('g');
  flagIgnoreCase.value = preset.flags.includes('i');
  flagMultiline.value = preset.flags.includes('m');
  flagDotAll.value = preset.flags.includes('s');
  flagUnicode.value = preset.flags.includes('u');
  testText.value = preset.sampleText;
  isPresetModalOpen.value = false;
}

// 插入速查表 Token 到表达式尾部
function insertTokenToPattern(token: string) {
  pattern.value += token;
}

// 清空全部
function clearAll() {
  pattern.value = '';
  testText.value = '';
  replacePattern.value = '';
}

// 过滤后的常用预设
const filteredPresets = computed(() => {
  let list = REGEX_PRESETS;
  if (selectedPresetCategory.value !== 'all') {
    list = list.filter(p => p.category === selectedPresetCategory.value);
  }
  const q = presetSearch.value.trim().toLowerCase();
  if (q) {
    list = list.filter(p => {
      return (
        p.nameZh.toLowerCase().includes(q) ||
        p.nameEn.toLowerCase().includes(q) ||
        p.pattern.toLowerCase().includes(q)
      );
    });
  }
  return list;
});

// 动态生成当前语言的代码片段
const currentCodeSnippet = computed(() => {
  return generateCodeSnippet(
    activeCodeLang.value,
    pattern.value,
    flagsStr.value,
    testText.value
  );
});
</script>

<template>
  <ToolContainer
    toolId="regex-tester"
    nameKey="tools.regexTester.name"
    descKey="tools.regexTester.desc"
    :icon="Regex"
    :wide="true"
    :fullHeight="true"
  >
    <div class="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-white dark:bg-zinc-900">
      <!-- 顶部：表达式输入与 Flags 配置区域 -->
      <div class="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/60 shrink-0 flex flex-col gap-3">
        <!-- 表达式大输入行 -->
        <div class="flex items-center gap-2">
          <div
            class="flex-1 flex items-center px-3.5 py-2.5 rounded-2xl border transition-all bg-white dark:bg-zinc-800/90 shadow-2xs"
            :class="compiledRegexInfo.error ? 'border-rose-400 dark:border-rose-600 ring-2 ring-rose-500/10' : 'border-zinc-200 dark:border-zinc-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/15'"
          >
            <span class="font-mono text-base font-bold text-zinc-400 mr-2 select-none">/</span>
            <input
              v-model="pattern"
              type="text"
              :placeholder="t('tools.regexTester.patternPlaceholder')"
              class="flex-1 font-mono text-sm sm:text-base font-semibold text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none bg-transparent"
            />
            <span class="font-mono text-base font-bold text-zinc-400 ml-2 select-none">/</span>
            <span class="font-mono text-sm font-bold text-blue-600 dark:text-blue-400 ml-1 select-none">
              {{ flagsStr }}
            </span>
          </div>

          <!-- 快速复制与重置 -->
          <div class="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              @click="copyRegexLiteral"
              :title="isZh ? '复制完整正则表达式字面量' : 'Copy regex literal'"
              class="px-2.5 py-2 rounded-xl text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
            >
              <Check v-if="copiedRegex" class="w-3.5 h-3.5 text-emerald-500" />
              <Copy v-else class="w-3.5 h-3.5" />
              <span class="hidden sm:inline">{{ copiedRegex ? t('common.copied') : t('common.copy') }}</span>
            </button>

            <button
              type="button"
              @click="clearAll"
              :title="t('tools.regexTester.clear')"
              class="p-2 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            >
              <RotateCcw class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Flags 切换按钮与预设库按钮 -->
        <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
          <!-- Flags 修饰符 Pills -->
          <div class="flex items-center gap-1.5 flex-wrap">
            <span class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mr-1 select-none">
              {{ t('tools.regexTester.flags') }}:
            </span>

            <button
              type="button"
              @click="flagGlobal = !flagGlobal"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer"
              :class="flagGlobal ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
              :title="t('tools.regexTester.flagGlobal')"
            >
              g
            </button>

            <button
              type="button"
              @click="flagIgnoreCase = !flagIgnoreCase"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer"
              :class="flagIgnoreCase ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
              :title="t('tools.regexTester.flagIgnoreCase')"
            >
              i
            </button>

            <button
              type="button"
              @click="flagMultiline = !flagMultiline"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer"
              :class="flagMultiline ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
              :title="t('tools.regexTester.flagMultiline')"
            >
              m
            </button>

            <button
              type="button"
              @click="flagDotAll = !flagDotAll"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer"
              :class="flagDotAll ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
              :title="t('tools.regexTester.flagDotAll')"
            >
              s
            </button>

            <button
              type="button"
              @click="flagUnicode = !flagUnicode"
              class="px-2.5 py-1 rounded-lg text-xs font-mono font-medium border transition-all cursor-pointer"
              :class="flagUnicode ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
              :title="t('tools.regexTester.flagUnicode')"
            >
              u
            </button>
          </div>

          <!-- 预设库按钮 -->
          <button
            type="button"
            @click="isPresetModalOpen = true"
            class="px-3 py-1.5 rounded-xl text-xs font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200/80 dark:border-blue-900/50 transition-colors cursor-pointer inline-flex items-center gap-1.5 shadow-2xs"
          >
            <Bookmark class="w-3.5 h-3.5 text-blue-500" />
            <span>{{ t('tools.regexTester.presetLibrary') }}</span>
          </button>
        </div>

        <!-- 正则语法错误横幅 -->
        <div
          v-if="compiledRegexInfo.error"
          class="flex items-center gap-2 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ t('tools.regexTester.invalidRegex', { error: compiledRegexInfo.error }) }}</span>
        </div>
      </div>

      <!-- 中部主工作区：Tab 切换与核心内容 -->
      <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <!-- Tab 栏 -->
        <div class="px-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between shrink-0">
          <div class="flex items-center gap-2 -mb-px text-xs font-semibold">
            <button
              type="button"
              @click="activeTab = 'matches'"
              class="px-3 py-3 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5"
              :class="activeTab === 'matches' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            >
              <Regex class="w-4 h-4" />
              <span>{{ t('tools.regexTester.matchesTab') }}</span>
              <span
                v-if="matchResults.count > 0"
                class="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 font-mono"
              >
                {{ matchResults.count }}
              </span>
            </button>

            <button
              type="button"
              @click="activeTab = 'replace'"
              class="px-3 py-3 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5"
              :class="activeTab === 'replace' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            >
              <Replace class="w-4 h-4" />
              <span>{{ t('tools.regexTester.replaceTab') }}</span>
            </button>

            <button
              type="button"
              @click="activeTab = 'code'"
              class="px-3 py-3 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5"
              :class="activeTab === 'code' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            >
              <Code2 class="w-4 h-4" />
              <span>{{ t('tools.regexTester.codeTab') }}</span>
            </button>

            <button
              type="button"
              @click="activeTab = 'cheatsheet'"
              class="px-3 py-3 border-b-2 transition-all cursor-pointer inline-flex items-center gap-1.5"
              :class="activeTab === 'cheatsheet' ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold' : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
            >
              <BookOpen class="w-4 h-4" />
              <span>{{ t('tools.regexTester.cheatsheetTab') }}</span>
            </button>
          </div>

          <!-- 右侧耗时指标 -->
          <div v-if="activeTab === 'matches' && matchResults.count > 0" class="text-[11px] font-mono text-zinc-400 hidden sm:block">
            {{ matchResults.executionMs }} ms
          </div>
        </div>

        <!-- ============================================== -->
        <!-- TAB 1: 实时匹配视图 (Matches View)               -->
        <!-- ============================================== -->
        <div v-if="activeTab === 'matches'" class="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-zinc-200 dark:divide-zinc-800">
          <!-- 左栏：测试文本输入与高亮可视化预览 -->
          <div class="flex-1 flex flex-col min-h-0 overflow-hidden p-4 gap-3 bg-zinc-50/30 dark:bg-zinc-950/20">
            <TextEditorBox
              v-model="testText"
              :label="isZh ? '测试字符串 (Test String)' : 'Test String'"
              :placeholder="t('tools.regexTester.testTextPlaceholder')"
              :showLineNumbers="true"
              :showWrapToggle="true"
              :defaultWrap="true"
              class="flex-1 min-h-[220px]"
            />

            <!-- 匹配高亮预览卡片 -->
            <div class="flex-1 flex flex-col min-h-[160px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
              <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800 text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center justify-between bg-zinc-50/50 dark:bg-zinc-900/50">
                <span>{{ isZh ? '高亮匹配预览' : 'Highlighted Match Preview' }}</span>
                <span class="text-[11px] font-mono text-zinc-400">
                  {{ t('tools.regexTester.matchesCount', { count: matchResults.count }) }}
                </span>
              </div>
              <div class="flex-1 p-3.5 overflow-auto font-mono text-xs leading-relaxed select-text whitespace-pre-wrap break-all">
                <template v-for="(seg, idx) in highlightedSegments" :key="idx">
                  <mark
                    v-if="seg.isMatch"
                    class="bg-blue-100 dark:bg-blue-900/60 text-blue-900 dark:text-blue-100 font-bold px-1 py-0.5 rounded border border-blue-300 dark:border-blue-700 inline-block shadow-2xs"
                    :title="'Match #' + seg.matchIndex"
                  >{{ seg.text }}</mark>
                  <span v-else class="text-zinc-700 dark:text-zinc-300">{{ seg.text }}</span>
                </template>
              </div>
            </div>
          </div>

          <!-- 右栏：匹配详细列表与捕获组拆解 (Matches Breakdown) -->
          <div class="w-full md:w-[380px] lg:w-[440px] flex flex-col min-h-0 bg-white dark:bg-zinc-900 overflow-hidden shrink-0">
            <div class="p-3.5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between text-xs shrink-0 bg-zinc-50/50 dark:bg-zinc-900/50">
              <span class="font-bold text-zinc-900 dark:text-zinc-100">
                {{ t('tools.regexTester.matchesCount', { count: matchResults.count }) }}
              </span>
            </div>

            <div class="flex-1 overflow-y-auto p-3.5 space-y-2.5">
              <div v-if="matchResults.matches.length === 0" class="py-16 text-center text-xs text-zinc-400">
                <Regex class="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>{{ t('tools.regexTester.noMatches') }}</p>
              </div>

              <div
                v-for="m in matchResults.matches"
                :key="m.index"
                class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-800/40 flex flex-col gap-2 transition-colors hover:border-blue-400 dark:hover:border-blue-600"
              >
                <!-- 卡片顶栏 -->
                <div class="flex items-center justify-between text-xs">
                  <div class="flex items-center gap-1.5">
                    <span class="font-bold text-blue-600 dark:text-blue-400 font-mono">#{{ m.index }}</span>
                    <span class="text-[11px] font-mono text-zinc-400">{{ t('tools.regexTester.range', { start: m.start, end: m.end }) }}</span>
                  </div>
                  <CopyButton :text="m.fullMatch" variant="ghost" />
                </div>

                <!-- 完整匹配值 -->
                <div class="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all select-all font-semibold">
                  {{ m.fullMatch }}
                </div>

                <!-- 捕获组 (Capture Groups) -->
                <div v-if="m.groups.length > 0" class="space-y-1.5 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                  <div
                    v-for="(grp, gIdx) in m.groups"
                    :key="gIdx"
                    class="flex items-start gap-2 text-[11px] font-mono"
                  >
                    <span class="text-zinc-400 shrink-0 select-none">
                      {{ t('tools.regexTester.groupIndex', { index: gIdx + 1 }) }}:
                    </span>
                    <span class="text-purple-600 dark:text-purple-400 break-all select-all font-medium">
                      {{ grp !== undefined ? grp : '<undefined>' }}
                    </span>
                  </div>
                </div>

                <!-- 具名捕获组 -->
                <div v-if="m.namedGroups && Object.keys(m.namedGroups).length > 0" class="space-y-1 pt-1 border-t border-zinc-200/60 dark:border-zinc-700/60">
                  <div
                    v-for="(nVal, nKey) in m.namedGroups"
                    :key="nKey"
                    class="flex items-start gap-2 text-[11px] font-mono"
                  >
                    <span class="text-teal-600 dark:text-teal-400 font-semibold shrink-0 select-none">&lt;{{ nKey }}&gt;:</span>
                    <span class="text-zinc-800 dark:text-zinc-200 break-all select-all">{{ nVal }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- TAB 2: 文本替换 (Replace View)                  -->
        <!-- ============================================== -->
        <div v-else-if="activeTab === 'replace'" class="flex-1 flex flex-col p-4 sm:p-6 gap-4 overflow-y-auto">
          <!-- 替换表达式输入栏 -->
          <div class="flex flex-col gap-1.5">
            <label class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              {{ isZh ? '替换表达式 (Substitution Pattern)' : 'Substitution Pattern' }}
            </label>
            <div class="flex items-center gap-2">
              <input
                v-model="replacePattern"
                type="text"
                :placeholder="t('tools.regexTester.replacePlaceholder')"
                class="flex-1 px-3.5 py-2 font-mono text-xs sm:text-sm rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="button"
                @click="applyReplacedToInput"
                class="px-3.5 py-2 rounded-xl text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer inline-flex items-center gap-1.5 shrink-0"
              >
                <ArrowRight class="w-3.5 h-3.5" />
                <span>{{ t('tools.regexTester.applyToInput') }}</span>
              </button>
            </div>
            <span class="text-[11px] text-zinc-400">
              {{ isZh ? '提示：支持使用 $& 代表整段匹配项，$1, $2 代表捕获组，$$ 代表美元符。' : 'Tip: Use $& for whole match, $1, $2 for capture groups, $$ for literal dollar.' }}
            </span>
          </div>

          <!-- 替换前与替换后双栏对比 -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[300px]">
            <!-- 左：源文本 -->
            <div class="flex flex-col gap-1.5">
              <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{{ isZh ? '原始测试文本' : 'Original Text' }}</span>
              <textarea
                v-model="testText"
                class="flex-1 w-full p-3.5 font-mono text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none resize-none min-h-[240px]"
              ></textarea>
            </div>

            <!-- 右：替换预览 -->
            <div class="flex flex-col gap-1.5">
              <div class="flex items-center justify-between">
                <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">{{ t('tools.regexTester.replaceResult') }}</span>
                <button
                  type="button"
                  @click="copyReplacedText"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer inline-flex items-center gap-1.5"
                >
                  <Check v-if="copiedReplaced" class="w-3.5 h-3.5 text-emerald-500" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  <span>{{ copiedReplaced ? t('common.copied') : t('tools.regexTester.copyReplaced') }}</span>
                </button>
              </div>
              <textarea
                :value="replacedTextResult"
                readonly
                class="flex-1 w-full p-3.5 font-mono text-xs rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-800 dark:text-zinc-200 outline-none resize-none min-h-[240px]"
              ></textarea>
            </div>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- TAB 3: 代码片段生成 (Code Generator)            -->
        <!-- ============================================== -->
        <div v-else-if="activeTab === 'code'" class="flex-1 flex flex-col p-4 sm:p-6 gap-4 overflow-y-auto">
          <!-- 语言选择 Pills -->
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700 text-xs">
              <button
                v-for="lang in [
                  { id: 'javascript', label: 'JavaScript' },
                  { id: 'python', label: 'Python' },
                  { id: 'go', label: 'Go' },
                  { id: 'rust', label: 'Rust' },
                  { id: 'java', label: 'Java' },
                  { id: 'php', label: 'PHP' }
                ]"
                :key="lang.id"
                type="button"
                @click="activeCodeLang = lang.id as any"
                class="px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
                :class="activeCodeLang === lang.id ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
              >
                {{ lang.label }}
              </button>
            </div>

            <CopyButton :text="currentCodeSnippet" variant="secondary" />
          </div>

          <!-- 生成代码展示 -->
          <div class="relative flex-1">
            <pre class="p-4 sm:p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 font-mono text-xs sm:text-sm text-zinc-800 dark:text-zinc-200 overflow-x-auto leading-relaxed select-all h-full">{{ currentCodeSnippet }}</pre>
          </div>
        </div>

        <!-- ============================================== -->
        <!-- TAB 4: 语法速查表 (Cheatsheet)                 -->
        <!-- ============================================== -->
        <div v-else-if="activeTab === 'cheatsheet'" class="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          <div
            v-for="cat in CHEATSHEET_DATA"
            :key="cat.categoryZh"
            class="space-y-2.5"
          >
            <h3 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              {{ isZh ? cat.categoryZh : cat.categoryEn }}
            </h3>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              <div
                v-for="item in cat.items"
                :key="item.token"
                class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex items-center justify-between gap-2"
              >
                <div class="flex flex-col min-w-0">
                  <span class="font-mono font-bold text-blue-600 dark:text-blue-400 text-xs">{{ item.token }}</span>
                  <span class="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5 truncate" :title="isZh ? item.descZh : item.descEn">
                    {{ isZh ? item.descZh : item.descEn }}
                  </span>
                </div>

                <button
                  type="button"
                  @click="insertTokenToPattern(item.token)"
                  class="p-1 rounded-md text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer shrink-0"
                  :title="t('tools.regexTester.insertToken')"
                >
                  <Plus class="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 常用正则预设弹窗 (Preset Modal) -->
    <div
      v-if="isPresetModalOpen"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <div class="w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 sm:p-6 flex flex-col max-h-[85vh] gap-4">
        <!-- 弹窗顶栏 -->
        <div class="flex items-center justify-between pb-2 border-b border-zinc-200/80 dark:border-zinc-800/80">
          <div class="flex items-center gap-2">
            <Bookmark class="w-5 h-5 text-blue-500" />
            <div>
              <h2 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                {{ t('tools.regexTester.selectPreset') }}
              </h2>
              <p class="text-xs text-zinc-400 mt-0.5">
                {{ t('tools.regexTester.selectPresetDesc') }}
              </p>
            </div>
          </div>

          <button
            type="button"
            @click="isPresetModalOpen = false"
            class="p-1 rounded-lg text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors cursor-pointer"
          >
            <X class="w-5 h-5" />
          </button>
        </div>

        <!-- 筛选分类与搜索输入 -->
        <div class="flex flex-col sm:flex-row items-center gap-2">
          <div class="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700 text-xs w-full sm:w-auto overflow-x-auto">
            <button
              v-for="cat in [
                { id: 'all', label: isZh ? '全部' : 'All' },
                { id: 'common', label: isZh ? '常用基础' : 'Common' },
                { id: 'network', label: isZh ? '网络' : 'Network' },
                { id: 'developer', label: isZh ? '开发' : 'Dev' },
                { id: 'format', label: isZh ? '格式' : 'Format' }
              ]"
              :key="cat.id"
              type="button"
              @click="selectedPresetCategory = cat.id as any"
              class="px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
              :class="selectedPresetCategory === cat.id ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs' : 'text-zinc-600 dark:text-zinc-400'"
            >
              {{ cat.label }}
            </button>
          </div>

          <div class="relative flex-1 w-full">
            <input
              v-model="presetSearch"
              type="text"
              :placeholder="isZh ? '搜索预设规则名称...' : 'Search presets...'"
              class="w-full px-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <!-- 预设卡片列表 -->
        <div class="flex-1 overflow-y-auto space-y-2 pr-1">
          <div
            v-for="p in filteredPresets"
            :key="p.id"
            @click="loadPreset(p)"
            class="p-3.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50/30 dark:hover:bg-blue-950/20 transition-all cursor-pointer flex flex-col gap-1.5"
          >
            <div class="flex items-center justify-between">
              <span class="font-bold text-xs text-zinc-900 dark:text-zinc-100">
                {{ isZh ? p.nameZh : p.nameEn }}
              </span>
              <span class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-200/60 dark:bg-zinc-700 text-zinc-600 dark:text-zinc-300">
                /{{ p.flags }}
              </span>
            </div>

            <p class="text-[11px] text-zinc-500 dark:text-zinc-400">
              {{ isZh ? p.descZh : p.descEn }}
            </p>

            <div class="p-2 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800 font-mono text-[11px] text-blue-600 dark:text-blue-400 truncate">
              {{ p.pattern }}
            </div>
          </div>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
