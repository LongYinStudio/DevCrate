export interface DiffOptions {
  ignoreWhitespace: boolean;
  ignoreCase: boolean;
  ignoreBlankLines: boolean;
}

export const DEFAULT_DIFF_OPTIONS: DiffOptions = {
  ignoreWhitespace: false,
  ignoreCase: false,
  ignoreBlankLines: false
};

export interface InlineToken {
  text: string;
  type: 'equal' | 'removed' | 'added';
}

export interface SplitDiffCell {
  lineNo: number | null;
  text: string;
  kind: 'equal' | 'removed' | 'added' | 'modified-old' | 'modified-new' | 'empty';
  tokens?: InlineToken[];
}

export interface SplitDiffRow {
  rowIndex: number;
  hunkId: number | null; // 非 null 表示属于第几个变更块（从 0 开始）
  isChange: boolean;
  left: SplitDiffCell;
  right: SplitDiffCell;
}

export interface UnifiedDiffRow {
  rowIndex: number;
  hunkId: number | null;
  type: 'equal' | 'removed' | 'added';
  oldLineNo: number | null;
  newLineNo: number | null;
  text: string;
  tokens?: InlineToken[];
}

export interface DiffStats {
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  hunkCount: number;
  isIdentical: boolean;
}

export interface DiffComputeResult {
  splitRows: SplitDiffRow[];
  unifiedRows: UnifiedDiffRow[];
  hunkStartRowIndices: number[]; // 在 splitRows 中的行索引
  unifiedHunkStartIndices: number[]; // 在 unifiedRows 中的行索引
  stats: DiffStats;
}

interface RawOp {
  type: 'equal' | 'delete' | 'insert';
  oldIdx: number;
  newIdx: number;
}

interface LineEntry {
  lineNo: number; // 1-based original line number
  raw: string;
  norm: string;
}

function normalizeLineText(line: string, options: DiffOptions): string {
  let s = line;
  if (options.ignoreWhitespace) {
    s = s.trim().replace(/\s+/g, ' ');
  }
  if (options.ignoreCase) {
    s = s.toLowerCase();
  }
  return s;
}

function prepareLines(text: string, options: DiffOptions): LineEntry[] {
  if (!text) return [];
  const rawLines = text.replace(/\r\n?/g, '\n').split('\n');
  const entries: LineEntry[] = [];
  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (options.ignoreBlankLines && raw.trim() === '') {
      continue;
    }
    entries.push({
      lineNo: i + 1,
      raw,
      norm: normalizeLineText(raw, options)
    });
  }
  return entries;
}

/**
 * Myers O(ND) 最小编辑距离序列算法（整数 ID 加速，带大差异安全兜底）
 */
function computeSequenceOps(aIds: number[], bIds: number[], maxEditDistance = 2000): RawOp[] {
  const n = aIds.length;
  const m = bIds.length;
  const max = n + m;

  if (n === 0 && m === 0) return [];
  if (n === 0) {
    return bIds.map((_, j) => ({ type: 'insert', oldIdx: 0, newIdx: j }));
  }
  if (m === 0) {
    return aIds.map((_, i) => ({ type: 'delete', oldIdx: i, newIdx: 0 }));
  }

  const limit = Math.min(max, maxEditDistance);
  const offset = limit;
  const v = new Int32Array(2 * limit + 1);
  v.fill(-1);
  v[offset + 1] = 0;

  const trace: Int32Array[] = [];
  let foundD = -1;

  for (let d = 0; d <= limit; d++) {
    trace.push(v.slice());
    for (let k = -d; k <= d; k += 2) {
      let x: number;
      if (k === -d || (k !== d && v[offset + k - 1] < v[offset + k + 1])) {
        x = v[offset + k + 1];
      } else {
        x = v[offset + k - 1] + 1;
      }
      let y = x - k;
      while (x < n && y < m && aIds[x] === bIds[y]) {
        x++;
        y++;
      }
      v[offset + k] = x;
      if (x >= n && y >= m) {
        foundD = d;
        break;
      }
    }
    if (foundD !== -1) break;
  }

  // 若差异超过阈值，回退为有序锚点/分块匹配，保证大文件不卡顿
  if (foundD === -1) {
    return fallbackAnchorOps(aIds, bIds);
  }

  const ops: RawOp[] = [];
  let x = n;
  let y = m;

  for (let d = foundD; d > 0; d--) {
    const prevV = trace[d];
    const k = x - y;
    let prevK: number;
    if (k === -d || (k !== d && prevV[offset + k - 1] < prevV[offset + k + 1])) {
      prevK = k + 1;
    } else {
      prevK = k - 1;
    }
    const prevX = prevV[offset + prevK];
    const prevY = prevX - prevK;

    while (x > prevX && y > prevY) {
      x--;
      y--;
      ops.push({ type: 'equal', oldIdx: x, newIdx: y });
    }

    if (x === prevX) {
      y--;
      ops.push({ type: 'insert', oldIdx: x, newIdx: y });
    } else {
      x--;
      ops.push({ type: 'delete', oldIdx: x, newIdx: y });
    }
  }

  while (x > 0 && y > 0) {
    x--;
    y--;
    ops.push({ type: 'equal', oldIdx: x, newIdx: y });
  }

  ops.reverse();
  return ops;
}

