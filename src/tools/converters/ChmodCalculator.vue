<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  ShieldCheck,
  Copy,
  Check,
  Terminal,
  File,
  Folder,
  AlertTriangle,
  Info,
  CheckCircle,
  Sparkles
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';

const { t, locale } = useI18n();

// 权限主体定义
interface Triplet {
  r: boolean;
  w: boolean;
  x: boolean;
}

interface SpecialBits {
  suid: boolean;
  sgid: boolean;
  sticky: boolean;
}

// 核心状态
const userPerms = ref<Triplet>({ r: true, w: true, x: true });
const groupPerms = ref<Triplet>({ r: true, w: false, x: true });
const otherPerms = ref<Triplet>({ r: true, w: false, x: true });
const specialPerms = ref<SpecialBits>({ suid: false, sgid: false, sticky: false });

const isDir = ref(false);
const targetPath = ref('filename');
const isRecursive = ref(false);

// 八进制与符号输入缓存（用于支持双向文本输入）
const octalInput = ref('0755');
const symbolicInput = ref('-rwxr-xr-x');
const hasInputError = ref(false);
const errorMessage = ref('');

// 复制状态缓存
const copiedKey = ref<string | null>(null);

function triggerCopied(key: string, text: string) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    copiedKey.value = key;
    setTimeout(() => {
      copiedKey.value = null;
    }, 1500);
  });
}

// 计算每组的数值
function tripletToNum(t: Triplet): number {
  return (t.r ? 4 : 0) + (t.w ? 2 : 0) + (t.x ? 1 : 0);
}

function specialToNum(s: SpecialBits): number {
  return (s.suid ? 4 : 0) + (s.sgid ? 2 : 0) + (s.sticky ? 1 : 0);
}

// 计算 3 位和 4 位八进制数字
const octal3 = computed(() => {
  return `${tripletToNum(userPerms.value)}${tripletToNum(groupPerms.value)}${tripletToNum(otherPerms.value)}`;
});

const octal4 = computed(() => {
  const spec = specialToNum(specialPerms.value);
  return `${spec}${octal3.value}`;
});

// 计算 10 位符号表示 (如 -rwxr-xr-x)
const symbolicString = computed(() => {
  const typeChar = isDir.value ? 'd' : '-';

  // User
  let uExec = '-';
  if (specialPerms.value.suid) {
    uExec = userPerms.value.x ? 's' : 'S';
  } else if (userPerms.value.x) {
    uExec = 'x';
  }
  const uPart = `${userPerms.value.r ? 'r' : '-'}${userPerms.value.w ? 'w' : '-'}${uExec}`;

  // Group
  let gExec = '-';
  if (specialPerms.value.sgid) {
    gExec = groupPerms.value.x ? 's' : 'S';
  } else if (groupPerms.value.x) {
    gExec = 'x';
  }
  const gPart = `${groupPerms.value.r ? 'r' : '-'}${groupPerms.value.w ? 'w' : '-'}${gExec}`;

  // Other
  let oExec = '-';
  if (specialPerms.value.sticky) {
    oExec = otherPerms.value.x ? 't' : 'T';
  } else if (otherPerms.value.x) {
    oExec = 'x';
  }
  const oPart = `${otherPerms.value.r ? 'r' : '-'}${otherPerms.value.w ? 'w' : '-'}${oExec}`;

  return `${typeChar}${uPart}${gPart}${oPart}`;
});

// 计算符号化 chmod 参数 (如 u=rwx,g=rx,o=rx)
const symbolicChmodArgs = computed(() => {
  function formatSection(t: Triplet, specFlag?: boolean, specChar?: string): string {
    let res = '';
    if (t.r) res += 'r';
    if (t.w) res += 'w';
    if (specFlag && specChar) {
      res += specChar;
    } else if (t.x) {
      res += 'x';
    }
    return res;
  }

  const u = formatSection(userPerms.value, specialPerms.value.suid, 's');
  const g = formatSection(groupPerms.value, specialPerms.value.sgid, 's');
  const o = formatSection(otherPerms.value, specialPerms.value.sticky, 't');

  return `u=${u},g=${g},o=${o}`;
});

