export interface FontCharPreset {
  id: string;
  labelKey: string;
  descKey: string;
  mode: 'text' | 'ranges' | 'all';
  value: string;
}

export interface UnicodeBlockDef {
  id: string;
  labelKey: string;
  start: number;
  end: number;
}

export const FONT_CHAR_PRESETS: FontCharPreset[] = [
  {
    id: 'ascii-printable',
    labelKey: 'tools.fontSubsetter.presets.asciiPrintable',
    descKey: 'tools.fontSubsetter.presets.asciiPrintableDesc',
    mode: 'ranges',
    value: 'U+0020-007E',
  },
  {
    id: 'digits-math',
    labelKey: 'tools.fontSubsetter.presets.digitsMath',
    descKey: 'tools.fontSubsetter.presets.digitsMathDesc',
    mode: 'text',
    value: '0123456789+-*/=%.,:;()[]{}<>±×÷≈≠≤≥∞·•',
  },
  {
    id: 'latin-1',
    labelKey: 'tools.fontSubsetter.presets.latin1',
    descKey: 'tools.fontSubsetter.presets.latin1Desc',
    mode: 'ranges',
    value: 'U+00A0-00FF',
  },
  {
    id: 'latin-ext-a',
    labelKey: 'tools.fontSubsetter.presets.latinExtA',
    descKey: 'tools.fontSubsetter.presets.latinExtADesc',
    mode: 'ranges',
    value: 'U+0100-017F',
  },
  {
    id: 'cjk-punctuation',
    labelKey: 'tools.fontSubsetter.presets.cjkPunctuation',
    descKey: 'tools.fontSubsetter.presets.cjkPunctuationDesc',
    mode: 'ranges',
    value: 'U+3000-303F, U+FF00-FFEF, U+2010-2027',
  },
  {
    id: 'currency-symbols',
    labelKey: 'tools.fontSubsetter.presets.currencySymbols',
    descKey: 'tools.fontSubsetter.presets.currencySymbolsDesc',
    mode: 'text',
    value: '¥$€£¢₹₩₽©®™°§¶†‡•…—–✓✕★☆',
  },
  {
    id: 'cjk-unified',
    labelKey: 'tools.fontSubsetter.presets.cjkUnified',
    descKey: 'tools.fontSubsetter.presets.cjkUnifiedDesc',
    mode: 'ranges',
    value: 'U+4E00-9FFF',
  },
  {
    id: 'hiragana-katakana',
    labelKey: 'tools.fontSubsetter.presets.kana',
    descKey: 'tools.fontSubsetter.presets.kanaDesc',
    mode: 'ranges',
    value: 'U+3040-309F, U+30A0-30FF',
  },
  {
    id: 'hangul',
    labelKey: 'tools.fontSubsetter.presets.hangul',
    descKey: 'tools.fontSubsetter.presets.hangulDesc',
    mode: 'ranges',
    value: 'U+AC00-D7AF',
  },
  {
    id: 'greek-cyrillic',
    labelKey: 'tools.fontSubsetter.presets.greekCyrillic',
    descKey: 'tools.fontSubsetter.presets.greekCyrillicDesc',
    mode: 'ranges',
    value: 'U+0370-03FF, U+0400-04FF',
  },
  {
    id: 'keep-all',
    labelKey: 'tools.fontSubsetter.presets.keepAll',
    descKey: 'tools.fontSubsetter.presets.keepAllDesc',
    mode: 'all',
    value: '*',
  },
];

