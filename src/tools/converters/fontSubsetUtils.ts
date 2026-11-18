import { zlibSync, unzlibSync } from 'fflate';

export type FontFormat = 'ttf' | 'otf' | 'woff' | 'woff2' | 'ttc';
export type OutputFormat = 'woff2' | 'woff' | 'sfnt';
export type FeatureMode = 'all' | 'essential' | 'none' | 'custom';

export interface FontTableInfo {
  tag: string;
  offset: number;
  length: number;
  checksum: number;
}

export interface VariableAxisInfo {
  tag: string;
  name: string;
  minValue: number;
  defaultValue: number;
  maxValue: number;
}

export interface OpenTypeFeatureInfo {
  tag: string;
  tables: ('GSUB' | 'GPOS')[];
}

export interface FontFaceSummary {
  index: number;
  family: string;
  subfamily: string;
  fullName: string;
  flavor: 'ttf' | 'otf';
}

export interface ParsedFontMetadata {
  sourceFormat: FontFormat;
  sfntFlavor: 'ttf' | 'otf';
  isCollection: boolean;
  faceCount: number;
  faceIndex: number;
  faces: FontFaceSummary[];
  familyName: string;
  subfamilyName: string;
  fullName: string;
  postScriptName: string;
  version: string;
  copyright: string;
  license: string;
  designer: string;
  unitsPerEm: number;
  ascender: number;
  descender: number;
  lineGap: number;
  numGlyphs: number;
  weightClass: number;
  codepoints: number[];
  tables: FontTableInfo[];
  features: OpenTypeFeatureInfo[];
  axes: VariableAxisInfo[];
  hasHinting: boolean;
  sfntByteLength: number;
}

export interface AxisSubsetConfig {
  mode: 'keep' | 'pin' | 'range';
  value?: number;
  min?: number;
  max?: number;
}

export interface SubsetOptions {
  faceIndex: number;
  outputFormat: OutputFormat;
  keepAllGlyphs: boolean;
  codepoints: number[];
  featureMode: FeatureMode;
  customFeatures: string[];
  noHinting: boolean;
  noLayoutClosure: boolean;
  retainGids: boolean;
  glyphNames: boolean;
  desubroutinize: boolean;
  dropTables: string[];
  variationAxes: Record<string, AxisSubsetConfig>;
}

export interface SubsetResult {
  bytes: Uint8Array;
  outputExt: 'woff2' | 'woff' | 'ttf' | 'otf';
  mimeType: string;
  cssFormat: string;
  byteLength: number;
  sfntByteLength: number;
  numGlyphs: number;
  codepoints: number[];
  unicodeRangeCss: string;
  tables: FontTableInfo[];
  elapsedMs: number;
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let val = bytes;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return idx === 0 ? `${val} B` : `${val.toFixed(2)} ${units[idx]}`;
}

function readTag(bytes: Uint8Array, offset: number): string {
  return String.fromCharCode(
    bytes[offset],
    bytes[offset + 1],
    bytes[offset + 2],
    bytes[offset + 3]
  );
}

function pad4(n: number): number {
  return (n + 3) & ~3;
}

export function detectFontFormat(bytes: Uint8Array): FontFormat | null {
  if (bytes.byteLength < 12) return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sig = view.getUint32(0);
  if (sig === 0x774f4632) return 'woff2'; // 'wOF2'
  if (sig === 0x774f4646) return 'woff'; // 'wOFF'
  if (sig === 0x74746366) return 'ttc'; // 'ttcf'
  if (sig === 0x4f54544f) return 'otf'; // 'OTTO'
  if (sig === 0x00010000 || sig === 0x74727565) return 'ttf'; // 1.0 or 'true'
  return null;
}

export function detectSfntFlavor(sfntBytes: Uint8Array): 'ttf' | 'otf' {
  if (sfntBytes.byteLength < 4) return 'ttf';
  const sig = new DataView(
    sfntBytes.buffer,
    sfntBytes.byteOffset,
    sfntBytes.byteLength
  ).getUint32(0);
  return sig === 0x4f54544f ? 'otf' : 'ttf';
}

