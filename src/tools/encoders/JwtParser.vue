<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  KeyRound,
  ShieldCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  Lock,
  ClipboardPaste,
  Trash2,
  Copy,
  Check,
  Sparkles
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';

const { t, locale } = useI18n();

const rawToken = ref('');
const secretKey = ref('');
const secretIsBase64 = ref(false);
const copiedRaw = ref(false);

const sampleJwt =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c3JfODQ5MjA0IiwibmFtZSI6IkFsZXggSm9obnNvbiIsImVtYWlsIjoiYWxleEBkZXZjcmF0ZS5kZXYiLCJyb2xlcyI6WyJhZG1pbiIsImRldmVsb3BlciJdLCJpc3MiOiJodHRwczovL2F1dGguZGV2Y3JhdGUuYXBwIiwiYXVkIjoiaHR0cHM6Ly9hcGkuZGV2Y3JhdGUuYXBwIiwiaWF0IjoxNzkzMTAzMTY5LCJleHAiOjE3OTM3MTE1NjksImp0aSI6ImI0ZjhhMjkxLTcyOWMtNGU4OS1hMmUxLTQ1ZjhlMzI5MDFjMiJ9.5pCpZkU5HedIN6X1utODft7l9Vz5fv7xRD7b7_p9VI4';
const sampleSecret = 'devcrate-super-secret-key';

function loadSample() {
  rawToken.value = sampleJwt;
  secretKey.value = sampleSecret;
}

function clearAll() {
  rawToken.value = '';
  secretKey.value = '';
  verifyStatus.value = 'idle';
}

async function handlePaste() {
  try {
    const text = await navigator.clipboard.readText();
    rawToken.value = text;
  } catch (err) {
    console.error('Failed to paste from clipboard', err);
  }
}

async function handleCopyRaw() {
  if (!cleanToken.value) return;
  try {
    await navigator.clipboard.writeText(cleanToken.value);
    copiedRaw.value = true;
    setTimeout(() => {
      copiedRaw.value = false;
    }, 1500);
  } catch (err) {
    console.error('Failed to copy', err);
  }
}

// 自动剥离 Bearer 前缀与两端空白
const cleanToken = computed(() => {
  let val = rawToken.value.trim();
  if (val.toLowerCase().startsWith('bearer ')) {
    val = val.slice(7).trim();
  }
  return val;
});

// 解析三段式结构
const tokenParts = computed(() => {
  if (!cleanToken.value) return null;
  const parts = cleanToken.value.split('.');
  if (parts.length !== 3) return null;
  return {
    header: parts[0],
    payload: parts[1],
    signature: parts[2]
  };
});

// UTF-8 安全 Base64Url 解码
function base64UrlDecode(str: string): string {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4 !== 0) {
    base64 += '=';
  }
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

// 解码 Header
const decodedHeader = computed(() => {
  if (!tokenParts.value) return null;
  try {
    const jsonStr = base64UrlDecode(tokenParts.value.header);
    return JSON.parse(jsonStr);
  } catch (e: any) {
    return { error: e.message || 'Header parse error' };
  }
});

// 格式化后的 Header 字符串
const headerFormatted = computed(() => {
  if (!decodedHeader.value) return '';
  return JSON.stringify(decodedHeader.value, null, 2);
});

// 解码 Payload
const decodedPayload = computed(() => {
  if (!tokenParts.value) return null;
  try {
    const jsonStr = base64UrlDecode(tokenParts.value.payload);
    return JSON.parse(jsonStr);
  } catch (e: any) {
    return { error: e.message || 'Payload parse error' };
  }
});

// 格式化后的 Payload 字符串
const payloadFormatted = computed(() => {
  if (!decodedPayload.value) return '';
  return JSON.stringify(decodedPayload.value, null, 2);
});

// 算法检测
const algorithm = computed<string>(() => {
  return decodedHeader.value?.alg || 'Unknown';
});