function fallbackAnchorOps(aIds: number[], bIds: number[]): RawOp[] {
  const ops: RawOp[] = [];
  const bMap = new Map<number, number[]>();
  bIds.forEach((id, idx) => {
    const list = bMap.get(id);
    if (list) list.push(idx);
    else bMap.set(id, [idx]);
  });

  let i = 0;
  let j = 0;
  while (i < aIds.length && j < bIds.length) {
    if (aIds[i] === bIds[j]) {
      ops.push({ type: 'equal', oldIdx: i++, newIdx: j++ });
      continue;
    }
    const candidates = bMap.get(aIds[i]);
    const nextMatchJ = candidates?.find(pos => pos >= j && pos - j <= 64);
    if (nextMatchJ !== undefined) {
      while (j < nextMatchJ) {
        ops.push({ type: 'insert', oldIdx: i, newIdx: j++ });
      }
      ops.push({ type: 'equal', oldIdx: i++, newIdx: j++ });
    } else {
      ops.push({ type: 'delete', oldIdx: i++, newIdx: j });
    }
  }
  while (i < aIds.length) ops.push({ type: 'delete', oldIdx: i++, newIdx: j });
  while (j < bIds.length) ops.push({ type: 'insert', oldIdx: i, newIdx: j++ });
  return ops;
}

/**
 * 行内词元级 Diff（用于高亮单行内部的具体变更部分）
 */
export function computeInlineDiff(
  oldLine: string,
  newLine: string,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS
): { oldTokens: InlineToken[]; newTokens: InlineToken[] } {
  if (oldLine === newLine) {
    return {
      oldTokens: [{ text: oldLine, type: 'equal' }],
      newTokens: [{ text: newLine, type: 'equal' }]
    };
  }
  if (oldLine.length > 1000 || newLine.length > 1000) {
    return {
      oldTokens: [{ text: oldLine, type: 'removed' }],
      newTokens: [{ text: newLine, type: 'added' }]
    };
  }

  const tokenize = (s: string) => s.match(/[A-Za-z0-9_]+|\s+|[^\sA-Za-z0-9_]/g) ?? [];
  const aTokens = tokenize(oldLine);
  const bTokens = tokenize(newLine);

  const dict = new Map<string, number>();
  let nextId = 1;
  const toId = (tok: string) => {
    const norm = options.ignoreCase ? tok.toLowerCase() : tok;
    let id = dict.get(norm);
    if (!id) {
      id = nextId++;
      dict.set(norm, id);
    }
    return id;
  };

  const ops = computeSequenceOps(aTokens.map(toId), bTokens.map(toId), 400);
  const oldTokens: InlineToken[] = [];
  const newTokens: InlineToken[] = [];

  const pushToken = (list: InlineToken[], text: string, type: InlineToken['type']) => {
    const last = list[list.length - 1];
    if (last && last.type === type) {
      last.text += text;
    } else if (text) {
      list.push({ text, type });
    }
  };

  for (const op of ops) {
    if (op.type === 'equal') {
      pushToken(oldTokens, aTokens[op.oldIdx], 'equal');
      pushToken(newTokens, bTokens[op.newIdx], 'equal');
    } else if (op.type === 'delete') {
      pushToken(oldTokens, aTokens[op.oldIdx], 'removed');
    } else {
      pushToken(newTokens, bTokens[op.newIdx], 'added');
    }
  }

  return { oldTokens, newTokens };
}

