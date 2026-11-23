// ==================== 通用数值格式化 ====================

export function formatUnitNumber(val: number, maxDecimals = 6): string {
  if (!Number.isFinite(val)) return '-';
  if (val === 0) return '0';
  const abs = Math.abs(val);
  if (abs >= 1e15 || (abs > 0 && abs < 1e-6)) {
    return val.toExponential(4).replace(/\.?0+e/, 'e');
  }
  const decimals = abs >= 1000 ? 2 : abs >= 1 ? 4 : maxDecimals;
  const fixed = Number(val.toFixed(decimals));
  return fixed.toLocaleString('en-US', {
    maximumFractionDigits: decimals,
  });
}

export function formatRawInputNumber(val: number, maxDecimals = 6): string {
  if (!Number.isFinite(val)) return '0';
  if (val === 0) return '0';
  const abs = Math.abs(val);
  const decimals = abs >= 1000 ? 2 : abs >= 1 ? 4 : maxDecimals;
  return String(Number(val.toFixed(decimals)));
}

// ==================== 1. 存储大小换算 (IEC Binary vs SI Decimal) ====================

export type StorageUnitId =
  | 'bit'
  | 'Kbit'
  | 'Mbit'
  | 'Gbit'
  | 'B'
  | 'KB'
  | 'MB'
  | 'GB'
  | 'TB'
  | 'PB'
  | 'KiB'
  | 'MiB'
  | 'GiB'
  | 'TiB'
  | 'PiB';

export interface StorageUnitDef {
  id: StorageUnitId;
  label: string;
  group: 'bits' | 'si' | 'iec';
  bytesFactor: number; // 1 unit = bytesFactor bytes
}

export const STORAGE_UNITS: StorageUnitDef[] = [
  { id: 'bit', label: 'bit (b)', group: 'bits', bytesFactor: 1 / 8 },
  { id: 'Kbit', label: 'Kbit (Kb)', group: 'bits', bytesFactor: 1000 / 8 },
  { id: 'Mbit', label: 'Mbit (Mb)', group: 'bits', bytesFactor: 1e6 / 8 },
  { id: 'Gbit', label: 'Gbit (Gb)', group: 'bits', bytesFactor: 1e9 / 8 },
  { id: 'B', label: 'Bytes (B)', group: 'si', bytesFactor: 1 },
  { id: 'KB', label: 'KB (10³)', group: 'si', bytesFactor: 1e3 },
  { id: 'MB', label: 'MB (10⁶)', group: 'si', bytesFactor: 1e6 },
  { id: 'GB', label: 'GB (10⁹)', group: 'si', bytesFactor: 1e9 },
  { id: 'TB', label: 'TB (10¹²)', group: 'si', bytesFactor: 1e12 },
  { id: 'PB', label: 'PB (10¹⁵)', group: 'si', bytesFactor: 1e15 },
  { id: 'KiB', label: 'KiB (2¹⁰)', group: 'iec', bytesFactor: 1024 },
  { id: 'MiB', label: 'MiB (2²⁰)', group: 'iec', bytesFactor: 1024 ** 2 },
  { id: 'GiB', label: 'GiB (2³⁰)', group: 'iec', bytesFactor: 1024 ** 3 },
  { id: 'TiB', label: 'TiB (2⁴⁰)', group: 'iec', bytesFactor: 1024 ** 4 },
  { id: 'PiB', label: 'PiB (2⁵⁰)', group: 'iec', bytesFactor: 1024 ** 5 },
];

export function convertStorageToBytes(value: number, unit: StorageUnitId): number {
  const def = STORAGE_UNITS.find(u => u.id === unit);
  if (!def || !Number.isFinite(value) || value < 0) return 0;
  return value * def.bytesFactor;
}

export function convertBytesToAllStorage(bytes: number): Record<StorageUnitId, number> {
  const out = {} as Record<StorageUnitId, number>;
  const safeBytes = Number.isFinite(bytes) && bytes >= 0 ? bytes : 0;
  for (const u of STORAGE_UNITS) {
    out[u.id] = safeBytes / u.bytesFactor;
  }
  return out;
}

// ==================== 2. 带宽换算与传输耗时预估 ====================

export type BandwidthUnitId =
  | 'bps'
  | 'Kbps'
  | 'Mbps'
  | 'Gbps'
  | 'B/s'
  | 'KB/s'
  | 'MB/s'
  | 'GB/s'
  | 'KiB/s'
  | 'MiB/s'
  | 'GiB/s';

export interface BandwidthUnitDef {
  id: BandwidthUnitId;
  label: string;
  group: 'bits' | 'si' | 'iec';
  bpsFactor: number; // 1 unit = bpsFactor bits/sec
}

