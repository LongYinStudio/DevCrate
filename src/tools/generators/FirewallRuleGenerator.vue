<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ArrowRightLeft,
  Check,
  CheckCircle2,
  CopyPlus,
  FileDown,
  Flame,
  Gauge,
  GlobeLock,
  Info,
  Network,
  Plus,
  RotateCcw,
  ShieldAlert,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Terminal,
  Trash2,
  Wrench,
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import TextEditorBox from '../../components/common/TextEditorBox.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import { downloadFile } from '../../utils/download';
import { FIREWALL_PRESETS, QUICK_SERVICE_PORTS, type QuickServicePort } from './firewallRulePresets';
import {
  auditFirewallConfig,
  createEmptyRule,
  createRuleId,
  detectIpFamily,
  ensureSshAllowRule,
  generateFirewallScript,
  getCompanionCommands,
  isSshPortProtected,
  parsePortSpec,
  type FirewallConfig,
  type FirewallEngine,
  type FirewallRule,
  type FirewallRuleKind,
} from './firewallRuleUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

// ==================== 核心状态 ====================
const activePresetId = ref(FIREWALL_PRESETS[0].id);
const config = ref<FirewallConfig>(FIREWALL_PRESETS[0].build());
const leftTab = ref<'rules' | 'policy'>('rules');
const showAuditDetails = ref(true);
const showCompanionCmds = ref(false);
const isDownloaded = ref(false);
const toastMessage = ref('');

function showToast(msg: string) {
  toastMessage.value = msg;
  setTimeout(() => {
    if (toastMessage.value === msg) toastMessage.value = '';
  }, 2800);
}

// ==================== 派生数据 ====================
const generatedScript = computed(() => generateFirewallScript(config.value));
const companionCommands = computed(() => getCompanionCommands(config.value));
const sshStatus = computed(() => isSshPortProtected(config.value));
const auditIssues = computed(() => auditFirewallConfig(config.value));
const errorCount = computed(() => auditIssues.value.filter((i) => i.level === 'error').length);
const warningCount = computed(() => auditIssues.value.filter((i) => i.level === 'warning').length);

const ruleInvalidIds = computed(() => {
  const set = new Set<string>();
  for (const issue of auditIssues.value) {
    if (issue.level === 'error' && issue.ruleId) {
      set.add(issue.ruleId);
    }
  }
  return set;
});

// ==================== 下拉选项 ====================
const engineOptions: { id: FirewallEngine; label: string; hint: string }[] = [
  { id: 'ufw', label: 'UFW', hint: 'Ubuntu / Debian' },
  { id: 'firewalld', label: 'firewalld', hint: 'RHEL / CentOS / Rocky' },
  { id: 'iptables', label: 'iptables', hint: 'Netfilter / Universal' },
];

const actionOptions = computed<SelectOption[]>(() => [
  { label: isZh.value ? '放行 (Allow)' : 'Allow', value: 'allow' },
  { label: isZh.value ? '丢弃 (Deny / Drop)' : 'Deny / Drop', value: 'deny' },
  { label: isZh.value ? '拒绝 (Reject)' : 'Reject', value: 'reject' },
]);

const protocolOptions: SelectOption[] = [
  { label: 'TCP', value: 'tcp' },
  { label: 'UDP', value: 'udp' },
  { label: 'TCP + UDP', value: 'both' },
];

const incomingPolicyOptions = computed<SelectOption[]>(() => [
  { label: isZh.value ? '默认丢弃 DROP（推荐）' : 'DROP (Recommended)', value: 'drop' },
  { label: isZh.value ? '默认拒绝 REJECT' : 'REJECT', value: 'reject' },
  { label: isZh.value ? '默认放行 ACCEPT' : 'ACCEPT', value: 'allow' },
]);

const outgoingPolicyOptions = computed<SelectOption[]>(() => [
  { label: isZh.value ? '默认放行 ACCEPT（推荐）' : 'ACCEPT (Recommended)', value: 'allow' },
  { label: isZh.value ? '默认严格拒绝 DROP' : 'DROP (Strict)', value: 'drop' },
]);