// 计算对应的 umask 参考值
const umaskEquivalent = computed(() => {
  const u = 7 - tripletToNum(userPerms.value);
  const g = 7 - tripletToNum(groupPerms.value);
  const o = 7 - tripletToNum(otherPerms.value);
  return `0${u}${g}${o}`;
});

// 命令行拼接
const commandOctal = computed(() => {
  const flags = isRecursive.value ? '-R ' : '';
  const oct = specialToNum(specialPerms.value) > 0 ? octal4.value : octal3.value;
  return `chmod ${flags}${oct} ${targetPath.value || 'filename'}`;
});

const commandSymbolic = computed(() => {
  const flags = isRecursive.value ? '-R ' : '';
  return `chmod ${flags}${symbolicChmodArgs.value} ${targetPath.value || 'filename'}`;
});

// 状态向文本输入的同步
watch(
  [octal4, symbolicString],
  () => {
    octalInput.value = octal4.value;
    symbolicInput.value = symbolicString.value;
    hasInputError.value = false;
    errorMessage.value = '';
  },
  { immediate: true }
);

// 从八进制数字反向解析
function applyFromOctal(val: string) {
  const clean = val.trim();
  if (!clean) return;

  let spec = 0;
  let u = 0;
  let g = 0;
  let o = 0;

  if (/^[0-7]{3}$/.test(clean)) {
    spec = 0;
    u = parseInt(clean[0], 10);
    g = parseInt(clean[1], 10);
    o = parseInt(clean[2], 10);
  } else if (/^[0-7]{4}$/.test(clean)) {
    spec = parseInt(clean[0], 10);
    u = parseInt(clean[1], 10);
    g = parseInt(clean[2], 10);
    o = parseInt(clean[3], 10);
  } else {
    hasInputError.value = true;
    errorMessage.value = locale.value.startsWith('zh')
      ? '八进制必须为 3 或 4 位数字 (每个数字 0-7)'
      : 'Octal must be 3 or 4 octal digits (0-7)';
    return;
  }

  hasInputError.value = false;
  errorMessage.value = '';

  userPerms.value = {
    r: (u & 4) !== 0,
    w: (u & 2) !== 0,
    x: (u & 1) !== 0
  };
  groupPerms.value = {
    r: (g & 4) !== 0,
    w: (g & 2) !== 0,
    x: (g & 1) !== 0
  };
  otherPerms.value = {
    r: (o & 4) !== 0,
    w: (o & 2) !== 0,
    x: (o & 1) !== 0
  };
  specialPerms.value = {
    suid: (spec & 4) !== 0,
    sgid: (spec & 2) !== 0,
    sticky: (spec & 1) !== 0
  };
}

// 从符号表示反向解析 (支持 9 位或 10 位)
function applyFromSymbolic(val: string) {
  let s = val.trim();
  if (s.length === 10) {
    if (s[0] === 'd') isDir.value = true;
    else if (s[0] === '-') isDir.value = false;
    s = s.slice(1);
  }

  if (s.length !== 9) {
    hasInputError.value = true;
    errorMessage.value = locale.value.startsWith('zh')
      ? '符号必须为 9 位或 10 位字符 (如 -rwxr-xr-x)'
      : 'Symbolic must be 9 or 10 characters (e.g. -rwxr-xr-x)';
    return;
  }

  // User: s[0], s[1], s[2]
  const uR = s[0] === 'r';
  const uW = s[1] === 'w';
  const uX = s[2] === 'x' || s[2] === 's';
  const suid = s[2] === 's' || s[2] === 'S';

  // Group: s[3], s[4], s[5]
  const gR = s[3] === 'r';
  const gW = s[4] === 'w';
  const gX = s[5] === 'x' || s[5] === 's';
  const sgid = s[5] === 's' || s[5] === 'S';

  // Other: s[6], s[7], s[8]
  const oR = s[6] === 'r';
  const oW = s[7] === 'w';
  const oX = s[8] === 'x' || s[8] === 't';
  const sticky = s[8] === 't' || s[8] === 'T';

  hasInputError.value = false;
  errorMessage.value = '';

  userPerms.value = { r: uR, w: uW, x: uX };
  groupPerms.value = { r: gR, w: gW, x: gX };
  otherPerms.value = { r: oR, w: oW, x: oX };
  specialPerms.value = { suid, sgid, sticky };
}

