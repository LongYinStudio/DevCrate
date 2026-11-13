// ==================== IPv4 类型与核心算法 ====================

export interface Ipv4CidrResult {
  ok: true;
  inputIp: string;
  prefix: number;
  cidr: string;
  networkAddress: string;
  broadcastAddress: string;
  subnetMask: string;
  wildcardMask: string;
  firstUsable: string;
  lastUsable: string;
  totalAddresses: number;
  usableHosts: number;
  ipClass: 'A' | 'B' | 'C' | 'D' | 'E';
  scopeType:
    | 'private'
    | 'public'
    | 'loopback'
    | 'linkLocal'
    | 'cgnat'
    | 'multicast'
    | 'reserved'
    | 'unspecified';
  networkInt: number;
  broadcastInt: number;
  maskInt: number;
  ipInt: number;
  ipBinaryOctets: string[];
  maskBinaryOctets: string[];
  networkBinaryOctets: string[];
  broadcastBinaryOctets: string[];
  hexIp: string;
  ptrRecord: string;
  isPointToPoint31: boolean;
  isSingleHost32: boolean;
}

export interface Ipv4SubnetItem {
  index: number;
  cidr: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsable: string;
  lastUsable: string;
  usableHosts: number;
  totalAddresses: number;
}

export function parseIpv4ToInt(ip: string): number | null {
  const trimmed = ip.trim();
  const parts = trimmed.split('.');
  if (parts.length !== 4) return null;

  let result = 0;
  for (let i = 0; i < 4; i++) {
    const part = parts[i];
    if (!/^\d{1,3}$/.test(part)) return null;
    if (part.length > 1 && part.startsWith('0')) return null; // 拒绝前导零避免八进制歧义
    const num = Number(part);
    if (num < 0 || num > 255) return null;
    result = ((result << 8) | num) >>> 0;
  }
  return result >>> 0;
}

export function intToIpv4(num: number): string {
  const n = num >>> 0;
  return [
    (n >>> 24) & 0xff,
    (n >>> 16) & 0xff,
    (n >>> 8) & 0xff,
    n & 0xff
  ].join('.');
}

export function prefixToMaskInt(prefix: number): number {
  if (prefix <= 0) return 0;
  if (prefix >= 32) return 0xffffffff;
  return (0xffffffff << (32 - prefix)) >>> 0;
}

/**
 * 将连续合法的子网掩码（如 255.255.255.0）转为前缀长度；若非连续 1 则返回 null
 */
export function maskToPrefix(mask: string): number | null {
  const maskInt = parseIpv4ToInt(mask);
  if (maskInt === null) return null;
  if (maskInt === 0) return 0;

  // 检查是否满足高位连续 1、低位连续 0（即取反加 1 必须是 2 的幂）
  const inverted = (~maskInt) >>> 0;
  if (((inverted + 1) & inverted) !== 0) {
    return null;
  }

  let prefix = 0;
  let temp = maskInt;
  while (temp !== 0) {
    prefix += temp & 1;
    temp >>>= 1;
  }
  return prefix;
}

export function intToBinaryOctets(num: number): string[] {
  const n = num >>> 0;
  return [
    ((n >>> 24) & 0xff).toString(2).padStart(8, '0'),
    ((n >>> 16) & 0xff).toString(2).padStart(8, '0'),
    ((n >>> 8) & 0xff).toString(2).padStart(8, '0'),
    (n & 0xff).toString(2).padStart(8, '0')
  ];
}

function getIpv4Class(firstOctet: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (firstOctet < 128) return 'A';
  if (firstOctet < 192) return 'B';
  if (firstOctet < 224) return 'C';
  if (firstOctet < 240) return 'D';
  return 'E';
}