export const BANDWIDTH_UNITS: BandwidthUnitDef[] = [
  { id: 'bps', label: 'bps', group: 'bits', bpsFactor: 1 },
  { id: 'Kbps', label: 'Kbps', group: 'bits', bpsFactor: 1e3 },
  { id: 'Mbps', label: 'Mbps', group: 'bits', bpsFactor: 1e6 },
  { id: 'Gbps', label: 'Gbps', group: 'bits', bpsFactor: 1e9 },
  { id: 'B/s', label: 'B/s', group: 'si', bpsFactor: 8 },
  { id: 'KB/s', label: 'KB/s', group: 'si', bpsFactor: 8 * 1e3 },
  { id: 'MB/s', label: 'MB/s', group: 'si', bpsFactor: 8 * 1e6 },
  { id: 'GB/s', label: 'GB/s', group: 'si', bpsFactor: 8 * 1e9 },
  { id: 'KiB/s', label: 'KiB/s', group: 'iec', bpsFactor: 8 * 1024 },
  { id: 'MiB/s', label: 'MiB/s', group: 'iec', bpsFactor: 8 * 1024 ** 2 },
  { id: 'GiB/s', label: 'GiB/s', group: 'iec', bpsFactor: 8 * 1024 ** 3 },
];

export const COMMON_LINK_SPEEDS: Array<{ label: string; mbps: number }> = [
  { label: '10 Mbps', mbps: 10 },
  { label: '50 Mbps', mbps: 50 },
  { label: '100 Mbps (百兆)', mbps: 100 },
  { label: '300 Mbps', mbps: 300 },
  { label: '500 Mbps', mbps: 500 },
  { label: '1 Gbps (千兆)', mbps: 1000 },
  { label: '2.5 Gbps', mbps: 2500 },
  { label: '10 Gbps (万兆)', mbps: 10000 },
  { label: 'USB 3.0 (5 Gbps)', mbps: 5000 },
];

export function convertBandwidthToBps(value: number, unit: BandwidthUnitId): number {
  const def = BANDWIDTH_UNITS.find(u => u.id === unit);
  if (!def || !Number.isFinite(value) || value < 0) return 0;
  return value * def.bpsFactor;
}

export function convertBpsToAllBandwidth(bps: number): Record<BandwidthUnitId, number> {
  const out = {} as Record<BandwidthUnitId, number>;
  const safe = Number.isFinite(bps) && bps >= 0 ? bps : 0;
  for (const u of BANDWIDTH_UNITS) {
    out[u.id] = safe / u.bpsFactor;
  }
  return out;
}

export interface TransferEtaResult {
  seconds: number;
  formattedHms: string;
  effectiveMbps: number;
  effectiveMBs: number;
  effectiveMiBs: number;
}

export function formatDurationCompact(totalSeconds: number, isZh: boolean): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return '-';
  if (totalSeconds === 0) return isZh ? '0 秒' : '0s';
  if (totalSeconds < 0.001) return `${(totalSeconds * 1e6).toFixed(1)} µs`;
  if (totalSeconds < 1) return `${(totalSeconds * 1000).toFixed(1)} ms`;
  if (totalSeconds < 60) return `${totalSeconds.toFixed(2)} ${isZh ? '秒' : 's'}`;

  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = Math.round(totalSeconds % 60);

  const parts: string[] = [];
  if (days > 0) parts.push(`${days}${isZh ? '天' : 'd'}`);
  if (hours > 0) parts.push(`${hours}${isZh ? '小时' : 'h'}`);
  if (mins > 0) parts.push(`${mins}${isZh ? '分' : 'm'}`);
  if (secs > 0 || parts.length === 0) parts.push(`${secs}${isZh ? '秒' : 's'}`);
  return parts.join(' ');
}

export function calculateTransferEta(options: {
  sizeBytes: number;
  bandwidthBps: number;
  efficiencyPercent: number;
  isZh: boolean;
}): TransferEtaResult {
  const eff = Math.max(1, Math.min(100, options.efficiencyPercent)) / 100;
  const effectiveBps = options.bandwidthBps * eff;
  if (effectiveBps <= 0 || options.sizeBytes <= 0) {
    return {
      seconds: 0,
      formattedHms: options.isZh ? '0 秒' : '0s',
      effectiveMbps: effectiveBps / 1e6,
      effectiveMBs: effectiveBps / 8 / 1e6,
      effectiveMiBs: effectiveBps / 8 / (1024 * 1024),
    };
  }
  const totalBits = options.sizeBytes * 8;
  const seconds = totalBits / effectiveBps;
  return {
    seconds,
    formattedHms: formatDurationCompact(seconds, options.isZh),
    effectiveMbps: effectiveBps / 1e6,
    effectiveMBs: effectiveBps / 8 / 1e6,
    effectiveMiBs: effectiveBps / 8 / (1024 * 1024),
  };
}

// ==================== 3. CSS 排版与视口单位 ====================

export type CssUnitId = 'px' | 'rem' | 'em' | 'vw' | 'vh' | 'pt' | 'percent';

export interface CssContext {
  rootFontSize: number;
  parentFontSize: number;
  viewportWidth: number;
  viewportHeight: number;
}