export const UNICODE_BLOCKS: UnicodeBlockDef[] = [
  { id: 'basic-latin', labelKey: 'tools.fontSubsetter.blocks.basicLatin', start: 0x0020, end: 0x007f },
  { id: 'latin-1', labelKey: 'tools.fontSubsetter.blocks.latin1', start: 0x0080, end: 0x00ff },
  { id: 'latin-ext', labelKey: 'tools.fontSubsetter.blocks.latinExt', start: 0x0100, end: 0x024f },
  { id: 'greek', labelKey: 'tools.fontSubsetter.blocks.greek', start: 0x0370, end: 0x03ff },
  { id: 'cyrillic', labelKey: 'tools.fontSubsetter.blocks.cyrillic', start: 0x0400, end: 0x04ff },
  { id: 'punctuation', labelKey: 'tools.fontSubsetter.blocks.punctuation', start: 0x2000, end: 0x206f },
  { id: 'symbols', labelKey: 'tools.fontSubsetter.blocks.symbols', start: 0x20a0, end: 0x27bf },
  { id: 'cjk-punct', labelKey: 'tools.fontSubsetter.blocks.cjkPunct', start: 0x3000, end: 0x303f },
  { id: 'kana', labelKey: 'tools.fontSubsetter.blocks.kana', start: 0x3040, end: 0x30ff },
  { id: 'cjk-unified', labelKey: 'tools.fontSubsetter.blocks.cjkUnified', start: 0x4e00, end: 0x9fff },
  { id: 'hangul', labelKey: 'tools.fontSubsetter.blocks.hangul', start: 0xac00, end: 0xd7af },
  { id: 'fullwidth', labelKey: 'tools.fontSubsetter.blocks.fullwidth', start: 0xff00, end: 0xffef },
  { id: 'emoji', labelKey: 'tools.fontSubsetter.blocks.emoji', start: 0x1f000, end: 0x1faff },
  { id: 'pua', labelKey: 'tools.fontSubsetter.blocks.pua', start: 0xe000, end: 0xf8ff },
];

export const ESSENTIAL_LAYOUT_FEATURES = new Set([
  'ccmp',
  'locl',
  'kern',
  'liga',
  'clig',
  'calt',
  'rlig',
  'mark',
  'mkmk',
]);

export const OPENTYPE_FEATURE_INFO: Record<string, { zh: string; en: string }> = {
  kern: { zh: '字距微调 (Kerning)', en: 'Kerning' },
  liga: { zh: '标准连字 (fi, fl 等)', en: 'Standard Ligatures' },
  dlig: { zh: '可选装饰连字', en: 'Discretionary Ligatures' },
  clig: { zh: '上下文连字', en: 'Contextual Ligatures' },
  calt: { zh: '上下文替代字形', en: 'Contextual Alternates' },
  ccmp: { zh: '字形组合与分解', en: 'Glyph Composition / Decomposition' },
  locl: { zh: '本地化字形变体', en: 'Localized Forms' },
  mark: { zh: '基字与附标定位', en: 'Mark Positioning' },
  mkmk: { zh: '附标间定位', en: 'Mark-to-Mark Positioning' },
  smcp: { zh: '小型大写字母', en: 'Small Capitals' },
  c2sc: { zh: '大写转小型大写', en: 'Capitals to Small Caps' },
  tnum: { zh: '等宽数字 (表格对齐)', en: 'Tabular Figures' },
  pnum: { zh: '比例宽度数字', en: 'Proportional Figures' },
  onum: { zh: '旧式/齐线小写数字', en: 'Oldstyle Figures' },
  lnum: { zh: '等高齐线数字', en: 'Lining Figures' },
  zero: { zh: '带斜线零 (0)', en: 'Slashed Zero' },
  frac: { zh: '斜线分数', en: 'Fractions' },
  sups: { zh: '上标', en: 'Superscript' },
  subs: { zh: '下标', en: 'Subscript' },
  ordn: { zh: '序数词标记', en: 'Ordinals' },
  case: { zh: '大写敏感标点对齐', en: 'Case-Sensitive Forms' },
  salt: { zh: '样式替代字形', en: 'Stylistic Alternates' },
  swsh: { zh: '花体字形', en: 'Swash' },
  vert: { zh: '竖排字形', en: 'Vertical Writing' },
  vrt2: { zh: '竖排旋转替代', en: 'Vertical Alternates & Rotation' },
  palt: { zh: '比例宽度替代 (CJK)', en: 'Proportional Alternate Widths' },
  halt: { zh: '半宽替代 (CJK)', en: 'Alternate Half Widths' },
  fwid: { zh: '全宽字形', en: 'Full Widths' },
  hwid: { zh: '半宽字形', en: 'Half Widths' },
  aalt: { zh: '全部替代访问', en: 'Access All Alternates' },
};