// 快速配置
function setAllPerms(allow: boolean) {
  userPerms.value = { r: allow, w: allow, x: allow };
  groupPerms.value = { r: allow, w: allow, x: allow };
  otherPerms.value = { r: allow, w: allow, x: allow };
  if (!allow) {
    specialPerms.value = { suid: false, sgid: false, sticky: false };
  }
}

// 常用预设定义
interface ChmodPreset {
  octal: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  isDir?: boolean;
  type: 'safe' | 'standard' | 'danger' | 'special';
}

const presets: ChmodPreset[] = [
  {
    octal: '644',
    nameZh: '644 标准文件',
    nameEn: '644 Standard File',
    descZh: '所有者读写，组与其他只读，常规文本/代码',
    descEn: 'Owner read/write, others read-only',
    type: 'standard'
  },
  {
    octal: '755',
    nameZh: '755 可执行/目录',
    nameEn: '755 Exec / Dir',
    descZh: '所有者完全，组与其他可读与进入执行',
    descEn: 'Owner full, others read & execute',
    type: 'standard'
  },
  {
    octal: '600',
    nameZh: '600 机密私钥',
    nameEn: '600 Secret Key',
    descZh: '仅所有者可读写，SSH 私钥 (id_rsa) 强制规范',
    descEn: 'Owner read/write only, SSH private key',
    type: 'safe'
  },
  {
    octal: '700',
    nameZh: '700 私有目录',
    nameEn: '700 Private Dir',
    descZh: '仅所有者完全控制，用于 ~/.ssh 目录等',
    descEn: 'Owner only, typically for ~/.ssh dir',
    isDir: true,
    type: 'safe'
  },
  {
    octal: '400',
    nameZh: '400 只读凭据',
    nameEn: '400 Read-only',
    descZh: '仅所有者只读，防意外覆写证书或秘钥',
    descEn: 'Owner read-only, protects certificates',
    type: 'safe'
  },
  {
    octal: '777',
    nameZh: '777 完全开放',
    nameEn: '777 Full Access',
    descZh: '所有人皆可读写执行，生产环境存在严重风险',
    descEn: 'Full read/write/exec for everyone (High risk)',
    type: 'danger'
  },
  {
    octal: '666',
    nameZh: '666 全局可写',
    nameEn: '666 World Write',
    descZh: '所有人皆可读写，但不可执行',
    descEn: 'Read & write for everyone, no execute',
    type: 'danger'
  },
  {
    octal: '1777',
    nameZh: '1777 共享临时目录',
    nameEn: '1777 Sticky /tmp',
    descZh: '启用 Sticky 粘滞位，如 /tmp，防删他人文件',
    descEn: 'Sticky bit enabled, e.g. /tmp dir',
    isDir: true,
    type: 'special'
  },
  {
    octal: '4755',
    nameZh: '4755 SUID 特权',
    nameEn: '4755 SUID Binary',
    descZh: '执行时临时提权为所有者(通常为 root)，如 passwd',
    descEn: 'Runs with owner privileges, e.g. passwd',
    type: 'special'
  },
  {
    octal: '2775',
    nameZh: '2775 SGID 协作',
    nameEn: '2775 SGID Folder',
    descZh: '目录内新建文件自动继承父组，利于团队共享',
    descEn: 'Inherits parent group, team shared folders',
    isDir: true,
    type: 'special'
  }
];

function applyPreset(p: ChmodPreset) {
  applyFromOctal(p.octal);
  if (p.isDir !== undefined) {
    isDir.value = p.isDir;
  }
}

