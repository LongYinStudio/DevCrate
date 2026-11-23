<script setup lang="ts">
import { ref, computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Gauge,
  HardDrive,
  Wifi,
  LayoutGrid,
  Timer,
  Sparkles,
  RotateCcw,
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CustomSelect, { type SelectOption } from '../../components/common/CustomSelect.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import {
  BANDWIDTH_UNITS,
  COMMON_LINK_SPEEDS,
  STORAGE_UNITS,
  TIME_UNITS,
  VIEWPORT_PRESETS,
  batchConvertCssPxToRem,
  calculateTransferEta,
  convertBandwidthToBps,
  convertBpsToAllBandwidth,
  convertBytesToAllStorage,
  convertCssUnitToPx,
  convertNsToAllTime,
  convertPxToAllCssUnits,
  convertStorageToBytes,
  convertTimeToNs,
  formatDurationCompact,
  formatRawInputNumber,
  formatUnitNumber,
  frequencyHzToNs,
  getTailwindSpacingHint,
  nsToFrequencyHz,
  type BandwidthUnitId,
  type CssContext,
  type CssUnitId,
  type StorageUnitId,
  type TimeUnitId,
} from './devUnitUtils';

const { t, locale } = useI18n();
const isZh = computed(() => locale.value.startsWith('zh'));

const activeTab = ref<'storage' | 'bandwidth' | 'css' | 'time'>('bandwidth');

// ==================== 1. 存储大小状态 ====================
const storageBytes = ref(1000 * 1000 * 1000 * 1000); // 默认 1 TB

const storageValues = computed(() => convertBytesToAllStorage(storageBytes.value));

const siVsIecGap = computed(() => {
  if (storageBytes.value < 1024) return null;
  const gb = storageValues.value.GB;
  const gib = storageValues.value.GiB;
  const diffPct = ((gib - gb) / gb) * 100;
  return {
    gb: formatUnitNumber(gb, 2),
    gib: formatUnitNumber(gib, 2),
    tb: formatUnitNumber(storageValues.value.TB, 4),
    tib: formatUnitNumber(storageValues.value.TiB, 4),
    diffPct: diffPct.toFixed(2),
  };
});

function updateStorage(unit: StorageUnitId, raw: string) {
  const num = Number(raw);
  if (raw.trim() === '' || Number.isNaN(num)) return;
  storageBytes.value = convertStorageToBytes(Math.max(0, num), unit);
}

function setStoragePreset(value: number, unit: StorageUnitId) {
  storageBytes.value = convertStorageToBytes(value, unit);
}

// ==================== 2. 带宽与传输耗时状态 ====================
const etaSizeValue = ref(4.7);
const etaSizeUnit = ref<StorageUnitId>('GiB');
const etaSpeedValue = ref(100);
const etaSpeedUnit = ref<BandwidthUnitId>('Mbps');
const etaEfficiency = ref(92);

const bandwidthBps = ref(100 * 1e6); // 100 Mbps
const bandwidthValues = computed(() => convertBpsToAllBandwidth(bandwidthBps.value));

const etaResult = computed(() => {
  const sizeBytes = convertStorageToBytes(etaSizeValue.value, etaSizeUnit.value);
  const speedBps = convertBandwidthToBps(etaSpeedValue.value, etaSpeedUnit.value);
  return calculateTransferEta({
    sizeBytes,
    bandwidthBps: speedBps,
    efficiencyPercent: etaEfficiency.value,
    isZh: isZh.value,
  });
});

const etaLinkComparison = computed(() => {
  const sizeBytes = convertStorageToBytes(etaSizeValue.value, etaSizeUnit.value);
  return COMMON_LINK_SPEEDS.map(link => {
    const res = calculateTransferEta({
      sizeBytes,
      bandwidthBps: link.mbps * 1e6,
      efficiencyPercent: etaEfficiency.value,
      isZh: isZh.value,
    });
    return {
      label: link.label,
      mbps: link.mbps,
      eta: res.formattedHms,
      speedMBs: formatUnitNumber(res.effectiveMBs, 2),
    };
  });
});

const etaSizeUnitOptions: SelectOption[] = ['MB', 'MiB', 'GB', 'GiB', 'TB', 'TiB'].map(u => ({
  label: u,
  value: u,
}));