/**
 * 将 WOFF 1.0 二进制解压重建为标准 SFNT (.ttf/.otf)
 */
export function woffToSfnt(woffBytes: Uint8Array): Uint8Array {
  if (woffBytes.byteLength < 44) {
    throw new Error('Invalid WOFF header: file too small');
  }
  const view = new DataView(
    woffBytes.buffer,
    woffBytes.byteOffset,
    woffBytes.byteLength
  );
  if (view.getUint32(0) !== 0x774f4646) {
    throw new Error('Not a valid WOFF 1.0 file');
  }

  const flavor = view.getUint32(4);
  const numTables = view.getUint16(12);
  if (numTables === 0 || 44 + numTables * 20 > woffBytes.byteLength) {
    throw new Error('Corrupted WOFF table directory');
  }

  interface WoffEntry {
    tag: number;
    checksum: number;
    data: Uint8Array;
  }

  const entries: WoffEntry[] = [];
  for (let i = 0; i < numTables; i++) {
    const rec = 44 + i * 20;
    const tag = view.getUint32(rec);
    const offset = view.getUint32(rec + 4);
    const compLength = view.getUint32(rec + 8);
    const origLength = view.getUint32(rec + 12);
    const checksum = view.getUint32(rec + 16);

    if (offset + compLength > woffBytes.byteLength) {
      throw new Error('Corrupted WOFF table bounds');
    }

    const rawSlice = woffBytes.subarray(offset, offset + compLength);
    let data: Uint8Array;
    if (compLength < origLength) {
      data = unzlibSync(rawSlice);
      if (data.byteLength !== origLength) {
        throw new Error('WOFF table decompressed length mismatch');
      }
    } else {
      data = new Uint8Array(rawSlice);
    }

    entries.push({ tag, checksum, data });
  }

  entries.sort((a, b) => (a.tag >>> 0) - (b.tag >>> 0));

  const headerSize = 12 + numTables * 16;
  let totalDataSize = 0;
  for (const e of entries) totalDataSize += pad4(e.data.byteLength);

  const sfnt = new Uint8Array(headerSize + totalDataSize);
  const outView = new DataView(sfnt.buffer);
  outView.setUint32(0, flavor);
  outView.setUint16(4, numTables);

  const entrySelector = Math.floor(Math.log2(numTables));
  const searchRange = (1 << entrySelector) * 16;
  outView.setUint16(6, searchRange);
  outView.setUint16(8, entrySelector);
  outView.setUint16(10, numTables * 16 - searchRange);

  let dataOffset = headerSize;
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const rec = 12 + i * 16;
    outView.setUint32(rec, e.tag);
    outView.setUint32(rec + 4, e.checksum);
    outView.setUint32(rec + 8, dataOffset);
    outView.setUint32(rec + 12, e.data.byteLength);
    sfnt.set(e.data, dataOffset);
    dataOffset += pad4(e.data.byteLength);
  }

  return sfnt;
}

/**
 * 将标准 SFNT (.ttf/.otf) 打包压缩为 WOFF 1.0 二进制
 */