export function describeOpenTypeFeature(tag: string, isZh: boolean): string {
  const known = OPENTYPE_FEATURE_INFO[tag];
  if (known) return isZh ? known.zh : known.en;
  if (/^ss\d{2}$/.test(tag)) {
    const num = tag.slice(2);
    return isZh ? `样式集 ${num}` : `Stylistic Set ${num}`;
  }
  if (/^cv\d{2}$/.test(tag)) {
    const num = tag.slice(2);
    return isZh ? `字符变体 ${num}` : `Character Variant ${num}`;
  }
  return tag;
}

// ==================== 最小化有效 TrueType 示例字体生成器 ====================

type Point = [number, number];
type Contour = Point[];

function rectContour(x1: number, y1: number, x2: number, y2: number, cw = true): Contour {
  // TrueType outer contour is clockwise; inner hole is counter-clockwise
  return cw
    ? [
        [x1, y1],
        [x1, y2],
        [x2, y2],
        [x2, y1],
      ]
    : [
        [x1, y1],
        [x2, y1],
        [x2, y2],
        [x1, y2],
      ];
}

/**
 * 基于 5x7 矢量栅格构建清晰的几何无衬线字符轮廓（用于开箱即用的示例字体）
 */
const BITMAP_5X7: Record<string, string[]> = {
  A: ['.###.', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  B: ['####.', '#...#', '#...#', '####.', '#...#', '#...#', '####.'],
  C: ['.####', '#....', '#....', '#....', '#....', '#....', '.####'],
  D: ['####.', '#...#', '#...#', '#...#', '#...#', '#...#', '####.'],
  E: ['#####', '#....', '#....', '####.', '#....', '#....', '#####'],
  F: ['#####', '#....', '#....', '####.', '#....', '#....', '#....'],
  G: ['.####', '#....', '#....', '#..##', '#...#', '#...#', '.####'],
  H: ['#...#', '#...#', '#...#', '#####', '#...#', '#...#', '#...#'],
  I: ['.###.', '..#..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  J: ['..###', '...#.', '...#.', '...#.', '#..#.', '#..#.', '.##..'],
  K: ['#...#', '#..#.', '#.#..', '##...', '#.#..', '#..#.', '#...#'],
  L: ['#....', '#....', '#....', '#....', '#....', '#....', '#####'],
  M: ['#...#', '##.##', '#.#.#', '#...#', '#...#', '#...#', '#...#'],
  N: ['#...#', '##..#', '#.#.#', '#..##', '#...#', '#...#', '#...#'],
  O: ['.###.', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  P: ['####.', '#...#', '#...#', '####.', '#....', '#....', '#....'],
  Q: ['.###.', '#...#', '#...#', '#...#', '#.#.#', '#..#.', '.##.#'],
  R: ['####.', '#...#', '#...#', '####.', '#.#..', '#..#.', '#...#'],
  S: ['.####', '#....', '#....', '.###.', '....#', '....#', '####.'],
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  U: ['#...#', '#...#', '#...#', '#...#', '#...#', '#...#', '.###.'],
  V: ['#...#', '#...#', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  W: ['#...#', '#...#', '#...#', '#...#', '#.#.#', '##.##', '#...#'],
  X: ['#...#', '#...#', '.#.#.', '..#..', '.#.#.', '#...#', '#...#'],
  Y: ['#...#', '#...#', '.#.#.', '..#..', '..#..', '..#..', '..#..'],
  Z: ['#####', '....#', '...#.', '..#..', '.#...', '#....', '#####'],
  a: ['.....', '.....', '.###.', '....#', '.####', '#...#', '.####'],
  b: ['#....', '#....', '####.', '#...#', '#...#', '#...#', '####.'],
  c: ['.....', '.....', '.####', '#....', '#....', '#....', '.####'],
  d: ['....#', '....#', '.####', '#...#', '#...#', '#...#', '.####'],
  e: ['.....', '.....', '.###.', '#...#', '#####', '#....', '.####'],
  f: ['..###', '.#...', '####.', '.#...', '.#...', '.#...', '.#...'],
  g: ['.....', '.....', '.####', '#...#', '.####', '....#', '####.'],
  h: ['#....', '#....', '####.', '#...#', '#...#', '#...#', '#...#'],
  i: ['..#..', '.....', '.##..', '..#..', '..#..', '..#..', '.###.'],
  j: ['...#.', '.....', '..##.', '...#.', '...#.', '#..#.', '.##..'],
  k: ['#....', '#....', '#..#.', '#.#..', '##...', '#.#..', '#..#.'],
  l: ['.@#..'.replace('@', ''), '..#..', '..#..', '..#..', '..#..', '..#..', '..##.'],
  m: ['.....', '.....', '##.#.', '#.#.#', '#.#.#', '#...#', '#...#'],
  n: ['.....', '.....', '####.', '#...#', '#...#', '#...#', '#...#'],
  o: ['.....', '.....', '.###.', '#...#', '#...#', '#...#', '.###.'],
  p: ['.....', '.....', '####.', '#...#', '####.', '#....', '#....'],
  q: ['.....', '.....', '.####', '#...#', '.####', '....#', '....#'],
  r: ['.....', '.....', '#.##.', '##..#', '#....', '#....', '#....'],
  s: ['.....', '.....', '.####', '#....', '.###.', '....#', '####.'],
  t: ['.#...', '.#...', '####.', '.#...', '.#...', '.#...', '..###'],
  u: ['.....', '.....', '#...#', '#...#', '#...#', '#...#', '.####'],
  v: ['.....', '.....', '#...#', '#...#', '#...#', '.#.#.', '..#..'],
  w: ['.....', '.....', '#...#', '#...#', '#.#.#', '#.#.#', '.#.#.'],
  x: ['.....', '.....', '#...#', '.#.#.', '..#..', '.#.#.', '#...#'],
  y: ['.....', '.....', '#...#', '#...#', '.####', '....#', '####.'],
  z: ['.....', '.....', '#####', '...#.', '..#..', '.#...', '#####'],
  '0': ['.###.', '#..##', '#.#.#', '#.#.#', '#.#.#', '##..#', '.###.'],
  '1': ['..#..', '.##..', '..#..', '..#..', '..#..', '..#..', '.###.'],
  '2': ['.###.', '#...#', '....#', '..##.', '.#...', '#....', '#####'],
  '3': ['####.', '....#', '....#', '.###.', '....#', '....#', '####.'],
  '4': ['#...#', '#...#', '#...#', '#####', '....#', '....#', '....#'],
  '5': ['#####', '#....', '####.', '....#', '....#', '#...#', '.###.'],
  '6': ['.###.', '#....', '####.', '#...#', '#...#', '#...#', '.###.'],
  '7': ['#####', '....#', '...#.', '..#..', '.#...', '.#...', '.#...'],
  '8': ['.###.', '#...#', '#...#', '.###.', '#...#', '#...#', '.###.'],
  '9': ['.###.', '#...#', '#...#', '.####', '....#', '....#', '.###.'],
  '.': ['.....', '.....', '.....', '.....', '.....', '.##..', '.##..'],
  ',': ['.....', '.....', '.....', '.....', '..#..', '..#..', '.#...'],
  ':': ['.....', '.##..', '.##..', '.....', '.##..', '.##..', '.....'],
  ';': ['.....', '.##..', '.##..', '.....', '..#..', '..#..', '.#...'],
  '!': ['..#..', '..#..', '..#..', '..#..', '..#..', '.....', '..#..'],
  '?': ['.###.', '#...#', '....#', '..##.', '..#..', '.....', '..#..'],
  '-': ['.....', '.....', '.....', '#####', '.....', '.....', '.....'],
  '+': ['.....', '..#..', '..#..', '#####', '..#..', '..#..', '.....'],
  '=': ['.....', '.....', '#####', '.....', '#####', '.....', '.....'],
  '/': ['....#', '...#.', '...#.', '..#..', '.#...', '.#...', '#....'],
  '(': ['...#.', '..#..', '.#...', '.#...', '.#...', '..#..', '...#.'],
  ')': ['.#...', '..#..', '...#.', '...#.', '...#.', '..#..', '.#...'],
  '[': ['.###.', '.#...', '.#...', '.#...', '.#...', '.#...', '.###.'],
  ']': ['.###.', '...#.', '...#.', '...#.', '...#.', '...#.', '.###.'],
  '@': ['.###.', '#...#', '#.###', '#.#.#', '#.###', '#....', '.####'],
  '#': ['.#.#.', '#####', '.#.#.', '.#.#.', '#####', '.#.#.', '.....'],
  '$': ['..#..', '.####', '#.#..', '.###.', '..#.#', '####.', '..#..'],
  '%': ['##..#', '##.#.', '...#.', '..#..', '.#...', '.#.##', '#..##'],
  '&': ['.##..', '#..#.', '#.#..', '.#...', '#.#.#', '#..#.', '.##.#'],
  '*': ['.....', '#.#.#', '.###.', '#####', '.###.', '#.#.#', '.....'],
  '_': ['.....', '.....', '.....', '.....', '.....', '.....', '#####'],
};

function bitmapToContours(rows: string[]): Contour[] {
  const cellW = 100;
  const cellH = 100;
  const xOffset = 80;
  const contours: Contour[] = [];

  // Merge contiguous horizontal runs per row to keep glyph contours clean and compact
  for (let r = 0; r < rows.length; r++) {
    const row = rows[r];
    const yTop = (7 - r) * cellH;
    const yBottom = yTop - cellH;
    let c = 0;
    while (c < row.length) {
      if (row[c] === '#') {
        const start = c;
        while (c < row.length && row[c] === '#') c++;
        contours.push(
          rectContour(xOffset + start * cellW, yBottom, xOffset + c * cellW, yTop, true)
        );
      } else {
        c++;
      }
    }
  }
  return contours;
}

function encodeSimpleGlyph(contours: Contour[]): Uint8Array {
  if (contours.length === 0) return new Uint8Array(0);
  let xMin = Infinity;
  let yMin = Infinity;
  let xMax = -Infinity;
  let yMax = -Infinity;
  const points: Point[] = [];
  const endPts: number[] = [];

  for (const contour of contours) {
    for (const [x, y] of contour) {
      if (x < xMin) xMin = x;
      if (y < yMin) yMin = y;
      if (x > xMax) xMax = x;
      if (y > yMax) yMax = y;
      points.push([x, y]);
    }
    endPts.push(points.length - 1);
  }

  // Header(10) + endPts(2*n) + instructionLength(2) + flags(p) + xCoords(2*p) + yCoords(2*p)
  const size = 10 + contours.length * 2 + 2 + points.length * 5;
  const buf = new Uint8Array(size);
  const view = new DataView(buf.buffer);
  view.setInt16(0, contours.length);
  view.setInt16(2, xMin);
  view.setInt16(4, yMin);
  view.setInt16(6, xMax);
  view.setInt16(8, yMax);

  let pos = 10;
  for (const endPt of endPts) {
    view.setUint16(pos, endPt);
    pos += 2;
  }
  // instructionLength = 0
  view.setUint16(pos, 0);
  pos += 2;

  // Flags: 0x01 (on-curve, 16-bit x & y deltas)
  for (let i = 0; i < points.length; i++) {
    buf[pos++] = 0x01;
  }

  let prevX = 0;
  for (const [x] of points) {
    view.setInt16(pos, x - prevX);
    prevX = x;
    pos += 2;
  }

  let prevY = 0;
  for (const [, y] of points) {
    view.setInt16(pos, y - prevY);
    prevY = y;
    pos += 2;
  }

  return buf;
}

function pad4(n: number): number {
  return (n + 3) & ~3;
}

function calcTableChecksum(bytes: Uint8Array): number {
  let sum = 0;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const full = Math.floor(bytes.byteLength / 4) * 4;
  for (let i = 0; i < full; i += 4) {
    sum = (sum + view.getUint32(i)) >>> 0;
  }
  const rem = bytes.byteLength - full;
  if (rem > 0) {
    let tail = 0;
    for (let i = 0; i < rem; i++) {
      tail |= bytes[full + i] << (24 - i * 8);
    }
    sum = (sum + (tail >>> 0)) >>> 0;
  }
  return sum >>> 0;
}

/**
 * 动态生成一份合法的几何像素风格 TrueType 示例字体 (.ttf)
 * 用于零外部依赖快速体验子集化、预览对比与 WOFF2/WOFF 导出
 */
export function createSampleFontTtf(): Uint8Array {
  const chars = [' ', ...Object.keys(BITMAP_5X7)].sort(
    (a, b) => a.charCodeAt(0) - b.charCodeAt(0)
  );

  // GID 0 = .notdef, GID 1..N = sorted chars
  const glyphs: { code: number | null; data: Uint8Array; advance: number; lsb: number }[] = [
    {
      code: null,
      data: encodeSimpleGlyph([
        rectContour(80, 0, 560, 700, true),
        rectContour(140, 60, 500, 640, false),
      ]),
      advance: 660,
      lsb: 80,
    },
  ];

  for (const ch of chars) {
    const code = ch.charCodeAt(0);
    if (ch === ' ') {
      glyphs.push({ code, data: new Uint8Array(0), advance: 420, lsb: 0 });
    } else {
      const contours = bitmapToContours(BITMAP_5X7[ch]);
      glyphs.push({ code, data: encodeSimpleGlyph(contours), advance: 660, lsb: 80 });
    }
  }

  const numGlyphs = glyphs.length;

  // Build glyf & loca
  let glyfTotal = 0;
  for (const g of glyphs) {
    glyfTotal += pad4(g.data.length);
  }
  const glyf = new Uint8Array(glyfTotal);
  const loca = new Uint8Array((numGlyphs + 1) * 4);
  const locaView = new DataView(loca.buffer);
  let glyfOffset = 0;
  let maxPoints = 8;
  let maxContours = 2;

  for (let i = 0; i < glyphs.length; i++) {
    locaView.setUint32(i * 4, glyfOffset);
    const data = glyphs[i].data;
    if (data.length > 0) {
      glyf.set(data, glyfOffset);
      const gView = new DataView(data.buffer);
      const nc = gView.getInt16(0);
      if (nc > maxContours) maxContours = nc;
      const lastEndPt = gView.getUint16(10 + (nc - 1) * 2) + 1;
      if (lastEndPt > maxPoints) maxPoints = lastEndPt;
      glyfOffset += pad4(data.length);
    }
  }
  locaView.setUint32(numGlyphs * 4, glyfOffset);

  // hmtx
  const hmtx = new Uint8Array(numGlyphs * 4);
  const hmtxView = new DataView(hmtx.buffer);
  for (let i = 0; i < glyphs.length; i++) {
    hmtxView.setUint16(i * 4, glyphs[i].advance);
    hmtxView.setInt16(i * 4 + 2, glyphs[i].lsb);
  }

  // head
  const head = new Uint8Array(54);
  const headView = new DataView(head.buffer);
  headView.setUint32(0, 0x00010000); // major.minor
  headView.setUint32(4, 0x00010000); // fontRevision 1.0
  headView.setUint32(12, 0x5f0f3cf5); // magicNumber
  headView.setUint16(16, 0x000b); // flags
  headView.setUint16(18, 1000); // unitsPerEm
  headView.setInt16(36, 0); // xMin
  headView.setInt16(38, -200); // yMin
  headView.setInt16(40, 660); // xMax
  headView.setInt16(42, 800); // yMax
  headView.setUint16(44, 0); // macStyle
  headView.setUint16(46, 8); // lowestRecPPEM
  headView.setInt16(48, 2); // fontDirectionHint
  headView.setInt16(50, 1); // indexToLocFormat = long (uint32)

  // hhea
  const hhea = new Uint8Array(36);
  const hheaView = new DataView(hhea.buffer);
  hheaView.setUint32(0, 0x00010000);
  hheaView.setInt16(4, 800); // ascender
  hheaView.setInt16(6, -200); // descender
  hheaView.setInt16(8, 100); // lineGap
  hheaView.setUint16(10, 660); // advanceWidthMax
  hheaView.setInt16(18, 1); // caretSlopeRise
  hheaView.setUint16(34, numGlyphs); // numberOfHMetrics

  // maxp
  const maxp = new Uint8Array(32);
  const maxpView = new DataView(maxp.buffer);
  maxpView.setUint32(0, 0x00010000);
  maxpView.setUint16(4, numGlyphs);
  maxpView.setUint16(6, maxPoints);
  maxpView.setUint16(8, maxContours);
  maxpView.setUint16(14, 2); // maxZones

  // OS/2 (78 bytes v0)
  const os2 = new Uint8Array(78);
  const os2View = new DataView(os2.buffer);
  os2View.setUint16(0, 0);
  os2View.setInt16(2, 620); // xAvgCharWidth
  os2View.setUint16(4, 400); // usWeightClass
  os2View.setUint16(6, 5); // usWidthClass
  os2View.setUint16(62, 0x0040); // fsSelection REGULAR
  os2View.setUint16(64, chars[0].charCodeAt(0));
  os2View.setUint16(66, chars[chars.length - 1].charCodeAt(0));
  os2View.setInt16(68, 800); // sTypoAscender
  os2View.setInt16(70, -200); // sTypoDescender
  os2View.setInt16(72, 100); // sTypoLineGap
  os2View.setUint16(74, 850); // usWinAscent
  os2View.setUint16(76, 200); // usWinDescent

  // cmap format 4 (contiguous + sentinel segment 0xFFFF)
  // Build segments from contiguous codepoints
  const segments: { startCode: number; endCode: number; idDelta: number }[] = [];
  for (let i = 0; i < chars.length; ) {
    const startGid = i + 1;
    const startCode = chars[i].charCodeAt(0);
    let endCode = startCode;
    let j = i + 1;
    while (j < chars.length && chars[j].charCodeAt(0) === endCode + 1) {
      endCode = chars[j].charCodeAt(0);
      j++;
    }
    segments.push({
      startCode,
      endCode,
      idDelta: (startGid - startCode) & 0xffff,
    });
    i = j;
  }
  segments.push({ startCode: 0xffff, endCode: 0xffff, idDelta: 1 });

  const segCount = segments.length;
  const subtableLen = 16 + segCount * 8;
  const cmap = new Uint8Array(4 + 8 + subtableLen);
  const cmapView = new DataView(cmap.buffer);
  cmapView.setUint16(0, 0); // version
  cmapView.setUint16(2, 1); // numTables
  cmapView.setUint16(4, 3); // platformID = Windows
  cmapView.setUint16(6, 1); // encodingID = Unicode BMP
  cmapView.setUint32(8, 12); // offset
  const subOff = 12;
  cmapView.setUint16(subOff, 4); // format 4
  cmapView.setUint16(subOff + 2, subtableLen);
  cmapView.setUint16(subOff + 4, 0); // language
  cmapView.setUint16(subOff + 6, segCount * 2);
  const entrySel = Math.floor(Math.log2(segCount));
  const searchRng = (1 << entrySel) * 2;
  cmapView.setUint16(subOff + 8, searchRng);
  cmapView.setUint16(subOff + 10, entrySel);
  cmapView.setUint16(subOff + 12, segCount * 2 - searchRng);

  let p = subOff + 14;
  for (const s of segments) {
    cmapView.setUint16(p, s.endCode);
    p += 2;
  }
  cmapView.setUint16(p, 0); // reservedPad
  p += 2;
  for (const s of segments) {
    cmapView.setUint16(p, s.startCode);
    p += 2;
  }
  for (const s of segments) {
    cmapView.setInt16(p, (s.idDelta << 16) >> 16);
    p += 2;
  }
  // idRangeOffset all 0

  // name table
  const nameEntries: [number, string][] = [
    [0, 'Copyright (c) 2026 DevCrate Sample Font (MIT)'],
    [1, 'DevCrate Pixel Sans'],
    [2, 'Regular'],
    [3, '1.000;DEVC;DevCratePixelSans-Regular'],
    [4, 'DevCrate Pixel Sans Regular'],
    [5, 'Version 1.000'],
    [6, 'DevCratePixelSans-Regular'],
    [9, 'DevCrate Toolbox'],
  ];
  const encodedStrings: Uint8Array[] = nameEntries.map(([, str]) => {
    const out = new Uint8Array(str.length * 2);
    const v = new DataView(out.buffer);
    for (let i = 0; i < str.length; i++) v.setUint16(i * 2, str.charCodeAt(i));
    return out;
  });
  const stringDataLen = encodedStrings.reduce((acc, s) => acc + s.length, 0);
  const nameHeaderLen = 6 + nameEntries.length * 12;
  const name = new Uint8Array(nameHeaderLen + stringDataLen);
  const nameView = new DataView(name.buffer);
  nameView.setUint16(0, 0); // format
  nameView.setUint16(2, nameEntries.length);
  nameView.setUint16(4, nameHeaderLen);
  let strCursor = 0;
  for (let i = 0; i < nameEntries.length; i++) {
    const [nameId] = nameEntries[i];
    const bytes = encodedStrings[i];
    const recOff = 6 + i * 12;
    nameView.setUint16(recOff, 3); // Windows
    nameView.setUint16(recOff + 2, 1); // Unicode BMP
    nameView.setUint16(recOff + 4, 0x0409); // en-US
    nameView.setUint16(recOff + 6, nameId);
    nameView.setUint16(recOff + 8, bytes.length);
    nameView.setUint16(recOff + 10, strCursor);
    name.set(bytes, nameHeaderLen + strCursor);
    strCursor += bytes.length;
  }

  // post v3.0
  const post = new Uint8Array(32);
  new DataView(post.buffer).setUint32(0, 0x00030000);

  // Assemble SFNT tables sorted by tag
  const tables: Array<{ tag: string; data: Uint8Array }> = [
    { tag: 'OS/2', data: os2 },
    { tag: 'cmap', data: cmap },
    { tag: 'glyf', data: glyf },
    { tag: 'head', data: head },
    { tag: 'hhea', data: hhea },
    { tag: 'hmtx', data: hmtx },
    { tag: 'loca', data: loca },
    { tag: 'maxp', data: maxp },
    { tag: 'name', data: name },
    { tag: 'post', data: post },
  ].sort((a, b) => (a.tag < b.tag ? -1 : a.tag > b.tag ? 1 : 0));

  const numTables = tables.length;
  const headerSize = 12 + numTables * 16;
  let dataSize = 0;
  for (const t of tables) dataSize += pad4(t.data.length);

  const sfnt = new Uint8Array(headerSize + dataSize);
  const sfntView = new DataView(sfnt.buffer);
  sfntView.setUint32(0, 0x00010000);
  sfntView.setUint16(4, numTables);
  const tEntrySel = Math.floor(Math.log2(numTables));
  const tSearchRng = (1 << tEntrySel) * 16;
  sfntView.setUint16(6, tSearchRng);
  sfntView.setUint16(8, tEntrySel);
  sfntView.setUint16(10, numTables * 16 - tSearchRng);

  let dataOffset = headerSize;
  let headTableOffset = 0;
  for (let i = 0; i < numTables; i++) {
    const t = tables[i];
    const recOff = 12 + i * 16;
    for (let j = 0; j < 4; j++) sfnt[recOff + j] = t.tag.charCodeAt(j);
    sfntView.setUint32(recOff + 4, calcTableChecksum(t.data));
    sfntView.setUint32(recOff + 8, dataOffset);
    sfntView.setUint32(recOff + 12, t.data.length);
    sfnt.set(t.data, dataOffset);
    if (t.tag === 'head') headTableOffset = dataOffset;
    dataOffset += pad4(t.data.length);
  }

  // Write head.checkSumAdjustment
  const wholeSum = calcTableChecksum(sfnt);
  sfntView.setUint32(headTableOffset + 8, (0xb1b0afba - wholeSum) >>> 0);

  return sfnt;
}