const etaSpeedUnitOptions: SelectOption[] = ['Kbps', 'Mbps', 'Gbps', 'KB/s', 'MB/s', 'MiB/s', 'GB/s'].map(
  u => ({ label: u, value: u })
);

function updateBandwidth(unit: BandwidthUnitId, raw: string) {
  const num = Number(raw);
  if (raw.trim() === '' || Number.isNaN(num)) return;
  bandwidthBps.value = convertBandwidthToBps(Math.max(0, num), unit);
}

// ==================== 3. CSS 单位状态 ====================
const cssPx = ref(16);
const cssContext = ref<CssContext>({
  rootFontSize: 16,
  parentFontSize: 16,
  viewportWidth: 1440,
  viewportHeight: 900,
});
const cssSnippetInput = ref(`.card {
  padding: 24px 16px;
  font-size: 14px;
  border-radius: 12px;
  border: 1px solid #e4e4e7;
  gap: 8px;
}`);

const cssValues = computed(() => convertPxToAllCssUnits(cssPx.value, cssContext.value));
const tailwindHint = computed(() => getTailwindSpacingHint(cssPx.value));
const convertedCssSnippet = computed(() =>
  batchConvertCssPxToRem(cssSnippetInput.value, cssContext.value.rootFontSize)
);

function updateCssUnit(unit: CssUnitId, raw: string) {
  const num = Number(raw);
  if (raw.trim() === '' || Number.isNaN(num)) return;
  cssPx.value = convertCssUnitToPx(num, unit, cssContext.value);
}

function applyViewportPreset(w: number, h: number) {
  cssContext.value.viewportWidth = w;
  cssContext.value.viewportHeight = h;
}

// ==================== 4. 时间精度与频率状态 ====================
const timeNs = ref(16_666_666.6667); // 60 FPS frame budget
const timeValues = computed(() => convertNsToAllTime(timeNs.value));
const freqHz = computed(() => nsToFrequencyHz(timeNs.value));

function updateTime(unit: TimeUnitId, raw: string) {
  const num = Number(raw);
  if (raw.trim() === '' || Number.isNaN(num)) return;
  timeNs.value = convertTimeToNs(Math.max(0, num), unit);
}

function updateFrequencyHz(raw: string) {
  const num = Number(raw);
  if (raw.trim() === '' || Number.isNaN(num) || num <= 0) return;
  timeNs.value = frequencyHzToNs(num);
}

function resetCurrentTab() {
  if (activeTab.value === 'storage') {
    storageBytes.value = 1e12;
  } else if (activeTab.value === 'bandwidth') {
    etaSizeValue.value = 4.7;
    etaSizeUnit.value = 'GiB';
    etaSpeedValue.value = 100;
    etaSpeedUnit.value = 'Mbps';
    etaEfficiency.value = 92;
    bandwidthBps.value = 100 * 1e6;
  } else if (activeTab.value === 'css') {
    cssPx.value = 16;
    cssContext.value = {
      rootFontSize: 16,
      parentFontSize: 16,
      viewportWidth: 1440,
      viewportHeight: 900,
    };
  } else {
    timeNs.value = 16_666_666.6667;
  }
}
</script>