function getIpv4Scope(ipInt: number): Ipv4CidrResult['scopeType'] {
  const o1 = (ipInt >>> 24) & 0xff;
  const o2 = (ipInt >>> 16) & 0xff;

  if (ipInt === 0 || o1 === 0) return 'unspecified';
  if (o1 === 127) return 'loopback';
  if (o1 === 10) return 'private';
  if (o1 === 172 && o2 >= 16 && o2 <= 31) return 'private';
  if (o1 === 192 && o2 === 168) return 'private';
  if (o1 === 100 && o2 >= 64 && o2 <= 127) return 'cgnat';
  if (o1 === 169 && o2 === 254) return 'linkLocal';
  if (o1 >= 224 && o1 <= 239) return 'multicast';
  if (o1 >= 240) return 'reserved';
  return 'public';
}

/**
 * 解析 CIDR 字符串（如 192.168.1.10/24）或单独指定 IP 与前缀
 */
export function calculateIpv4Cidr(input: string): Ipv4CidrResult | { ok: false } {
  const trimmed = input.trim();
  const slashIdx = trimmed.indexOf('/');
  if (slashIdx === -1) return { ok: false };

  const ipStr = trimmed.slice(0, slashIdx).trim();
  const prefixStr = trimmed.slice(slashIdx + 1).trim();

  if (!/^\d{1,2}$/.test(prefixStr)) return { ok: false };
  const prefix = Number(prefixStr);
  if (prefix < 0 || prefix > 32) return { ok: false };

  const ipInt = parseIpv4ToInt(ipStr);
  if (ipInt === null) return { ok: false };

  const maskInt = prefixToMaskInt(prefix);
  const wildcardInt = (~maskInt) >>> 0;
  const networkInt = (ipInt & maskInt) >>> 0;
  const broadcastInt = (networkInt | wildcardInt) >>> 0;

  const totalAddresses = Math.pow(2, 32 - prefix);
  let usableHosts = 0;
  let firstUsableInt = networkInt;
  let lastUsableInt = broadcastInt;

  if (prefix === 32) {
    usableHosts = 1;
    firstUsableInt = networkInt;
    lastUsableInt = networkInt;
  } else if (prefix === 31) {
    // RFC 3021 点对点链路
    usableHosts = 2;
    firstUsableInt = networkInt;
    lastUsableInt = broadcastInt;
  } else {
    usableHosts = Math.max(0, totalAddresses - 2);
    firstUsableInt = (networkInt + 1) >>> 0;
    lastUsableInt = (broadcastInt - 1) >>> 0;
  }

  const networkAddress = intToIpv4(networkInt);
  const octets = networkAddress.split('.');

  return {
    ok: true,
    inputIp: intToIpv4(ipInt),
    prefix,
    cidr: `${networkAddress}/${prefix}`,
    networkAddress,
    broadcastAddress: intToIpv4(broadcastInt),
    subnetMask: intToIpv4(maskInt),
    wildcardMask: intToIpv4(wildcardInt),
    firstUsable: intToIpv4(firstUsableInt),
    lastUsable: intToIpv4(lastUsableInt),
    totalAddresses,
    usableHosts,
    ipClass: getIpv4Class((ipInt >>> 24) & 0xff),
    scopeType: getIpv4Scope(networkInt),
    networkInt,
    broadcastInt,
    maskInt,
    ipInt,
    ipBinaryOctets: intToBinaryOctets(ipInt),
    maskBinaryOctets: intToBinaryOctets(maskInt),
    networkBinaryOctets: intToBinaryOctets(networkInt),
    broadcastBinaryOctets: intToBinaryOctets(broadcastInt),
    hexIp: '0x' + ipInt.toString(16).toUpperCase().padStart(8, '0'),
    ptrRecord: `${octets[3]}.${octets[2]}.${octets[1]}.${octets[0]}.in-addr.arpa`,
    isPointToPoint31: prefix === 31,
    isSingleHost32: prefix === 32
  };
}

/**
 * 将某个 IPv4 CIDR 按目标新前缀切分为子网列表（限制最多生成 maxCount 条保证界面流畅）
 */
