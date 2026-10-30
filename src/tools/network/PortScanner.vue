<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Radio,
  Server,
  Play,
  Square,
  RotateCcw,
  Search,
  Check,
  Copy,
  AlertCircle,
  AlertTriangle,
  Activity,
  CheckCircle2,
  Trash2,
  Download
} from 'lucide-vue-next';
import { invoke } from '@tauri-apps/api/core';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import {
  PORT_PRESETS,
  getKnownService,
  type PortPreset
} from './portServices';
import {
  parsePortInput,
  chunkArray,
  type PortScanItem,
  type ListeningPortItem
} from './portScannerUtils';

const { t, locale } = useI18n();

// 当前 Tab：'scan' (端口扫描) 或 'listeners' (本机监听排查)
const activeTab = ref<'scan' | 'listeners'>('scan');

// ==============================
// 1. 端口扫描 (Port Scanner) 状态
// ==============================
const targetHost = ref('127.0.0.1');
const activePresetId = ref('dev');
const portInputText = ref(PORT_PRESETS[0].ports.join(', '));
const timeoutMs = ref(300);

const isScanning = ref(false);
const shouldStopScan = ref(false);
const scannedCount = ref(0);
const totalToScan = ref(0);
const scanResults = ref<PortScanItem[]>([]);
const scanFilterQuery = ref('');
const onlyOpenPorts = ref(false);
const copiedAllOpen = ref(false);
const scanErrorMessage = ref('');

// 计算待扫描的端口列表
const targetPorts = computed(() => {
  return parsePortInput(portInputText.value);
});

// 选择预设
function selectPreset(preset: PortPreset) {
  activePresetId.value = preset.id;
  portInputText.value = preset.ports.join(', ');
}

// 快速填入 Host
function selectHost(host: string) {
  targetHost.value = host;
}

// 执行并发端口扫描
async function startScan() {
  const ports = targetPorts.value;
  if (ports.length === 0) return;

  isScanning.value = true;
  shouldStopScan.value = false;
  scanResults.value = [];
  scannedCount.value = 0;
  totalToScan.value = ports.length;
  scanErrorMessage.value = '';

  const chunks = chunkArray(ports, 32);

  try {
    for (const chunk of chunks) {
      if (shouldStopScan.value) {
        break;
      }

      const chunkResults = await invoke<Array<{ port: number; open: boolean; latency_ms: number | null }>>(
        'scan_ports',
        {
          host: targetHost.value.trim(),
          ports: chunk,
          timeoutMs: timeoutMs.value
        }
      );

      for (const res of chunkResults) {
        scanResults.value.push({
          port: res.port,
          open: res.open,
          latencyMs: res.latency_ms
        });
      }

      scannedCount.value += chunk.length;
    }
  } catch (err: any) {
    console.error('Port scan failed', err);
    scanErrorMessage.value = String(err);
  } finally {
    isScanning.value = false;
    shouldStopScan.value = false;
  }
}

function stopScan() {
  shouldStopScan.value = true;
  isScanning.value = false;
}

// 扫描进度百分比
const progressPercent = computed(() => {
  if (totalToScan.value === 0) return 0;
  return Math.min(100, Math.round((scannedCount.value / totalToScan.value) * 100));
});

// 扫描统计指标
const scanMetrics = computed(() => {
  const results = scanResults.value;
  const openList = results.filter(r => r.open);
  const closedCount = results.length - openList.length;

  let totalLatency = 0;
  let countWithLatency = 0;
  openList.forEach(r => {
    if (r.latencyMs !== null) {
      totalLatency += r.latencyMs;
      countWithLatency++;
    }
  });

  const avgLatency = countWithLatency > 0 ? Math.round(totalLatency / countWithLatency) : 0;

  return {
    totalScanned: results.length,
    openCount: openList.length,
    closedCount,
    avgLatency
  };
});

// 过滤后的扫描结果
const filteredScanResults = computed(() => {
  let list = scanResults.value;
  if (onlyOpenPorts.value) {
    list = list.filter(r => r.open);
  }

  const q = scanFilterQuery.value.trim().toLowerCase();
  if (q) {
    list = list.filter(r => {
      const portStr = String(r.port);
      if (portStr.includes(q)) return true;
      const s = getKnownService(r.port);
      if (s) {
        if (s.service.toLowerCase().includes(q)) return true;
        if (s.descZh.toLowerCase().includes(q)) return true;
        if (s.descEn.toLowerCase().includes(q)) return true;
      }
      return false;
    });
  }

  return list;
});