export const VIEWPORT_PRESETS: Array<{ label: string; w: number; h: number }> = [
  { label: 'Mobile (375×812)', w: 375, h: 812 },
  { label: 'Tablet (768×1024)', w: 768, h: 1024 },
  { label: 'Laptop (1280×800)', w: 1280, h: 800 },
  { label: 'Desktop (1440×900)', w: 1440, h: 900 },
  { label: 'Full HD (1920×1080)', w: 1920, h: 1080 },
];

export function convertCssUnitToPx(
  value: number,
  unit: CssUnitId,
  ctx: CssContext
): number {
  if (!Number.isFinite(value)) return 0;
  const root = ctx.rootFontSize > 0 ? ctx.rootFontSize : 16;
  const parent = ctx.parentFontSize > 0 ? ctx.parentFontSize : 16;
  const vw = ctx.viewportWidth > 0 ? ctx.viewportWidth : 1440;
  const vh = ctx.viewportHeight > 0 ? ctx.viewportHeight : 900;

  switch (unit) {
    case 'px':
      return value;
    case 'rem':
      return value * root;
    case 'em':
      return value * parent;
    case 'vw':
      return (value * vw) / 100;
    case 'vh':
      return (value * vh) / 100;
    case 'pt':
      return (value * 96) / 72;
    case 'percent':
      return (value * parent) / 100;
  }
}

export function convertPxToAllCssUnits(
  px: number,
  ctx: CssContext
): Record<CssUnitId, number> {
  const root = ctx.rootFontSize > 0 ? ctx.rootFontSize : 16;
  const parent = ctx.parentFontSize > 0 ? ctx.parentFontSize : 16;
  const vw = ctx.viewportWidth > 0 ? ctx.viewportWidth : 1440;
  const vh = ctx.viewportHeight > 0 ? ctx.viewportHeight : 900;

  return {
    px,
    rem: px / root,
    em: px / parent,
    vw: (px / vw) * 100,
    vh: (px / vh) * 100,
    pt: (px * 72) / 96,
    percent: (px / parent) * 100,
  };
}

export function getTailwindSpacingHint(px: number): string {
  if (!Number.isFinite(px) || px < 0) return '';
  if (px === 0) return '0';
  if (px === 1) return 'px (1px)';
  const scale = px / 4;
  if (Math.abs(scale - Math.round(scale * 2) / 2) < 0.01) {
    return `${Math.round(scale * 2) / 2} (${px}px)`;
  }
  return `[${Number(px.toFixed(2))}px]`;
}

export function batchConvertCssPxToRem(
  cssText: string,
  rootFontSize: number
): string {
  const root = rootFontSize > 0 ? rootFontSize : 16;
  return cssText.replace(/(-?\d*\.?\d+)px\b/gi, (_match, numStr: string) => {
    const px = Number(numStr);
    if (!Number.isFinite(px) || px === 0) return '0';
    if (Math.abs(px) <= 1) return `${px}px`; // keep hairline 1px borders
    const rem = Number((px / root).toFixed(4));
    return `${rem}rem`;
  });
}

// ==================== 4. 时间精度、帧率与频率换算 ====================

export type TimeUnitId = 'ns' | 'us' | 'ms' | 's' | 'min' | 'h' | 'd' | 'wk';

export interface TimeUnitDef {
  id: TimeUnitId;
  label: string;
  nsFactor: number;
}

export const TIME_UNITS: TimeUnitDef[] = [
  { id: 'ns', label: 'Nanoseconds (ns)', nsFactor: 1 },
  { id: 'us', label: 'Microseconds (µs)', nsFactor: 1e3 },
  { id: 'ms', label: 'Milliseconds (ms)', nsFactor: 1e6 },
  { id: 's', label: 'Seconds (s)', nsFactor: 1e9 },
  { id: 'min', label: 'Minutes (min)', nsFactor: 60 * 1e9 },
  { id: 'h', label: 'Hours (h)', nsFactor: 3600 * 1e9 },
  { id: 'd', label: 'Days (d)', nsFactor: 86400 * 1e9 },
  { id: 'wk', label: 'Weeks (wk)', nsFactor: 604800 * 1e9 },
];

export function convertTimeToNs(value: number, unit: TimeUnitId): number {
  const def = TIME_UNITS.find(u => u.id === unit);
  if (!def || !Number.isFinite(value) || value < 0) return 0;
  return value * def.nsFactor;
}

export function convertNsToAllTime(ns: number): Record<TimeUnitId, number> {
  const out = {} as Record<TimeUnitId, number>;
  const safe = Number.isFinite(ns) && ns >= 0 ? ns : 0;
  for (const u of TIME_UNITS) {
    out[u.id] = safe / u.nsFactor;
  }
  return out;
}

export function nsToFrequencyHz(ns: number): number {
  if (!Number.isFinite(ns) || ns <= 0) return 0;
  return 1e9 / ns;
}

export function frequencyHzToNs(hz: number): number {
  if (!Number.isFinite(hz) || hz <= 0) return 0;
  return 1e9 / hz;
}