export function splitIpv4Subnets(
  baseNetworkInt: number,
  basePrefix: number,
  targetPrefix: number,
  maxCount = 256
): { items: Ipv4SubnetItem[]; totalCount: number; truncated: boolean } {
  if (targetPrefix <= basePrefix || targetPrefix > 32) {
    return { items: [], totalCount: 0, truncated: false };
  }

  const count = Math.pow(2, targetPrefix - basePrefix);
  const blockSize = Math.pow(2, 32 - targetPrefix);
  const limit = Math.min(count, maxCount);
  const items: Ipv4SubnetItem[] = [];

  for (let i = 0; i < limit; i++) {
    const netInt = (baseNetworkInt + i * blockSize) >>> 0;
    const bcastInt = (netInt + blockSize - 1) >>> 0;
    const netStr = intToIpv4(netInt);

    let firstInt = netInt;
    let lastInt = bcastInt;
    let usable = blockSize;

    if (targetPrefix === 32) {
      usable = 1;
    } else if (targetPrefix === 31) {
      usable = 2;
    } else {
      usable = Math.max(0, blockSize - 2);
      firstInt = (netInt + 1) >>> 0;
      lastInt = (bcastInt - 1) >>> 0;
    }

    items.push({
      index: i + 1,
      cidr: `${netStr}/${targetPrefix}`,
      networkAddress: netStr,
      broadcastAddress: intToIpv4(bcastInt),
      firstUsable: intToIpv4(firstInt),
      lastUsable: intToIpv4(lastInt),
      usableHosts: usable,
      totalAddresses: blockSize
    });
  }

  return {
    items,
    totalCount: count,
    truncated: count > maxCount
  };
}

// ==================== IPv4 范围、归属与重叠工具 ====================

export function checkIpInCidr(ipStr: string, cidrStr: string): boolean | null {
  const ipInt = parseIpv4ToInt(ipStr);
  const cidr = calculateIpv4Cidr(cidrStr);
  if (ipInt === null || !cidr.ok) return null;
  return ipInt >= cidr.networkInt && ipInt <= cidr.broadcastInt;
}

export type OverlapRelation = 'disjoint' | 'identical' | 'aContainsB' | 'bContainsA' | 'overlap';

export function checkCidrOverlap(
  cidrA: string,
  cidrB: string
): { ok: true; relation: OverlapRelation; netA: Ipv4CidrResult; netB: Ipv4CidrResult } | { ok: false } {
  const a = calculateIpv4Cidr(cidrA);
  const b = calculateIpv4Cidr(cidrB);
  if (!a.ok || !b.ok) return { ok: false };

  if (a.networkInt === b.networkInt && a.broadcastInt === b.broadcastInt) {
    return { ok: true, relation: 'identical', netA: a, netB: b };
  }
  if (a.networkInt <= b.networkInt && a.broadcastInt >= b.broadcastInt) {
    return { ok: true, relation: 'aContainsB', netA: a, netB: b };
  }
  if (b.networkInt <= a.networkInt && b.broadcastInt >= a.broadcastInt) {
    return { ok: true, relation: 'bContainsA', netA: a, netB: b };
  }
  if (a.broadcastInt < b.networkInt || b.broadcastInt < a.networkInt) {
    return { ok: true, relation: 'disjoint', netA: a, netB: b };
  }
  return { ok: true, relation: 'overlap', netA: a, netB: b };
}

/**
 * 将任意 IPv4 起止范围聚合成最精简的 CIDR 块列表
 */