// 时间戳格式化
function formatTimestamp(tsInSeconds: number): string {
  const date = new Date(tsInSeconds * 1000);
  if (isNaN(date.getTime())) return String(tsInSeconds);
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  const s = pad(date.getSeconds());
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

// 相对时间距离
function formatRelativeTime(targetSeconds: number): { text: string; isPast: boolean } {
  const diff = targetSeconds - Math.floor(Date.now() / 1000);
  const isPast = diff < 0;
  const absDiff = Math.abs(diff);
  const isZh = locale.value.startsWith('zh');

  if (absDiff < 60) return { text: isZh ? `${absDiff} 秒` : `${absDiff}s`, isPast };
  if (absDiff < 3600) return { text: isZh ? `${Math.floor(absDiff / 60)} 分钟` : `${Math.floor(absDiff / 60)}m`, isPast };
  if (absDiff < 86400) {
    const hours = Math.floor(absDiff / 3600);
    const mins = Math.floor((absDiff % 3600) / 60);
    return { text: isZh ? `${hours} 小时 ${mins} 分钟` : `${hours}h ${mins}m`, isPast };
  }
  const days = Math.floor(absDiff / 86400);
  const hours = Math.floor((absDiff % 86400) / 3600);
  return { text: isZh ? `${days} 天 ${hours} 小时` : `${days}d ${hours}h`, isPast };
}

// 声明过期状态与解析
const claimsStatus = computed(() => {
  const payload = decodedPayload.value;
  if (!payload || payload.error) return null;

  const nowSec = Math.floor(Date.now() / 1000);
  const isZh = locale.value.startsWith('zh');

  let isExpired = false;
  let notBeforeActive = false;
  let expText = '';
  let iatText = '';
  let nbfText = '';

  if (typeof payload.exp === 'number') {
    const rel = formatRelativeTime(payload.exp);
    isExpired = payload.exp <= nowSec;
    const desc = isZh
      ? (rel.isPast ? `已过期 ${rel.text}` : `还剩 ${rel.text}`)
      : (rel.isPast ? `Expired ${rel.text} ago` : `${rel.text} remaining`);
    expText = `${formatTimestamp(payload.exp)} (${desc})`;
  }

  if (typeof payload.iat === 'number') {
    const rel = formatRelativeTime(payload.iat);
    const desc = isZh
      ? (rel.isPast ? `${rel.text} 前签发` : '未来签发')
      : (rel.isPast ? `Issued ${rel.text} ago` : 'Issued in future');
    iatText = `${formatTimestamp(payload.iat)} (${desc})`;
  }

  if (typeof payload.nbf === 'number') {
    notBeforeActive = payload.nbf > nowSec;
    const rel = formatRelativeTime(payload.nbf);
    const desc = isZh
      ? (notBeforeActive ? `将于 ${rel.text} 后生效` : '已生效')
      : (notBeforeActive ? `Effective in ${rel.text}` : 'Active now');
    nbfText = `${formatTimestamp(payload.nbf)} (${desc})`;
  }

  return {
    isExpired,
    hasExp: typeof payload.exp === 'number',
    notBeforeActive,
    hasNbf: typeof payload.nbf === 'number',
    expText,
    iatText,
    nbfText,
    iss: payload.iss,
    sub: payload.sub,
    aud: payload.aud,
    jti: payload.jti
  };
});

// 签名本地验证逻辑（基于 Web Crypto API）
type VerifyStatus = 'idle' | 'valid' | 'invalid' | 'unsupported';
const verifyStatus = ref<VerifyStatus>('idle');

async function checkSignature() {
  if (!tokenParts.value || !secretKey.value) {
    verifyStatus.value = 'idle';
    return;
  }

  const alg = algorithm.value.toUpperCase();
  if (!['HS256', 'HS384', 'HS512'].includes(alg)) {
    verifyStatus.value = 'unsupported';
    return;
  }

  const hashName = alg === 'HS384' ? 'SHA-384' : alg === 'HS512' ? 'SHA-512' : 'SHA-256';

  try {
    let keyBytes: Uint8Array;
    if (secretIsBase64.value) {
      let b64 = secretKey.value.replace(/-/g, '+').replace(/_/g, '/');
      while (b64.length % 4 !== 0) b64 += '=';
      const bin = atob(b64);
      keyBytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) keyBytes[i] = bin.charCodeAt(i);
    } else {
      keyBytes = new TextEncoder().encode(secretKey.value);
    }

    const cryptoKey = await window.crypto.subtle.importKey(
      'raw',
      keyBytes as any,
      { name: 'HMAC', hash: { name: hashName } },
      false,
      ['verify']
    );

    // 解析 signature 字节
    let sigB64 = tokenParts.value.signature.replace(/-/g, '+').replace(/_/g, '/');
    while (sigB64.length % 4 !== 0) sigB64 += '=';
    const sigBin = atob(sigB64);
    const sigBytes = new Uint8Array(sigBin.length);
    for (let i = 0; i < sigBin.length; i++) sigBytes[i] = sigBin.charCodeAt(i);

    const dataToVerify = new TextEncoder().encode(
      `${tokenParts.value.header}.${tokenParts.value.payload}`
    );

    const isValid = await window.crypto.subtle.verify(
      'HMAC',
      cryptoKey,
      sigBytes as any,
      dataToVerify as any
    );

    verifyStatus.value = isValid ? 'valid' : 'invalid';
  } catch (err) {
    console.warn('HMAC verification error', err);
    verifyStatus.value = 'invalid';
  }
}

watch([cleanToken, secretKey, secretIsBase64], () => {
  if (cleanToken.value && secretKey.value) {
    checkSignature();
  } else {
    verifyStatus.value = 'idle';
  }
});
</script>

