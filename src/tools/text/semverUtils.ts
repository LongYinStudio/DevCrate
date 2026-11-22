export type SemVerOperator = '' | '=' | '>' | '>=' | '<' | '<=';

export interface ParsedSemVer {
  raw: string;
  major: number;
  minor: number;
  patch: number;
  prerelease: Array<string | number>;
  build: string[];
  canonical: string;
  isPrerelease: boolean;
}

export interface SemVerComparator {
  operator: Exclude<SemVerOperator, ''>;
  version: ParsedSemVer;
  raw: string;
  isAny?: boolean;
}

export interface ParsedRange {
  raw: string;
  orSets: SemVerComparator[][];
  normalized: string;
  errors: string[];
}

export interface RangeCheckDetail {
  satisfied: boolean;
  reasonZh: string;
  reasonEn: string;
}

export type SemVerBumpType =
  | 'major'
  | 'minor'
  | 'patch'
  | 'premajor'
  | 'preminor'
  | 'prepatch'
  | 'prerelease';

export type VersionDiffKind =
  | 'identical'
  | 'build-only'
  | 'major'
  | 'minor'
  | 'patch'
  | 'prerelease'
  | 'downgrade';

export interface SemVerPreset {
  id: string;
  nameZh: string;
  nameEn: string;
  descZh: string;
  descEn: string;
  range: string;
  versions: string[];
}

const STRICT_NUMERIC = /^(0|[1-9]\d*)$/;
const PRERELEASE_IDENT = /^[0-9A-Za-z-]+$/;
const STRICT_SEMVER_RE =
  /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-((?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*)(?:\.(?:0|[1-9]\d*|\d*[a-zA-Z-][0-9a-zA-Z-]*))*))?(?:\+([0-9a-zA-Z-]+(?:\.[0-9a-zA-Z-]+)*))?$/;

const LOOSE_SEMVER_RE =
  /^[vV=\s]*(\d+)(?:\.(\d+))?(?:\.(\d+))?(?:-([0-9a-zA-Z.-]+))?(?:\+([0-9a-zA-Z.-]+))?$/;

function parsePrereleaseIdentifiers(raw: string): Array<string | number> {
  if (!raw) return [];
  return raw
    .split('.')
    .filter(Boolean)
    .map(part => {
      if (/^\d+$/.test(part)) return Number(part);
      return part;
    });
}

function buildCanonical(
  major: number,
  minor: number,
  patch: number,
  prerelease: Array<string | number>
): string {
  const base = `${major}.${minor}.${patch}`;
  return prerelease.length > 0 ? `${base}-${prerelease.join('.')}` : base;
}

export function parseSemVer(rawInput: string, loose = true): ParsedSemVer | null {
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  if (!loose) {
    const m = trimmed.match(STRICT_SEMVER_RE);
    if (!m) return null;
    const major = Number(m[1]);
    const minor = Number(m[2]);
    const patch = Number(m[3]);
    const prerelease = m[4] ? parsePrereleaseIdentifiers(m[4]) : [];
    const build = m[5] ? m[5].split('.').filter(Boolean) : [];
    return {
      raw: rawInput,
      major,
      minor,
      patch,
      prerelease,
      build,
      canonical: buildCanonical(major, minor, patch, prerelease),
      isPrerelease: prerelease.length > 0,
    };
  }

  const m = trimmed.match(LOOSE_SEMVER_RE);
  if (!m) return null;
  const major = Number(m[1]);
  const minor = m[2] !== undefined ? Number(m[2]) : 0;
  const patch = m[3] !== undefined ? Number(m[3]) : 0;
  if (!Number.isSafeInteger(major) || !Number.isSafeInteger(minor) || !Number.isSafeInteger(patch)) {
    return null;
  }

  const prerelease: Array<string | number> = [];
  if (m[4]) {
    for (const part of m[4].split('.')) {
      if (!part || !PRERELEASE_IDENT.test(part)) return null;
      if (/^\d+$/.test(part)) {
        if (part.length > 1 && part.startsWith('0') && !STRICT_NUMERIC.test(part)) {
          // Keep loose numeric conversion safely
          prerelease.push(Number(part));
        } else {
          prerelease.push(Number(part));
        }
      } else {
        prerelease.push(part);
      }
    }
  }
  const build = m[5] ? m[5].split('.').filter(Boolean) : [];

  return {
    raw: rawInput,
    major,
    minor,
    patch,
    prerelease,
    build,
    canonical: buildCanonical(major, minor, patch, prerelease),
    isPrerelease: prerelease.length > 0,
  };
}

