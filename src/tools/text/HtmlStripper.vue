<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  RemoveFormatting,
  Sparkles,
  RotateCcw,
  ArrowRight,
  SlidersHorizontal
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// 输入与配置状态
const inputHtml = ref('');
const blockToNewline = ref(true);
const decodeEntities = ref(true);
const stripScriptStyle = ref(true);
const stripComments = ref(true);
const linkHandling = ref<'textOnly' | 'textWithUrl' | 'urlOnly'>('textOnly');
const imageHandling = ref<'ignore' | 'altText' | 'srcUrl'>('altText');
const whitespaceMode = ref<'normalize' | 'preserve' | 'singleLine'>('normalize');
const allowedTagsInput = ref('');
const isOptionsExpanded = ref(true);

// 常用 HTML 实体字典
const HTML_ENTITIES_MAP: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&copy;': '©',
  '&reg;': '®',
  '&trade;': '™',
  '&euro;': '€',
  '&yen;': '¥',
  '&pound;': '£',
  '&cent;': '¢',
  '&times;': '×',
  '&divide;': '÷',
  '&plusmn;': '±',
  '&ne;': '≠',
  '&le;': '≤',
  '&ge;': '≥',
  '&mdash;': '—',
  '&ndash;': '–',
  '&hellip;': '…',
  '&bull;': '•',
  '&middot;': '·',
  '&deg;': '°',
  '&para;': '¶',
  '&sect;': '§',
  '&laquo;': '«',
  '&raquo;': '»',
  '&percnt;': '%',
  '&ldquo;': '“',
  '&rdquo;': '”',
  '&lsquo;': '‘',
  '&rsquo;': '’'
};

// 解析白名单标签
const allowedTagSet = computed(() => {
  const raw = allowedTagsInput.value.trim();
  if (!raw) return new Set<string>();
  return new Set(
    raw
      .split(/[,，\s]+/)
      .map(tag => tag.replace(/^<|>$/g, '').trim().toLowerCase())
      .filter(Boolean)
  );
});