const zoneOptions: SelectOption[] = [
  { label: 'public', value: 'public' },
  { label: 'dmz', value: 'dmz' },
  { label: 'internal', value: 'internal' },
  { label: 'work', value: 'work' },
  { label: 'trusted', value: 'trusted' },
  { label: 'drop', value: 'drop' },
];

const rateUnitOptions = computed<SelectOption[]>(() => [
  { label: isZh.value ? '/ 秒 (sec)' : '/ sec', value: 'sec' },
  { label: isZh.value ? '/ 分 (min)' : '/ min', value: 'min' },
  { label: isZh.value ? '/ 时 (hour)' : '/ hour', value: 'hour' },
]);

// ==================== 操作函数 ====================
function applyPreset(presetId: string) {
  const found = FIREWALL_PRESETS.find((p) => p.id === presetId);
  if (!found) return;
  activePresetId.value = presetId;
  config.value = found.build();
  leftTab.value = 'rules';
}

function handleReset() {
  applyPreset(activePresetId.value);
}

function setEngine(engine: FirewallEngine) {
  config.value.engine = engine;
}

function addRule(kind: FirewallRuleKind) {
  const newRule = createEmptyRule(kind);
  config.value.rules.push(newRule);
  leftTab.value = 'rules';
}

function addQuickPort(svc: QuickServicePort) {
  config.value.rules.push({
    id: createRuleId(),
    enabled: true,
    kind: 'port',
    action: 'allow',
    protocol: svc.protocol,
    port: svc.port,
    source: '',
    toPort: '',
    toAddr: '',
    iface: '',
    rateCount: 6,
    rateUnit: 'min',
    rateBurst: 10,
    comment: svc.comment,
  });
  leftTab.value = 'rules';
}

function duplicateRule(index: number) {
  const src = config.value.rules[index];
  if (!src) return;
  config.value.rules.splice(index + 1, 0, {
    ...src,
    id: createRuleId(),
    comment: src.comment ? `${src.comment} (copy)` : '',
  });
}

function removeRule(index: number) {
  config.value.rules.splice(index, 1);
}

function moveRule(index: number, delta: -1 | 1) {
  const target = index + delta;
  if (target < 0 || target >= config.value.rules.length) return;
  const list = [...config.value.rules];
  const [item] = list.splice(index, 1);
  list.splice(target, 0, item);
  config.value.rules = list;
}

function fixSshLockout() {
  config.value = ensureSshAllowRule(config.value);
  showToast(t('tools.firewallRuleGenerator.sshFixedToast'));
}

async function handleDownload() {
  const filename = `firewall-${config.value.engine}.sh`;
  await downloadFile(generatedScript.value, filename, 'text/x-shellscript;charset=utf-8');
  isDownloaded.value = true;
  showToast(t('tools.firewallRuleGenerator.downloadedNotice', { filename }));
  setTimeout(() => {
    isDownloaded.value = false;
  }, 1800);
}

function getKindMeta(kind: FirewallRuleKind) {
  switch (kind) {
    case 'port':
      return {
        labelKey: 'tools.firewallRuleGenerator.kindPort',
        icon: Network,
        badgeClass: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800/60',
      };
    case 'whitelist':
      return {
        labelKey: 'tools.firewallRuleGenerator.kindWhitelist',
        icon: GlobeLock,
        badgeClass: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800/60',
      };
    case 'ratelimit':
      return {
        labelKey: 'tools.firewallRuleGenerator.kindRateLimit',
        icon: Gauge,
        badgeClass: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800/60',
      };
    case 'forward':
      return {
        labelKey: 'tools.firewallRuleGenerator.kindForward',
        icon: ArrowRightLeft,
        badgeClass: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800/60',
      };
  }
}

function formatRuleSummary(rule: FirewallRule): string {
  const proto = rule.protocol === 'both' ? 'tcp+udp' : rule.protocol;
  if (rule.kind === 'forward') {
    const target = rule.toAddr.trim() ? `${rule.toAddr.trim()}:${rule.toPort || '?'}` : `:${rule.toPort || '?'}`;
    return `${rule.port || '?'}/${proto} → ${target}`;
  }
  if (rule.kind === 'ratelimit') {
    return `LIMIT ${rule.port || '?'}/${proto} (${rule.rateCount}/${rule.rateUnit})`;
  }
  const act = rule.action.toUpperCase();
  const src = rule.source.trim();
  if (rule.kind === 'whitelist') {
    return rule.port.trim() ? `${act} ${src || '?'} → ${rule.port.trim()}/${proto}` : `${act} ${src || '?'} (ALL)`;
  }
  return src ? `${act} ${rule.port || '?'}/${proto} ← ${src}` : `${act} ${rule.port || '?'}/${proto}`;
}

