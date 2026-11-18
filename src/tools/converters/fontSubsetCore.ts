import hbSubsetWasmUrl from 'harfbuzzjs/dist/harfbuzz-subset.wasm?url';
import { compress as compressWoff2, decompress as decompressWoff2 } from 'woff2-encoder';
import { ESSENTIAL_LAYOUT_FEATURES } from './fontPresets';
import {
  detectFontFormat,
  detectSfntFlavor,
  formatUnicodeRanges,
  getOutputMimeAndCssFormat,
  inspectSfnt,
  sfntToWoff,
  woffToSfnt,
  type ParsedFontMetadata,
  type SubsetOptions,
  type SubsetResult,
} from './fontSubsetUtils';

interface HarfBuzzSubsetExports {
  memory: WebAssembly.Memory;
  malloc(size: number): number;
  free(ptr: number): void;
  _initialize(): void;
  hb_blob_create(
    data: number,
    length: number,
    mode: number,
    userData: number,
    destroy: number
  ): number;
  hb_blob_destroy(blob: number): void;
  hb_blob_get_length(blob: number): number;
  hb_blob_get_data(blob: number, lengthOutPtr: number): number;
  hb_face_create(blob: number, index: number): number;
  hb_face_destroy(face: number): void;
  hb_face_reference_blob(face: number): number;
  hb_set_clear(set: number): void;
  hb_set_add(set: number, value: number): void;
  hb_set_invert(set: number): void;
  hb_subset_input_create_or_fail(): number;
  hb_subset_input_destroy(input: number): void;
  hb_subset_input_unicode_set(input: number): number;
  hb_subset_input_set(input: number, setType: number): number;
  hb_subset_input_get_flags(input: number): number;
  hb_subset_input_set_flags(input: number, flags: number): void;
  hb_subset_input_pin_axis_location(
    input: number,
    face: number,
    axisTag: number,
    axisValue: number
  ): number;
  hb_subset_input_set_axis_range(
    input: number,
    face: number,
    axisTag: number,
    axisMinValue: number,
    axisMaxValue: number,
    axisDefValue: number
  ): number;
  hb_subset_or_fail(face: number, input: number): number;
}

const HB_MEMORY_MODE_WRITABLE = 2;
const HB_SUBSET_SETS_DROP_TABLE_TAG = 3;
const HB_SUBSET_SETS_LAYOUT_FEATURE_TAG = 6;

const HB_SUBSET_FLAGS_NO_HINTING = 0x00000001;
const HB_SUBSET_FLAGS_RETAIN_GIDS = 0x00000002;
const HB_SUBSET_FLAGS_DESUBROUTINIZE = 0x00000004;
const HB_SUBSET_FLAGS_GLYPH_NAMES = 0x00000080;
const HB_SUBSET_FLAGS_NO_LAYOUT_CLOSURE = 0x00000200;

let hbWasmPromise: Promise<HarfBuzzSubsetExports> | null = null;

function getHarfBuzzSubset(): Promise<HarfBuzzSubsetExports> {
  if (!hbWasmPromise) {
    hbWasmPromise = (async () => {
      const response = await fetch(hbSubsetWasmUrl);
      if (!response.ok) {
        throw new Error(`Failed to load harfbuzz-subset.wasm (${response.status})`);
      }
      const bytes = await response.arrayBuffer();
      const { instance } = await WebAssembly.instantiate(bytes);
      const exports = instance.exports as unknown as HarfBuzzSubsetExports;
      exports._initialize();
      return exports;
    })().catch(err => {
      hbWasmPromise = null;
      throw err;
    });
  }
  return hbWasmPromise;
}

function hbTag(tag: string): number {
  return (
    ((tag.charCodeAt(0) & 0xff) << 24) |
    ((tag.charCodeAt(1) & 0xff) << 16) |
    ((tag.charCodeAt(2) & 0xff) << 8) |
    (tag.charCodeAt(3) & 0xff)
  );
}