function compareIdentifiers(a: string | number, b: string | number): number {
  const aNum = typeof a === 'number';
  const bNum = typeof b === 'number';
  if (a === b) return 0;
  if (aNum && !bNum) return -1;
  if (!aNum && bNum) return 1;
  if (aNum && bNum) return a < b ? -1 : 1;
  return String(a) < String(b) ? -1 : 1;
}

/**
 * 依据 SemVer 2.0.0 规范比较两个版本优先级（忽略 +build 元数据）
 */
export function compareSemVer(a: ParsedSemVer, b: ParsedSemVer): -1 | 0 | 1 {
  if (a.major !== b.major) return a.major < b.major ? -1 : 1;
  if (a.minor !== b.minor) return a.minor < b.minor ? -1 : 1;
  if (a.patch !== b.patch) return a.patch < b.patch ? -1 : 1;

  const aLen = a.prerelease.length;
  const bLen = b.prerelease.length;
  if (aLen === 0 && bLen === 0) return 0;
  if (aLen === 0 && bLen > 0) return 1;
  if (aLen > 0 && bLen === 0) return -1;

  const minLen = Math.min(aLen, bLen);
  for (let i = 0; i < minLen; i++) {
    const cmp = compareIdentifiers(a.prerelease[i], b.prerelease[i]);
    if (cmp !== 0) return cmp < 0 ? -1 : 1;
  }
  if (aLen === bLen) return 0;
  return aLen < bLen ? -1 : 1;
}

// ==================== 范围解析器 (npm / Cargo / SemVer Range) ====================

function makeVersion(
  major: number,
  minor: number,
  patch: number,
  prerelease: Array<string | number> = []
): ParsedSemVer {
  return {
    raw: buildCanonical(major, minor, patch, prerelease),
    major,
    minor,
    patch,
    prerelease,
    build: [],
    canonical: buildCanonical(major, minor, patch, prerelease),
    isPrerelease: prerelease.length > 0,
  };
}

function makeComp(
  operator: Exclude<SemVerOperator, ''>,
  version: ParsedSemVer,
  isAny = false
): SemVerComparator {
  return {
    operator,
    version,
    raw: isAny ? '*' : `${operator}${version.canonical}`,
    isAny,
  };
}

interface PartialVersion {
  major: number | null;
  minor: number | null;
  patch: number | null;
  prerelease: Array<string | number>;
}

function isWildcardToken(tok: string | undefined): boolean {
  if (!tok) return true;
  const lower = tok.toLowerCase();
  return lower === 'x' || lower === '*' || lower === '';
}

function parsePartialVersion(raw: string): PartialVersion | null {
  let clean = raw.trim().replace(/^[vV=]+/, '');
  if (!clean) return null;
  if (clean === '*' || clean.toLowerCase() === 'x' || clean.toLowerCase() === 'latest') {
    return { major: null, minor: null, patch: null, prerelease: [] };
  }

  // Strip build metadata
  const plusIdx = clean.indexOf('+');
  if (plusIdx >= 0) clean = clean.slice(0, plusIdx);

  let preRaw = '';
  const dashIdx = clean.indexOf('-');
  if (dashIdx >= 0) {
    preRaw = clean.slice(dashIdx + 1);
    clean = clean.slice(0, dashIdx);
  }

  const parts = clean.split('.');
  if (parts.length > 3) return null;

  const parsePart = (p: string | undefined): number | null | undefined => {
    if (isWildcardToken(p)) return null;
    if (!/^\d+$/.test(p!)) return undefined;
    return Number(p);
  };

  const major = parsePart(parts[0]);
  if (major === undefined) return null;
  const minor = parts.length > 1 ? parsePart(parts[1]) : null;
  if (minor === undefined) return null;
  const patch = parts.length > 2 ? parsePart(parts[2]) : null;
  if (patch === undefined) return null;

  return {
    major,
    minor,
    patch,
    prerelease: preRaw ? parsePrereleaseIdentifiers(preRaw) : [],
  };
}