<template>
  <ToolContainer
    toolId="jwt-parser"
    nameKey="tools.jwtParser.name"
    descKey="tools.jwtParser.desc"
    :icon="KeyRound"
    :wide="true"
    :fullHeight="true"
  >
    <!-- 顶部操作条 -->
    <div class="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-wrap items-center justify-between gap-2.5 shrink-0 select-none">
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
          {{ t('tools.jwtParser.encodedToken') }}
        </span>

        <span
          v-if="algorithm && algorithm !== 'Unknown'"
          class="px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-900/60"
        >
          {{ algorithm }}
        </span>
      </div>

      <div class="flex items-center gap-1.5">
        <button
          type="button"
          @click="loadSample"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer"
        >
          <Sparkles class="w-3.5 h-3.5 text-blue-500" />
          <span>{{ t('tools.jwtParser.loadSample') }}</span>
        </button>

        <button
          type="button"
          @click="handlePaste"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer"
          :title="t('common.paste')"
        >
          <ClipboardPaste class="w-3.5 h-3.5" />
          <span>{{ t('common.paste') }}</span>
        </button>

        <button
          type="button"
          @click="handleCopyRaw"
          :disabled="!cleanToken"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200/80 dark:border-zinc-700/80 transition-colors cursor-pointer disabled:opacity-40"
          :title="locale.startsWith('zh') ? '复制原始 Token' : 'Copy raw Token'"
        >
          <Check v-if="copiedRaw" class="w-3.5 h-3.5 text-emerald-500" />
          <Copy v-else class="w-3.5 h-3.5" />
          <span>{{ copiedRaw ? t('common.copied') : t('common.copy') }}</span>
        </button>

        <button
          type="button"
          @click="clearAll"
          :disabled="!rawToken"
          class="inline-flex items-center justify-center w-8 h-7 rounded-lg text-xs font-medium text-zinc-500 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-40"
          :title="t('common.clear')"
        >
          <Trash2 class="w-3.5 h-3.5" />
        </button>
      </div>
    </div>

    <!-- 原始 Token 输入与三段式色彩高亮展示 -->
    <div class="flex flex-col gap-2 shrink-0">
      <div class="relative rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs p-3">
        <textarea
          v-model="rawToken"
          :placeholder="t('tools.jwtParser.pasteTokenPrompt')"
          rows="3"
          class="w-full font-mono text-xs leading-relaxed bg-transparent text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 dark:placeholder-zinc-600 outline-none resize-none"
          spellcheck="false"
        />

        <!-- 三色段落预览指示器 -->
        <div v-if="tokenParts" class="mt-2 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center gap-3 text-[11px] font-mono select-none">
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
            <span class="text-rose-600 dark:text-rose-400 font-semibold">{{ t('tools.jwtParser.decodedHeader') }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-indigo-500"></span>
            <span class="text-indigo-600 dark:text-indigo-400 font-semibold">{{ t('tools.jwtParser.decodedPayload') }}</span>
          </div>
          <div class="flex items-center gap-1.5">
            <span class="w-2.5 h-2.5 rounded-full bg-sky-500"></span>
            <span class="text-sky-600 dark:text-sky-400 font-semibold">{{ t('tools.jwtParser.signature') }}</span>
          </div>
        </div>
      </div>

      <!-- 错误提示 -->
      <div
        v-if="cleanToken && !tokenParts"
        class="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs bg-rose-50/90 dark:bg-rose-950/30 text-rose-800 dark:text-rose-300 border border-rose-200/80 dark:border-rose-800/50"
      >
        <AlertCircle class="w-4 h-4 text-rose-500 shrink-0" />
        <span>{{ t('tools.jwtParser.invalidJwtFormat') }}</span>
      </div>
    </div>

    <!-- 声明状态分析卡片（当 Token 有效解析出 Claims 时展现） -->
    <div
      v-if="claimsStatus"
      class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-3 shrink-0"
    >
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <ShieldCheck class="w-4 h-4 text-blue-500" />
          <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {{ t('tools.jwtParser.standardClaims') }}
          </span>
        </div>

        <!-- 过期状态徽章 -->
        <div class="flex items-center gap-2">
          <!-- 过期情况 -->
          <div
            v-if="claimsStatus.hasExp"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium"
            :class="[
              claimsStatus.isExpired
                ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60'
            ]"
          >
            <AlertCircle v-if="claimsStatus.isExpired" class="w-3.5 h-3.5 text-rose-500" />
            <CheckCircle2 v-else class="w-3.5 h-3.5 text-emerald-500" />
            <span>{{ claimsStatus.isExpired ? t('tools.jwtParser.statusExpired') : t('tools.jwtParser.statusActive') }}</span>
          </div>

          <!-- 生效前状态 -->
          <div
            v-if="claimsStatus.hasNbf && claimsStatus.notBeforeActive"
            class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200"
          >
            <Clock class="w-3.5 h-3.5" />
            <span>{{ t('tools.jwtParser.statusNotBefore') }}</span>
          </div>
        </div>
      </div>

      <!-- 核心 Claims 详细指标 -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
        <!-- 过期时间 -->
        <div v-if="claimsStatus.hasExp" class="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <div class="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{{ t('tools.jwtParser.expiresAt') }}</div>
          <div class="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 break-all">
            {{ claimsStatus.expText }}
          </div>
        </div>

        <!-- 签发时间 -->
        <div v-if="claimsStatus.iatText" class="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <div class="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{{ t('tools.jwtParser.issuedAt') }}</div>
          <div class="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 break-all">
            {{ claimsStatus.iatText }}
          </div>
        </div>

        <!-- Subject -->
        <div v-if="claimsStatus.sub" class="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <div class="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{{ t('tools.jwtParser.subject') }}</div>
          <div class="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 break-all">
            {{ claimsStatus.sub }}
          </div>
        </div>

        <!-- Issuer -->
        <div v-if="claimsStatus.iss" class="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
          <div class="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium">{{ t('tools.jwtParser.issuer') }}</div>
          <div class="font-mono text-xs font-semibold text-zinc-800 dark:text-zinc-200 mt-0.5 break-all">
            {{ claimsStatus.iss }}
          </div>
        </div>
      </div>
    </div>

    <!-- 解码结果主编辑区（撑满纵向空间） -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-3.5 flex-1 min-h-[300px]">
      <!-- Header -->
      <TextEditorBox
        :modelValue="headerFormatted"
        :label="`${t('tools.jwtParser.decodedHeader')} (Algorithm & Type)`"
        :readonly="true"
        :showPaste="false"
        :showClear="false"
        :showLineNumbers="true"
        :defaultWrap="false"
        placeholder="Decoded header will appear here..."
      />

      <!-- Payload -->
      <TextEditorBox
        :modelValue="payloadFormatted"
        :label="`${t('tools.jwtParser.decodedPayload')} (Claims Data)`"
        :readonly="true"
        :showPaste="false"
        :showClear="false"
        :showLineNumbers="true"
        :defaultWrap="false"
        placeholder="Decoded payload claims will appear here..."
      />
    </div>

    <!-- 底部：签名展示与验证区域 -->
    <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-3 shrink-0">
      <div class="flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2">
          <Lock class="w-4 h-4 text-sky-500" />
          <span class="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
            {{ t('tools.jwtParser.verifySignature') }}
          </span>
          <span class="text-[11px] text-zinc-400">
            (HMAC-SHA256 / SHA384 / SHA512)
          </span>
        </div>

        <!-- 验签状态指示徽章 -->
        <div class="flex items-center gap-2">
          <div
            v-if="verifyStatus === 'valid'"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60"
          >
            <CheckCircle2 class="w-3.5 h-3.5 text-emerald-500" />
            <span>{{ t('tools.jwtParser.signatureValid') }}</span>
          </div>

          <div
            v-else-if="verifyStatus === 'invalid'"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
          >
            <AlertCircle class="w-3.5 h-3.5 text-rose-500" />
            <span>{{ t('tools.jwtParser.signatureInvalid') }}</span>
          </div>

          <div
            v-else-if="verifyStatus === 'unsupported'"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200"
          >
            <AlertCircle class="w-3.5 h-3.5 text-amber-500" />
            <span>{{ t('tools.jwtParser.signatureUnsupported') }}</span>
          </div>

          <div
            v-else
            class="text-[11px] text-zinc-400"
          >
            {{ t('tools.jwtParser.signaturePrompt') }}
          </div>
        </div>
      </div>

      <div class="flex flex-col sm:flex-row items-center gap-2.5">
        <div class="relative flex-1 w-full">
          <input
            v-model="secretKey"
            type="text"
            :placeholder="t('tools.jwtParser.secretPlaceholder')"
            class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/70 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-blue-500"
          />
        </div>

        <label class="inline-flex items-center gap-1.5 text-xs text-zinc-600 dark:text-zinc-300 select-none cursor-pointer shrink-0">
          <input
            type="checkbox"
            v-model="secretIsBase64"
            class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
          />
          <span>{{ t('tools.jwtParser.secretIsBase64') }}</span>
        </label>
      </div>

      <!-- 签名原始串 -->
      <div v-if="tokenParts" class="p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800">
        <div class="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium mb-1">
          {{ t('tools.jwtParser.signature') }} (Base64Url):
        </div>
        <div class="font-mono text-xs text-sky-600 dark:text-sky-400 break-all select-all">
          {{ tokenParts.signature }}
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