/**
 * 完整计算左右并排与行内统一两种 Diff 视图结构
 */
export function computeCodeDiff(
  originalText: string,
  modifiedText: string,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS
): DiffComputeResult {
  const aEntries = prepareLines(originalText, options);
  const bEntries = prepareLines(modifiedText, options);

  // 前后缀公共行快速裁剪
  let prefix = 0;
  while (
    prefix < aEntries.length &&
    prefix < bEntries.length &&
    aEntries[prefix].norm === bEntries[prefix].norm
  ) {
    prefix++;
  }

  let suffix = 0;
  while (
    suffix < aEntries.length - prefix &&
    suffix < bEntries.length - prefix &&
    aEntries[aEntries.length - 1 - suffix].norm === bEntries[bEntries.length - 1 - suffix].norm
  ) {
    suffix++;
  }

  const midA = aEntries.slice(prefix, aEntries.length - suffix);
  const midB = bEntries.slice(prefix, bEntries.length - suffix);

  const dict = new Map<string, number>();
  let nextId = 1;
  const encode = (norm: string) => {
    let id = dict.get(norm);
    if (!id) {
      id = nextId++;
      dict.set(norm, id);
    }
    return id;
  };

  const midOps = computeSequenceOps(
    midA.map(e => encode(e.norm)),
    midB.map(e => encode(e.norm))
  );

  // 合并前中后操作流
  type TaggedLineOp =
    | { type: 'equal'; a: LineEntry; b: LineEntry }
    | { type: 'delete'; a: LineEntry }
    | { type: 'insert'; b: LineEntry };

  const allOps: TaggedLineOp[] = [];
  for (let i = 0; i < prefix; i++) {
    allOps.push({ type: 'equal', a: aEntries[i], b: bEntries[i] });
  }
  for (const op of midOps) {
    if (op.type === 'equal') {
      allOps.push({ type: 'equal', a: midA[op.oldIdx], b: midB[op.newIdx] });
    } else if (op.type === 'delete') {
      allOps.push({ type: 'delete', a: midA[op.oldIdx] });
    } else {
      allOps.push({ type: 'insert', b: midB[op.newIdx] });
    }
  }
  for (let i = 0; i < suffix; i++) {
    const aIdx = aEntries.length - suffix + i;
    const bIdx = bEntries.length - suffix + i;
    allOps.push({ type: 'equal', a: aEntries[aIdx], b: bEntries[bIdx] });
  }

  const splitRows: SplitDiffRow[] = [];
  const unifiedRows: UnifiedDiffRow[] = [];
  const hunkStartRowIndices: number[] = [];
  const unifiedHunkStartIndices: number[] = [];

  let added = 0;
  let removed = 0;
  let modified = 0;
  let unchanged = 0;
  let hunkCount = 0;

  let idx = 0;
  while (idx < allOps.length) {
    const curr = allOps[idx];
    if (curr.type === 'equal') {
      unchanged++;
      splitRows.push({
        rowIndex: splitRows.length,
        hunkId: null,
        isChange: false,
        left: { lineNo: curr.a.lineNo, text: curr.a.raw, kind: 'equal' },
        right: { lineNo: curr.b.lineNo, text: curr.b.raw, kind: 'equal' }
      });
      unifiedRows.push({
        rowIndex: unifiedRows.length,
        hunkId: null,
        type: 'equal',
        oldLineNo: curr.a.lineNo,
        newLineNo: curr.b.lineNo,
        text: curr.a.raw
      });
      idx++;
      continue;
    }

    // 收集连续变更块（delete + insert）
    const delList: LineEntry[] = [];
    const insList: LineEntry[] = [];
    while (idx < allOps.length && allOps[idx].type !== 'equal') {
      const op = allOps[idx];
      if (op.type === 'delete') delList.push(op.a);
      else if (op.type === 'insert') insList.push(op.b);
      idx++;
    }

    const currentHunkId = hunkCount++;
    hunkStartRowIndices.push(splitRows.length);
    unifiedHunkStartIndices.push(unifiedRows.length);

    const pairedCount = Math.min(delList.length, insList.length);
    modified += pairedCount;
    removed += delList.length - pairedCount;
    added += insList.length - pairedCount;

    const maxLen = Math.max(delList.length, insList.length);
    const inlinePairs = new Map<number, { oldTokens: InlineToken[]; newTokens: InlineToken[] }>();
    for (let p = 0; p < pairedCount; p++) {
      inlinePairs.set(p, computeInlineDiff(delList[p].raw, insList[p].raw, options));
    }

    // Split 视图配对填充
    for (let r = 0; r < maxLen; r++) {
      const hasOld = r < delList.length;
      const hasNew = r < insList.length;
      const pairTokens = inlinePairs.get(r);

      splitRows.push({
        rowIndex: splitRows.length,
        hunkId: currentHunkId,
        isChange: true,
        left: hasOld
          ? {
              lineNo: delList[r].lineNo,
              text: delList[r].raw,
              kind: hasNew ? 'modified-old' : 'removed',
              tokens: pairTokens?.oldTokens
            }
          : { lineNo: null, text: '', kind: 'empty' },
        right: hasNew
          ? {
              lineNo: insList[r].lineNo,
              text: insList[r].raw,
              kind: hasOld ? 'modified-new' : 'added',
              tokens: pairTokens?.newTokens
            }
          : { lineNo: null, text: '', kind: 'empty' }
      });
    }

    // Unified 视图先输出删除行再输出新增行
    for (let r = 0; r < delList.length; r++) {
      unifiedRows.push({
        rowIndex: unifiedRows.length,
        hunkId: currentHunkId,
        type: 'removed',
        oldLineNo: delList[r].lineNo,
        newLineNo: null,
        text: delList[r].raw,
        tokens: inlinePairs.get(r)?.oldTokens
      });
    }
    for (let r = 0; r < insList.length; r++) {
      unifiedRows.push({
        rowIndex: unifiedRows.length,
        hunkId: currentHunkId,
        type: 'added',
        oldLineNo: null,
        newLineNo: insList[r].lineNo,
        text: insList[r].raw,
        tokens: inlinePairs.get(r)?.newTokens
      });
    }
  }

  return {
    splitRows,
    unifiedRows,
    hunkStartRowIndices,
    unifiedHunkStartIndices,
    stats: {
      added,
      removed,
      modified,
      unchanged,
      hunkCount,
      isIdentical: hunkCount === 0
    }
  };
}