function expandCaret(pv: PartialVersion): SemVerComparator[] {
  if (pv.major === null) {
    return [makeComp('>=', makeVersion(0, 0, 0), true)];
  }
  const M = pv.major;
  const m = pv.minor ?? 0;
  const p = pv.patch ?? 0;
  const lower = makeComp('>=', makeVersion(M, m, p, pv.prerelease));

  if (M > 0) {
    return [lower, makeComp('<', makeVersion(M + 1, 0, 0, [0]))];
  }
  if (pv.minor === null) {
    return [lower, makeComp('<', makeVersion(1, 0, 0, [0]))];
  }
  if (m > 0) {
    return [lower, makeComp('<', makeVersion(0, m + 1, 0, [0]))];
  }
  if (pv.patch === null) {
    return [lower, makeComp('<', makeVersion(0, 1, 0, [0]))];
  }
  return [lower, makeComp('<', makeVersion(0, 0, p + 1, [0]))];
}

function expandTilde(pv: PartialVersion): SemVerComparator[] {
  if (pv.major === null) {
    return [makeComp('>=', makeVersion(0, 0, 0), true)];
  }
  const M = pv.major;
  const m = pv.minor ?? 0;
  const p = pv.patch ?? 0;
  const lower = makeComp('>=', makeVersion(M, m, p, pv.prerelease));

  if (pv.minor === null) {
    return [lower, makeComp('<', makeVersion(M + 1, 0, 0, [0]))];
  }
  return [lower, makeComp('<', makeVersion(M, m + 1, 0, [0]))];
}

function expandXRange(op: SemVerOperator, pv: PartialVersion): SemVerComparator[] {
  if (pv.major === null) {
    if (op === '<' || op === '>') {
      return [makeComp('<', makeVersion(0, 0, 0, [0]))];
    }
    return [makeComp('>=', makeVersion(0, 0, 0), true)];
  }

  const M = pv.major;
  const isPartialMinor = pv.minor === null;
  const isPartialPatch = pv.patch === null;
  const m = pv.minor ?? 0;
  const p = pv.patch ?? 0;

  if (!isPartialMinor && !isPartialPatch) {
    return [makeComp(op || '=', makeVersion(M, m, p, pv.prerelease))];
  }

  // Partial x-range handling
  if (op === '' || op === '=') {
    const lower = makeComp('>=', makeVersion(M, m, p));
    const upper = isPartialMinor
      ? makeComp('<', makeVersion(M + 1, 0, 0, [0]))
      : makeComp('<', makeVersion(M, m + 1, 0, [0]));
    return [lower, upper];
  }
  if (op === '>') {
    const next = isPartialMinor
      ? makeVersion(M + 1, 0, 0)
      : makeVersion(M, m + 1, 0);
    return [makeComp('>=', next)];
  }
  if (op === '>=') {
    return [makeComp('>=', makeVersion(M, m, p))];
  }
  if (op === '<') {
    return [makeComp('<', makeVersion(M, m, p, [0]))];
  }
  // op === '<='
  const upper = isPartialMinor
    ? makeComp('<', makeVersion(M + 1, 0, 0, [0]))
    : makeComp('<', makeVersion(M, m + 1, 0, [0]));
  return [upper];
}