// 复制所有开放端口
async function copyOpenPorts() {
  const openList = scanResults.value.filter(r => r.open).map(r => r.port);
  if (openList.length === 0) return;
  try {
    await navigator.clipboard.writeText(openList.join(', '));
    copiedAllOpen.value = true;
    setTimeout(() => {
      copiedAllOpen.value = false;
    }, 1500);
  } catch (err) {
    console.error('Failed to copy open ports', err);
  }
}

// 导出 JSON
function exportScanJson() {
  const data = scanResults.value.map(r => ({
    port: r.port,
    open: r.open,
    latencyMs: r.latencyMs,
    service: getKnownService(r.port)?.service || 'Unknown'
  }));
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `port_scan_${targetHost.value.replace(/[^a-zA-Z0-9]/g, '_')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ======================================
// 2. 本机监听排查 (Active Listeners) 状态
// ======================================
const listeningPorts = ref<ListeningPortItem[]>([]);
const isInspectingListeners = ref(false);
const listenersFilterQuery = ref('');
const listenerErrorMessage = ref('');
const actionNotice = ref<{ type: 'success' | 'error'; message: string } | null>(null);

// 终止进程确认弹窗
const processToKill = ref<ListeningPortItem | null>(null);
const isKillingProcess = ref(false);

async function refreshListeners() {
  isInspectingListeners.value = true;
  listenerErrorMessage.value = '';
  try {
    const rawList = await invoke<Array<{
      port: number;
      protocol: string;
      address: string;
      pid: number | null;
      process_name: string | null;
      user: string | null;
    }>>('get_listening_ports');

    listeningPorts.value = rawList.map(item => ({
      port: item.port,
      protocol: item.protocol,
      address: item.address,
      pid: item.pid,
      processName: item.process_name,
      user: item.user
    }));
  } catch (err: any) {
    console.error('Failed to inspect listening ports', err);
    listenerErrorMessage.value = String(err);
  } finally {
    isInspectingListeners.value = false;
  }
}

// 过滤后的监听端口列表
const filteredListeningPorts = computed(() => {
  const q = listenersFilterQuery.value.trim().toLowerCase();
  if (!q) return listeningPorts.value;

  return listeningPorts.value.filter(item => {
    if (String(item.port).includes(q)) return true;
    if (item.address.toLowerCase().includes(q)) return true;
    if (item.processName && item.processName.toLowerCase().includes(q)) return true;
    if (item.pid && String(item.pid).includes(q)) return true;
    const s = getKnownService(item.port);
    if (s && (s.service.toLowerCase().includes(q) || s.descZh.toLowerCase().includes(q) || s.descEn.toLowerCase().includes(q))) {
      return true;
    }
    return false;
  });
});

// 监听指标
const listenersMetrics = computed(() => {
  const list = listeningPorts.value;
  const pids = new Set<number>();
  let devCount = 0;

  list.forEach(item => {
    if (item.pid) pids.add(item.pid);
    if ([3000, 3001, 5173, 5174, 8000, 8080, 8081, 8888].includes(item.port)) {
      devCount++;
    }
  });

  return {
    totalPorts: list.length,
    processesCount: pids.size,
    devCount
  };
});

// 终止进程
async function handleConfirmKill() {
  if (!processToKill.value || !processToKill.value.pid) return;
  const pid = processToKill.value.pid;
  const port = processToKill.value.port;
  const name = processToKill.value.processName || 'process';

  isKillingProcess.value = true;
  try {
    await invoke('kill_process', { pid });
    actionNotice.value = {
      type: 'success',
      message: t('tools.portScanner.killSuccess', { pid, name, port })
    };
    processToKill.value = null;
    await refreshListeners();
  } catch (err: any) {
    console.error('Failed to kill process', err);
    actionNotice.value = {
      type: 'error',
      message: t('tools.portScanner.killFailed', { error: String(err) })
    };
  } finally {
    isKillingProcess.value = false;
    setTimeout(() => {
      actionNotice.value = null;
    }, 4000);
  }
}

// 首次挂载时如果处于 listeners tab 则自动拉取
onMounted(() => {
  // 可选预热
});
</script>

<template>
  <ToolContainer
    toolId="port-scanner"
    nameKey="tools.portScanner.name"
    descKey="tools.portScanner.desc"
    :icon="Radio"
    :wide="true"
    :fullHeight="true"
  >
    <div class="flex-1 flex flex-col min-h-0 h-full overflow-hidden bg-white dark:bg-zinc-900">
      <!-- 顶部 Tab 导航栏 -->
      <div class="px-5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50/70 dark:bg-zinc-900/60 flex items-center justify-between shrink-0">
        <div class="flex items-center gap-2 -mb-px text-xs font-semibold">
          <button
            type="button"
            @click="activeTab = 'scan'"
            class="px-4 py-3 border-b-2 transition-all cursor-pointer inline-flex items-center gap-2"
            :class="[
              activeTab === 'scan'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            ]"
          >
            <Activity class="w-4 h-4" />
            <span>{{ t('tools.portScanner.scanTab') }}</span>
          </button>

          <button
            type="button"
            @click="activeTab = 'listeners'; if (listeningPorts.length === 0) refreshListeners();"
            class="px-4 py-3 border-b-2 transition-all cursor-pointer inline-flex items-center gap-2"
            :class="[
              activeTab === 'listeners'
                ? 'border-blue-600 text-blue-600 dark:text-blue-400 font-bold'
                : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
            ]"
          >
            <Server class="w-4 h-4" />
            <span>{{ t('tools.portScanner.listenersTab') }}</span>
          </button>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- TAB 1: 端口连通扫描 (Port Scanner)              -->
      <!-- ============================================== -->
      <div v-if="activeTab === 'scan'" class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <!-- 扫描配置区域 -->
        <div class="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shrink-0 flex flex-col gap-4">
          <!-- 目标主机 & 快捷 Host Chips -->
          <div class="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs">
            <span class="w-20 font-semibold text-zinc-700 dark:text-zinc-300 shrink-0">
              {{ t('tools.portScanner.targetHost') }}:
            </span>
            <div class="flex items-center gap-2 flex-1">
              <input
                v-model="targetHost"
                type="text"
                placeholder="127.0.0.1"
                class="w-full sm:max-w-xs px-3 py-1.5 font-mono text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  v-for="h in ['127.0.0.1', 'localhost', '0.0.0.0']"
                  :key="h"
                  type="button"
                  @click="selectHost(h)"
                  class="px-2 py-1 text-[11px] font-mono rounded-md border transition-colors cursor-pointer"
                  :class="targetHost === h ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 font-semibold' : 'border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'"
                >
                  {{ h }}
                </button>
              </div>
            </div>
          </div>

          <!-- 预设分类与自定义端口 -->
          <div class="flex flex-col gap-2 text-xs">
            <div class="flex items-center justify-between flex-wrap gap-2">
              <span class="font-semibold text-zinc-700 dark:text-zinc-300">
                {{ t('tools.portScanner.portSelection') }}:
              </span>
              <div class="flex items-center gap-1.5 flex-wrap">
                <button
                  v-for="p in PORT_PRESETS"
                  :key="p.id"
                  type="button"
                  @click="selectPreset(p)"
                  class="px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer"
                  :class="activePresetId === p.id ? 'bg-blue-600 text-white border-blue-600 font-semibold shadow-2xs' : 'bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-300'"
                >
                  {{ locale.startsWith('zh') ? p.nameZh : p.nameEn }}
                </button>
              </div>
            </div>

            <!-- 端口输入文本域 -->
            <div class="relative">
              <input
                v-model="portInputText"
                type="text"
                :placeholder="t('tools.portScanner.customPortPlaceholder')"
                class="w-full px-3 py-2 font-mono text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <span class="absolute right-2.5 top-1/2 -translate-y-1/2 text-[11px] font-mono text-zinc-400">
                {{ targetPorts.length }} {{ locale.startsWith('zh') ? '个待测端口' : 'ports' }}
              </span>
            </div>
          </div>

          <!-- 操作栏：超时设置 & 开始/停止按钮 -->
          <div class="flex items-center justify-between flex-wrap gap-3 pt-1">
            <div class="flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
              <span>{{ t('tools.portScanner.timeout') }}:</span>
              <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700 text-xs">
                <button
                  v-for="to in [150, 300, 500, 1000]"
                  :key="to"
                  type="button"
                  @click="timeoutMs = to"
                  class="px-2 py-0.5 rounded-md text-[11px] font-mono transition-colors cursor-pointer"
                  :class="timeoutMs === to ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 font-bold shadow-2xs' : 'text-zinc-600 dark:text-zinc-400'"
                >
                  {{ to }}ms
                </button>
              </div>
            </div>

            <div class="flex items-center gap-2">
              <button
                v-if="isScanning"
                type="button"
                @click="stopScan"
                class="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
              >
                <Square class="w-3.5 h-3.5 fill-current" />
                <span>{{ t('tools.portScanner.stopScan') }}</span>
              </button>

              <button
                v-else
                type="button"
                @click="startScan"
                :disabled="targetPorts.length === 0"
                class="px-5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs hover:shadow transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <Play class="w-3.5 h-3.5 fill-current" />
                <span>{{ t('tools.portScanner.startScan') }}</span>
              </button>
            </div>
          </div>

          <!-- 进度条与错误提示 -->
          <div v-if="isScanning || (scannedCount > 0 && scannedCount < totalToScan)" class="flex flex-col gap-1.5">
            <div class="flex items-center justify-between text-[11px] font-mono text-zinc-500">
              <span>{{ t('tools.portScanner.scanning') }} ({{ scannedCount }} / {{ totalToScan }})</span>
              <span>{{ progressPercent }}%</span>
            </div>
            <div class="w-full h-1.5 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div class="h-full bg-blue-600 transition-all duration-150" :style="{ width: `${progressPercent}%` }"></div>
            </div>
          </div>

          <div v-if="scanErrorMessage" class="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/40 text-xs text-rose-600 dark:text-rose-400 flex items-center gap-2">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span>{{ scanErrorMessage }}</span>
          </div>
        </div>

        <!-- 扫描结果工作区 -->
        <div class="flex-1 flex flex-col min-h-0 overflow-hidden">
          <!-- 指标栏与过滤工具条 -->
          <div v-if="scanResults.length > 0" class="p-3.5 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-col gap-3 shrink-0">
            <!-- 4 项 KPI 指标卡片 -->
            <div class="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
              <div class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 flex flex-col justify-between">
                <span class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ t('tools.portScanner.totalPorts') }}</span>
                <span class="font-mono text-base font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">{{ scanMetrics.totalScanned }}</span>
              </div>

              <div class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 flex flex-col justify-between">
                <span class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ t('tools.portScanner.openPorts') }}</span>
                <span class="font-mono text-base font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{{ scanMetrics.openCount }}</span>
              </div>

              <div class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 flex flex-col justify-between">
                <span class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ t('tools.portScanner.closedPorts') }}</span>
                <span class="font-mono text-base font-bold text-zinc-500 dark:text-zinc-400 mt-0.5">{{ scanMetrics.closedCount }}</span>
              </div>

              <div class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-white dark:bg-zinc-800/60 flex flex-col justify-between">
                <span class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ t('tools.portScanner.avgLatency') }}</span>
                <span class="font-mono text-base font-bold text-blue-600 dark:text-blue-400 mt-0.5">{{ scanMetrics.avgLatency }} ms</span>
              </div>
            </div>

            <!-- 搜索与快捷过滤 -->
            <div class="flex items-center justify-between flex-wrap gap-2 text-xs">
              <div class="flex items-center gap-2 flex-1 min-w-[200px]">
                <div class="relative w-full max-w-xs">
                  <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    v-model="scanFilterQuery"
                    type="text"
                    :placeholder="t('tools.portScanner.searchPlaceholder')"
                    class="w-full pl-8 pr-2.5 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 placeholder-zinc-400 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="button"
                  @click="onlyOpenPorts = !onlyOpenPorts"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors cursor-pointer shrink-0"
                  :class="onlyOpenPorts ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-semibold' : 'border-zinc-200 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'"
                >
                  {{ t('tools.portScanner.openOnly') }}
                </button>
              </div>

              <div class="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  @click="copyOpenPorts"
                  :disabled="scanMetrics.openCount === 0"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer inline-flex items-center gap-1 disabled:opacity-40"
                >
                  <Check v-if="copiedAllOpen" class="w-3.5 h-3.5 text-emerald-500" />
                  <Copy v-else class="w-3.5 h-3.5" />
                  <span>{{ copiedAllOpen ? t('common.copied') : t('tools.portScanner.copyOpenPorts') }}</span>
                </button>

                <button
                  type="button"
                  @click="exportScanJson"
                  class="px-2.5 py-1 rounded-lg text-xs font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-200 border border-zinc-200 dark:border-zinc-700 transition-colors cursor-pointer inline-flex items-center gap-1"
                >
                  <Download class="w-3.5 h-3.5" />
                  <span>{{ t('tools.portScanner.exportJson') }}</span>
                </button>
              </div>
            </div>
          </div>

          <!-- 结果表格 -->
          <div class="flex-1 overflow-y-auto">
            <div v-if="scanResults.length === 0" class="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-400">
              <Activity class="w-10 h-10 mb-2 text-zinc-300 dark:text-zinc-600" />
              <p class="text-xs">{{ t('tools.portScanner.noScanResults') }}</p>
            </div>

            <div v-else class="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
              <!-- 表头 -->
              <div class="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-100/70 dark:bg-zinc-800/60 font-semibold text-zinc-500 dark:text-zinc-400 select-none sticky top-0 backdrop-blur-xs">
                <span class="col-span-3 sm:col-span-2">{{ t('tools.portScanner.port') }}</span>
                <span class="col-span-3 sm:col-span-2">{{ t('tools.portScanner.status') }}</span>
                <span class="col-span-2 sm:col-span-2 text-right">{{ t('tools.portScanner.latency') }}</span>
                <span class="col-span-4 sm:col-span-6 pl-2">{{ t('tools.portScanner.service') }}</span>
              </div>

              <!-- 行列表 -->
              <div
                v-for="item in filteredScanResults"
                :key="item.port"
                class="grid grid-cols-12 gap-2 px-4 py-2.5 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
              >
                <!-- 端口与协议 -->
                <div class="col-span-3 sm:col-span-2 flex items-center gap-1.5">
                  <span class="font-mono text-xs font-bold text-zinc-900 dark:text-zinc-100">{{ item.port }}</span>
                  <span class="px-1 py-0.2 rounded text-[10px] font-mono font-medium bg-zinc-100 dark:bg-zinc-800 text-zinc-500 border border-zinc-200 dark:border-zinc-700">TCP</span>
                </div>

                <!-- 状态指示 -->
                <div class="col-span-3 sm:col-span-2 flex items-center gap-1.5">
                  <span
                    class="w-2 h-2 rounded-full shrink-0"
                    :class="item.open ? 'bg-emerald-500 animate-pulse' : 'bg-zinc-300 dark:bg-zinc-600'"
                  ></span>
                  <span
                    class="font-medium text-[11px]"
                    :class="item.open ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-zinc-400'"
                  >
                    {{ item.open ? t('tools.portScanner.statusOpen') : t('tools.portScanner.statusClosed') }}
                  </span>
                </div>

                <!-- 延迟 -->
                <div class="col-span-2 sm:col-span-2 text-right font-mono text-[11px]">
                  <span v-if="item.latencyMs !== null" :class="item.latencyMs < 20 ? 'text-emerald-600 dark:text-emerald-400' : item.latencyMs < 100 ? 'text-blue-600 dark:text-blue-400' : 'text-amber-600 dark:text-amber-400'">
                    {{ item.latencyMs }} ms
                  </span>
                  <span v-else class="text-zinc-400">-</span>
                </div>

                <!-- 知名服务推测 -->
                <div class="col-span-4 sm:col-span-6 pl-2 flex items-center justify-between gap-2 min-w-0">
                  <div class="flex flex-col min-w-0">
                    <div class="flex items-center gap-1.5">
                      <span v-if="getKnownService(item.port)" class="font-semibold text-zinc-800 dark:text-zinc-200 truncate">
                        {{ getKnownService(item.port)?.service }}
                      </span>
                      <span v-else class="text-zinc-400 text-[11px]">-</span>
                    </div>
                    <span v-if="getKnownService(item.port)" class="text-[11px] text-zinc-400 truncate">
                      {{ locale.startsWith('zh') ? getKnownService(item.port)?.descZh : getKnownService(item.port)?.descEn }}
                    </span>
                  </div>

                  <CopyButton
                    v-if="item.open"
                    :text="`${targetHost}:${item.port}`"
                    variant="ghost"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- ============================================== -->
      <!-- TAB 2: 本机监听与冲突排查 (Active Listeners)     -->
      <!-- ============================================== -->
      <div v-else class="flex-1 flex flex-col min-h-0 overflow-hidden">
        <!-- 提示横幅与操作工具栏 -->
        <div class="p-4 sm:p-5 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/90 shrink-0 flex flex-col gap-3.5">
          <div class="flex items-center justify-between flex-wrap gap-2">
            <div class="flex items-center gap-2">
              <span class="font-bold text-sm text-zinc-900 dark:text-zinc-100">
                {{ t('tools.portScanner.listenersTab') }}
              </span>
              <span class="text-xs text-zinc-400">
                ({{ listeningPorts.length }} {{ locale.startsWith('zh') ? '个正在监听' : 'listening' }})
              </span>
            </div>

            <button
              type="button"
              @click="refreshListeners"
              :disabled="isInspectingListeners"
              class="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-xs hover:shadow transition-all cursor-pointer inline-flex items-center gap-2 disabled:opacity-50"
            >
              <RotateCcw class="w-3.5 h-3.5" :class="{ 'animate-spin': isInspectingListeners }" />
              <span>{{ isInspectingListeners ? t('tools.portScanner.inspecting') : t('tools.portScanner.refreshListeners') }}</span>
            </button>
          </div>

          <p class="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            {{ t('tools.portScanner.listenerDesc') }}
          </p>

          <!-- 操作成功 / 失败反馈通知 -->
          <div
            v-if="actionNotice"
            class="p-3 rounded-xl text-xs flex items-center gap-2"
            :class="actionNotice.type === 'success' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/40' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/40'"
          >
            <CheckCircle2 v-if="actionNotice.type === 'success'" class="w-4 h-4 shrink-0" />
            <AlertCircle v-else class="w-4 h-4 shrink-0" />
            <span>{{ actionNotice.message }}</span>
          </div>

          <!-- 3 项指标摘要卡片 -->
          <div class="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            <div class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col justify-between">
              <span class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ t('tools.portScanner.activeListenersCount') }}</span>
              <span class="font-mono text-base font-bold text-blue-600 dark:text-blue-400 mt-1">{{ listenersMetrics.totalPorts }}</span>
            </div>

            <div class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col justify-between">
              <span class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ t('tools.portScanner.processesCount') }}</span>
              <span class="font-mono text-base font-bold text-zinc-800 dark:text-zinc-200 mt-1">{{ listenersMetrics.processesCount }}</span>
            </div>

            <div class="p-2.5 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-800/40 flex flex-col justify-between">
              <span class="text-[11px] text-zinc-500 dark:text-zinc-400">{{ locale.startsWith('zh') ? '常用开发端口占用' : 'Dev Ports Occupied' }}</span>
              <span class="font-mono text-base font-bold mt-1" :class="listenersMetrics.devCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-zinc-400'">
                {{ listenersMetrics.devCount }}
              </span>
            </div>
          </div>

          <!-- 搜索筛选输入 -->
          <div class="relative w-full">
            <Search class="w-3.5 h-3.5 text-zinc-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              v-model="listenersFilterQuery"
              type="text"
              :placeholder="t('tools.portScanner.searchListenersPlaceholder')"
              class="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <!-- 监听列表表格 -->
        <div class="flex-1 overflow-y-auto">
          <div v-if="filteredListeningPorts.length === 0" class="h-full flex flex-col items-center justify-center p-8 text-center text-zinc-400">
            <Server class="w-10 h-10 mb-2 text-zinc-300 dark:text-zinc-600" />
            <p class="text-xs">{{ t('tools.portScanner.noListenersFound') }}</p>
          </div>

          <div v-else class="min-w-full divide-y divide-zinc-100 dark:divide-zinc-800/80 text-xs">
            <!-- 表头 -->
            <div class="grid grid-cols-12 gap-2 px-4 py-2 bg-zinc-100/70 dark:bg-zinc-800/60 font-semibold text-zinc-500 dark:text-zinc-400 select-none sticky top-0 backdrop-blur-xs">
              <span class="col-span-3 sm:col-span-2">{{ t('tools.portScanner.port') }}</span>
              <span class="col-span-3 sm:col-span-2">{{ t('tools.portScanner.address') }}</span>
              <span class="col-span-3 sm:col-span-3">{{ t('tools.portScanner.processName') }} / {{ t('tools.portScanner.pid') }}</span>
              <span class="col-span-3 sm:col-span-3 hidden sm:block">{{ t('tools.portScanner.service') }}</span>
              <span class="col-span-3 sm:col-span-2 text-right pr-2">{{ t('tools.portScanner.actions') }}</span>
            </div>

            <!-- 数据行 -->
            <div
              v-for="item in filteredListeningPorts"
              :key="item.port + (item.pid ? `_${item.pid}` : '')"
              class="grid grid-cols-12 gap-2 px-4 py-3 items-center hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
            >
              <!-- 端口 -->
              <div class="col-span-3 sm:col-span-2 flex items-center gap-1.5">
                <span class="font-mono text-xs font-bold text-blue-600 dark:text-blue-400">{{ item.port }}</span>
                <span class="px-1 py-0.2 rounded text-[10px] font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700">
                  {{ item.protocol }}
                </span>
              </div>

              <!-- 绑定地址 -->
              <div class="col-span-3 sm:col-span-2 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 truncate" :title="item.address">
                {{ item.address }}
              </div>

              <!-- 进程名与 PID -->
              <div class="col-span-3 sm:col-span-3 flex items-center gap-1.5 min-w-0">
                <div class="flex flex-col min-w-0">
                  <span class="font-medium text-zinc-800 dark:text-zinc-200 truncate" :title="item.processName || 'N/A'">
                    {{ item.processName || 'N/A' }}
                  </span>
                  <span v-if="item.pid" class="font-mono text-[10px] text-zinc-400">
                    PID: {{ item.pid }}
                  </span>
                </div>
              </div>

              <!-- 知名服务 -->
              <div class="col-span-3 sm:col-span-3 hidden sm:flex flex-col min-w-0">
                <span v-if="getKnownService(item.port)" class="font-medium text-zinc-700 dark:text-zinc-300 truncate">
                  {{ getKnownService(item.port)?.service }}
                </span>
                <span v-if="getKnownService(item.port)" class="text-[11px] text-zinc-400 truncate">
                  {{ locale.startsWith('zh') ? getKnownService(item.port)?.descZh : getKnownService(item.port)?.descEn }}
                </span>
                <span v-else class="text-zinc-400">-</span>
              </div>

              <!-- 操作区 (复制 PID / 杀死进程) -->
              <div class="col-span-3 sm:col-span-2 flex items-center justify-end gap-1.5 pr-2">
                <CopyButton
                  v-if="item.pid"
                  :text="String(item.pid)"
                  variant="ghost"
                />

                <button
                  v-if="item.pid"
                  type="button"
                  @click="processToKill = item"
                  class="px-2 py-1 rounded-md text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 border border-rose-200/60 dark:border-rose-900/40 transition-colors cursor-pointer inline-flex items-center gap-1"
                  :title="t('tools.portScanner.killProcess')"
                >
                  <Trash2 class="w-3.5 h-3.5" />
                  <span class="hidden sm:inline">{{ locale.startsWith('zh') ? '释放' : 'Kill' }}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 终止进程二次确认弹窗 -->
    <div
      v-if="processToKill"
      class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
    >
      <div class="w-full max-w-md bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 shadow-2xl p-5 flex flex-col gap-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
            <AlertTriangle class="w-5 h-5" />
          </div>
          <div>
            <h3 class="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {{ t('tools.portScanner.killConfirmTitle') }}
            </h3>
            <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
              PID: {{ processToKill.pid }} · Port: {{ processToKill.port }}
            </p>
          </div>
        </div>

        <p class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {{ t('tools.portScanner.killConfirmDesc', {
            name: processToKill.processName || 'process',
            pid: processToKill.pid,
            port: processToKill.port
          }) }}
        </p>

        <div class="flex items-center justify-end gap-2.5 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            @click="processToKill = null"
            class="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            {{ t('tools.portScanner.cancel') }}
          </button>

          <button
            type="button"
            @click="handleConfirmKill"
            :disabled="isKillingProcess"
            class="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 hover:bg-rose-500 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {{ isKillingProcess ? locale.startsWith('zh') ? '正在终止...' : 'Killing...' : t('tools.portScanner.confirmKill') }}
          </button>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