export function sfntToWoff(sfntBytes: Uint8Array): Uint8Array {
  if (sfntBytes.byteLength < 12) {
    throw new Error('Invalid SFNT header');
  }
  const view = new DataView(
    sfntBytes.buffer,
    sfntBytes.byteOffset,
    sfntBytes.byteLength
  );
  const flavor = view.getUint32(0);
  const numTables = view.getUint16(4);
  if (numTables === 0 || 12 + numTables * 16 > sfntBytes.byteLength) {
    throw new Error('Corrupted SFNT table directory');
  }

  interface WoffOutTable {
    tag: number;
    checksum: number;
    origLength: number;
    stored: Uint8Array;
  }

  let majorVersion = 1;
  let minorVersion = 0;
  let totalSfntSize = 12 + numTables * 16;
  const outTables: WoffOutTable[] = [];

  for (let i = 0; i < numTables; i++) {
    const rec = 12 + i * 16;
    const tag = view.getUint32(rec);
    const checksum = view.getUint32(rec + 4);
    const offset = view.getUint32(rec + 8);
    const length = view.getUint32(rec + 12);

    if (offset + length > sfntBytes.byteLength) {
      throw new Error('Corrupted SFNT table bounds');
    }

    const orig = sfntBytes.subarray(offset, offset + length);
    if (tag === 0x68656164 && length >= 8) {
      // 'head' table fontRevision Fixed 16.16
      majorVersion = view.getUint16(offset + 4);
      minorVersion = view.getUint16(offset + 6);
    }

    totalSfntSize += pad4(length);
    const compressed = zlibSync(orig, { level: 9 });
    const stored = compressed.byteLength < orig.byteLength ? compressed : orig;

    outTables.push({
      tag,
      checksum,
      origLength: length,
      stored,
    });
  }

  outTables.sort((a, b) => (a.tag >>> 0) - (b.tag >>> 0));

  const dirEnd = 44 + numTables * 20;
  let totalWoffSize = dirEnd;
  for (const t of outTables) totalWoffSize += pad4(t.stored.byteLength);

  const woff = new Uint8Array(totalWoffSize);
  const wView = new DataView(woff.buffer);
  wView.setUint32(0, 0x774f4646); // 'wOFF'
  wView.setUint32(4, flavor);
  wView.setUint32(8, totalWoffSize);
  wView.setUint16(12, numTables);
  wView.setUint16(14, 0); // reserved
  wView.setUint32(16, totalSfntSize);
  wView.setUint16(20, majorVersion);
  wView.setUint16(22, minorVersion);
  // metaOffset, metaLength, metaOrigLength, privOffset, privLength remain 0

  let cursor = dirEnd;
  for (let i = 0; i < outTables.length; i++) {
    const t = outTables[i];
    const rec = 44 + i * 20;
    wView.setUint32(rec, t.tag);
    wView.setUint32(rec + 4, cursor);
    wView.setUint32(rec + 8, t.stored.byteLength);
    wView.setUint32(rec + 12, t.origLength);
    wView.setUint32(rec + 16, t.checksum);
    woff.set(t.stored, cursor);
    cursor += pad4(t.stored.byteLength);
  }

  return woff;
}

// ==================== SFNT 元数据与表解析 ====================

function readSfntDirectoryAt(
  bytes: Uint8Array,
  headerOffset: number
): { flavor: 'ttf' | 'otf'; tables: FontTableInfo[]; tableMap: Map<string, FontTableInfo> } {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const sig = view.getUint32(headerOffset);
  const flavor: 'ttf' | 'otf' = sig === 0x4f54544f ? 'otf' : 'ttf';
  const numTables = view.getUint16(headerOffset + 4);
  const tables: FontTableInfo[] = [];
  const tableMap = new Map<string, FontTableInfo>();

  for (let i = 0; i < numTables; i++) {
    const rec = headerOffset + 12 + i * 16;
    if (rec + 16 > bytes.byteLength) break;
    const tag = readTag(bytes, rec);
    const checksum = view.getUint32(rec + 4);
    const offset = view.getUint32(rec + 8);
    const length = view.getUint32(rec + 12);
    if (offset + length <= bytes.byteLength) {
      const info: FontTableInfo = { tag, offset, length, checksum };
      tables.push(info);
      tableMap.set(tag, info);
    }
  }

  return { flavor, tables, tableMap };
}

function decodeNameString(bytes: Uint8Array, platformId: number): string {
  if (platformId === 0 || platformId === 3) {
    // UTF-16BE
    const decoder = new TextDecoder('utf-16be');
    return decoder.decode(bytes).replace(/\0/g, '').trim();
  }
  // MacRoman / ASCII fallback
  let out = '';
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    if (b !== 0) out += String.fromCharCode(b);
  }
  return out.trim();
}