function expandHyphen(fromRaw: string, toRaw: string): SemVerComparator[] | null {
  const fromPv = parsePartialVersion(fromRaw);
  const toPv = parsePartialVersion(toRaw);
  if (!fromPv || !toPv) return null;

  const comps: SemVerComparator[] = [];
  if (fromPv.major !== null) {
    comps.push(
      makeComp(
        '>=',
        makeVersion(fromPv.major, fromPv.minor ?? 0, fromPv.patch ?? 0, fromPv.prerelease)
      )
    );
  }
  if (toPv.major !== null) {
    if (toPv.minor === null) {
      comps.push(makeComp('<', makeVersion(toPv.major + 1, 0, 0, [0])));
    } else if (toPv.patch === null) {
      comps.push(makeComp('<', makeVersion(toPv.major, toPv.minor + 1, 0, [0])));
    } else {
      comps.push(makeComp('<=', makeVersion(toPv.major, toPv.minor, toPv.patch, toPv.prerelease)));
    }
  }
  return comps.length > 0 ? comps : [makeComp('>=', makeVersion(0, 0, 0), true)];
}

function parseSingleComparatorToken(token: string): SemVerComparator[] | null {
  const trimmed = token.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('^')) {
    const pv = parsePartialVersion(trimmed.slice(1));
    return pv ? expandCaret(pv) : null;
  }
  if (trimmed.startsWith('~')) {
    const body = trimmed.startsWith('~>') ? trimmed.slice(2) : trimmed.slice(1);
    const pv = parsePartialVersion(body);
    return pv ? expandTilde(pv) : null;
  }

  const opMatch = trimmed.match(/^(>=|<=|>|<|=)?\s*(.+)$/);
  if (!opMatch) return null;
  const op = (opMatch[1] ?? '') as SemVerOperator;
  const pv = parsePartialVersion(opMatch[2]);
  if (!pv) return null;

  return expandXRange(op, pv);
}

/**
 * 解析完整的 SemVer 范围表达式（支持 ||、空格与逗号 AND、- 连字符、^、~、x/*、比较符）
 */
export function parseSemVerRange(rangeInput: string): ParsedRange {
  const raw = rangeInput.trim();
  if (!raw) {
    return {
      raw,
      orSets: [[makeComp('>=', makeVersion(0, 0, 0), true)]],
      normalized: '*',
      errors: [],
    };
  }

  const orParts = raw.split(/\s*\|\|\s*/);
  const orSets: SemVerComparator[][] = [];
  const errors: string[] = [];

  for (const part of orParts) {
    const trimmedPart = part.trim();
    if (!trimmedPart) {
      errors.push('Empty clause around "||"');
      continue;
    }

    // Normalize space after operators like ">= 1.2.3" -> ">=1.2.3", and comma separators (Cargo)
    const normalizedSpaces = trimmedPart
      .replace(/,/g, ' ')
      .replace(/(>=|<=|>|<|=|\^|~>|~)\s+/g, '$1');

    // Check hyphen range: "A - B"
    const hyphenMatch = normalizedSpaces.match(/^([^\s]+)\s+-\s+([^\s]+)$/);
    if (hyphenMatch) {
      const comps = expandHyphen(hyphenMatch[1], hyphenMatch[2]);
      if (!comps) {
        errors.push(`Invalid hyphen range: "${trimmedPart}"`);
      } else {
        orSets.push(comps);
      }
      continue;
    }

    const tokens = normalizedSpaces.split(/\s+/).filter(Boolean);
    const andComps: SemVerComparator[] = [];
    for (const tok of tokens) {
      const expanded = parseSingleComparatorToken(tok);
      if (!expanded) {
        errors.push(`Invalid comparator: "${tok}"`);
      } else {
        andComps.push(...expanded);
      }
    }
    if (andComps.length > 0) {
      orSets.push(andComps);
    }
  }

  const normalized =
    orSets.length > 0
      ? orSets.map(set => set.map(c => c.raw).join(' ')).join(' || ')
      : '';

  return { raw, orSets, normalized, errors };
}

function testComparator(version: ParsedSemVer, comp: SemVerComparator): boolean {
  if (comp.isAny) return true;
  const cmp = compareSemVer(version, comp.version);
  switch (comp.operator) {
    case '=':
      return cmp === 0;
    case '>':
      return cmp === 1;
    case '>=':
      return cmp >= 0;
    case '<':
      return cmp === -1;
    case '<=':
      return cmp <= 0;
  }
}