/**
 * 生成标准 Git / Unified Diff Patch 补丁文本
 */
export function generateUnifiedPatch(
  unifiedRows: UnifiedDiffRow[],
  oldFilename = 'original',
  newFilename = 'modified',
  contextLines = 3
): string {
  const changeIndices: number[] = [];
  unifiedRows.forEach((row, i) => {
    if (row.type !== 'equal') changeIndices.push(i);
  });

  if (changeIndices.length === 0) {
    return '';
  }

  // 合并相邻变更窗口 [start, end]
  const windows: Array<{ start: number; end: number }> = [];
  for (const idx of changeIndices) {
    const start = Math.max(0, idx - contextLines);
    const end = Math.min(unifiedRows.length - 1, idx + contextLines);
    const prev = windows[windows.length - 1];
    if (prev && start <= prev.end + 1) {
      prev.end = end;
    } else {
      windows.push({ start, end });
    }
  }

  const lines: string[] = [`--- a/${oldFilename}`, `+++ b/${newFilename}`];

  for (const win of windows) {
    const slice = unifiedRows.slice(win.start, win.end + 1);
    let oldCount = 0;
    let newCount = 0;
    let oldStart = 0;
    let newStart = 0;

    for (const r of slice) {
      if (r.type === 'equal') {
        if (oldStart === 0) oldStart = r.oldLineNo ?? 1;
        if (newStart === 0) newStart = r.newLineNo ?? 1;
        oldCount++;
        newCount++;
      } else if (r.type === 'removed') {
        if (oldStart === 0) oldStart = r.oldLineNo ?? 1;
        oldCount++;
      } else {
        if (newStart === 0) newStart = r.newLineNo ?? 1;
        newCount++;
      }
    }

    if (oldStart === 0) oldStart = 1;
    if (newStart === 0) newStart = 1;

    lines.push(`@@ -${oldStart},${oldCount} +${newStart},${newCount} @@`);
    for (const r of slice) {
      const prefix = r.type === 'removed' ? '-' : r.type === 'added' ? '+' : ' ';
      lines.push(`${prefix}${r.text}`);
    }
  }

  return lines.join('\n');
}