function parseNameTable(
  bytes: Uint8Array,
  table?: FontTableInfo
): Map<number, string> {
  const result = new Map<number, string>();
  if (!table || table.length < 6) return result;

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const base = table.offset;
  const count = view.getUint16(base + 2);
  const stringOffset = view.getUint16(base + 4);
  const storageBase = base + stringOffset;

  const scored = new Map<number, { score: number; value: string }>();

  for (let i = 0; i < count; i++) {
    const rec = base + 6 + i * 12;
    if (rec + 12 > base + table.length) break;
    const platformId = view.getUint16(rec);
    const encodingId = view.getUint16(rec + 2);
    const languageId = view.getUint16(rec + 4);
    const nameId = view.getUint16(rec + 6);
    const length = view.getUint16(rec + 8);
    const offset = view.getUint16(rec + 10);

    const strStart = storageBase + offset;
    if (strStart + length > bytes.byteLength || length === 0) continue;

    // Prefer Windows Unicode English / Chinese, then Unicode platform, then MacRoman
    let score = 0;
    if (platformId === 3 && (encodingId === 1 || encodingId === 10)) {
      score = languageId === 0x0409 ? 100 : languageId === 0x0804 ? 95 : 80;
    } else if (platformId === 0) {
      score = 70;
    } else if (platformId === 1 && encodingId === 0) {
      score = languageId === 0 ? 50 : 40;
    } else {
      continue;
    }

    const decoded = decodeNameString(
      bytes.subarray(strStart, strStart + length),
      platformId
    );
    if (!decoded) continue;

    const existing = scored.get(nameId);
    if (!existing || score > existing.score) {
      scored.set(nameId, { score, value: decoded });
    }
  }

  for (const [k, v] of scored.entries()) {
    result.set(k, v.value);
  }
  return result;
}

function addValidCodepoint(set: Set<number>, cp: number) {
  if (cp >= 0 && cp <= 0x10ffff && (cp < 0xd800 || cp > 0xdfff)) {
    set.add(cp);
  }
}

function parseCmapSubtable(
  bytes: Uint8Array,
  subOffset: number,
  tableEnd: number,
  codepoints: Set<number>
) {
  if (subOffset + 4 > tableEnd) return;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const format = view.getUint16(subOffset);

  if (format === 0) {
    if (subOffset + 262 > tableEnd) return;
    for (let i = 0; i < 256; i++) {
      if (bytes[subOffset + 6 + i] !== 0) {
        addValidCodepoint(codepoints, i);
      }
    }
    return;
  }

  if (format === 4) {
    if (subOffset + 14 > tableEnd) return;
    const segCountX2 = view.getUint16(subOffset + 6);
    const segCount = segCountX2 >> 1;
    const endCodeBase = subOffset + 14;
    const startCodeBase = endCodeBase + segCountX2 + 2;
    const idDeltaBase = startCodeBase + segCountX2;
    const idRangeOffsetBase = idDeltaBase + segCountX2;
    if (idRangeOffsetBase + segCountX2 > tableEnd) return;

    for (let i = 0; i < segCount; i++) {
      const endCode = view.getUint16(endCodeBase + i * 2);
      const startCode = view.getUint16(startCodeBase + i * 2);
      if (startCode === 0xffff && endCode === 0xffff) continue;

      const idDelta = view.getInt16(idDeltaBase + i * 2);
      const idRangeOffsetPos = idRangeOffsetBase + i * 2;
      const idRangeOffset = view.getUint16(idRangeOffsetPos);

      for (let cp = startCode; cp <= endCode; cp++) {
        let gid = 0;
        if (idRangeOffset === 0) {
          gid = (cp + idDelta) & 0xffff;
        } else {
          const glyphOffset =
            idRangeOffsetPos + idRangeOffset + (cp - startCode) * 2;
          if (glyphOffset + 2 <= tableEnd) {
            gid = view.getUint16(glyphOffset);
            if (gid !== 0) {
              gid = (gid + idDelta) & 0xffff;
            }
          }
        }
        if (gid !== 0) {
          addValidCodepoint(codepoints, cp);
        }
      }
    }
    return;
  }

  if (format === 6) {
    if (subOffset + 10 > tableEnd) return;
    const firstCode = view.getUint16(subOffset + 6);
    const entryCount = view.getUint16(subOffset + 8);
    if (subOffset + 10 + entryCount * 2 > tableEnd) return;
    for (let i = 0; i < entryCount; i++) {
      const gid = view.getUint16(subOffset + 10 + i * 2);
      if (gid !== 0) {
        addValidCodepoint(codepoints, firstCode + i);
      }
    }
    return;
  }

  if (format === 12 || format === 13) {
    if (subOffset + 16 > tableEnd) return;
    const numGroups = view.getUint32(subOffset + 12);
    const groupsBase = subOffset + 16;
    if (groupsBase + numGroups * 12 > tableEnd) return;
    for (let i = 0; i < numGroups; i++) {
      const rec = groupsBase + i * 12;
      const startChar = view.getUint32(rec);
      const endChar = Math.min(view.getUint32(rec + 4), 0x10ffff);
      const startGlyph = view.getUint32(rec + 8);
      if (format === 13 && startGlyph === 0) continue;
      for (let cp = startChar; cp <= endChar; cp++) {
        addValidCodepoint(codepoints, cp);
      }
    }
  }
}