// 安全与风险评估
const securityStatus = computed(() => {
  const isWorldWritable = otherPerms.value.w;
  const isFullOpen = octal3.value === '777';
  const isPrivate = octal3.value === '600' || octal3.value === '700' || octal3.value === '400';

  if (isFullOpen || isWorldWritable) {
    return {
      level: 'danger',
      title: locale.value.startsWith('zh') ? '高危安全警告' : 'High Security Risk',
      message: locale.value.startsWith('zh')
        ? '允许其他任何用户写入/修改该文件。在多用户系统或生产服务器中极易被注入恶意代码或篡改数据！'
        : 'World-writable permission enabled. Any user can modify or truncate this file!',
      bgClass: 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50 text-rose-800 dark:text-rose-300'
    };
  }

  if (isPrivate) {
    return {
      level: 'safe',
      title: locale.value.startsWith('zh') ? '高安全性配置' : 'Strict Security',
      message: locale.value.startsWith('zh')
        ? '仅文件所有者拥有访问权限，组与其他用户完全不可读写，符合 SSH 密钥与绝密凭据的安全规范。'
        : 'Strictly restricted to the file owner. Ideal for SSH keys and private credentials.',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300'
    };
  }

  if (specialPerms.value.suid || specialPerms.value.sgid) {
    return {
      level: 'special',
      title: locale.value.startsWith('zh') ? '特殊特权标记' : 'Privilege Elevation',
      message: locale.value.startsWith('zh')
        ? '已启用 SUID 或 SGID，执行时将临时借用所有者或组特权运行，请确保二进制文件不存在权限逃逸漏洞。'
        : 'SUID or SGID enabled. Binary runs with elevated privileges of the file owner or group.',
      bgClass: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-900/50 text-purple-800 dark:text-purple-300'
    };
  }

  return {
    level: 'standard',
    title: locale.value.startsWith('zh') ? '常规权限规范' : 'Standard Permission',
    message: locale.value.startsWith('zh')
      ? '权限配置均衡，仅所有者可写，其他人受只读或只执行限制，符合 Unix 最小特权原则。'
      : 'Standard Unix permissions. Owner can modify while others have read/execute access.',
    bgClass: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300'
  };
});

function formatPermSummary(p: Triplet, isDirectory: boolean): string {
  const isZh = locale.value.startsWith('zh');
  const readStr = p.r ? (isZh ? '可读' : 'Read') : (isZh ? '不可读' : 'No Read');
  const writeStr = p.w ? (isZh ? '可写' : 'Write') : (isZh ? '不可写' : 'No Write');
  const execStr = p.x
    ? (isDirectory ? (isZh ? '可进入检索' : 'Enter / Search') : (isZh ? '可执行' : 'Execute'))
    : (isZh ? '不可执行' : 'No Execute');

  return isZh ? `${readStr}、${writeStr}、${execStr}` : `${readStr}, ${writeStr}, ${execStr}`;
}
</script>