/**
 * 评估单个版本是否满足范围表达式，并给出可解释的命中/排除原因
 */
export function evaluateRangeMatch(
  version: ParsedSemVer,
  range: ParsedRange,
  includePrerelease = false
): RangeCheckDetail {
  if (range.errors.length > 0 || range.orSets.length === 0) {
    return {
      satisfied: false,
      reasonZh: '范围表达式存在语法错误',
      reasonEn: 'Range expression has syntax errors',
    };
  }

  let rejectedByPrereleaseRule = false;
  const failedBounds: string[] = [];

  for (const andSet of range.orSets) {
    let allPassed = true;
    for (const comp of andSet) {
      if (!testComparator(version, comp)) {
        allPassed = false;
        failedBounds.push(comp.raw);
        break;
      }
    }
    if (!allPassed) continue;

    // SemVer/npm prerelease tuple rule
    if (version.isPrerelease && !includePrerelease) {
      const hasMatchingTuplePrerelease = andSet.some(
        c =>
          c.version.isPrerelease &&
          c.version.major === version.major &&
          c.version.minor === version.minor &&
          c.version.patch === version.patch
      );
      if (!hasMatchingTuplePrerelease) {
        rejectedByPrereleaseRule = true;
        continue;
      }
    }

    return {
      satisfied: true,
      reasonZh: `匹配条件：${andSet.map(c => c.raw).join(' ')}`,
      reasonEn: `Matched: ${andSet.map(c => c.raw).join(' ')}`,
    };
  }

  if (rejectedByPrereleaseRule) {
    return {
      satisfied: false,
      reasonZh: '预发布版本未显式命中同 M.m.p 预发布约束（可开启「包含预发布」测试）',
      reasonEn: 'Prerelease excluded by M.m.p tuple rule (enable "Include Prerelease" to match)',
    };
  }

  const firstFailure = failedBounds[0] || range.normalized;
  return {
    satisfied: false,
    reasonZh: `不满足约束 ${firstFailure}`,
    reasonEn: `Fails constraint ${firstFailure}`,
  };
}

// ==================== 版本递增 (Bump) 与对比 ====================

export function bumpSemVer(
  base: ParsedSemVer,
  type: SemVerBumpType,
  preId = 'alpha'
): string {
  const id = preId.trim() || 'alpha';
  switch (type) {
    case 'major': {
      const nextMajor =
        base.minor === 0 && base.patch === 0 && base.isPrerelease
          ? base.major
          : base.major + 1;
      return `${nextMajor}.0.0`;
    }
    case 'minor': {
      const nextMinor =
        base.patch === 0 && base.isPrerelease ? base.minor : base.minor + 1;
      return `${base.major}.${nextMinor}.0`;
    }
    case 'patch': {
      const nextPatch = base.isPrerelease ? base.patch : base.patch + 1;
      return `${base.major}.${base.minor}.${nextPatch}`;
    }
    case 'premajor':
      return `${base.major + 1}.0.0-${id}.0`;
    case 'preminor':
      return `${base.major}.${base.minor + 1}.0-${id}.0`;
    case 'prepatch':
      return `${base.major}.${base.minor}.${base.patch + 1}-${id}.0`;
    case 'prerelease': {
      if (!base.isPrerelease) {
        return `${base.major}.${base.minor}.${base.patch + 1}-${id}.0`;
      }
      const next = [...base.prerelease];
      // If preId differs from existing first non-numeric identifier, reset
      if (preId.trim() && next[0] !== id) {
        return `${base.major}.${base.minor}.${base.patch}-${id}.0`;
      }
      for (let i = next.length - 1; i >= 0; i--) {
        if (typeof next[i] === 'number') {
          next[i] = (next[i] as number) + 1;
          return `${base.major}.${base.minor}.${base.patch}-${next.join('.')}`;
        }
      }
      next.push(0);
      return `${base.major}.${base.minor}.${base.patch}-${next.join('.')}`;
    }
  }
}

