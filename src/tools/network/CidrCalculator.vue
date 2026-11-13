<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Router,
  Copy,
  Check,
  AlertCircle,
  Binary,
  Split,
  SearchCheck,
  GitCompareArrows,
  ArrowRight,
  Download
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import { downloadFile } from '../../utils/download';
import {
  calculateIpv4Cidr,
  splitIpv4Subnets,
  prefixToMaskInt,
  intToIpv4,
  maskToPrefix,
  parseIpv4ToInt,
  checkIpInCidr,
  checkCidrOverlap,
  ipRangeToCidrs,
  calculateIpv6Cidr,
  splitIpv6Subnets
} from './cidrUtils';

const { t } = useI18n();

type ActiveTab = 'ipv4' | 'ipv6' | 'tools';
const activeTab = ref<ActiveTab>('ipv4');

// 通用复制反馈状态
const copiedKey = ref<string | null>(null);
function copyValue(key: string, val: string) {
  if (!val) return;
  navigator.clipboard.writeText(val).then(() => {
    copiedKey.value = key;
    setTimeout(() => {
      if (copiedKey.value === key) {
        copiedKey.value = null;
      }
    }, 1400);
  });
}

// ==================== Tab 1: IPv4 CIDR 状态 ====================
const ipv4CidrInput = ref('192.168.1.10/24');
const ipv4IpInput = ref('192.168.1.10');
const ipv4Prefix = ref(24);
const ipv4MaskInput = ref('255.255.255.0');
const ipv4MaskError = ref(false);

const ipv4Presets = [
  '192.168.1.0/24',
  '10.0.0.0/8',
  '172.16.0.0/16',
  '100.64.0.0/10',
  '192.168.10.1/28',
  '10.20.30.40/30',
  '10.20.30.40/31',
  '10.20.30.40/32'
];

const ipv4Result = computed(() => {
  if (ipv4MaskError.value) return { ok: false as const };
  return calculateIpv4Cidr(ipv4CidrInput.value);
});

function onIpv4CidrChange(val: string) {
  ipv4CidrInput.value = val;
  ipv4MaskError.value = false;
  const res = calculateIpv4Cidr(val);
  if (res.ok) {
    ipv4IpInput.value = res.inputIp;
    ipv4Prefix.value = res.prefix;
    ipv4MaskInput.value = res.subnetMask;
  }
}

function onIpv4IpChange(val: string) {
  ipv4IpInput.value = val;
  ipv4MaskError.value = false;
  if (parseIpv4ToInt(val) !== null) {
    ipv4CidrInput.value = `${val.trim()}/${ipv4Prefix.value}`;
  } else {
    ipv4CidrInput.value = `${val.trim()}/${ipv4Prefix.value}`;
  }
}

function onPrefixChange(newPrefix: number) {
  const p = Math.max(0, Math.min(32, Number(newPrefix) || 0));
  ipv4Prefix.value = p;
  ipv4MaskError.value = false;
  ipv4MaskInput.value = intToIpv4(prefixToMaskInt(p));
  const ip = ipv4IpInput.value.trim() || '192.168.1.0';
  ipv4CidrInput.value = `${ip}/${p}`;
}

function onMaskInputChange(val: string) {
  ipv4MaskInput.value = val;
  const p = maskToPrefix(val);
  if (p !== null) {
    ipv4MaskError.value = false;
    ipv4Prefix.value = p;
    const ip = ipv4IpInput.value.trim() || '192.168.1.0';
    ipv4CidrInput.value = `${ip}/${p}`;
  } else {
    ipv4MaskError.value = true;
  }
}

function applyIpv4Preset(cidr: string) {
  onIpv4CidrChange(cidr);
}

// 32-bit 二进制展示行
const binaryRows = computed(() => {
  if (!ipv4Result.value.ok) return [];
  const r = ipv4Result.value;
  return [
    { key: 'ip', label: t('tools.cidrCalculator.rowIp'), octets: r.ipBinaryOctets, text: r.inputIp },
    { key: 'mask', label: t('tools.cidrCalculator.rowMask'), octets: r.maskBinaryOctets, text: r.subnetMask },
    { key: 'net', label: t('tools.cidrCalculator.rowNetwork'), octets: r.networkBinaryOctets, text: r.networkAddress },
    { key: 'bcast', label: t('tools.cidrCalculator.rowBroadcast'), octets: r.broadcastBinaryOctets, text: r.broadcastAddress }
  ];
});

// 子网划分前缀状态
const splitTargetPrefix = ref(26);

watch(
  () => (ipv4Result.value.ok ? ipv4Result.value.prefix : 24),
  baseP => {
    if (baseP >= 32) {
      splitTargetPrefix.value = 32;
    } else if (splitTargetPrefix.value <= baseP) {
      splitTargetPrefix.value = Math.min(32, baseP + 2);
    }
  },
  { immediate: true }
);