// 执行核心清洗
const stripResult = computed(() => {
  const html = inputHtml.value;
  if (!html) {
    return {
      text: '',
      tagsRemoved: 0,
      entitiesDecoded: 0,
      commentsRemoved: 0
    };
  }

  let text = html;
  let commentsRemoved = 0;
  let tagsRemoved = 0;
  let entitiesDecoded = 0;

  // 1. 去除 DOCTYPE 与 XML 声明
  text = text.replace(/<!DOCTYPE\b[^>]*>/gi, '');
  text = text.replace(/<\?[xX][mM][lL]\b[^>]*\?>/gi, '');

  // 2. 去除 HTML 注释
  if (stripComments.value) {
    text = text.replace(/<!--[\s\S]*?-->/g, () => {
      commentsRemoved++;
      return '';
    });
  }

  // 3. 剥离 <script>, <style>, <svg>, <noscript> 及其包含的内容
  if (stripScriptStyle.value) {
    text = text.replace(/<script\b[\s\S]*?<\/script>/gi, '');
    text = text.replace(/<style\b[\s\S]*?<\/style>/gi, '');
    text = text.replace(/<svg\b[\s\S]*?<\/svg>/gi, '');
    text = text.replace(/<noscript\b[\s\S]*?<\/noscript>/gi, '');
  }

  // 4. 处理图片 <img> 标签
  if (imageHandling.value === 'altText') {
    text = text.replace(/<img\b[^>]*?\balt=(["'])([\s\S]*?)\1[^>]*>/gi, (_match, _quote, alt) => {
      const cleanAlt = alt.trim();
      return cleanAlt ? ` [${cleanAlt}] ` : '';
    });
  } else if (imageHandling.value === 'srcUrl') {
    text = text.replace(/<img\b[^>]*?\bsrc=(["'])([\s\S]*?)\1[^>]*>/gi, (_match, _quote, src) => {
      const cleanSrc = src.trim();
      return cleanSrc ? ` [Image: ${cleanSrc}] ` : '';
    });
  }

  // 5. 处理超链接 <a> 标签
  if (linkHandling.value === 'textWithUrl') {
    text = text.replace(/<a\b[^>]*?\bhref=(["'])([\s\S]*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_m, _q, href, content) => {
      const cleanContent = content.replace(/<[^>]+>/g, '').trim();
      const cleanHref = href.trim();
      if (!cleanHref) return cleanContent;
      if (!cleanContent) return cleanHref;
      return `${cleanContent} (${cleanHref})`;
    });
  } else if (linkHandling.value === 'urlOnly') {
    text = text.replace(/<a\b[^>]*?\bhref=(["'])([\s\S]*?)\1[^>]*>([\s\S]*?)<\/a>/gi, (_m, _q, href) => {
      return href.trim();
    });
  }

  // 6. 块级元素转换为换行符
  if (blockToNewline.value) {
    text = text.replace(/<br\s*\/?>/gi, '\n');
    text = text.replace(/<hr\s*\/?>/gi, '\n---\n');

    text = text.replace(/<\/(p|div|h[1-6]|li|tr|blockquote|section|article|header|footer|nav|pre)>/gi, '\n');
    text = text.replace(/<(h[1-6]|p|div|blockquote|table|ul|ol|pre|section|article)\b[^>]*>/gi, '\n');
    text = text.replace(/<li\b[^>]*>/gi, '\n• ');
    text = text.replace(/<(td|th)\b[^>]*>/gi, '  ');
  }

  // 7. 去除剩余全部 HTML 标签（保留白名单中的标签）
  const allowed = allowedTagSet.value;
  text = text.replace(/<(\/)?([a-zA-Z0-9_-]+)(\s+[^>]*)?\/?>/gi, (match, _slash, tag) => {
    if (allowed.size > 0 && allowed.has(tag.toLowerCase())) {
      return match;
    }
    tagsRemoved++;
    return '';
  });

  // 8. 解码 HTML 实体
  if (decodeEntities.value) {
    text = text.replace(/&(?:[a-zA-Z0-9]+|#\d+|#[xX][a-fA-F0-9]+);/g, (entity) => {
      entitiesDecoded++;
      if (HTML_ENTITIES_MAP[entity]) return HTML_ENTITIES_MAP[entity];
      if (HTML_ENTITIES_MAP[entity.toLowerCase()]) return HTML_ENTITIES_MAP[entity.toLowerCase()];

      // 16 进制数字实体 &#x4f60;
      if (entity.startsWith('&#x') || entity.startsWith('&#X')) {
        const code = parseInt(entity.slice(3, -1), 16);
        return !isNaN(code) && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
      }
      // 10 进制数字实体 &#20320;
      if (entity.startsWith('&#')) {
        const code = parseInt(entity.slice(2, -1), 10);
        return !isNaN(code) && code <= 0x10ffff ? String.fromCodePoint(code) : entity;
      }
      return entity;
    });
  }

  // 9. 空白与排版整理
  if (whitespaceMode.value === 'normalize') {
    text = text
      .split('\n')
      .map(line => line.replace(/[ \t]+/g, ' ').trim())
      .join('\n');
    text = text.replace(/\n{3,}/g, '\n\n').trim();
  } else if (whitespaceMode.value === 'singleLine') {
    text = text.replace(/\s+/g, ' ').trim();
  }

  return {
    text,
    tagsRemoved,
    entitiesDecoded,
    commentsRemoved
  };
});

// 计算统计量对比
const statsComparison = computed(() => {
  const rawLen = inputHtml.value.length;
  const strippedLen = stripResult.value.text.length;
  const diff = rawLen - strippedLen;
  const percent = rawLen > 0 ? Math.round((diff / rawLen) * 1000) / 10 : 0;

  return {
    rawLen,
    strippedLen,
    reducedPercent: percent > 0 ? `-${percent}%` : '0%',
    tagsRemoved: stripResult.value.tagsRemoved,
    entitiesDecoded: stripResult.value.entitiesDecoded,
    commentsRemoved: stripResult.value.commentsRemoved
  };
});

// 预设模式
function applyPreset(preset: 'cleanText' | 'singleLine' | 'withLinks' | 'keepFormatting') {
  if (preset === 'cleanText') {
    blockToNewline.value = true;
    decodeEntities.value = true;
    stripScriptStyle.value = true;
    stripComments.value = true;
    linkHandling.value = 'textOnly';
    imageHandling.value = 'altText';
    whitespaceMode.value = 'normalize';
    allowedTagsInput.value = '';
  } else if (preset === 'singleLine') {
    blockToNewline.value = false;
    decodeEntities.value = true;
    stripScriptStyle.value = true;
    stripComments.value = true;
    linkHandling.value = 'textOnly';
    imageHandling.value = 'ignore';
    whitespaceMode.value = 'singleLine';
    allowedTagsInput.value = '';
  } else if (preset === 'withLinks') {
    blockToNewline.value = true;
    decodeEntities.value = true;
    stripScriptStyle.value = true;
    stripComments.value = true;
    linkHandling.value = 'textWithUrl';
    imageHandling.value = 'altText';
    whitespaceMode.value = 'normalize';
    allowedTagsInput.value = '';
  } else if (preset === 'keepFormatting') {
    blockToNewline.value = true;
    decodeEntities.value = true;
    stripScriptStyle.value = true;
    stripComments.value = true;
    linkHandling.value = 'textOnly';
    imageHandling.value = 'altText';
    whitespaceMode.value = 'normalize';
    allowedTagsInput.value = 'p, b, i, strong, em, code, pre';
  }
}

// 应用清洗结果至输入框
function applyOutputToInput() {
  if (stripResult.value.text) {
    inputHtml.value = stripResult.value.text;
  }
}

// 清空所有内容
function clearAll() {
  inputHtml.value = '';
}

// 加载示例 HTML
function loadSample() {
  inputHtml.value = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>DevCrate 开发者工具箱</title>
  <style>
    body { font-family: system-ui, sans-serif; color: #1e293b; line-height: 1.6; }
    .hero { background: #f8fafc; padding: 24px; border-radius: 12px; }
  <\/style>
  <script>
    console.log("DevCrate running locally and securely");
  <\/script>
</head>
<body>
  <!-- 头部主标题与项目描述 -->
  <header class="hero">
    <h1>欢迎使用 <b>DevCrate</b> 瑞士军刀箱 &copy; 2026</h1>
    <p class="subtitle">面向现代工程师的<strong>跨平台离线</strong>开发工具箱。</p>
  </header>

  <main>
    <section>
      <h2>核心特性概览</h2>
      <p>所有工具纯本地运行，零网络依赖，数据安全性高达 100&percnt;！</p>
      <img src="https://example.com/banner.png" alt="DevCrate 功能架构图" />

      <h3>内置高频工具清单：</h3>
      <ul>
        <li><strong>文本与格式化</strong>：JSON 美化压缩、正则表达式测试、HTML 标签清洗</li>
        <li><strong>编解码与哈希</strong>：Base64 / URL 编解码，JWT 解析，MD5 / SHA-256 计算</li>
        <li><strong>网络分析与排查</strong>：HAR 瀑布流抓包查看器、本地 TCP 端口扫描及进程释放</li>
      </ul>

      <p>
        更多详情请访问开源仓库：
        <a href="https://github.com/LongYinStudio/DevCrate" target="_blank">DevCrate GitHub 官方仓库</a>
      </p>

      <hr />

      <blockquote>
        &ldquo;简单、克制、快速且尊重数据隐私。&rdquo; &mdash; 开发者寄语
      </blockquote>

      <p>Unicode 实体测试：&#x4F60;&#x597D; (你好)，价格: &euro;0.00 &times; 永久免费 &bull; 欢迎 Star 支持！</p>
    </section>
  </main>
</body>
</html>`;
}
</script>

<template>
  <ToolContainer
    toolId="html-stripper"
    nameKey="tools.htmlStripper.name"
    descKey="tools.htmlStripper.desc"
    :icon="RemoveFormatting"
    :wide="true"
    :fullHeight="true"
  >
    <div class="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-white dark:bg-zinc-900">
      <!-- 顶部控制条：预设切换与快捷操作 -->
      <div class="px-5 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 shrink-0 flex flex-wrap items-center justify-between gap-3">
        <!-- 预设模式 Pills -->
        <div class="flex items-center gap-1.5 flex-wrap text-xs">
          <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mr-1 select-none">
            {{ t('tools.htmlStripper.presets') }}:
          </span>

          <button
            type="button"
            @click="applyPreset('cleanText')"
            class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer"
            :class="whitespaceMode === 'normalize' && linkHandling === 'textOnly' && !allowedTagsInput ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
          >
            {{ t('tools.htmlStripper.presetCleanText') }}
          </button>

          <button
            type="button"
            @click="applyPreset('singleLine')"
            class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer"
            :class="whitespaceMode === 'singleLine' ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
          >
            {{ t('tools.htmlStripper.presetSingleLine') }}
          </button>

          <button
            type="button"
            @click="applyPreset('withLinks')"
            class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer"
            :class="linkHandling === 'textWithUrl' ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
          >
            {{ t('tools.htmlStripper.presetWithLinks') }}
          </button>

          <button
            type="button"
            @click="applyPreset('keepFormatting')"
            class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer"
            :class="allowedTagsInput.length > 0 ? 'bg-blue-600 text-white border-blue-600 shadow-2xs font-bold' : 'bg-white dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
          >
            {{ t('tools.htmlStripper.presetKeepFormatting') }}
          </button>
        </div>

        <!-- 右侧快速操作按钮组 -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            @click="loadSample"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200/70 dark:border-blue-900/40 transition-colors cursor-pointer shadow-2xs"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ t('common.loadSample') }}</span>
          </button>

          <button
            type="button"
            @click="applyOutputToInput"
            :disabled="!stripResult.text"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            :title="t('tools.htmlStripper.applyToInput')"
          >
            <ArrowRight class="w-3.5 h-3.5" />
            <span>{{ t('tools.htmlStripper.applyToInput') }}</span>
          </button>

          <button
            type="button"
            @click="clearAll"
            class="p-2 rounded-xl text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer"
            :title="t('common.clear')"
          >
            <RotateCcw class="w-4 h-4" />
          </button>

          <!-- 展开/折叠配置项 -->
          <button
            type="button"
            @click="isOptionsExpanded = !isOptionsExpanded"
            class="p-2 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer"
            :title="isZh ? '展开/收起清洗配置' : 'Toggle options'"
          >
            <SlidersHorizontal class="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <!-- 可折叠详细剥离参数配置面板 -->
      <div
        v-if="isOptionsExpanded"
        class="px-5 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/95 shrink-0 flex flex-col gap-3 transition-all"
      >
        <!-- 第一行：基础开关复选框 -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <label class="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
            <input
              v-model="blockToNewline"
              type="checkbox"
              class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span class="font-medium">{{ t('tools.htmlStripper.blockToNewline') }}</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
            <input
              v-model="decodeEntities"
              type="checkbox"
              class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span class="font-medium">{{ t('tools.htmlStripper.decodeEntities') }}</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
            <input
              v-model="stripScriptStyle"
              type="checkbox"
              class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span class="font-medium">{{ t('tools.htmlStripper.stripScriptStyle') }}</span>
          </label>

          <label class="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
            <input
              v-model="stripComments"
              type="checkbox"
              class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 w-4 h-4"
            />
            <span class="font-medium">{{ t('tools.htmlStripper.stripComments') }}</span>
          </label>
        </div>

        <!-- 第二行：链接、图片、空白模式分段选择 & 白名单输入 -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs">
          <!-- 超链接处理 -->
          <div class="flex flex-col gap-1.5">
            <span class="font-semibold text-zinc-600 dark:text-zinc-400">{{ t('tools.htmlStripper.linkHandling') }}</span>
            <select
              v-model="linkHandling"
              class="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
            >
              <option value="textOnly">{{ t('tools.htmlStripper.linkTextOnly') }}</option>
              <option value="textWithUrl">{{ t('tools.htmlStripper.linkTextWithUrl') }}</option>
              <option value="urlOnly">{{ t('tools.htmlStripper.linkUrlOnly') }}</option>
            </select>
          </div>

          <!-- 图片处理 -->
          <div class="flex flex-col gap-1.5">
            <span class="font-semibold text-zinc-600 dark:text-zinc-400">{{ t('tools.htmlStripper.imageHandling') }}</span>
            <select
              v-model="imageHandling"
              class="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
            >
              <option value="altText">{{ t('tools.htmlStripper.imageAltText') }}</option>
              <option value="srcUrl">{{ t('tools.htmlStripper.imageSrcUrl') }}</option>
              <option value="ignore">{{ t('tools.htmlStripper.imageIgnore') }}</option>
            </select>
          </div>

          <!-- 空白字符规整 -->
          <div class="flex flex-col gap-1.5">
            <span class="font-semibold text-zinc-600 dark:text-zinc-400">{{ t('tools.htmlStripper.whitespaceMode') }}</span>
            <select
              v-model="whitespaceMode"
              class="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none cursor-pointer"
            >
              <option value="normalize">{{ t('tools.htmlStripper.whitespaceNormalize') }}</option>
              <option value="preserve">{{ t('tools.htmlStripper.whitespacePreserve') }}</option>
              <option value="singleLine">{{ t('tools.htmlStripper.whitespaceSingleLine') }}</option>
            </select>
          </div>

          <!-- 标签保留白名单 -->
          <div class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between">
              <span class="font-semibold text-zinc-600 dark:text-zinc-400">{{ t('tools.htmlStripper.allowedTags') }}</span>
              <span v-if="allowedTagSet.size > 0" class="text-[10px] text-blue-600 dark:text-blue-400 font-mono">
                ({{ allowedTagSet.size }})
              </span>
            </div>
            <input
              v-model="allowedTagsInput"
              type="text"
              :placeholder="t('tools.htmlStripper.allowedTagsPlaceholder')"
              class="px-2.5 py-1.5 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 outline-none placeholder-zinc-400 font-mono text-xs"
            />
          </div>
        </div>
      </div>

      <!-- 实时清洗效果数据条 (Stats Bar) -->
      <div class="px-5 py-2.5 bg-zinc-50/50 dark:bg-zinc-950/40 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between flex-wrap gap-2 text-xs shrink-0 select-none">
        <div class="flex items-center gap-4 flex-wrap text-zinc-600 dark:text-zinc-400 font-medium">
          <div class="flex items-center gap-1.5">
            <span>{{ t('tools.htmlStripper.originalLength') }}:</span>
            <span class="font-mono font-bold text-zinc-900 dark:text-zinc-100">{{ statsComparison.rawLen }}</span>
          </div>

          <div class="flex items-center gap-1.5">
            <span>{{ t('tools.htmlStripper.strippedLength') }}:</span>
            <span class="font-mono font-bold text-zinc-900 dark:text-zinc-100">{{ statsComparison.strippedLen }}</span>
          </div>

          <div class="flex items-center gap-1.5">
            <span>{{ t('tools.htmlStripper.reducedRatio') }}:</span>
            <span
              class="px-1.5 py-0.5 rounded text-[11px] font-mono font-bold"
              :class="statsComparison.rawLen > 0 ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'"
            >
              {{ statsComparison.reducedPercent }}
            </span>
          </div>
        </div>

        <div class="flex items-center gap-3 text-[11px] font-mono text-zinc-500 dark:text-zinc-400">
          <span>{{ t('tools.htmlStripper.tagsRemoved') }}: <strong class="text-blue-600 dark:text-blue-400">{{ statsComparison.tagsRemoved }}</strong></span>
          <span>&bull;</span>
          <span>{{ t('tools.htmlStripper.entitiesDecoded') }}: <strong class="text-purple-600 dark:text-purple-400">{{ statsComparison.entitiesDecoded }}</strong></span>
          <span>&bull;</span>
          <span>{{ t('tools.htmlStripper.commentsRemoved') }}: <strong class="text-amber-600 dark:text-amber-400">{{ statsComparison.commentsRemoved }}</strong></span>
        </div>
      </div>

      <!-- 核心编辑区：左右分栏对齐 -->
      <div class="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-3 p-4 min-h-0 overflow-hidden bg-zinc-50/20 dark:bg-zinc-950/20">
        <!-- 左侧：HTML 原文输入框 -->
        <TextEditorBox
          v-model="inputHtml"
          :label="isZh ? '输入 HTML 代码 (HTML Input)' : 'HTML Input'"
          :placeholder="t('tools.htmlStripper.inputPlaceholder')"
          :showLineNumbers="true"
          :showWrapToggle="true"
          :defaultWrap="true"
          class="flex-1 h-full min-h-[280px]"
        />

        <!-- 右侧：纯文本输出框 -->
        <TextEditorBox
          :modelValue="stripResult.text"
          :label="isZh ? '清洗后纯文本 (Plain Text Output)' : 'Plain Text Output'"
          :placeholder="t('tools.htmlStripper.outputPlaceholder')"
          :readonly="true"
          :showPaste="false"
          :showClear="false"
          :showLineNumbers="true"
          :showWrapToggle="true"
          :defaultWrap="true"
          class="flex-1 h-full min-h-[280px]"
        />
      </div>
    </div>
  </ToolContainer>
</template>