export function diffSemVer(
  a: ParsedSemVer,
  b: ParsedSemVer
): { cmp: -1 | 0 | 1; kind: VersionDiffKind } {
  const cmp = compareSemVer(a, b);
  if (cmp === 0) {
    const buildSame = a.build.join('.') === b.build.join('.');
    return { cmp: 0, kind: buildSame ? 'identical' : 'build-only' };
  }
  if (cmp > 0) {
    return { cmp: 1, kind: 'downgrade' };
  }
  if (b.major > a.major) return { cmp: -1, kind: 'major' };
  if (b.minor > a.minor) return { cmp: -1, kind: 'minor' };
  if (b.patch > a.patch) return { cmp: -1, kind: 'patch' };
  return { cmp: -1, kind: 'prerelease' };
}

// ==================== 常见预设用例 ====================

export const SEMVER_PRESETS: SemVerPreset[] = [
  {
    id: 'npm-caret',
    nameZh: 'npm 插入号 (^1.2.3)',
    nameEn: 'npm Caret (^1.2.3)',
    descZh: '允许兼容的 Minor 与 Patch 升级，锁定 Major 不变',
    descEn: 'Allows compatible minor and patch updates within major 1.x',
    range: '^1.2.3',
    versions: [
      '1.0.0',
      '1.2.2',
      '1.2.3',
      '1.2.4-alpha.1',
      '1.3.0',
      '1.9.12',
      '2.0.0-alpha.1',
      '2.0.0',
    ],
  },
  {
    id: 'pre-one-caret',
    nameZh: '0.x 陷阱 (^0.2.3 vs ^0.0.3)',
    nameEn: 'Pre-1.0 Caret (^0.2.3)',
    descZh: '0.x 版本中，^0.2.3 会锁定 Minor 位（0.2.x），避免 0.3.0 破坏性变更',
    descEn: 'In 0.x releases, ^0.2.3 pins the minor version (<0.3.0-0)',
    range: '^0.2.3',
    versions: ['0.1.9', '0.2.2', '0.2.3', '0.2.9', '0.3.0-alpha.1', '0.3.0', '1.0.0'],
  },
  {
    id: 'multi-or',
    nameZh: '多区间或集 (|| + ~)',
    nameEn: 'Multi-Range (|| + ~)',
    descZh: '常见于框架 peerDependencies：兼容 18.2.x 或 >=19.0.0 <20.0.0',
    descEn: 'Common peerDependencies pattern: ~18.2.0 || ^19.0.0',
    range: '~18.2.0 || >=19.0.0 <20.0.0',
    versions: [
      '18.1.9',
      '18.2.0',
      '18.2.14',
      '18.3.0',
      '19.0.0-rc.1',
      '19.0.0',
      '19.2.1',
      '20.0.0',
    ],
  },
  {
    id: 'prerelease-tuple',
    nameZh: '预发布匹配规则',
    nameEn: 'Prerelease Tuple Rule',
    descZh: '验证预发布标签仅在同 M.m.p 下生效的规则与 alpha/beta/rc 排序',
    descEn: 'Test M.m.p prerelease matching and precedence sorting',
    range: '>=2.0.0-beta.2 <2.1.0',
    versions: [
      '2.0.0-alpha.9',
      '2.0.0-beta.1',
      '2.0.0-beta.2',
      '2.0.0-beta.10',
      '2.0.0-rc.1',
      '2.0.0',
      '2.0.1-alpha.1',
      '2.0.1',
      '2.1.0',
    ],
  },
  {
    id: 'hyphen-cargo',
    nameZh: '连字符与 Cargo 逗号语法',
    nameEn: 'Hyphen & Cargo Syntax',
    descZh: '演示 1.2.0 - 2.3 与 >=1.2.0, <2.0.0 等复合边界写法',
    descEn: 'Demonstrates hyphen ranges and Cargo-style comma comparators',
    range: '1.2.0 - 2.3',
    versions: ['1.1.9', '1.2.0', '1.9.0', '2.0.0', '2.3.0', '2.3.5', '2.4.0'],
  },
];