/**
 * 若文本为合法 JSON，则递归按字母序排序对象键并格式化输出，便于无视键序对比结构差异
 */
export function sortAndFormatJsonForDiff(text: string): { ok: true; text: string } | { ok: false } {
  if (!text.trim()) return { ok: false };
  try {
    const parsed = JSON.parse(text);
    const sortDeep = (val: unknown): unknown => {
      if (Array.isArray(val)) return val.map(sortDeep);
      if (val !== null && typeof val === 'object') {
        const sorted: Record<string, unknown> = {};
        for (const k of Object.keys(val as Record<string, unknown>).sort((a, b) => a.localeCompare(b))) {
          sorted[k] = sortDeep((val as Record<string, unknown>)[k]);
        }
        return sorted;
      }
      return val;
    };
    return { ok: true, text: JSON.stringify(sortDeep(parsed), null, 2) };
  } catch {
    return { ok: false };
  }
}

export interface DiffSamplePreset {
  id: string;
  oldFilename: string;
  newFilename: string;
  oldContent: string;
  newContent: string;
}

export const DIFF_SAMPLE_PRESETS: DiffSamplePreset[] = [
  {
    id: 'tsRefactor',
    oldFilename: 'userService.ts',
    newFilename: 'userService.ts',
    oldContent: `export interface UserProfile {
  id: string;
  name: string;
  role: 'admin' | 'user';
}

export async function fetchUser(id: string): Promise<UserProfile> {
  const res = await fetch('/api/v1/users/' + id);
  if (!res.ok) {
    throw new Error('Failed to load user');
  }
  const data = await res.json();
  return data;
}`,
    newContent: `export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'member' | 'guest';
}

export async function fetchUser(id: string, signal?: AbortSignal): Promise<UserProfile> {
  const res = await fetch(\`/api/v2/users/\${encodeURIComponent(id)}\`, { signal });
  if (!res.ok) {
    throw new Error(\`Failed to load user (\${res.status})\`);
  }
  return (await res.json()) as UserProfile;
}`
  },
  {
    id: 'jsonConfig',
    oldFilename: 'config.old.json',
    newFilename: 'config.new.json',
    oldContent: `{
  "service": "devcrate-api",
  "port": 8080,
  "cache": {
    "enabled": false,
    "ttlSeconds": 60
  },
  "cors": ["http://localhost:3000"]
}`,
    newContent: `{
  "service": "devcrate-api",
  "port": 9000,
  "cache": {
    "enabled": true,
    "ttlSeconds": 300,
    "provider": "redis"
  },
  "cors": ["https://devcrate.app", "http://localhost:3000"],
  "rateLimit": {
    "windowMs": 60000,
    "max": 120
  }
}`
  },
  {
    id: 'nginxConfig',
    oldFilename: 'nginx.old.conf',
    newFilename: 'nginx.new.conf',
    oldContent: `server {
    listen 80;
    server_name api.example.com;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
    }
}`,
    newContent: `server {
    listen 443 ssl http2;
    server_name api.example.com;

    ssl_certificate /etc/ssl/certs/api.crt;
    ssl_certificate_key /etc/ssl/private/api.key;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_read_timeout 60s;
    }
}`
  }
];