function parseCmapCodepoints(
  bytes: Uint8Array,
  table?: FontTableInfo
): number[] {
  if (!table || table.length < 4) return [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const base = table.offset;
  const tableEnd = base + table.length;
  const numTables = view.getUint16(base + 2);

  const unicodeRecords: Array<{ priority: number; offset: number }> = [];

  for (let i = 0; i < numTables; i++) {
    const rec = base + 4 + i * 8;
    if (rec + 8 > tableEnd) break;
    const platformId = view.getUint16(rec);
    const encodingId = view.getUint16(rec + 2);
    const subOffset = base + view.getUint32(rec + 4);

    if (platformId === 3 && encodingId === 10) {
      unicodeRecords.push({ priority: 100, offset: subOffset });
    } else if (platformId === 0 && (encodingId === 4 || encodingId === 6)) {
      unicodeRecords.push({ priority: 95, offset: subOffset });
    } else if (platformId === 3 && encodingId === 1) {
      unicodeRecords.push({ priority: 80, offset: subOffset });
    } else if (platformId === 0) {
      unicodeRecords.push({ priority: 70, offset: subOffset });
    }
  }

  if (unicodeRecords.length === 0) return [];
  unicodeRecords.sort((a, b) => b.priority - a.priority);

  const codepoints = new Set<number>();
  // Parse highest priority full repertoire subtable first, plus BMP fallback if distinct
  parseCmapSubtable(bytes, unicodeRecords[0].offset, tableEnd, codepoints);
  if (codepoints.size === 0 && unicodeRecords.length > 1) {
    for (let i = 1; i < unicodeRecords.length; i++) {
      parseCmapSubtable(bytes, unicodeRecords[i].offset, tableEnd, codepoints);
      if (codepoints.size > 0) break;
    }
  }

  return Array.from(codepoints).sort((a, b) => a - b);
}

function parseLayoutFeatures(
  bytes: Uint8Array,
  gsub?: FontTableInfo,
  gpos?: FontTableInfo
): OpenTypeFeatureInfo[] {
  const map = new Map<string, Set<'GSUB' | 'GPOS'>>();
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);

  const scanTable = (table: FontTableInfo | undefined, label: 'GSUB' | 'GPOS') => {
    if (!table || table.length < 10) return;
    const featureListRel = view.getUint16(table.offset + 6);
    if (featureListRel === 0) return;
    const featureListOffset = table.offset + featureListRel;
    if (featureListOffset + 2 > table.offset + table.length) return;
    const featureCount = view.getUint16(featureListOffset);
    for (let i = 0; i < featureCount; i++) {
      const rec = featureListOffset + 2 + i * 6;
      if (rec + 6 > table.offset + table.length) break;
      const tag = readTag(bytes, rec);
      let set = map.get(tag);
      if (!set) {
        set = new Set();
        map.set(tag, set);
      }
      set.add(label);
    }
  };

  scanTable(gsub, 'GSUB');
  scanTable(gpos, 'GPOS');

  return Array.from(map.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([tag, tables]) => ({
      tag,
      tables: Array.from(tables),
    }));
}