const splitTargetOptions = computed<SelectOption[]>(() => {
  if (!ipv4Result.value.ok || ipv4Result.value.prefix >= 32) return [];
  const baseP = ipv4Result.value.prefix;
  const opts: SelectOption[] = [];
  for (let p = baseP + 1; p <= 32; p++) {
    const count = Math.pow(2, p - baseP);
    opts.push({
      label: `/${p} (${count.toLocaleString('en-US')} subnets)`,
      value: p
    });
  }
  return opts;
});

const splitSubnets = computed(() => {
  if (!ipv4Result.value.ok || ipv4Result.value.prefix >= 32) {
    return { items: [], totalCount: 0, truncated: false };
  }
  return splitIpv4Subnets(
    ipv4Result.value.networkInt,
    ipv4Result.value.prefix,
    splitTargetPrefix.value,
    256
  );
});

function exportSubnetsCsv() {
  if (!splitSubnets.value.items.length) return;
  const header = 'Index,CIDR,Network,First Usable,Last Usable,Broadcast,Usable Hosts,Total Addresses';
  const rows = splitSubnets.value.items.map(
    s => `${s.index},${s.cidr},${s.networkAddress},${s.firstUsable},${s.lastUsable},${s.broadcastAddress},${s.usableHosts},${s.totalAddresses}`
  );
  downloadFile([header, ...rows].join('\n'), `subnets-${ipv4Prefix.value}-to-${splitTargetPrefix.value}.csv`, 'text/csv;charset=utf-8');
}

// ==================== Tab 2: IPv6 CIDR 状态 ====================
const ipv6CidrInput = ref('2001:db8:85a3::8a2e:370:7334/64');
const ipv6Presets = [
  '2001:db8:85a3::/48',
  '2001:db8:85a3::8a2e:370:7334/64',
  'fe80::1/10',
  'fd00:1234:5678::/48',
  '::1/128'
];

const ipv6Result = computed(() => calculateIpv6Cidr(ipv6CidrInput.value));

const ipv6SplitPrefix = ref(64);
watch(
  () => (ipv6Result.value.ok ? ipv6Result.value.prefix : 64),
  baseP => {
    if (baseP >= 128) {
      ipv6SplitPrefix.value = 128;
    } else if (ipv6SplitPrefix.value <= baseP) {
      ipv6SplitPrefix.value = Math.min(128, baseP + 4);
    }
  },
  { immediate: true }
);

const ipv6SplitOptions = computed<SelectOption[]>(() => {
  if (!ipv6Result.value.ok || ipv6Result.value.prefix >= 128) return [];
  const baseP = ipv6Result.value.prefix;
  const opts: SelectOption[] = [];
  const maxStep = Math.min(128, baseP + 16);
  for (let p = baseP + 1; p <= maxStep; p++) {
    const countBig = 1n << BigInt(p - baseP);
    opts.push({
      label: `/${p} (${countBig.toLocaleString('en-US')} subnets)`,
      value: p
    });
  }
  return opts;
});

const ipv6Subnets = computed(() => {
  if (!ipv6Result.value.ok || ipv6Result.value.prefix >= 128) {
    return { items: [], totalStr: '0', truncated: false };
  }
  return splitIpv6Subnets(
    ipv6Result.value.networkBigInt,
    ipv6Result.value.prefix,
    ipv6SplitPrefix.value,
    64
  );
});

// ==================== Tab 3: 归属 / 重叠 / 范围聚合 ====================
const checkIpInput = ref('10.0.12.55');
const checkCidrListInput = ref('192.168.0.0/16\n10.0.0.0/16\n10.0.12.0/24\n172.16.0.0/12');

const ipCheckResults = computed(() => {
  const ipValid = parseIpv4ToInt(checkIpInput.value) !== null;
  if (!ipValid) {
    return {
      validIp: false,
      matches: [] as { cidr: string; matched: boolean; validCidr: boolean }[]
    };
  }

  const lines = checkCidrListInput.value
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean);

  const matches: { cidr: string; matched: boolean; validCidr: boolean }[] = lines.map(cidr => {
    const res = checkIpInCidr(checkIpInput.value, cidr);
    return {
      cidr,
      matched: res === true,
      validCidr: res !== null
    };
  });

  return { validIp: true, matches };
});

const overlapCidrA = ref('10.0.0.0/16');
const overlapCidrB = ref('10.0.128.0/17');

const overlapResult = computed(() => checkCidrOverlap(overlapCidrA.value, overlapCidrB.value));

const rangeStartIp = ref('192.168.1.10');
const rangeEndIp = ref('192.168.1.50');

const rangeAggregatedCidrs = computed(() => ipRangeToCidrs(rangeStartIp.value, rangeEndIp.value));
</script>