export function ipRangeToCidrs(startIp: string, endIp: string): string[] | null {
  const s = parseIpv4ToInt(startIp);
  const e = parseIpv4ToInt(endIp);
  if (s === null || e === null) return null;

  let start = Math.min(s, e) >>> 0;
  const end = Math.max(s, e) >>> 0;
  const result: string[] = [];

  while (start <= end) {
    // 1. 计算当前 start 地址对齐的最大块幂次（trailing zeros）
    let maxAlignBits = 32;
    if (start !== 0) {
      let tz = 0;
      let tmp = start;
      while ((tmp & 1) === 0 && tz < 32) {
        tz++;
        tmp >>>= 1;
      }
      maxAlignBits = tz;
    }

    // 2. 计算不超过剩余范围 (end - start + 1) 的最大块幂次
    const remaining = end - start + 1;
    const maxSizeBits = Math.floor(Math.log2(remaining));

    const bits = Math.min(maxAlignBits, maxSizeBits);
    const prefix = 32 - bits;
    result.push(`${intToIpv4(start)}/${prefix}`);

    const step = Math.pow(2, bits);
    if (start + step > 0xffffffff) break;
    start = (start + step) >>> 0;
  }

  return result;
}

// ==================== IPv6 类型与 BigInt 128-bit 核心算法 ====================

export interface Ipv6CidrResult {
  ok: true;
  prefix: number;
  compressedCidr: string;
  expandedIp: string;
  compressedIp: string;
  networkExpanded: string;
  networkCompressed: string;
  endExpanded: string;
  endCompressed: string;
  maskExpanded: string;
  totalAddressesStr: string;
  scopeType:
    | 'global'
    | 'uniqueLocal'
    | 'linkLocal'
    | 'loopback'
    | 'multicast'
    | 'documentation'
    | 'unspecified';
  networkBigInt: bigint;
  endBigInt: bigint;
}

const ALL_ONES_128 = (1n << 128n) - 1n;

export function parseIpv6ToBigInt(ip: string): bigint | null {
  let s = ip.trim();
  // 剔除 zone index（如 fe80::1%eth0）
  const zoneIdx = s.indexOf('%');
  if (zoneIdx !== -1) s = s.slice(0, zoneIdx);
  if (!s) return null;

  const doubleColonParts = s.split('::');
  if (doubleColonParts.length > 2) return null;

  let groups: string[] = [];

  if (doubleColonParts.length === 2) {
    const left = doubleColonParts[0] ? doubleColonParts[0].split(':') : [];
    const right = doubleColonParts[1] ? doubleColonParts[1].split(':') : [];
    const missing = 8 - (left.length + right.length);
    if (missing < 1) return null;
    groups = [...left, ...Array(missing).fill('0'), ...right];
  } else {
    groups = s.split(':');
    if (groups.length !== 8) return null;
  }

  if (groups.length !== 8) return null;

  let result = 0n;
  for (const g of groups) {
    if (!/^[0-9a-fA-F]{1,4}$/.test(g)) return null;
    result = (result << 16n) | BigInt(parseInt(g, 16));
  }
  return result;
}

export function bigIntToExpandedIpv6(val: bigint): string {
  const groups: string[] = [];
  for (let i = 7; i >= 0; i--) {
    const shift = BigInt(i * 16);
    const segment = Number((val >> shift) & 0xffffn);
    groups.push(segment.toString(16).padStart(4, '0'));
  }
  return groups.join(':');
}

/**
 * 依据 RFC 5952 格式化最短 IPv6 地址（压缩最长连续零段）
 */
export function bigIntToCompressedIpv6(val: bigint): string {
  const segments: number[] = [];
  for (let i = 7; i >= 0; i--) {
    segments.push(Number((val >> BigInt(i * 16)) & 0xffffn));
  }

  let bestStart = -1;
  let bestLen = 0;
  let curStart = -1;
  let curLen = 0;

  for (let i = 0; i < 8; i++) {
    if (segments[i] === 0) {
      if (curStart === -1) {
        curStart = i;
        curLen = 1;
      } else {
        curLen++;
      }
      if (curLen > bestLen) {
        bestStart = curStart;
        bestLen = curLen;
      }
    } else {
      curStart = -1;
      curLen = 0;
    }
  }

  if (bestLen < 2) {
    return segments.map(s => s.toString(16)).join(':');
  }

  const left = segments.slice(0, bestStart).map(s => s.toString(16)).join(':');
  const right = segments.slice(bestStart + bestLen).map(s => s.toString(16)).join(':');
  return `${left}::${right}`;
}