function parseFvarAxes(
  bytes: Uint8Array,
  fvar: FontTableInfo | undefined,
  names: Map<number, string>
): VariableAxisInfo[] {
  if (!fvar || fvar.length < 16) return [];
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const base = fvar.offset;
  const axesOffset = view.getUint16(base + 4);
  const axisCount = view.getUint16(base + 8);
  const axisSize = view.getUint16(base + 10);
  if (axisSize < 20) return [];

  const axes: VariableAxisInfo[] = [];
  for (let i = 0; i < axisCount; i++) {
    const rec = base + axesOffset + i * axisSize;
    if (rec + 20 > base + fvar.length) break;
    const tag = readTag(bytes, rec);
    const minValue = view.getInt32(rec + 4) / 65536;
    const defaultValue = view.getInt32(rec + 8) / 65536;
    const maxValue = view.getInt32(rec + 12) / 65536;
    const axisNameId = view.getUint16(rec + 18);
    axes.push({
      tag,
      name: names.get(axisNameId) || tag,
      minValue: Number(minValue.toFixed(3)),
      defaultValue: Number(defaultValue.toFixed(3)),
      maxValue: Number(maxValue.toFixed(3)),
    });
  }
  return axes;
}

/**
 * 解析 SFNT (或 TTC 字体集合) 元数据、字形统计、支持码位、OpenType 特性与可变轴
 */
export function inspectSfnt(
  sfntBytes: Uint8Array,
  sourceFormat: FontFormat,
  requestedFaceIndex = 0
): ParsedFontMetadata {
  const view = new DataView(
    sfntBytes.buffer,
    sfntBytes.byteOffset,
    sfntBytes.byteLength
  );

  const isCollection =
    sfntBytes.byteLength >= 12 && view.getUint32(0) === 0x74746366;

  let faceOffsets: number[] = [0];
  if (isCollection) {
    const numFaces = view.getUint32(8);
    faceOffsets = [];
    for (let i = 0; i < numFaces && 12 + i * 4 + 4 <= sfntBytes.byteLength; i++) {
      faceOffsets.push(view.getUint32(12 + i * 4));
    }
    if (faceOffsets.length === 0) faceOffsets = [0];
  }

  const faceIndex = Math.max(0, Math.min(requestedFaceIndex, faceOffsets.length - 1));

  const faces: FontFaceSummary[] = faceOffsets.map((offset, idx) => {
    const dir = readSfntDirectoryAt(sfntBytes, offset);
    const names = parseNameTable(sfntBytes, dir.tableMap.get('name'));
    const family = names.get(16) || names.get(1) || `Font Face ${idx + 1}`;
    const subfamily = names.get(17) || names.get(2) || 'Regular';
    const fullName = names.get(4) || `${family} ${subfamily}`;
    return {
      index: idx,
      family,
      subfamily,
      fullName,
      flavor: dir.flavor,
    };
  });

  const activeOffset = faceOffsets[faceIndex];
  const { flavor, tables, tableMap } = readSfntDirectoryAt(sfntBytes, activeOffset);
  const names = parseNameTable(sfntBytes, tableMap.get('name'));

  const head = tableMap.get('head');
  const unitsPerEm = head && head.length >= 20 ? view.getUint16(head.offset + 18) : 1000;

  const hhea = tableMap.get('hhea');
  const ascender = hhea && hhea.length >= 8 ? view.getInt16(hhea.offset + 4) : 800;
  const descender = hhea && hhea.length >= 8 ? view.getInt16(hhea.offset + 6) : -200;
  const lineGap = hhea && hhea.length >= 10 ? view.getInt16(hhea.offset + 8) : 0;

  const maxp = tableMap.get('maxp');
  const numGlyphs = maxp && maxp.length >= 6 ? view.getUint16(maxp.offset + 4) : 0;

  const os2 = tableMap.get('OS/2');
  const weightClass = os2 && os2.length >= 6 ? view.getUint16(os2.offset + 4) : 400;

  const codepoints = parseCmapCodepoints(sfntBytes, tableMap.get('cmap'));
  const features = parseLayoutFeatures(
    sfntBytes,
    tableMap.get('GSUB'),
    tableMap.get('GPOS')
  );
  const axes = parseFvarAxes(sfntBytes, tableMap.get('fvar'), names);

  const hasHinting =
    tableMap.has('fpgm') || tableMap.has('prep') || tableMap.has('cvt ');

  const familyName = names.get(16) || names.get(1) || 'Untitled Font';
  const subfamilyName = names.get(17) || names.get(2) || 'Regular';
  const fullName = names.get(4) || `${familyName} ${subfamilyName}`;

  return {
    sourceFormat,
    sfntFlavor: flavor,
    isCollection,
    faceCount: faces.length,
    faceIndex,
    faces,
    familyName,
    subfamilyName,
    fullName,
    postScriptName: names.get(6) || '',
    version: names.get(5) || '',
    copyright: names.get(0) || '',
    license: names.get(13) || '',
    designer: names.get(9) || '',
    unitsPerEm,
    ascender,
    descender,
    lineGap,
    numGlyphs,
    weightClass,
    codepoints,
    tables: [...tables].sort((a, b) => b.length - a.length),
    features,
    axes,
    hasHinting,
    sfntByteLength: sfntBytes.byteLength,
  };
}