<template>
  <ToolContainer
    toolId="cidr-calculator"
    nameKey="tools.cidrCalculator.name"
    descKey="tools.cidrCalculator.desc"
    :icon="Router"
    :wide="true"
    :fullHeight="false"
  >
    <div class="flex flex-col gap-4">
      <!-- 顶部 Tab 切换 -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="inline-flex rounded-xl bg-zinc-100 dark:bg-zinc-800 p-1 border border-zinc-200/80 dark:border-zinc-700/80">
          <button
            type="button"
            @click="activeTab = 'ipv4'"
            class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            :class="activeTab === 'ipv4'
              ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
          >
            {{ t('tools.cidrCalculator.tabIpv4') }}
          </button>
          <button
            type="button"
            @click="activeTab = 'ipv6'"
            class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            :class="activeTab === 'ipv6'
              ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
          >
            {{ t('tools.cidrCalculator.tabIpv6') }}
          </button>
          <button
            type="button"
            @click="activeTab = 'tools'"
            class="px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer"
            :class="activeTab === 'tools'
              ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
          >
            {{ t('tools.cidrCalculator.tabTools') }}
          </button>
        </div>
      </div>

      <!-- ==================== TAB 1: IPv4 CIDR ==================== -->
      <template v-if="activeTab === 'ipv4'">
        <!-- 输入控制卡 -->
        <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3.5">
          <div class="grid grid-cols-1 md:grid-cols-12 gap-3">
            <div class="md:col-span-4">
              <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {{ t('tools.cidrCalculator.cidrInputLabel') }}
              </label>
              <input
                :value="ipv4CidrInput"
                @input="onIpv4CidrChange(($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="192.168.1.10/24"
                class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div class="md:col-span-3">
              <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {{ t('tools.cidrCalculator.ipAddress') }}
              </label>
              <input
                :value="ipv4IpInput"
                @input="onIpv4IpChange(($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="192.168.1.10"
                class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div class="md:col-span-3">
              <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {{ t('tools.cidrCalculator.subnetMask') }}
              </label>
              <input
                :value="ipv4MaskInput"
                @input="onMaskInputChange(($event.target as HTMLInputElement).value)"
                type="text"
                placeholder="255.255.255.0"
                class="w-full px-3 py-2 text-sm font-mono rounded-lg border bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1"
                :class="ipv4MaskError ? 'border-rose-400 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'"
              />
            </div>

            <div class="md:col-span-2">
              <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                {{ t('tools.cidrCalculator.prefixLength') }}
              </label>
              <div class="flex items-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950">
                <span class="text-sm font-mono text-zinc-400">/</span>
                <input
                  :value="ipv4Prefix"
                  @input="onPrefixChange(Number(($event.target as HTMLInputElement).value))"
                  type="number"
                  min="0"
                  max="32"
                  class="w-full text-sm font-mono bg-transparent text-zinc-900 dark:text-zinc-100 focus:outline-none"
                />
              </div>
            </div>
          </div>

          <!-- 滑块微调前缀长度 -->
          <div class="flex items-center gap-3">
            <span class="text-[11px] font-mono text-zinc-400 w-6">/0</span>
            <input
              :value="ipv4Prefix"
              @input="onPrefixChange(Number(($event.target as HTMLInputElement).value))"
              type="range"
              min="0"
              max="32"
              class="flex-1 accent-blue-600 cursor-pointer"
            />
            <span class="text-[11px] font-mono text-zinc-400 w-7 text-right">/32</span>
          </div>

          <!-- 常用网段预设 -->
          <div class="flex items-center gap-1.5 flex-wrap pt-1 border-t border-zinc-100 dark:border-zinc-800/80">
            <span class="text-[11px] text-zinc-400 dark:text-zinc-500 mr-1">{{ t('tools.cidrCalculator.presets') }}:</span>
            <button
              v-for="preset in ipv4Presets"
              :key="preset"
              type="button"
              @click="applyIpv4Preset(preset)"
              class="px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer"
              :class="ipv4CidrInput.trim() === preset
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
            >
              {{ preset }}
            </button>
          </div>
        </div>

        <!-- 错误提示 -->
        <div
          v-if="!ipv4Result.ok"
          class="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ t('tools.cidrCalculator.invalidIpv4Cidr') }}</span>
        </div>

        <template v-else>
          <!-- 核心计算指标网格 -->
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <!-- 规范 CIDR -->
            <button
              type="button"
              @click="copyValue('cidr', ipv4Result.cidr)"
              class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group"
            >
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>{{ t('tools.cidrCalculator.networkCidr') }}</span>
                <component :is="copiedKey === 'cidr' ? Check : Copy" class="w-3.5 h-3.5" :class="copiedKey === 'cidr' ? 'text-emerald-500' : 'text-zinc-400 opacity-0 group-hover:opacity-100'" />
              </div>
              <div class="text-base font-mono font-semibold text-blue-600 dark:text-blue-400">{{ ipv4Result.cidr }}</div>
            </button>

            <!-- 网络地址 -->
            <button
              type="button"
              @click="copyValue('net', ipv4Result.networkAddress)"
              class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group"
            >
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>{{ t('tools.cidrCalculator.networkAddress') }}</span>
                <component :is="copiedKey === 'net' ? Check : Copy" class="w-3.5 h-3.5" :class="copiedKey === 'net' ? 'text-emerald-500' : 'text-zinc-400 opacity-0 group-hover:opacity-100'" />
              </div>
              <div class="text-base font-mono font-semibold text-zinc-900 dark:text-zinc-100">{{ ipv4Result.networkAddress }}</div>
            </button>

            <!-- 广播地址 -->
            <button
              type="button"
              @click="copyValue('bcast', ipv4Result.broadcastAddress)"
              class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group"
            >
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>{{ t('tools.cidrCalculator.broadcastAddress') }}</span>
                <component :is="copiedKey === 'bcast' ? Check : Copy" class="w-3.5 h-3.5" :class="copiedKey === 'bcast' ? 'text-emerald-500' : 'text-zinc-400 opacity-0 group-hover:opacity-100'" />
              </div>
              <div class="text-base font-mono font-semibold text-zinc-900 dark:text-zinc-100">{{ ipv4Result.broadcastAddress }}</div>
            </button>

            <!-- 可用主机范围 -->
            <button
              type="button"
              @click="copyValue('range', `${ipv4Result.firstUsable} - ${ipv4Result.lastUsable}`)"
              class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group"
            >
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>{{ t('tools.cidrCalculator.usableRange') }}</span>
                <component :is="copiedKey === 'range' ? Check : Copy" class="w-3.5 h-3.5" :class="copiedKey === 'range' ? 'text-emerald-500' : 'text-zinc-400 opacity-0 group-hover:opacity-100'" />
              </div>
              <div class="text-sm font-mono font-semibold text-emerald-600 dark:text-emerald-400 truncate">
                {{ ipv4Result.firstUsable }} ~ {{ ipv4Result.lastUsable }}
              </div>
            </button>

            <!-- 子网掩码 -->
            <button
              type="button"
              @click="copyValue('mask', ipv4Result.subnetMask)"
              class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group"
            >
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>{{ t('tools.cidrCalculator.subnetMask') }}</span>
                <component :is="copiedKey === 'mask' ? Check : Copy" class="w-3.5 h-3.5" :class="copiedKey === 'mask' ? 'text-emerald-500' : 'text-zinc-400 opacity-0 group-hover:opacity-100'" />
              </div>
              <div class="text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-100">{{ ipv4Result.subnetMask }}</div>
            </button>

            <!-- 通配符掩码 -->
            <button
              type="button"
              @click="copyValue('wild', ipv4Result.wildcardMask)"
              class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group"
            >
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>{{ t('tools.cidrCalculator.wildcardMask') }}</span>
                <component :is="copiedKey === 'wild' ? Check : Copy" class="w-3.5 h-3.5" :class="copiedKey === 'wild' ? 'text-emerald-500' : 'text-zinc-400 opacity-0 group-hover:opacity-100'" />
              </div>
              <div class="text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-100">{{ ipv4Result.wildcardMask }}</div>
            </button>

            <!-- 可用主机数 / 总数 -->
            <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                {{ t('tools.cidrCalculator.usableHosts') }} / {{ t('tools.cidrCalculator.totalAddresses') }}
              </div>
              <div class="text-sm font-mono font-semibold text-zinc-900 dark:text-zinc-100">
                <span class="text-emerald-600 dark:text-emerald-400">{{ ipv4Result.usableHosts.toLocaleString('en-US') }}</span>
                <span class="text-zinc-400 mx-1">/</span>
                <span>{{ ipv4Result.totalAddresses.toLocaleString('en-US') }}</span>
              </div>
            </div>

            <!-- IP 分类与属性 -->
            <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                {{ t('tools.cidrCalculator.ipClass') }} · {{ t('tools.cidrCalculator.ipScope') }}
              </div>
              <div class="flex items-center gap-1.5 flex-wrap">
                <span class="px-1.5 py-0.5 rounded text-xs font-mono font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400">
                  Class {{ ipv4Result.ipClass }}
                </span>
                <span class="text-xs font-medium text-zinc-800 dark:text-zinc-200">
                  {{ t(`tools.cidrCalculator.scopes.${ipv4Result.scopeType}`) }}
                </span>
              </div>
            </div>
          </div>

          <!-- 特殊前缀提示 + Hex / PTR 附属行 -->
          <div class="flex flex-wrap items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-xs">
            <div class="flex flex-wrap items-center gap-4 font-mono">
              <div>
                <span class="text-zinc-400 mr-1.5">{{ t('tools.cidrCalculator.hexAndInt') }}:</span>
                <button
                  type="button"
                  @click="copyValue('hex', ipv4Result.hexIp)"
                  class="text-zinc-800 dark:text-zinc-200 hover:text-blue-600 cursor-pointer"
                >
                  {{ ipv4Result.hexIp }} ({{ ipv4Result.ipInt }})
                </button>
              </div>
              <div>
                <span class="text-zinc-400 mr-1.5">{{ t('tools.cidrCalculator.ptrRecord') }}:</span>
                <button
                  type="button"
                  @click="copyValue('ptr', ipv4Result.ptrRecord)"
                  class="text-zinc-800 dark:text-zinc-200 hover:text-blue-600 cursor-pointer"
                >
                  {{ ipv4Result.ptrRecord }}
                </button>
              </div>
            </div>

            <span v-if="ipv4Result.isPointToPoint31" class="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              {{ t('tools.cidrCalculator.noteRfc3021') }}
            </span>
            <span v-else-if="ipv4Result.isSingleHost32" class="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
              {{ t('tools.cidrCalculator.noteSingleHost') }}
            </span>
          </div>

          <!-- 32 位二进制结构可视化 -->
          <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <Binary class="w-4 h-4 text-blue-500" />
                <span>{{ t('tools.cidrCalculator.binaryViewTitle') }}</span>
              </div>

              <div class="flex items-center gap-3 text-[11px]">
                <span class="inline-flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-sm bg-blue-500/80"></span>
                  <span class="text-zinc-600 dark:text-zinc-300">{{ t('tools.cidrCalculator.networkBitsLabel', { count: ipv4Result.prefix }) }}</span>
                </span>
                <span class="inline-flex items-center gap-1.5">
                  <span class="w-2.5 h-2.5 rounded-sm bg-emerald-500/80"></span>
                  <span class="text-zinc-600 dark:text-zinc-300">{{ t('tools.cidrCalculator.hostBitsLabel', { count: 32 - ipv4Result.prefix }) }}</span>
                </span>
              </div>
            </div>

            <div class="space-y-1.5 overflow-x-auto">
              <div
                v-for="row in binaryRows"
                :key="row.key"
                class="flex items-center gap-3 text-xs font-mono min-w-[600px]"
              >
                <span class="w-20 text-zinc-500 dark:text-zinc-400 font-sans text-[11px] shrink-0">{{ row.label }}</span>
                <div class="flex items-center gap-1.5">
                  <template v-for="(octet, oIdx) in row.octets" :key="oIdx">
                    <div class="inline-flex rounded overflow-hidden border border-zinc-200 dark:border-zinc-700/80">
                      <span
                        v-for="(bit, bIdx) in octet.split('')"
                        :key="bIdx"
                        class="w-4 h-5 flex items-center justify-center text-[11px] font-semibold"
                        :class="(oIdx * 8 + bIdx) < ipv4Result.prefix
                          ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                          : 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'"
                      >
                        {{ bit }}
                      </span>
                    </div>
                    <span v-if="oIdx < 3" class="text-zinc-400 font-bold">.</span>
                  </template>
                </div>
                <span class="text-zinc-600 dark:text-zinc-300 ml-auto text-[11px]">{{ row.text }}</span>
              </div>
            </div>
          </div>

          <!-- 子网划分预览器 -->
          <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
            <div class="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <Split class="w-4 h-4 text-blue-500" />
                <span>{{ t('tools.cidrCalculator.splitterTitle') }}</span>
                <span
                  v-if="splitSubnets.totalCount > 0"
                  class="text-[11px] font-normal text-zinc-500 dark:text-zinc-400"
                >
                  — {{ t('tools.cidrCalculator.splitCountSummary', {
                    total: splitSubnets.totalCount.toLocaleString('en-US'),
                    hosts: (splitSubnets.items[0]?.usableHosts ?? 0).toLocaleString('en-US')
                  }) }}
                </span>
              </div>

              <div v-if="ipv4Result.prefix < 32" class="flex items-center gap-2">
                <span class="text-xs text-zinc-500 dark:text-zinc-400">{{ t('tools.cidrCalculator.splitTargetPrefix') }}:</span>
                <div class="w-48">
                  <CustomSelect
                    v-model="splitTargetPrefix"
                    :options="splitTargetOptions"
                    size="sm"
                  />
                </div>
                <button
                  type="button"
                  @click="exportSubnetsCsv"
                  :disabled="splitSubnets.items.length === 0"
                  class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer"
                >
                  <Download class="w-3.5 h-3.5" />
                  <span>{{ t('tools.cidrCalculator.exportCsv') }}</span>
                </button>
              </div>
            </div>

            <div v-if="ipv4Result.prefix >= 32" class="p-6 text-center text-xs text-zinc-400 dark:text-zinc-500">
              {{ t('tools.cidrCalculator.splitCannotSplit') }}
            </div>

            <div v-else class="max-h-72 overflow-y-auto">
              <div
                v-if="splitSubnets.truncated"
                class="px-4 py-1.5 bg-amber-50/70 dark:bg-amber-950/30 text-[11px] text-amber-700 dark:text-amber-300 border-b border-amber-100 dark:border-amber-900/40"
              >
                {{ t('tools.cidrCalculator.splitTruncated', { max: 256 }) }}
              </div>

              <table class="w-full text-left border-collapse text-xs">
                <thead class="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th class="py-2 px-3 font-medium w-12">{{ t('tools.cidrCalculator.colIndex') }}</th>
                    <th class="py-2 px-3 font-medium">{{ t('tools.cidrCalculator.colCidr') }}</th>
                    <th class="py-2 px-3 font-medium">{{ t('tools.cidrCalculator.colRange') }}</th>
                    <th class="py-2 px-3 font-medium">{{ t('tools.cidrCalculator.colBroadcast') }}</th>
                    <th class="py-2 px-3 font-medium text-right">{{ t('tools.cidrCalculator.colHosts') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                  <tr
                    v-for="sub in splitSubnets.items"
                    :key="sub.index"
                    @click="applyIpv4Preset(sub.cidr)"
                    class="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors cursor-pointer"
                    :title="t('tools.cidrCalculator.clickToInspect')"
                  >
                    <td class="py-1.5 px-3 text-[11px] text-zinc-400">{{ sub.index }}</td>
                    <td class="py-1.5 px-3 font-semibold text-blue-600 dark:text-blue-400">{{ sub.cidr }}</td>
                    <td class="py-1.5 px-3 text-zinc-700 dark:text-zinc-300">{{ sub.firstUsable }} ~ {{ sub.lastUsable }}</td>
                    <td class="py-1.5 px-3 text-zinc-500 dark:text-zinc-400">{{ sub.broadcastAddress }}</td>
                    <td class="py-1.5 px-3 text-right text-emerald-600 dark:text-emerald-400">{{ sub.usableHosts.toLocaleString('en-US') }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </template>

      <!-- ==================== TAB 2: IPv6 CIDR ==================== -->
      <template v-else-if="activeTab === 'ipv6'">
        <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
          <div>
            <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
              {{ t('tools.cidrCalculator.cidrInputLabel') }} (IPv6)
            </label>
            <input
              v-model="ipv6CidrInput"
              type="text"
              placeholder="2001:db8:85a3::8a2e:370:7334/64"
              class="w-full px-3 py-2 text-sm font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div class="flex items-center gap-1.5 flex-wrap pt-1">
            <span class="text-[11px] text-zinc-400 mr-1">{{ t('tools.cidrCalculator.presets') }}:</span>
            <button
              v-for="preset in ipv6Presets"
              :key="preset"
              type="button"
              @click="ipv6CidrInput = preset"
              class="px-2 py-0.5 rounded text-[11px] font-mono border transition-colors cursor-pointer"
              :class="ipv6CidrInput.trim() === preset
                ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800'
                : 'bg-zinc-50 dark:bg-zinc-800/60 text-zinc-600 dark:text-zinc-300 border-zinc-200/80 dark:border-zinc-700/60 hover:bg-zinc-100 dark:hover:bg-zinc-700'"
            >
              {{ preset }}
            </button>
          </div>
        </div>

        <div
          v-if="!ipv6Result.ok"
          class="flex items-center gap-2 px-4 py-3 rounded-xl text-xs font-medium bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800/60"
        >
          <AlertCircle class="w-4 h-4 shrink-0" />
          <span>{{ t('tools.cidrCalculator.invalidIpv6Cidr') }}</span>
        </div>

        <template v-else>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              @click="copyValue('v6cidr', ipv6Result.compressedCidr)"
              class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group"
            >
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>{{ t('tools.cidrCalculator.networkCidr') }} (RFC 5952)</span>
                <component :is="copiedKey === 'v6cidr' ? Check : Copy" class="w-3.5 h-3.5" :class="copiedKey === 'v6cidr' ? 'text-emerald-500' : 'text-zinc-400 opacity-0 group-hover:opacity-100'" />
              </div>
              <div class="text-sm font-mono font-semibold text-blue-600 dark:text-blue-400 break-all">{{ ipv6Result.compressedCidr }}</div>
            </button>

            <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs">
              <div class="text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                {{ t('tools.cidrCalculator.totalAddresses') }} · {{ t('tools.cidrCalculator.ipScope') }}
              </div>
              <div class="flex items-center justify-between gap-2 flex-wrap">
                <span class="text-xs font-mono font-semibold text-emerald-600 dark:text-emerald-400 break-all">
                  2^{{ 128 - ipv6Result.prefix }} = {{ ipv6Result.totalAddressesStr }}
                </span>
                <span class="px-2 py-0.5 rounded text-[11px] bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 font-medium">
                  {{ t(`tools.cidrCalculator.scopes.${ipv6Result.scopeType}`) }}
                </span>
              </div>
            </div>

            <button
              type="button"
              @click="copyValue('v6exp', ipv6Result.expandedIp)"
              class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group"
            >
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>{{ t('tools.cidrCalculator.ipv6Expanded') }}</span>
                <component :is="copiedKey === 'v6exp' ? Check : Copy" class="w-3.5 h-3.5" :class="copiedKey === 'v6exp' ? 'text-emerald-500' : 'text-zinc-400 opacity-0 group-hover:opacity-100'" />
              </div>
              <div class="text-xs font-mono text-zinc-800 dark:text-zinc-200 break-all">{{ ipv6Result.expandedIp }}</div>
            </button>

            <button
              type="button"
              @click="copyValue('v6mask', ipv6Result.maskExpanded)"
              class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group"
            >
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>{{ t('tools.cidrCalculator.ipv6Mask') }}</span>
                <component :is="copiedKey === 'v6mask' ? Check : Copy" class="w-3.5 h-3.5" :class="copiedKey === 'v6mask' ? 'text-emerald-500' : 'text-zinc-400 opacity-0 group-hover:opacity-100'" />
              </div>
              <div class="text-xs font-mono text-zinc-800 dark:text-zinc-200 break-all">{{ ipv6Result.maskExpanded }}</div>
            </button>

            <button
              type="button"
              @click="copyValue('v6start', ipv6Result.networkExpanded)"
              class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group"
            >
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>{{ t('tools.cidrCalculator.ipv6NetworkStart') }}</span>
                <component :is="copiedKey === 'v6start' ? Check : Copy" class="w-3.5 h-3.5" :class="copiedKey === 'v6start' ? 'text-emerald-500' : 'text-zinc-400 opacity-0 group-hover:opacity-100'" />
              </div>
              <div class="text-xs font-mono text-zinc-800 dark:text-zinc-200 break-all">{{ ipv6Result.networkExpanded }}</div>
            </button>

            <button
              type="button"
              @click="copyValue('v6end', ipv6Result.endExpanded)"
              class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs text-left hover:border-blue-300 dark:hover:border-blue-700 transition-colors cursor-pointer group"
            >
              <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                <span>{{ t('tools.cidrCalculator.ipv6NetworkEnd') }}</span>
                <component :is="copiedKey === 'v6end' ? Check : Copy" class="w-3.5 h-3.5" :class="copiedKey === 'v6end' ? 'text-emerald-500' : 'text-zinc-400 opacity-0 group-hover:opacity-100'" />
              </div>
              <div class="text-xs font-mono text-zinc-800 dark:text-zinc-200 break-all">{{ ipv6Result.endExpanded }}</div>
            </button>
          </div>

          <!-- IPv6 子网划分预览 -->
          <div
            v-if="ipv6Result.prefix < 128"
            class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden"
          >
            <div class="px-4 py-2.5 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2">
              <div class="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <Split class="w-4 h-4 text-blue-500" />
                <span>{{ t('tools.cidrCalculator.splitterTitle') }}</span>
                <span class="text-[11px] font-normal text-zinc-500">({{ ipv6Subnets.totalStr }} subnets)</span>
              </div>

              <div class="w-52">
                <CustomSelect v-model="ipv6SplitPrefix" :options="ipv6SplitOptions" size="sm" />
              </div>
            </div>

            <div class="max-h-64 overflow-y-auto">
              <div
                v-if="ipv6Subnets.truncated"
                class="px-4 py-1.5 bg-amber-50/70 dark:bg-amber-950/30 text-[11px] text-amber-700 dark:text-amber-300 border-b border-amber-100 dark:border-amber-900/40"
              >
                {{ t('tools.cidrCalculator.splitTruncated', { max: 64 }) }}
              </div>
              <table class="w-full text-left border-collapse text-xs">
                <thead class="sticky top-0 bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <tr>
                    <th class="py-2 px-3 font-medium w-12">#</th>
                    <th class="py-2 px-3 font-medium">{{ t('tools.cidrCalculator.colCidr') }}</th>
                    <th class="py-2 px-3 font-medium">{{ t('tools.cidrCalculator.ipv6RangeShort') }}</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                  <tr
                    v-for="sub in ipv6Subnets.items"
                    :key="sub.index"
                    @click="ipv6CidrInput = sub.cidr"
                    class="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 cursor-pointer"
                  >
                    <td class="py-1.5 px-3 text-[11px] text-zinc-400">{{ sub.index }}</td>
                    <td class="py-1.5 px-3 font-semibold text-blue-600 dark:text-blue-400">{{ sub.cidr }}</td>
                    <td class="py-1.5 px-3 text-zinc-600 dark:text-zinc-300">{{ sub.start }} ~ {{ sub.end }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </template>
      </template>

      <!-- ==================== TAB 3: 归属 / 重叠 / 聚合 ==================== -->
      <template v-else>
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <!-- 1. IP 归属检测 -->
          <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
            <div class="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
              <SearchCheck class="w-4 h-4 text-blue-500" />
              <span>{{ t('tools.cidrCalculator.ipCheckTitle') }}</span>
            </div>

            <div>
              <label class="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                {{ t('tools.cidrCalculator.ipCheckIpLabel') }}
              </label>
              <input
                v-model="checkIpInput"
                type="text"
                class="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                {{ t('tools.cidrCalculator.ipCheckCidrLabel') }}
              </label>
              <textarea
                v-model="checkCidrListInput"
                rows="4"
                class="w-full px-3 py-2 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y"
              />
            </div>

            <div v-if="ipCheckResults.validIp" class="space-y-1.5">
              <div
                v-for="(item, idx) in ipCheckResults.matches"
                :key="idx"
                class="px-3 py-1.5 rounded-lg text-xs font-mono flex items-center justify-between border"
                :class="!item.validCidr
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800/50 text-rose-600'
                  : item.matched
                    ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                    : 'bg-zinc-50 dark:bg-zinc-950/50 border-zinc-200 dark:border-zinc-800 text-zinc-500'"
              >
                <span>{{ item.cidr }}</span>
                <span class="font-sans text-[11px] font-medium">
                  {{ !item.validCidr ? 'Invalid CIDR' : item.matched ? '✓ Match' : '—' }}
                </span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-4">
            <!-- 2. 网段重叠检测 -->
            <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
              <div class="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <GitCompareArrows class="w-4 h-4 text-blue-500" />
                <span>{{ t('tools.cidrCalculator.overlapTitle') }}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                    {{ t('tools.cidrCalculator.cidrA') }}
                  </label>
                  <input
                    v-model="overlapCidrA"
                    type="text"
                    class="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                    {{ t('tools.cidrCalculator.cidrB') }}
                  </label>
                  <input
                    v-model="overlapCidrB"
                    type="text"
                    class="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div
                v-if="overlapResult.ok"
                class="px-3.5 py-2.5 rounded-lg text-xs font-medium border"
                :class="overlapResult.relation === 'disjoint'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800/60 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-700 dark:text-amber-300'"
              >
                {{ t(`tools.cidrCalculator.overlapResults.${overlapResult.relation}`) }}
              </div>
              <div
                v-else
                class="px-3.5 py-2 rounded-lg text-xs bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/50"
              >
                {{ t('tools.cidrCalculator.invalidIpv4Cidr') }}
              </div>
            </div>

            <!-- 3. 起止 IP 范围聚合为 CIDR -->
            <div class="p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-3">
              <div class="flex items-center gap-2 text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                <ArrowRight class="w-4 h-4 text-blue-500" />
                <span>{{ t('tools.cidrCalculator.rangeToCidrTitle') }}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label class="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                    {{ t('tools.cidrCalculator.startIp') }}
                  </label>
                  <input
                    v-model="rangeStartIp"
                    type="text"
                    class="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label class="block text-[11px] text-zinc-500 dark:text-zinc-400 mb-1">
                    {{ t('tools.cidrCalculator.endIp') }}
                  </label>
                  <input
                    v-model="rangeEndIp"
                    type="text"
                    class="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div v-if="rangeAggregatedCidrs" class="space-y-2">
                <div class="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                  <span>{{ t('tools.cidrCalculator.aggregatedResult', { count: rangeAggregatedCidrs.length }) }}</span>
                  <button
                    type="button"
                    @click="copyValue('aggAll', rangeAggregatedCidrs.join('\n'))"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
                  >
                    <component :is="copiedKey === 'aggAll' ? Check : Copy" class="w-3 h-3" />
                    <span>{{ t('common.copy') }}</span>
                  </button>
                </div>

                <div class="flex flex-wrap gap-1.5">
                  <button
                    v-for="c in rangeAggregatedCidrs"
                    :key="c"
                    type="button"
                    @click="copyValue(`agg-${c}`, c)"
                    class="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-mono bg-zinc-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-950/40 text-zinc-800 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer"
                  >
                    <span>{{ c }}</span>
                    <Check v-if="copiedKey === `agg-${c}`" class="w-3 h-3 text-emerald-500" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>
    </div>
  </ToolContainer>
</template>