<template>
  <ToolContainer
    toolId="chmod-calculator"
    nameKey="tools.chmodCalculator.name"
    descKey="tools.chmodCalculator.desc"
    :icon="ShieldCheck"
    :wide="true"
    :fullHeight="true"
  >
    <div class="flex flex-col h-full overflow-y-auto p-6 gap-6">
      <!-- 1. 常用权限预设 (Presets) -->
      <div class="flex flex-col gap-2.5">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Sparkles class="w-4 h-4 text-amber-500" />
            <h2 class="text-xs font-semibold text-zinc-800 dark:text-zinc-200 uppercase tracking-wider">
              {{ t('tools.chmodCalculator.presets') }}
            </h2>
          </div>
          <div class="flex items-center gap-2">
            <button
              type="button"
              @click="setAllPerms(true)"
              class="text-xs text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {{ locale.startsWith('zh') ? '全部允许' : 'Grant All' }}
            </button>
            <span class="text-zinc-300 dark:text-zinc-700">|</span>
            <button
              type="button"
              @click="setAllPerms(false)"
              class="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
            >
              {{ locale.startsWith('zh') ? '全部清空' : 'Clear All' }}
            </button>
          </div>
        </div>

        <div class="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none flex-wrap">
          <button
            v-for="p in presets"
            :key="p.octal"
            type="button"
            @click="applyPreset(p)"
            class="group inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer shadow-2xs"
            :class="[
              octal3 === p.octal || octal4 === p.octal
                ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                : 'bg-white dark:bg-zinc-800/80 border-zinc-200/80 dark:border-zinc-700/80 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-750'
            ]"
            :title="locale.startsWith('zh') ? p.descZh : p.descEn"
          >
            <span class="font-mono font-bold">{{ p.octal }}</span>
            <span class="text-[11px] opacity-80">{{ locale.startsWith('zh') ? p.nameZh.replace(/^\d+\s*/, '') : p.nameEn.replace(/^\d+\s*/, '') }}</span>
          </button>
        </div>
      </div>

      <!-- 2. 八进制与符号双向输入控制卡片 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
        <!-- 八进制值输入框 -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center justify-between">
            <span>{{ t('tools.chmodCalculator.octalInput') }}</span>
            <span class="text-[10px] text-zinc-400 font-normal font-mono">0-7777</span>
          </label>
          <div class="relative">
            <input
              v-model="octalInput"
              type="text"
              maxlength="5"
              @input="applyFromOctal(octalInput)"
              class="w-full px-3 py-2 rounded-lg border font-mono text-base font-bold text-blue-600 dark:text-blue-400 bg-zinc-50 dark:bg-zinc-800/80 outline-none transition-all"
              :class="hasInputError ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15'"
            />
          </div>
        </div>

        <!-- 符号表示输入框 -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center justify-between">
            <span>{{ t('tools.chmodCalculator.symbolicInput') }}</span>
            <span class="text-[10px] text-zinc-400 font-normal font-mono">rwxrwxrwx</span>
          </label>
          <input
            v-model="symbolicInput"
            type="text"
            maxlength="10"
            @input="applyFromSymbolic(symbolicInput)"
            class="w-full px-3 py-2 rounded-lg border font-mono text-sm font-bold text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/80 outline-none transition-all"
            :class="hasInputError ? 'border-rose-500 focus:ring-2 focus:ring-rose-500/20' : 'border-zinc-200 dark:border-zinc-700 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15'"
          />
        </div>

        <!-- 文件类型 (常规文件 vs 目录) -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-zinc-600 dark:text-zinc-300">
            {{ t('tools.chmodCalculator.fileType') }}
          </label>
          <div class="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              @click="isDir = false"
              class="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer"
              :class="!isDir ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-semibold' : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'"
            >
              <File class="w-3.5 h-3.5" />
              <span>{{ t('tools.chmodCalculator.regularFile') }}</span>
            </button>
            <button
              type="button"
              @click="isDir = true"
              class="flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium border transition-colors cursor-pointer"
              :class="isDir ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800 font-semibold' : 'bg-zinc-50 dark:bg-zinc-800/50 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'"
            >
              <Folder class="w-3.5 h-3.5" />
              <span>{{ t('tools.chmodCalculator.directory') }}</span>
            </button>
          </div>
        </div>

        <!-- 目标路径与 -R 递归 -->
        <div class="flex flex-col gap-1.5">
          <label class="text-xs font-semibold text-zinc-600 dark:text-zinc-300 flex items-center justify-between">
            <span>{{ t('tools.chmodCalculator.targetPath') }}</span>
            <label class="inline-flex items-center gap-1 text-[11px] font-normal cursor-pointer select-none">
              <input
                type="checkbox"
                v-model="isRecursive"
                class="rounded border-zinc-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
              />
              <span>-R {{ locale.startsWith('zh') ? '递归' : 'Recursive' }}</span>
            </label>
          </label>
          <input
            v-model="targetPath"
            type="text"
            class="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-zinc-800 dark:text-zinc-200 bg-zinc-50 dark:bg-zinc-800/80 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/15 transition-all"
            :placeholder="locale.startsWith('zh') ? 'filename 或 path/to/dir' : 'filename or path/to/dir'"
          />
        </div>

        <!-- 错误提示 -->
        <div v-if="hasInputError" class="col-span-full text-xs text-rose-500 flex items-center gap-1.5 pt-1">
          <AlertTriangle class="w-3.5 h-3.5 shrink-0" />
          <span>{{ errorMessage }}</span>
        </div>
      </div>

      <!-- 3. 交互式复选框权限矩阵 (Matrix) -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- 所有者 (User / Owner) -->
        <div class="p-4 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-3">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full bg-blue-500"></div>
              <h3 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                {{ t('tools.chmodCalculator.user') }}
              </h3>
            </div>
            <span class="px-2 py-0.5 rounded font-mono text-xs font-bold bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/40">
              {{ tripletToNum(userPerms) }}
            </span>
          </div>

          <div class="flex flex-col gap-2">
            <label class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer select-none transition-colors border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/60">
              <span class="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{{ t('tools.chmodCalculator.read') }}</span>
              <input type="checkbox" v-model="userPerms.r" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
            </label>
            <label class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer select-none transition-colors border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/60">
              <span class="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{{ t('tools.chmodCalculator.write') }}</span>
              <input type="checkbox" v-model="userPerms.w" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
            </label>
            <label class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer select-none transition-colors border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/60">
              <span class="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{{ t('tools.chmodCalculator.execute') }}</span>
              <input type="checkbox" v-model="userPerms.x" class="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer" />
            </label>
            <!-- 特殊权限：SetUID -->
            <label class="flex items-center justify-between p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 cursor-pointer select-none transition-colors mt-1">
              <div class="flex flex-col">
                <span class="text-xs text-purple-700 dark:text-purple-300 font-semibold">{{ t('tools.chmodCalculator.suid') }}</span>
                <span class="text-[10px] text-zinc-400 font-normal">{{ locale.startsWith('zh') ? '以所有者身份执行 (s)' : 'Execute as owner (s)' }}</span>
              </div>
              <input type="checkbox" v-model="specialPerms.suid" class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer" />
            </label>
          </div>
        </div>

        <!-- 所属组 (Group) -->
        <div class="p-4 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-3">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
              <h3 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                {{ t('tools.chmodCalculator.group') }}
              </h3>
            </div>
            <span class="px-2 py-0.5 rounded font-mono text-xs font-bold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40">
              {{ tripletToNum(groupPerms) }}
            </span>
          </div>

          <div class="flex flex-col gap-2">
            <label class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer select-none transition-colors border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/60">
              <span class="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{{ t('tools.chmodCalculator.read') }}</span>
              <input type="checkbox" v-model="groupPerms.r" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
            </label>
            <label class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer select-none transition-colors border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/60">
              <span class="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{{ t('tools.chmodCalculator.write') }}</span>
              <input type="checkbox" v-model="groupPerms.w" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
            </label>
            <label class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer select-none transition-colors border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/60">
              <span class="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{{ t('tools.chmodCalculator.execute') }}</span>
              <input type="checkbox" v-model="groupPerms.x" class="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer" />
            </label>
            <!-- 特殊权限：SetGID -->
            <label class="flex items-center justify-between p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 cursor-pointer select-none transition-colors mt-1">
              <div class="flex flex-col">
                <span class="text-xs text-purple-700 dark:text-purple-300 font-semibold">{{ t('tools.chmodCalculator.sgid') }}</span>
                <span class="text-[10px] text-zinc-400 font-normal">{{ locale.startsWith('zh') ? '继承属组 / 组特权运行 (s)' : 'Inherit group / execute as group (s)' }}</span>
              </div>
              <input type="checkbox" v-model="specialPerms.sgid" class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer" />
            </label>
          </div>
        </div>

        <!-- 其他用户 (Others) -->
        <div class="p-4 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-3">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-100 dark:border-zinc-800">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full bg-amber-500"></div>
              <h3 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase">
                {{ t('tools.chmodCalculator.other') }}
              </h3>
            </div>
            <span class="px-2 py-0.5 rounded font-mono text-xs font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40">
              {{ tripletToNum(otherPerms) }}
            </span>
          </div>

          <div class="flex flex-col gap-2">
            <label class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer select-none transition-colors border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/60">
              <span class="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{{ t('tools.chmodCalculator.read') }}</span>
              <input type="checkbox" v-model="otherPerms.r" class="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" />
            </label>
            <label class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer select-none transition-colors border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/60">
              <span class="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{{ t('tools.chmodCalculator.write') }}</span>
              <input type="checkbox" v-model="otherPerms.w" class="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" />
            </label>
            <label class="flex items-center justify-between p-2 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-800/60 cursor-pointer select-none transition-colors border border-transparent hover:border-zinc-200/60 dark:hover:border-zinc-700/60">
              <span class="text-xs text-zinc-700 dark:text-zinc-300 font-medium">{{ t('tools.chmodCalculator.execute') }}</span>
              <input type="checkbox" v-model="otherPerms.x" class="w-4 h-4 rounded text-amber-600 focus:ring-amber-500 cursor-pointer" />
            </label>
            <!-- 特殊权限：Sticky Bit -->
            <label class="flex items-center justify-between p-2 rounded-lg bg-purple-50/50 dark:bg-purple-950/20 border border-purple-200/60 dark:border-purple-900/40 cursor-pointer select-none transition-colors mt-1">
              <div class="flex flex-col">
                <span class="text-xs text-purple-700 dark:text-purple-300 font-semibold">{{ t('tools.chmodCalculator.sticky') }}</span>
                <span class="text-[10px] text-zinc-400 font-normal">{{ locale.startsWith('zh') ? '粘滞位，防非所有者删除 (t)' : 'Prevent non-owner deletion (t)' }}</span>
              </div>
              <input type="checkbox" v-model="specialPerms.sticky" class="w-4 h-4 rounded text-purple-600 focus:ring-purple-500 cursor-pointer" />
            </label>
          </div>
        </div>
      </div>

      <!-- 4. 生成的 Shell 命令行与终端输出模拟 -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- 常用命令集合 -->
        <div class="p-4 rounded-xl border border-zinc-200/90 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-3">
          <div class="flex items-center gap-2">
            <Terminal class="w-4 h-4 text-blue-500" />
            <h3 class="text-xs font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              {{ t('tools.chmodCalculator.generatedCommands') }}
            </h3>
          </div>

          <div class="flex flex-col gap-2.5">
            <!-- 八进制命令 -->
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold text-zinc-400">{{ t('tools.chmodCalculator.chmodOctal') }}</span>
              <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                <span class="select-all">{{ commandOctal }}</span>
                <button
                  type="button"
                  @click="triggerCopied('octal-cmd', commandOctal)"
                  class="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer ml-2"
                  :title="t('tools.chmodCalculator.copyCommand')"
                >
                  <Check v-if="copiedKey === 'octal-cmd'" class="w-3.5 h-3.5 text-emerald-500" />
                  <Copy v-else class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- 符号式命令 -->
            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-semibold text-zinc-400">{{ t('tools.chmodCalculator.chmodSymbolic') }}</span>
              <div class="flex items-center justify-between px-3 py-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/80 border border-zinc-200 dark:border-zinc-700 font-mono text-xs text-zinc-900 dark:text-zinc-100">
                <span class="select-all">{{ commandSymbolic }}</span>
                <button
                  type="button"
                  @click="triggerCopied('symbolic-cmd', commandSymbolic)"
                  class="text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 cursor-pointer ml-2"
                  :title="t('tools.chmodCalculator.copyCommand')"
                >
                  <Check v-if="copiedKey === 'symbolic-cmd'" class="w-3.5 h-3.5 text-emerald-500" />
                  <Copy v-else class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- 对应 Umask -->
            <div class="flex items-center justify-between text-xs pt-1 px-1">
              <span class="text-zinc-500">{{ t('tools.chmodCalculator.umaskRef') }}:</span>
              <span class="font-mono font-bold text-zinc-700 dark:text-zinc-300">umask {{ umaskEquivalent }}</span>
            </div>
          </div>
        </div>

        <!-- 终端模拟 ls -l 列表预览 -->
        <div class="p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-zinc-100 font-mono text-xs shadow-xs flex flex-col justify-between">
          <div class="flex items-center justify-between pb-2 border-b border-zinc-800 mb-3">
            <div class="flex items-center gap-2">
              <div class="w-2.5 h-2.5 rounded-full bg-rose-500/80"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-amber-500/80"></div>
              <div class="w-2.5 h-2.5 rounded-full bg-emerald-500/80"></div>
              <span class="text-[11px] text-zinc-500 ml-1.5">{{ t('tools.chmodCalculator.terminalPreview') }}</span>
            </div>
            <button
              type="button"
              @click="triggerCopied('ls-l', `${symbolicString} 1 user group 4096 Oct 28 23:00 ${targetPath || 'filename'}`)"
              class="text-zinc-400 hover:text-zinc-200 cursor-pointer"
            >
              <Check v-if="copiedKey === 'ls-l'" class="w-3.5 h-3.5 text-emerald-400" />
              <Copy v-else class="w-3.5 h-3.5" />
            </button>
          </div>

          <!-- 模拟内容 -->
          <div class="flex flex-col gap-2 py-2 select-all">
            <div class="text-zinc-400 text-[11px]">$ ls -la {{ targetPath || 'filename' }}</div>
            <div class="flex items-center gap-2 flex-wrap">
              <!-- 权限位高亮 -->
              <span class="font-bold tracking-wider" :class="isDir ? 'text-blue-400' : 'text-emerald-400'">
                {{ symbolicString }}
              </span>
              <span class="text-zinc-500">1</span>
              <span class="text-amber-300">user</span>
              <span class="text-zinc-400">group</span>
              <span class="text-zinc-400">4096</span>
              <span class="text-zinc-500">Oct 28 23:00</span>
              <span class="font-bold" :class="isDir ? 'text-blue-400' : (userPerms.x ? 'text-emerald-300' : 'text-zinc-200')">
                {{ targetPath || 'filename' }}
              </span>
            </div>
          </div>

          <!-- 底部小字 -->
          <div class="text-[10px] text-zinc-500 pt-2 border-t border-zinc-800/80 flex items-center justify-between">
            <span>Octal: {{ octal4 }}</span>
            <span>Umask: {{ umaskEquivalent }}</span>
          </div>
        </div>
      </div>

      <!-- 5. 安全评估与权限语义说明 -->
      <div
        class="p-4 rounded-xl border text-xs flex flex-col gap-2.5 transition-all"
        :class="securityStatus.bgClass"
      >
        <div class="flex items-center gap-2 font-bold text-sm">
          <AlertTriangle v-if="securityStatus.level === 'danger'" class="w-4 h-4 text-rose-500" />
          <CheckCircle v-else-if="securityStatus.level === 'safe'" class="w-4 h-4 text-emerald-500" />
          <Info v-else class="w-4 h-4 text-blue-500" />
          <span>{{ securityStatus.title }}</span>
        </div>
        <p class="leading-relaxed opacity-90">
          {{ securityStatus.message }}
        </p>

        <!-- 详细主体访问权限解读 -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-current/10 text-[11px]">
          <div>
            <span class="font-bold">{{ locale.startsWith('zh') ? '所有者权限: ' : 'Owner (User): ' }}</span>
            <span>{{ formatPermSummary(userPerms, isDir) }}</span>
          </div>
          <div>
            <span class="font-bold">{{ locale.startsWith('zh') ? '所属组成员: ' : 'Group Members: ' }}</span>
            <span>{{ formatPermSummary(groupPerms, isDir) }}</span>
          </div>
          <div>
            <span class="font-bold">{{ locale.startsWith('zh') ? '其他所有人: ' : 'Others (Public): ' }}</span>
            <span>{{ formatPermSummary(otherPerms, isDir) }}</span>
          </div>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