// ==================== Unicode 范围解析与 CSS unicode-range 生成 ====================

export function parseUnicodeRangeInput(input: string): {
  ranges: Array<[number, number]>;
  invalidTokens: string[];
} {
  const ranges: Array<[number, number]> = [];
  const invalidTokens: string[] = [];

  const tokens = input
    .split(/[\s,;，；\n\r]+/)
    .map(s => s.trim())
    .filter(Boolean);

  for (const token of tokens) {
    const clean = token.replace(/^U\+/gi, '').replace(/^0x/gi, '');
    const match = clean.match(/^([0-9a-fA-F]{1,6})(?:[-–—](?:U\+|0x)?([0-9a-fA-F]{1,6}))?$/i);
    if (!match) {
      invalidTokens.push(token);
      continue;
    }

    const start = parseInt(match[1], 16);
    const end = match[2] ? parseInt(match[2], 16) : start;
    if (
      Number.isNaN(start) ||
      Number.isNaN(end) ||
      start < 0 ||
      end > 0x10ffff ||
      start > end
    ) {
      invalidTokens.push(token);
      continue;
    }

    ranges.push([start, end]);
  }

  return { ranges, invalidTokens };
}

export function extractUniqueCodepointsFromText(text: string): number[] {
  const set = new Set<number>();
  for (const ch of text) {
    const cp = ch.codePointAt(0);
    if (cp !== undefined) addValidCodepoint(set, cp);
  }
  return Array.from(set).sort((a, b) => a - b);
}

/**
 * 合并文本输入、Unicode 范围与自定义点选码位，并与字体实际支持的码位做对照
 */