function getIpv6Scope(net: bigint): Ipv6CidrResult['scopeType'] {
  if (net === 0n) return 'unspecified';
  if (net === 1n) return 'loopback';
  const top16 = Number((net >> 112n) & 0xffffn);
  const top32 = Number((net >> 96n) & 0xffffffffn);
  if (top32 === 0x20010db8) return 'documentation';
  if ((top16 & 0xfe00) === 0xfc00) return 'uniqueLocal';
  if ((top16 & 0xffc0) === 0xfe80) return 'linkLocal';
  if ((top16 & 0xff00) === 0xff00) return 'multicast';
  return 'global';
}

export function calculateIpv6Cidr(input: string): Ipv6CidrResult | { ok: false } {
  const trimmed = input.trim();
  const slashIdx = trimmed.indexOf('/');
  if (slashIdx === -1) return { ok: false };

  const ipStr = trimmed.slice(0, slashIdx).trim();
  const prefixStr = trimmed.slice(slashIdx + 1).trim();

  if (!/^\d{1,3}$/.test(prefixStr)) return { ok: false };
  const prefix = Number(prefixStr);
  if (prefix < 0 || prefix > 128) return { ok: false };

  const ipBig = parseIpv6ToBigInt(ipStr);
  if (ipBig === null) return { ok: false };

  const hostBits = BigInt(128 - prefix);
  const maskBig = prefix === 0 ? 0n : (ALL_ONES_128 << hostBits) & ALL_ONES_128;
  const wildcardBig = (~maskBig) & ALL_ONES_128;

  const networkBig = ipBig & maskBig;
  const endBig = networkBig | wildcardBig;

  const totalBig = 1n << hostBits;
  const networkCompressed = bigIntToCompressedIpv6(networkBig);

  return {
    ok: true,
    prefix,
    compressedCidr: `${networkCompressed}/${prefix}`,
    expandedIp: bigIntToExpandedIpv6(ipBig),
    compressedIp: bigIntToCompressedIpv6(ipBig),
    networkExpanded: bigIntToExpandedIpv6(networkBig),
    networkCompressed,
    endExpanded: bigIntToExpandedIpv6(endBig),
    endCompressed: bigIntToCompressedIpv6(endBig),
    maskExpanded: bigIntToExpandedIpv6(maskBig),
    totalAddressesStr: totalBig.toLocaleString('en-US'),
    scopeType: getIpv6Scope(networkBig),
    networkBigInt: networkBig,
    endBigInt: endBig
  };
}

export function splitIpv6Subnets(
  baseNetworkBig: bigint,
  basePrefix: number,
  targetPrefix: number,
  maxCount = 64
): { items: { index: number; cidr: string; start: string; end: string }[]; totalStr: string; truncated: boolean } {
  if (targetPrefix <= basePrefix || targetPrefix > 128) {
    return { items: [], totalStr: '0', truncated: false };
  }

  const diff = BigInt(targetPrefix - basePrefix);
  const totalCountBig = 1n << diff;
  const blockSizeBig = 1n << BigInt(128 - targetPrefix);
  const limit = totalCountBig < BigInt(maxCount) ? Number(totalCountBig) : maxCount;
  const items: { index: number; cidr: string; start: string; end: string }[] = [];

  for (let i = 0; i < limit; i++) {
    const net = baseNetworkBig + BigInt(i) * blockSizeBig;
    const end = net + blockSizeBig - 1n;
    const startCompressed = bigIntToCompressedIpv6(net);
    items.push({
      index: i + 1,
      cidr: `${startCompressed}/${targetPrefix}`,
      start: startCompressed,
      end: bigIntToCompressedIpv6(end)
    });
  }

  return {
    items,
    totalStr: totalCountBig.toLocaleString('en-US'),
    truncated: totalCountBig > BigInt(maxCount)
  };
}