<template>
  <ToolContainer
    tool-id="dev-unit-converter"
    name-key="tools.devUnitConverter.name"
    desc-key="tools.devUnitConverter.desc"
    :icon="Gauge"
    :full-height="false"
    wide
  >
    <template #header-actions>
      <button
        type="button"
        @click="resetCurrentTab"
        class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-750 transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        <RotateCcw class="w-3.5 h-3.5" />
        <span>{{ t('common.reset') }}</span>
      </button>
    </template>

    <!-- 顶部功能分类 Tabs -->
    <div class="flex flex-wrap gap-1.5 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/70 p-2">
      <button
        v-for="tab in [
          { id: 'bandwidth', label: t('tools.devUnitConverter.tabBandwidth'), icon: Wifi },
          { id: 'storage', label: t('tools.devUnitConverter.tabStorage'), icon: HardDrive },
          { id: 'css', label: t('tools.devUnitConverter.tabCss'), icon: LayoutGrid },
          { id: 'time', label: t('tools.devUnitConverter.tabTime'), icon: Timer },
        ]"
        :key="tab.id"
        type="button"
        @click="activeTab = tab.id as any"
        class="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition-all cursor-pointer whitespace-nowrap"
        :class="
          activeTab === tab.id
            ? 'bg-blue-600 text-white shadow-sm'
            : 'text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800'
        "
      >
        <component :is="tab.icon" class="w-3.5 h-3.5" />
        <span>{{ tab.label }}</span>
      </button>
    </div>

    <!-- ==================== TAB 1: 带宽与传输耗时预估 ==================== -->
    <div v-if="activeTab === 'bandwidth'" class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
      <!-- 左侧：文件传输耗时计算器 -->
      <div class="xl:col-span-7 flex flex-col gap-3.5 min-w-0">
        <section class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-4 text-xs">
          <div class="flex items-center justify-between gap-2">
            <h2 class="text-xs font-bold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
              {{ t('tools.devUnitConverter.etaTitle') }}
            </h2>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="p in [
                  { label: '100 MB', v: 100, u: 'MB' },
                  { label: '1 GiB', v: 1, u: 'GiB' },
                  { label: '4.7 GiB ISO', v: 4.7, u: 'GiB' },
                  { label: '50 GB', v: 50, u: 'GB' },
                ]"
                :key="p.label"
                type="button"
                @click="
                  etaSizeValue = p.v;
                  etaSizeUnit = p.u as StorageUnitId;
                "
                class="px-2 py-0.5 rounded-md text-[11px] bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 hover:text-blue-600 cursor-pointer"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                {{ t('tools.devUnitConverter.fileSizeLabel') }}
              </label>
              <div class="flex gap-1.5">
                <input
                  v-model.number="etaSizeValue"
                  type="number"
                  min="0"
                  step="any"
                  class="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
                <CustomSelect v-model="etaSizeUnit" :options="etaSizeUnitOptions" />
              </div>
            </div>

            <div>
              <label class="block text-[11px] font-medium text-zinc-500 mb-1">
                {{ t('tools.devUnitConverter.linkSpeedLabel') }}
              </label>
              <div class="flex gap-1.5">
                <input
                  v-model.number="etaSpeedValue"
                  type="number"
                  min="0"
                  step="any"
                  class="flex-1 min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
                />
                <CustomSelect v-model="etaSpeedUnit" :options="etaSpeedUnitOptions" />
              </div>
            </div>
          </div>

          <!-- 协议损耗与有效传输率 -->
          <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 p-3 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                {{ t('tools.devUnitConverter.efficiencyLabel') }}:
                <strong class="font-mono text-blue-600 dark:text-blue-400">{{ etaEfficiency }}%</strong>
              </span>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="eff in [
                    { label: '100% Raw', val: 100 },
                    { label: '94% TCP/HTTP', val: 94 },
                    { label: '85% WAN', val: 85 },
                  ]"
                  :key="eff.val"
                  type="button"
                  @click="etaEfficiency = eff.val"
                  class="px-2 py-0.5 rounded text-[10px] font-medium cursor-pointer border"
                  :class="
                    etaEfficiency === eff.val
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300'
                      : 'border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-500'
                  "
                >
                  {{ eff.label }}
                </button>
              </div>
            </div>
            <input
              v-model.number="etaEfficiency"
              type="range"
              min="50"
              max="100"
              class="w-full accent-blue-600"
            />
          </div>

          <!-- 计算结果大卡片 -->
          <div class="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 p-4">
            <div class="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
              {{ t('tools.devUnitConverter.estimatedDuration') }}
            </div>
            <div class="text-2xl font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {{ etaResult.formattedHms }}
            </div>
            <div class="flex flex-wrap gap-4 mt-2.5 text-[11px] font-mono text-zinc-600 dark:text-zinc-300">
              <span>{{ formatUnitNumber(etaResult.effectiveMBs, 2) }} MB/s</span>
              <span>{{ formatUnitNumber(etaResult.effectiveMiBs, 2) }} MiB/s</span>
              <span>{{ formatUnitNumber(etaResult.effectiveMbps, 2) }} Mbps</span>
            </div>
          </div>

          <!-- 常见带宽横向对比表 -->
          <div class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 overflow-hidden">
            <table class="w-full text-xs">
              <thead class="bg-zinc-50 dark:bg-zinc-800/70 text-[11px] text-zinc-500">
                <tr>
                  <th class="text-left px-3 py-2 font-medium">{{ t('tools.devUnitConverter.linkCol') }}</th>
                  <th class="text-right px-3 py-2 font-medium">{{ t('tools.devUnitConverter.effectiveRateCol') }}</th>
                  <th class="text-right px-3 py-2 font-medium">{{ t('tools.devUnitConverter.etaCol') }}</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-zinc-100 dark:divide-zinc-800/60 font-mono">
                <tr v-for="row in etaLinkComparison" :key="row.label">
                  <td class="px-3 py-1.5 text-zinc-700 dark:text-zinc-200 font-sans">{{ row.label }}</td>
                  <td class="px-3 py-1.5 text-right text-zinc-500">{{ row.speedMBs }} MB/s</td>
                  <td class="px-3 py-1.5 text-right font-semibold text-blue-600 dark:text-blue-400">
                    {{ row.eta }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <!-- 右侧：实时带宽双向矩阵 -->
      <div class="xl:col-span-5 flex flex-col gap-3 min-w-0">
        <section class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-3 text-xs">
          <div class="flex items-center justify-between">
            <h2 class="text-xs font-bold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
              {{ t('tools.devUnitConverter.bandwidthMatrixTitle') }}
            </h2>
            <span class="text-[11px] text-zinc-400">{{ t('tools.devUnitConverter.editAnyField') }}</span>
          </div>

          <div class="space-y-2">
            <div
              v-for="u in BANDWIDTH_UNITS"
              :key="u.id"
              class="flex items-center gap-2 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 px-3 py-1.5"
            >
              <span class="w-16 font-mono font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
                {{ u.label }}
              </span>
              <input
                :value="formatRawInputNumber(bandwidthValues[u.id], 6)"
                @input="updateBandwidth(u.id, ($event.target as HTMLInputElement).value)"
                type="number"
                step="any"
                class="flex-1 min-w-0 bg-transparent font-mono text-right text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
              <CopyButton :text="formatRawInputNumber(bandwidthValues[u.id], 6)" variant="icon" />
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- ==================== TAB 2: 存储大小换算 (IEC vs SI) ==================== -->
    <div v-if="activeTab === 'storage'" class="space-y-4">
      <div class="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 px-4 py-3 text-xs">
        <div class="flex flex-wrap items-center gap-1.5">
          <span class="text-zinc-500 flex items-center gap-1 mr-1">
            <Sparkles class="w-3.5 h-3.5 text-blue-500" />
            {{ t('tools.devUnitConverter.quickPresets') }}:
          </span>
          <button
            v-for="p in [
              { label: '64 MiB', v: 64, u: 'MiB' },
              { label: '512 MiB', v: 512, u: 'MiB' },
              { label: '4.7 GB (DVD)', v: 4.7, u: 'GB' },
              { label: '1 TB (SI)', v: 1, u: 'TB' },
              { label: '1 TiB (IEC)', v: 1, u: 'TiB' },
            ]"
            :key="p.label"
            type="button"
            @click="setStoragePreset(p.v, p.u as StorageUnitId)"
            class="px-2.5 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-200 hover:text-blue-600 cursor-pointer font-mono text-[11px]"
          >
            {{ p.label }}
          </button>
        </div>

        <div v-if="siVsIecGap" class="text-[11px] font-mono text-amber-600 dark:text-amber-400">
          {{ siVsIecGap.gb }} GB (SI) = {{ siVsIecGap.gib }} GiB (OS / IEC, {{ siVsIecGap.diffPct }}%)
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section
          v-for="grp in [
            { id: 'iec', title: t('tools.devUnitConverter.groupIec'), badge: '1024ⁿ' },
            { id: 'si', title: t('tools.devUnitConverter.groupSi'), badge: '1000ⁿ' },
            { id: 'bits', title: t('tools.devUnitConverter.groupBits'), badge: 'Bits' },
          ]"
          :key="grp.id"
          class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-2.5 text-xs"
        >
          <div class="flex items-center justify-between">
            <h3 class="font-bold text-zinc-800 dark:text-zinc-100">{{ grp.title }}</h3>
            <span class="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 font-mono text-[10px] text-zinc-500">
              {{ grp.badge }}
            </span>
          </div>

          <div
            v-for="u in STORAGE_UNITS.filter(item => item.group === grp.id)"
            :key="u.id"
            class="flex items-center gap-2 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 px-3 py-1.5"
          >
            <span class="w-20 font-mono font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
              {{ u.label }}
            </span>
            <input
              :value="formatRawInputNumber(storageValues[u.id], 6)"
              @input="updateStorage(u.id, ($event.target as HTMLInputElement).value)"
              type="number"
              step="any"
              class="flex-1 min-w-0 bg-transparent font-mono text-right text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
            <CopyButton :text="formatRawInputNumber(storageValues[u.id], 6)" variant="icon" />
          </div>
        </section>
      </div>
    </div>

    <!-- ==================== TAB 3: CSS 视口与排版单位 ==================== -->
    <div v-if="activeTab === 'css'" class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
      <div class="xl:col-span-7 flex flex-col gap-3.5 min-w-0">
        <section class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-4 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="font-bold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
              {{ t('tools.devUnitConverter.cssContextTitle') }}
            </h2>
            <div class="flex flex-wrap gap-1">
              <button
                v-for="vp in VIEWPORT_PRESETS"
                :key="vp.label"
                type="button"
                @click="applyViewportPreset(vp.w, vp.h)"
                class="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[10px] font-mono text-zinc-600 dark:text-zinc-300 hover:text-blue-600 cursor-pointer"
              >
                {{ vp.label }}
              </button>
            </div>
          </div>

          <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div>
              <label class="block text-[10px] text-zinc-400 mb-1">Root html (px)</label>
              <input
                v-model.number="cssContext.rootFontSize"
                type="number"
                min="1"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label class="block text-[10px] text-zinc-400 mb-1">Parent (px)</label>
              <input
                v-model.number="cssContext.parentFontSize"
                type="number"
                min="1"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label class="block text-[10px] text-zinc-400 mb-1">Viewport W (px)</label>
              <input
                v-model.number="cssContext.viewportWidth"
                type="number"
                min="1"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
              />
            </div>
            <div>
              <label class="block text-[10px] text-zinc-400 mb-1">Viewport H (px)</label>
              <input
                v-model.number="cssContext.viewportHeight"
                type="number"
                min="1"
                class="w-full min-w-0 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-2.5 py-1.5 font-mono"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="u in [
                { id: 'px', label: 'px' },
                { id: 'rem', label: 'rem' },
                { id: 'em', label: 'em' },
                { id: 'vw', label: 'vw' },
                { id: 'vh', label: 'vh' },
                { id: 'pt', label: 'pt' },
                { id: 'percent', label: '%' },
              ]"
              :key="u.id"
              class="flex items-center gap-2 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 px-3 py-1.5"
            >
              <span class="w-14 font-mono font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
                {{ u.label }}
              </span>
              <input
                :value="formatRawInputNumber(cssValues[u.id as CssUnitId], 4)"
                @input="updateCssUnit(u.id as CssUnitId, ($event.target as HTMLInputElement).value)"
                type="number"
                step="any"
                class="flex-1 min-w-0 bg-transparent font-mono text-right text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
              <CopyButton
                :text="`${formatRawInputNumber(cssValues[u.id as CssUnitId], 4)}${u.id === 'percent' ? '%' : u.id}`"
                variant="icon"
              />
            </div>
          </div>

          <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-800 px-3 py-2 flex items-center justify-between">
            <span class="text-zinc-500">Tailwind Spacing Token:</span>
            <code class="font-mono font-semibold text-blue-600 dark:text-blue-400">{{ tailwindHint }}</code>
          </div>
        </section>
      </div>

      <!-- 右侧：批量 px -> rem 转换器 -->
      <div class="xl:col-span-5 flex flex-col gap-3 min-w-0">
        <section class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-3 text-xs">
          <div class="flex items-center justify-between gap-2">
            <div>
              <h2 class="font-bold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
                {{ t('tools.devUnitConverter.batchPxToRem') }}
              </h2>
              <p class="text-[11px] text-zinc-400 mt-0.5">
                {{ t('tools.devUnitConverter.batchPxToRemDesc') }}
              </p>
            </div>
            <CopyButton :text="convertedCssSnippet" />
          </div>

          <textarea
            v-model="cssSnippetInput"
            rows="6"
            class="w-full rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 p-2.5 font-mono text-xs resize-y focus:outline-none focus:border-blue-500"
          />

          <pre
            class="rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/80 p-3 text-xs font-mono text-emerald-700 dark:text-emerald-300 overflow-auto max-h-56 select-all"
          >{{ convertedCssSnippet }}</pre>
        </section>
      </div>
    </div>

    <!-- ==================== TAB 4: 时间精度与频率 ==================== -->
    <div v-if="activeTab === 'time'" class="grid grid-cols-1 xl:grid-cols-12 gap-4 items-start">
      <div class="xl:col-span-7 flex flex-col gap-3 min-w-0">
        <section class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-3 text-xs">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <h2 class="font-bold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
              {{ t('tools.devUnitConverter.timeMatrixTitle') }}
            </h2>
            <div class="flex flex-wrap gap-1.5">
              <button
                v-for="p in [
                  { label: '100 ns (RAM)', v: 100, u: 'ns' },
                  { label: '8.33 ms (120 FPS)', v: 1000 / 120, u: 'ms' },
                  { label: '16.67 ms (60 FPS)', v: 1000 / 60, u: 'ms' },
                  { label: '1 d', v: 1, u: 'd' },
                  { label: '7 d (JWT)', v: 7, u: 'd' },
                ]"
                :key="p.label"
                type="button"
                @click="timeNs = convertTimeToNs(p.v, p.u as TimeUnitId)"
                class="px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-[11px] font-mono text-zinc-600 dark:text-zinc-300 hover:text-blue-600 cursor-pointer"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <div class="space-y-2">
            <div
              v-for="u in TIME_UNITS"
              :key="u.id"
              class="flex items-center gap-2 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 px-3 py-1.5"
            >
              <span class="w-36 font-mono font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
                {{ u.label }}
              </span>
              <input
                :value="formatRawInputNumber(timeValues[u.id], 6)"
                @input="updateTime(u.id, ($event.target as HTMLInputElement).value)"
                type="number"
                step="any"
                class="flex-1 min-w-0 bg-transparent font-mono text-right text-zinc-900 dark:text-zinc-100 focus:outline-none"
              />
              <CopyButton :text="formatRawInputNumber(timeValues[u.id], 6)" variant="icon" />
            </div>
          </div>
        </section>
      </div>

      <!-- 右侧：频率 / 帧率互转与人类可读摘要 -->
      <div class="xl:col-span-5 flex flex-col gap-3 min-w-0">
        <section class="rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900/80 p-4 space-y-3 text-xs">
          <h2 class="font-bold uppercase tracking-wide text-zinc-800 dark:text-zinc-100">
            {{ t('tools.devUnitConverter.freqTitle') }}
          </h2>

          <div class="flex items-center gap-2 rounded-xl border border-zinc-200/70 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-950/50 px-3 py-2">
            <span class="w-24 font-mono font-semibold text-zinc-600 dark:text-zinc-300 shrink-0">
              Hz / FPS
            </span>
            <input
              :value="formatRawInputNumber(freqHz, 4)"
              @input="updateFrequencyHz(($event.target as HTMLInputElement).value)"
              type="number"
              step="any"
              class="flex-1 min-w-0 bg-transparent font-mono text-right text-zinc-900 dark:text-zinc-100 focus:outline-none"
            />
            <CopyButton :text="formatRawInputNumber(freqHz, 4)" variant="icon" />
          </div>

          <div class="grid grid-cols-2 gap-2">
            <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 p-2.5">
              <div class="text-[10px] text-zinc-400">kHz</div>
              <div class="font-mono font-semibold mt-0.5">{{ formatUnitNumber(freqHz / 1e3, 4) }}</div>
            </div>
            <div class="rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 p-2.5">
              <div class="text-[10px] text-zinc-400">MHz</div>
              <div class="font-mono font-semibold mt-0.5">{{ formatUnitNumber(freqHz / 1e6, 4) }}</div>
            </div>
          </div>

          <div class="rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200/70 dark:border-blue-800/50 p-3">
            <div class="text-[10px] text-blue-600 dark:text-blue-400 font-medium">
              {{ t('tools.devUnitConverter.humanDuration') }}
            </div>
            <div class="text-sm font-mono font-bold text-zinc-900 dark:text-zinc-100 mt-1">
              {{ formatDurationCompact(timeNs / 1e9, isZh) }}
            </div>
          </div>
        </section>
      </div>
    </div>
  </ToolContainer>
</template>