export function resolveTargetCodepoints(options: {
  text: string;
  rangeInput: string;
  pickedCodepoints: number[];
  fontCodepoints?: number[];
}): {
  requestedCodepoints: number[];
  presentCodepoints: number[];
  missingCodepoints: number[];
  invalidRangeTokens: string[];
} {
  const { ranges, invalidTokens } = parseUnicodeRangeInput(options.rangeInput);
  const fontSet = options.fontCodepoints ? new Set(options.fontCodepoints) : null;

  const requestedSet = new Set<number>();
  for (const cp of extractUniqueCodepointsFromText(options.text)) {
    requestedSet.add(cp);
  }
  for (const cp of options.pickedCodepoints) {
    addValidCodepoint(requestedSet, cp);
  }

  // Expand explicit ranges: if a range is huge (e.g. U+0000-10FFFF), intersect with fontSet to stay instant
  for (const [start, end] of ranges) {
    const span = end - start + 1;
    if (fontSet && span > 4096) {
      for (const cp of fontSet) {
        if (cp >= start && cp <= end) {
          requestedSet.add(cp);
        }
      }
    } else {
      const limit = Math.min(end, start + 65535);
      for (let cp = start; cp <= limit; cp++) {
        addValidCodepoint(requestedSet, cp);
      }
    }
  }

  const requestedCodepoints = Array.from(requestedSet).sort((a, b) => a - b);
  if (!fontSet) {
    return {
      requestedCodepoints,
      presentCodepoints: requestedCodepoints,
      missingCodepoints: [],
      invalidRangeTokens: invalidTokens,
    };
  }

  const presentCodepoints: number[] = [];
  const missingCodepoints: number[] = [];
  for (const cp of requestedCodepoints) {
    if (fontSet.has(cp)) {
      presentCodepoints.push(cp);
    } else {
      missingCodepoints.push(cp);
    }
  }

  return {
    requestedCodepoints,
    presentCodepoints,
    missingCodepoints,
    invalidRangeTokens: invalidTokens,
  };
}

export function formatCodepointHex(cp: number): string {
  return `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
}

/**
 * 将离散码位集合合并压缩为标准 CSS `unicode-range` 列表
 */
export function formatUnicodeRanges(codepoints: number[]): string {
  if (codepoints.length === 0) return '';
  const sorted = Array.from(new Set(codepoints)).sort((a, b) => a - b);
  const parts: string[] = [];

  let start = sorted[0];
  let end = sorted[0];

  const pushRange = (s: number, e: number) => {
    const sHex = s.toString(16).toUpperCase().padStart(4, '0');
    if (s === e) {
      parts.push(`U+${sHex}`);
    } else {
      const eHex = e.toString(16).toUpperCase().padStart(4, '0');
      parts.push(`U+${sHex}-${eHex}`);
    }
  };

  for (let i = 1; i < sorted.length; i++) {
    const cp = sorted[i];
    if (cp === end + 1) {
      end = cp;
    } else {
      pushRange(start, end);
      start = cp;
      end = cp;
    }
  }
  pushRange(start, end);
  return parts.join(', ');
}

export function uint8ArrayToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return btoa(binary);
}

export function getOutputMimeAndCssFormat(ext: 'woff2' | 'woff' | 'ttf' | 'otf'): {
  mimeType: string;
  cssFormat: string;
} {
  switch (ext) {
    case 'woff2':
      return { mimeType: 'font/woff2', cssFormat: 'woff2' };
    case 'woff':
      return { mimeType: 'font/woff', cssFormat: 'woff' };
    case 'otf':
      return { mimeType: 'font/otf', cssFormat: 'opentype' };
    case 'ttf':
    default:
      return { mimeType: 'font/ttf', cssFormat: 'truetype' };
  }
}

export function generateFontFaceCss(options: {
  familyName: string;
  urlOrDataUri: string;
  cssFormat: string;
  unicodeRange?: string;
  weight?: string;
  style?: string;
  display?: string;
}): string {
  const safeFamily = (options.familyName || 'CustomFont').replace(/'/g, "\\'");
  const lines = [
    '@font-face {',
    `  font-family: '${safeFamily}';`,
    `  src: url('${options.urlOrDataUri}') format('${options.cssFormat}');`,
    `  font-weight: ${options.weight || '400'};`,
    `  font-style: ${options.style || 'normal'};`,
    `  font-display: ${options.display || 'swap'};`,
  ];
  if (options.unicodeRange) {
    lines.push(`  unicode-range: ${options.unicodeRange};`);
  }
  lines.push('}');
  return lines.join('\n');
}