function isRulePortBad(rule: FirewallRule): boolean {
  if (rule.kind === 'whitelist' && !rule.port.trim()) return false;
  return !parsePortSpec(rule.port).valid;
}

function isRuleSourceBad(rule: FirewallRule): boolean {
  if (rule.kind === 'whitelist' && !rule.source.trim()) return true;
  return detectIpFamily(rule.source) === 'invalid';
}
</script>

<template>
  <ToolContainer
    toolId="firewall-rule-generator"
    nameKey="tools.firewallRuleGenerator.name"
    descKey="tools.firewallRuleGenerator.desc"
    :icon="Flame"
    :wide="true"
    :fullHeight="true"
  >
    <template #actions>
      <div class="flex flex-wrap items-center gap-2">
        <button
          type="button"
          @click="handleDownload"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-blue-600 hover:bg-blue-500 transition-colors cursor-pointer shadow-xs whitespace-nowrap"
        >
          <component :is="isDownloaded ? Check : FileDown" class="w-3.5 h-3.5 shrink-0" />
          <span>{{ t('tools.firewallRuleGenerator.downloadBtn') }}</span>
        </button>

        <button
          type="button"
          @click="handleReset"
          class="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer whitespace-nowrap"
          :title="t('common.reset')"
        >
          <RotateCcw class="w-3.5 h-3.5 shrink-0" />
          <span class="hidden sm:inline">{{ t('common.reset') }}</span>
        </button>
      </div>
    </template>

    <!-- Toast 提示 -->
    <div
      v-if="toastMessage"
      class="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 text-xs font-medium text-emerald-700 dark:text-emerald-300 flex items-center gap-2 shrink-0"
    >
      <CheckCircle2 class="w-4 h-4 shrink-0" />
      <span>{{ toastMessage }}</span>
    </div>

    <!-- 顶部栏：引擎切换 + 场景预设 -->
    <div class="flex flex-wrap items-center justify-between gap-2.5 shrink-0">
      <!-- 引擎切换分段器 -->
      <div class="inline-flex flex-wrap items-center gap-1 p-1 rounded-xl bg-zinc-200/70 dark:bg-zinc-800/80 border border-zinc-200/80 dark:border-zinc-700/70">
        <button
          v-for="eng in engineOptions"
          :key="eng.id"
          type="button"
          @click="setEngine(eng.id)"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
          :class="config.engine === eng.id
            ? 'bg-white dark:bg-zinc-900 text-blue-600 dark:text-blue-400 shadow-xs font-semibold'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
        >
          <span>{{ eng.label }}</span>
          <span class="hidden sm:inline text-[10px] opacity-70 font-normal">({{ eng.hint }})</span>
        </button>
      </div>

      <!-- 场景预设 Pills -->
      <div class="flex flex-wrap items-center gap-1.5">
        <span class="text-xs font-semibold text-zinc-500 dark:text-zinc-400 inline-flex items-center gap-1 mr-1 whitespace-nowrap">
          <Sparkles class="w-3.5 h-3.5 text-amber-500 shrink-0" />
          <span>{{ t('tools.firewallRuleGenerator.presetsLabel') }}:</span>
        </span>
        <button
          v-for="preset in FIREWALL_PRESETS"
          :key="preset.id"
          type="button"
          @click="applyPreset(preset.id)"
          class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer whitespace-nowrap"
          :class="activePresetId === preset.id
            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
            : 'bg-white dark:bg-zinc-900 border-zinc-200/80 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:border-blue-400'"
          :title="t(preset.descKey)"
        >
          {{ t(preset.nameKey) }}
        </button>
      </div>
    </div>

    <!-- SSH 防断连状态条（核心安全提醒） -->
    <div
      class="px-3.5 py-2.5 rounded-xl border flex flex-wrap items-center justify-between gap-2.5 text-xs shrink-0"
      :class="!sshStatus.protected
        ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60 text-rose-800 dark:text-rose-200'
        : sshStatus.restrictedSourceOnly
          ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 text-amber-800 dark:text-amber-200'
          : 'bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/80 dark:border-emerald-800/50 text-emerald-800 dark:text-emerald-200'"
    >
      <div class="flex items-center gap-2 min-w-0">
        <component
          :is="!sshStatus.protected ? ShieldAlert : ShieldCheck"
          class="w-4 h-4 shrink-0"
          :class="!sshStatus.protected ? 'text-rose-600 dark:text-rose-400' : sshStatus.restrictedSourceOnly ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'"
        />
        <span class="font-medium leading-relaxed">
          <template v-if="!sshStatus.protected">
            {{ t('tools.firewallRuleGenerator.sshDangerBanner', { port: config.sshPort }) }}
          </template>
          <template v-else-if="sshStatus.restrictedSourceOnly">
            {{ t('tools.firewallRuleGenerator.sshRestrictedBanner', { port: config.sshPort }) }}
          </template>
          <template v-else>
            {{ t('tools.firewallRuleGenerator.sshSafeBanner', { port: config.sshPort }) }}
          </template>
        </span>
      </div>

      <div class="flex flex-wrap items-center gap-2 shrink-0 ml-auto">
        <label class="inline-flex items-center gap-1.5 text-[11px] bg-white/80 dark:bg-zinc-900/80 px-2 py-1 rounded-lg border border-current/15 whitespace-nowrap">
          <span>{{ t('tools.firewallRuleGenerator.sshPortLabel') }}:</span>
          <input
            v-model.number="config.sshPort"
            type="number"
            min="1"
            max="65535"
            class="w-14 font-mono font-bold bg-transparent text-center focus:outline-none"
          />
        </label>

        <button
          v-if="!sshStatus.protected"
          type="button"
          @click="fixSshLockout"
          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors cursor-pointer whitespace-nowrap"
        >
          <Wrench class="w-3.5 h-3.5 shrink-0" />
          <span>{{ t('tools.firewallRuleGenerator.fixSshBtn', { port: config.sshPort }) }}</span>
        </button>
      </div>
    </div>

    <!-- 主工作区：左侧规则编排 + 右侧脚本输出与审计 -->
    <div class="grid grid-cols-1 xl:grid-cols-12 gap-3.5 xl:flex-1 xl:min-h-0">
      <!-- 左侧：可视化规则编辑器 -->
      <div class="xl:col-span-7 flex flex-col xl:min-h-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden">
        <!-- Tabs 与添加规则按钮 -->
        <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/70 flex flex-wrap items-center justify-between gap-2 shrink-0 select-none">
          <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
            <button
              type="button"
              @click="leftTab = 'rules'"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
              :class="leftTab === 'rules' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            >
              <Network class="w-3.5 h-3.5 shrink-0" />
              <span>{{ t('tools.firewallRuleGenerator.tabRules') }}</span>
              <span class="px-1.5 py-0.2 rounded bg-zinc-200/70 dark:bg-zinc-600/60 text-[10px] font-mono">
                {{ config.rules.length }}
              </span>
            </button>

            <button
              type="button"
              @click="leftTab = 'policy'"
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
              :class="leftTab === 'policy' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
            >
              <SlidersHorizontal class="w-3.5 h-3.5 shrink-0" />
              <span>{{ t('tools.firewallRuleGenerator.tabPolicy') }}</span>
            </button>
          </div>

          <!-- 4 类规则快速添加 -->
          <div class="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              @click="addRule('port')"
              class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/60 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus class="w-3 h-3 shrink-0" />
              <span>{{ t('tools.firewallRuleGenerator.addPortRule') }}</span>
            </button>
            <button
              type="button"
              @click="addRule('whitelist')"
              class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/60 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus class="w-3 h-3 shrink-0" />
              <span>{{ t('tools.firewallRuleGenerator.addWhitelistRule') }}</span>
            </button>
            <button
              type="button"
              @click="addRule('ratelimit')"
              class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/80 dark:border-amber-800/60 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus class="w-3 h-3 shrink-0" />
              <span>{{ t('tools.firewallRuleGenerator.addRateLimitRule') }}</span>
            </button>
            <button
              type="button"
              @click="addRule('forward')"
              class="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800/60 hover:bg-purple-100 dark:hover:bg-purple-900/40 transition-colors cursor-pointer whitespace-nowrap"
            >
              <Plus class="w-3 h-3 shrink-0" />
              <span>{{ t('tools.firewallRuleGenerator.addForwardRule') }}</span>
            </button>
          </div>
        </div>

        <!-- 快捷端口添加栏（仅规则 Tab） -->
        <div
          v-if="leftTab === 'rules'"
          class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/70 bg-zinc-50/40 dark:bg-zinc-950/20 flex flex-wrap items-center gap-1.5 shrink-0"
        >
          <span class="text-[11px] font-medium text-zinc-400 mr-1 whitespace-nowrap">
            {{ t('tools.firewallRuleGenerator.quickPorts') }}:
          </span>
          <button
            v-for="svc in QUICK_SERVICE_PORTS"
            :key="svc.label"
            type="button"
            @click="addQuickPort(svc)"
            class="px-2 py-0.5 rounded-md text-[11px] font-mono bg-zinc-100 hover:bg-blue-50 dark:bg-zinc-800 dark:hover:bg-blue-950/40 text-zinc-600 hover:text-blue-600 dark:text-zinc-300 dark:hover:text-blue-400 border border-zinc-200/70 dark:border-zinc-700/70 transition-colors cursor-pointer whitespace-nowrap"
          >
            + {{ svc.label }}
          </button>
        </div>

        <!-- Tab 1: 规则列表 -->
        <div
          v-if="leftTab === 'rules'"
          class="xl:flex-1 overflow-y-auto p-3.5 space-y-3"
        >
          <div
            v-if="config.rules.length === 0"
            class="py-12 text-center text-xs text-zinc-400 dark:text-zinc-500 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl"
          >
            {{ t('tools.firewallRuleGenerator.emptyRules') }}
          </div>

          <div
            v-for="(rule, idx) in config.rules"
            :key="rule.id"
            class="rounded-xl border transition-all p-3 space-y-2.5"
            :class="[
              !rule.enabled ? 'opacity-60 bg-zinc-50/60 dark:bg-zinc-950/30 border-zinc-200/70 dark:border-zinc-800/70' : 'bg-white dark:bg-zinc-900',
              ruleInvalidIds.has(rule.id) && rule.enabled
                ? 'border-rose-300 dark:border-rose-800/80 ring-1 ring-rose-500/15'
                : 'border-zinc-200 dark:border-zinc-800'
            ]"
          >
            <!-- 规则卡片头部 -->
            <div class="flex flex-wrap items-center justify-between gap-2">
              <div class="flex flex-wrap items-center gap-2 min-w-0">
                <input
                  v-model="rule.enabled"
                  type="checkbox"
                  class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  :title="t('tools.firewallRuleGenerator.toggleEnable')"
                />

                <span
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border shrink-0 whitespace-nowrap"
                  :class="getKindMeta(rule.kind).badgeClass"
                >
                  <component :is="getKindMeta(rule.kind).icon" class="w-3 h-3 shrink-0" />
                  <span>{{ t(getKindMeta(rule.kind).labelKey) }}</span>
                </span>

                <span class="text-xs font-mono font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                  {{ formatRuleSummary(rule) }}
                </span>
              </div>

              <!-- 排序/复制/删除 -->
              <div class="flex items-center gap-1 shrink-0 ml-auto">
                <button
                  type="button"
                  :disabled="idx === 0"
                  @click="moveRule(idx, -1)"
                  class="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  :title="t('tools.firewallRuleGenerator.moveUp')"
                >
                  <ArrowUp class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  :disabled="idx === config.rules.length - 1"
                  @click="moveRule(idx, 1)"
                  class="p-1 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-30 cursor-pointer disabled:cursor-not-allowed"
                  :title="t('tools.firewallRuleGenerator.moveDown')"
                >
                  <ArrowDown class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="duplicateRule(idx)"
                  class="p-1 rounded text-zinc-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 cursor-pointer"
                  :title="t('tools.firewallRuleGenerator.duplicateRule')"
                >
                  <CopyPlus class="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  @click="removeRule(idx)"
                  class="p-1 rounded text-zinc-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                  :title="t('tools.firewallRuleGenerator.deleteRule')"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <!-- 规则字段编辑网格 -->
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs">
              <!-- 动作（port / whitelist） -->
              <div v-if="rule.kind === 'port' || rule.kind === 'whitelist'" class="flex flex-col gap-1 min-w-0">
                <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {{ t('tools.firewallRuleGenerator.fieldAction') }}
                </label>
                <CustomSelect v-model="rule.action" :options="actionOptions" size="sm" fullWidth />
              </div>

              <!-- 协议 -->
              <div class="flex flex-col gap-1 min-w-0">
                <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400">
                  {{ t('tools.firewallRuleGenerator.fieldProtocol') }}
                </label>
                <CustomSelect v-model="rule.protocol" :options="protocolOptions" size="sm" fullWidth />
              </div>

              <!-- 端口 / 外部端口 -->
              <div class="flex flex-col gap-1 min-w-0">
                <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                  {{ rule.kind === 'forward' ? t('tools.firewallRuleGenerator.fieldFromPort') : rule.kind === 'whitelist' ? t('tools.firewallRuleGenerator.fieldOptionalPort') : t('tools.firewallRuleGenerator.fieldPort') }}
                </label>
                <input
                  v-model="rule.port"
                  type="text"
                  :placeholder="rule.kind === 'whitelist' ? (isZh ? '留空=全部端口' : 'Blank = All') : '80 / 8000:8100'"
                  class="w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1"
                  :class="isRulePortBad(rule) && rule.enabled ? 'border-rose-400 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'"
                />
              </div>

              <!-- 转发目标端口 / 来源 CIDR -->
              <div v-if="rule.kind === 'forward'" class="flex flex-col gap-1 min-w-0">
                <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                  {{ t('tools.firewallRuleGenerator.fieldToPort') }}
                </label>
                <input
                  v-model="rule.toPort"
                  type="text"
                  placeholder="8080"
                  class="w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1"
                  :class="(!parsePortSpec(rule.toPort).valid || parsePortSpec(rule.toPort).isRange) && rule.enabled ? 'border-rose-400 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'"
                />
              </div>

              <div v-else class="flex flex-col gap-1 min-w-0">
                <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                  {{ t('tools.firewallRuleGenerator.fieldSource') }}
                </label>
                <input
                  v-model="rule.source"
                  type="text"
                  :placeholder="rule.kind === 'whitelist' ? '10.0.0.0/8' : (isZh ? '留空=所有来源' : 'Blank = Any')"
                  class="w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1"
                  :class="isRuleSourceBad(rule) && rule.enabled ? 'border-rose-400 focus:ring-rose-500' : 'border-zinc-200 dark:border-zinc-700 focus:ring-blue-500'"
                />
              </div>

              <!-- 转发目标 IP -->
              <div v-if="rule.kind === 'forward'" class="flex flex-col gap-1 min-w-0">
                <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                  {{ t('tools.firewallRuleGenerator.fieldToAddr') }}
                </label>
                <input
                  v-model="rule.toAddr"
                  type="text"
                  :placeholder="isZh ? '留空=本机端口重定向' : 'Blank = Local redirect'"
                  class="w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <!-- 限速字段 -->
              <template v-if="rule.kind === 'ratelimit'">
                <div class="flex flex-col gap-1 min-w-0">
                  <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                    {{ t('tools.firewallRuleGenerator.fieldRateCount') }}
                  </label>
                  <div class="flex items-center gap-1.5">
                    <input
                      v-model.number="rule.rateCount"
                      type="number"
                      min="1"
                      class="w-20 px-2 py-1.5 rounded-lg border font-mono text-xs border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    <div class="flex-1 min-w-0">
                      <CustomSelect v-model="rule.rateUnit" :options="rateUnitOptions" size="sm" fullWidth />
                    </div>
                  </div>
                </div>

                <div v-if="config.engine === 'iptables'" class="flex flex-col gap-1 min-w-0">
                  <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                    {{ t('tools.firewallRuleGenerator.fieldRateBurst') }}
                  </label>
                  <input
                    v-model.number="rule.rateBurst"
                    type="number"
                    min="1"
                    class="w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </template>

              <!-- 网卡过滤 & 备注 -->
              <div v-if="config.engine !== 'firewalld'" class="flex flex-col gap-1 min-w-0">
                <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                  {{ t('tools.firewallRuleGenerator.fieldIface') }}
                </label>
                <input
                  v-model="rule.iface"
                  type="text"
                  placeholder="eth0"
                  class="w-full px-2.5 py-1.5 rounded-lg border font-mono text-xs border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div class="flex flex-col gap-1 min-w-0 sm:col-span-2">
                <label class="text-[11px] font-medium text-zinc-500 dark:text-zinc-400 truncate">
                  {{ t('tools.firewallRuleGenerator.fieldComment') }}
                </label>
                <input
                  v-model="rule.comment"
                  type="text"
                  :placeholder="t('tools.firewallRuleGenerator.commentPlaceholder')"
                  class="w-full px-2.5 py-1.5 rounded-lg border text-xs border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Tab 2: 全局基线与策略设置 -->
        <div
          v-else
          class="xl:flex-1 overflow-y-auto p-4 space-y-4 text-xs"
        >
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div class="flex flex-col gap-1.5">
              <label class="font-semibold text-zinc-700 dark:text-zinc-300">
                {{ t('tools.firewallRuleGenerator.defaultIncoming') }}
              </label>
              <CustomSelect v-model="config.defaultIncoming" :options="incomingPolicyOptions" size="sm" fullWidth />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-semibold text-zinc-700 dark:text-zinc-300">
                {{ t('tools.firewallRuleGenerator.defaultOutgoing') }}
              </label>
              <CustomSelect v-model="config.defaultOutgoing" :options="outgoingPolicyOptions" size="sm" fullWidth />
            </div>

            <div v-if="config.engine === 'firewalld'" class="flex flex-col gap-1.5">
              <label class="font-semibold text-zinc-700 dark:text-zinc-300">
                {{ t('tools.firewallRuleGenerator.firewalldZone') }}
              </label>
              <CustomSelect v-model="config.zone" :options="zoneOptions" size="sm" fullWidth />
            </div>

            <div class="flex flex-col gap-1.5">
              <label class="font-semibold text-zinc-700 dark:text-zinc-300">
                {{ t('tools.firewallRuleGenerator.defaultIface') }}
              </label>
              <input
                v-model="config.defaultIface"
                type="text"
                placeholder="eth0 / ens3 (optional)"
                class="w-full px-3 py-1.5 rounded-lg border font-mono text-xs border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <!-- SSH 与基线选项 -->
          <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/60 dark:bg-zinc-950/30 space-y-2.5">
            <div class="font-semibold text-zinc-800 dark:text-zinc-200">
              {{ t('tools.firewallRuleGenerator.baselineOptionsTitle') }}
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <label class="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
                <input v-model="config.includeComments" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
                <span>{{ t('tools.firewallRuleGenerator.includeComments') }}</span>
              </label>

              <label class="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
                <input v-model="config.includeRollbackHint" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
                <span>{{ t('tools.firewallRuleGenerator.includeRollbackHint') }}</span>
              </label>

              <template v-if="config.engine === 'iptables'">
                <label class="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
                  <input v-model="config.allowLoopback" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
                  <span>{{ t('tools.firewallRuleGenerator.allowLoopback') }}</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
                  <input v-model="config.allowEstablished" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
                  <span>{{ t('tools.firewallRuleGenerator.allowEstablished') }}</span>
                </label>

                <label class="flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
                  <input v-model="config.allowPing" type="checkbox" class="rounded text-blue-600 cursor-pointer" />
                  <span>{{ t('tools.firewallRuleGenerator.allowPing') }}</span>
                </label>
              </template>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：实时生成的规则脚本、伴随命令与安全审计 -->
      <div class="xl:col-span-5 flex flex-col gap-3 xl:min-h-0">
        <div class="flex-1 flex flex-col min-h-[260px]">
          <TextEditorBox
            :modelValue="generatedScript"
            :label="`firewall-${config.engine}.sh`"
            :readonly="true"
            :showPaste="false"
            :showClear="false"
            :showLineNumbers="true"
            :showWrapToggle="true"
            :defaultWrap="false"
          >
            <template #actions>
              <button
                type="button"
                @click="showCompanionCmds = !showCompanionCmds"
                class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
                :class="showCompanionCmds
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400'
                  : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-200/60 dark:hover:bg-zinc-800'"
              >
                <Terminal class="w-3.5 h-3.5 shrink-0" />
                <span class="hidden sm:inline">{{ t('tools.firewallRuleGenerator.companionCmdsBtn') }}</span>
              </button>
            </template>
          </TextEditorBox>
        </div>

        <!-- 常用运维查询与急救回滚命令 -->
        <div
          v-if="showCompanionCmds"
          class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs shrink-0 overflow-hidden"
        >
          <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 text-xs font-semibold text-zinc-700 dark:text-zinc-200 flex items-center gap-1.5">
            <Terminal class="w-3.5 h-3.5 text-blue-500 shrink-0" />
            <span>{{ t('tools.firewallRuleGenerator.companionCmdsTitle') }}</span>
          </div>
          <div class="p-3 space-y-2">
            <div
              v-for="item in companionCommands"
              :key="item.id"
              class="p-2 rounded-lg bg-zinc-50 dark:bg-zinc-950/60 border border-zinc-200/80 dark:border-zinc-800 space-y-1"
            >
              <div class="flex items-center justify-between gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                <span>{{ isZh ? item.labelZh : item.labelEn }}</span>
                <CopyButton :text="item.command" variant="ghost" />
              </div>
              <pre class="font-mono text-[11px] text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-all">{{ item.command }}</pre>
            </div>
          </div>
        </div>

        <!-- 安全审计与配置诊断面板 -->
        <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs shrink-0 overflow-hidden">
          <button
            type="button"
            @click="showAuditDetails = !showAuditDetails"
            class="w-full px-3.5 py-2 flex items-center justify-between text-xs font-medium bg-zinc-50/80 dark:bg-zinc-900/70 cursor-pointer"
          >
            <div class="flex items-center gap-2 min-w-0">
              <CheckCircle2 v-if="errorCount === 0 && warningCount === 0" class="w-4 h-4 text-emerald-500 shrink-0" />
              <AlertCircle v-else-if="errorCount > 0" class="w-4 h-4 text-rose-500 shrink-0" />
              <AlertTriangle v-else class="w-4 h-4 text-amber-500 shrink-0" />
              <span class="truncate">
                {{ auditIssues.length === 0 ? t('tools.firewallRuleGenerator.auditPassed') : t('tools.firewallRuleGenerator.auditCount', { count: auditIssues.length }) }}
              </span>
            </div>
            <span class="text-[11px] text-zinc-400 shrink-0">
              {{ showAuditDetails ? (isZh ? '收起' : 'Hide') : (isZh ? '展开' : 'Show') }}
            </span>
          </button>

          <div
            v-if="showAuditDetails && auditIssues.length > 0"
            class="max-h-40 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 border-t border-zinc-100 dark:border-zinc-800"
          >
            <div
              v-for="(issue, i) in auditIssues"
              :key="i"
              class="px-3.5 py-2 text-xs flex items-start justify-between gap-2"
            >
              <div class="flex items-start gap-2 min-w-0">
                <AlertCircle v-if="issue.level === 'error'" class="w-3.5 h-3.5 text-rose-500 shrink-0 mt-0.5" />
                <AlertTriangle v-else-if="issue.level === 'warning'" class="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                <Info v-else class="w-3.5 h-3.5 text-blue-500 shrink-0 mt-0.5" />
                <span class="text-zinc-700 dark:text-zinc-300 leading-relaxed">
                  {{ isZh ? issue.messageZh : issue.messageEn }}
                </span>
              </div>
              <button
                v-if="issue.fixable === 'allow-ssh'"
                type="button"
                @click="fixSshLockout"
                class="px-2 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-white text-[11px] font-medium shrink-0 cursor-pointer whitespace-nowrap"
              >
                {{ isZh ? '一键放行 SSH' : 'Allow SSH' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