/**
 * 将 TTF / OTF / TTC / WOFF / WOFF2 统一解包为 SFNT，并解析完整元数据
 */
export async function parseAndNormalizeFont(
  rawBytes: Uint8Array,
  faceIndex = 0
): Promise<{ sfntBytes: Uint8Array; metadata: ParsedFontMetadata }> {
  const sourceFormat = detectFontFormat(rawBytes);
  if (!sourceFormat) {
    throw new Error('UNSUPPORTED_FORMAT');
  }

  let sfntBytes: Uint8Array;
  if (sourceFormat === 'woff') {
    sfntBytes = woffToSfnt(rawBytes);
  } else if (sourceFormat === 'woff2') {
    const out = await decompressWoff2(rawBytes);
    sfntBytes = out instanceof Uint8Array ? out : new Uint8Array(out);
  } else {
    sfntBytes = rawBytes;
  }

  const metadata = inspectSfnt(sfntBytes, sourceFormat, faceIndex);
  return { sfntBytes, metadata };
}

/**
 * 使用 HarfBuzz WASM (hb-subset) 执行字体子集化，并按目标格式编码输出
 */
export async function executeFontSubset(
  sfntBytes: Uint8Array,
  options: SubsetOptions
): Promise<SubsetResult> {
  const startedAt = performance.now();

  if (!options.keepAllGlyphs && options.codepoints.length === 0) {
    throw new Error('EMPTY_CODEPOINTS');
  }

  const hb = await getHarfBuzzSubset();
  const heapU8 = () => new Uint8Array(hb.memory.buffer);

  const input = hb.hb_subset_input_create_or_fail();
  if (input === 0) {
    throw new Error('hb_subset_input_create_or_fail returned null');
  }

  let fontPtr = 0;
  let face = 0;
  let subsetFace = 0;
  let resultBlob = 0;

  try {
    fontPtr = hb.malloc(sfntBytes.byteLength);
    heapU8().set(sfntBytes, fontPtr);

    const blob = hb.hb_blob_create(
      fontPtr,
      sfntBytes.byteLength,
      HB_MEMORY_MODE_WRITABLE,
      0,
      0
    );
    face = hb.hb_face_create(blob, options.faceIndex || 0);
    hb.hb_blob_destroy(blob);

    // 1. OpenType 排版特性裁剪控制
    const layoutSet = hb.hb_subset_input_set(
      input,
      HB_SUBSET_SETS_LAYOUT_FEATURE_TAG
    );
    hb.hb_set_clear(layoutSet);
    if (options.featureMode === 'all') {
      hb.hb_set_invert(layoutSet);
    } else if (options.featureMode === 'essential') {
      for (const tag of ESSENTIAL_LAYOUT_FEATURES) {
        hb.hb_set_add(layoutSet, hbTag(tag));
      }
    } else if (options.featureMode === 'custom') {
      for (const tag of options.customFeatures) {
        if (tag.length === 4) {
          hb.hb_set_add(layoutSet, hbTag(tag));
        }
      }
    }

    // 2. 子集化标志位
    let flags = hb.hb_subset_input_get_flags(input);
    if (options.noHinting) flags |= HB_SUBSET_FLAGS_NO_HINTING;
    if (options.retainGids) flags |= HB_SUBSET_FLAGS_RETAIN_GIDS;
    if (options.desubroutinize) flags |= HB_SUBSET_FLAGS_DESUBROUTINIZE;
    if (options.glyphNames) flags |= HB_SUBSET_FLAGS_GLYPH_NAMES;
    if (options.noLayoutClosure) flags |= HB_SUBSET_FLAGS_NO_LAYOUT_CLOSURE;
    hb.hb_subset_input_set_flags(input, flags);

    // 3. 丢弃可选冗余表
    if (options.dropTables.length > 0) {
      const dropSet = hb.hb_subset_input_set(input, HB_SUBSET_SETS_DROP_TABLE_TAG);
      for (const tag of options.dropTables) {
        if (tag.length === 4) {
          hb.hb_set_add(dropSet, hbTag(tag));
        }
      }
    }

    // 4. Unicode 码位集合
    const unicodeSet = hb.hb_subset_input_unicode_set(input);
    if (options.keepAllGlyphs) {
      hb.hb_set_clear(unicodeSet);
      hb.hb_set_invert(unicodeSet);
    } else {
      for (const cp of options.codepoints) {
        hb.hb_set_add(unicodeSet, cp);
      }
    }

    // 5. 可变字体轴固定或范围收缩
    for (const [axisTag, cfg] of Object.entries(options.variationAxes)) {
      if (axisTag.length !== 4 || cfg.mode === 'keep') continue;
      if (cfg.mode === 'pin' && typeof cfg.value === 'number') {
        const ok = hb.hb_subset_input_pin_axis_location(
          input,
          face,
          hbTag(axisTag),
          cfg.value
        );
        if (!ok) {
          throw new Error(`Failed to pin variation axis "${axisTag}"`);
        }
      } else if (
        cfg.mode === 'range' &&
        typeof cfg.min === 'number' &&
        typeof cfg.max === 'number'
      ) {
        const minVal = Math.min(cfg.min, cfg.max);
        const maxVal = Math.max(cfg.min, cfg.max);
        const ok = hb.hb_subset_input_set_axis_range(
          input,
          face,
          hbTag(axisTag),
          minVal,
          maxVal,
          Number.NaN
        );
        if (!ok) {
          throw new Error(`Failed to restrict variation axis "${axisTag}"`);
        }
      }
    }

    subsetFace = hb.hb_subset_or_fail(face, input);
    if (subsetFace === 0) {
      throw new Error('SUBSET_FAILED');
    }

    resultBlob = hb.hb_face_reference_blob(subsetFace);
    const dataPtr = hb.hb_blob_get_data(resultBlob, 0);
    const dataLen = hb.hb_blob_get_length(resultBlob);
    if (dataLen === 0 || dataPtr === 0) {
      throw new Error('SUBSET_FAILED');
    }

    const subsetSfnt = heapU8().slice(dataPtr, dataPtr + dataLen);
    const subsetFlavor = detectSfntFlavor(subsetSfnt);
    const subsetMeta = inspectSfnt(subsetSfnt, subsetFlavor, 0);

    let outputBytes: Uint8Array;
    let outputExt: 'woff2' | 'woff' | 'ttf' | 'otf';

    if (options.outputFormat === 'woff2') {
      const compressed = await compressWoff2(subsetSfnt);
      outputBytes = compressed instanceof Uint8Array ? compressed : new Uint8Array(compressed);
      outputExt = 'woff2';
    } else if (options.outputFormat === 'woff') {
      outputBytes = sfntToWoff(subsetSfnt);
      outputExt = 'woff';
    } else {
      outputBytes = subsetSfnt;
      outputExt = subsetFlavor;
    }

    const { mimeType, cssFormat } = getOutputMimeAndCssFormat(outputExt);
    const unicodeRangeCss = formatUnicodeRanges(subsetMeta.codepoints);

    return {
      bytes: outputBytes,
      outputExt,
      mimeType,
      cssFormat,
      byteLength: outputBytes.byteLength,
      sfntByteLength: subsetSfnt.byteLength,
      numGlyphs: subsetMeta.numGlyphs,
      codepoints: subsetMeta.codepoints,
      unicodeRangeCss,
      tables: subsetMeta.tables,
      elapsedMs: Math.round(performance.now() - startedAt),
    };
  } finally {
    if (resultBlob) hb.hb_blob_destroy(resultBlob);
    if (subsetFace) hb.hb_face_destroy(subsetFace);
    if (face) hb.hb_face_destroy(face);
    if (fontPtr) hb.free(fontPtr);
    hb.hb_subset_input_destroy(input);
  }
}
