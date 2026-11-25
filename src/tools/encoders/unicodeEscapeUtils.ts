export type EscapeFormat =
  | 'js-unicode'
  | 'python-c'
  | 'html-entity'
  | 'css-escape'
  | 'codepoints'
  | 'punycode';

export type HtmlEntityStyle = 'hex' | 'decimal' | 'named-hex';

export interface EscapeOptions {
  escapeAscii: boolean;
  useBracedCodePoint: boolean;
  htmlStyle: HtmlEntityStyle;
}

export type CharSeverity = 'normal' | 'invisible' | 'bidi' | 'special-space' | 'control' | 'confusable';

export interface SpecialCharInfo {
  shortTag: string;
  nameZh: string;
  nameEn: string;
  severity: Exclude<CharSeverity, 'normal'>;
}

export interface InspectedToken {
  index: number;
  char: string;
  codePoint: number;
  hexCodePoint: string; // e.g. U+200B
  utf16Escapes: string; // e.g. \uD83D\uDE00
  utf8Hex: string; // e.g. E4 B8 AD
  htmlEntity: string; // e.g. &#x4E2D; or &zwj;
  isAsciiPrintable: boolean;
  isNewline: boolean;
  severity: CharSeverity;
  shortTag: string;
  labelZh: string;
  labelEn: string;
}

export interface TextInspectionReport {
  totalCodePoints: number;
  totalUtf16Units: number;
  totalUtf8Bytes: number;
  tokens: InspectedToken[];
  truncated: boolean;
  invisibleCount: number;
  bidiCount: number;
  specialSpaceCount: number;
  controlCount: number;
  confusableCount: number;
  anomalySummary: Array<{
    codePoint: number;
    hexCodePoint: string;
    shortTag: string;
    severity: Exclude<CharSeverity, 'normal'>;
    labelZh: string;
    labelEn: string;
    count: number;
  }>;
}

// 常见 HTML 命名实体映射（双向共用）
const NAMED_ENTITY_TO_CP: Record<string, number> = {
  quot: 0x0022,
  amp: 0x0026,
  apos: 0x0027,
  lt: 0x003c,
  gt: 0x003e,
  nbsp: 0x00a0,
  iexcl: 0x00a1,
  cent: 0x00a2,
  pound: 0x00a3,
  curren: 0x00a4,
  yen: 0x00a5,
  brvbar: 0x00a6,
  sect: 0x00a7,
  copy: 0x00a9,
  ordf: 0x00aa,
  laquo: 0x00ab,
  not: 0x00ac,
  shy: 0x00ad,
  reg: 0x00ae,
  macr: 0x00af,
  deg: 0x00b0,
  plusmn: 0x00b1,
  sup2: 0x00b2,
  sup3: 0x00b3,
  micro: 0x00b5,
  para: 0x00b6,
  middot: 0x00b7,
  sup1: 0x00b9,
  raquo: 0x00bb,
  frac14: 0x00bc,
  frac12: 0x00bd,
  frac34: 0x00be,
  times: 0x00d7,
  divide: 0x00f7,
  ensp: 0x2002,
  emsp: 0x2003,
  thinsp: 0x2009,
  zwnj: 0x200c,
  zwj: 0x200d,
  lrm: 0x200e,
  rlm: 0x200f,
  ndash: 0x2013,
  mdash: 0x2014,
  lsquo: 0x2018,
  rsquo: 0x2019,
  ldquo: 0x201c,
  rdquo: 0x201d,
  bull: 0x2022,
  hellip: 0x2026,
  permil: 0x2030,
  prime: 0x2032,
  Prime: 0x2033,
  lsaquo: 0x2039,
  rsaquo: 0x203a,
  euro: 0x20ac,
  trade: 0x2122,
  larr: 0x2190,
  uarr: 0x2191,
  rarr: 0x2192,
  darr: 0x2193,
  harr: 0x2194,
  crarr: 0x21b5,
  infin: 0x221e,
  ne: 0x2260,
  equiv: 0x2261,
  le: 0x2264,
  ge: 0x2265,
  check: 0x2713,
  cross: 0x2717,
};

const CP_TO_NAMED_ENTITY = new Map<number, string>();
for (const [name, cp] of Object.entries(NAMED_ENTITY_TO_CP)) {
  if (!CP_TO_NAMED_ENTITY.has(cp)) {
    CP_TO_NAMED_ENTITY.set(cp, name);
  }
}

// 零宽、双向控制、特殊空格及不可见陷阱字符清单
const SPECIAL_CHAR_MAP = new Map<number, SpecialCharInfo>([
  [0x0000, { shortTag: 'NUL', nameZh: '空字符 (NUL)', nameEn: 'Null Character', severity: 'control' }],
  [0x0008, { shortTag: 'BS', nameZh: '退格符 (BS)', nameEn: 'Backspace', severity: 'control' }],
  [0x0009, { shortTag: 'TAB', nameZh: '水平制表符 (Tab)', nameEn: 'Horizontal Tab', severity: 'special-space' }],
  [0x000b, { shortTag: 'VT', nameZh: '垂直制表符 (VT)', nameEn: 'Vertical Tab', severity: 'control' }],
  [0x000c, { shortTag: 'FF', nameZh: '换页符 (FF)', nameEn: 'Form Feed', severity: 'control' }],
  [0x000d, { shortTag: 'CR', nameZh: '回车符 (CR)', nameEn: 'Carriage Return', severity: 'control' }],
  [0x00a0, { shortTag: 'NBSP', nameZh: '不换行空格 (NBSP)', nameEn: 'Non-Breaking Space', severity: 'special-space' }],
  [0x00ad, { shortTag: 'SHY', nameZh: '软连字符 (隐形断词)', nameEn: 'Soft Hyphen', severity: 'invisible' }],
  [0x034f, { shortTag: 'CGJ', nameZh: '组合字形连接符', nameEn: 'Combining Grapheme Joiner', severity: 'invisible' }],
  [0x061c, { shortTag: 'ALM', nameZh: '阿拉伯字母标记', nameEn: 'Arabic Letter Mark', severity: 'bidi' }],
  [0x180e, { shortTag: 'MVS', nameZh: '蒙古语元音分隔符', nameEn: 'Mongolian Vowel Separator', severity: 'invisible' }],
  [0x2000, { shortTag: 'NQSP', nameZh: 'En Quad 空格', nameEn: 'En Quad', severity: 'special-space' }],
  [0x2001, { shortTag: 'MQSP', nameZh: 'Em Quad 空格', nameEn: 'Em Quad', severity: 'special-space' }],
  [0x2002, { shortTag: 'ENSP', nameZh: '半角 En 空格', nameEn: 'En Space', severity: 'special-space' }],
  [0x2003, { shortTag: 'EMSP', nameZh: '全角 Em 空格', nameEn: 'Em Space', severity: 'special-space' }],
  [0x2004, { shortTag: '3/EM', nameZh: '三分之一 Em 空格', nameEn: 'Three-Per-Em Space', severity: 'special-space' }],
  [0x2005, { shortTag: '4/EM', nameZh: '四分之一 Em 空格', nameEn: 'Four-Per-Em Space', severity: 'special-space' }],
  [0x2006, { shortTag: '6/EM', nameZh: '六分之一 Em 空格', nameEn: 'Six-Per-Em Space', severity: 'special-space' }],
  [0x2007, { shortTag: 'FSP', nameZh: '数字等宽空格', nameEn: 'Figure Space', severity: 'special-space' }],
  [0x2008, { shortTag: 'PSP', nameZh: '标点宽度空格', nameEn: 'Punctuation Space', severity: 'special-space' }],
  [0x2009, { shortTag: 'THSP', nameZh: '窄空格 (Thin Space)', nameEn: 'Thin Space', severity: 'special-space' }],
  [0x200a, { shortTag: 'HSP', nameZh: '极窄空格 (Hair Space)', nameEn: 'Hair Space', severity: 'special-space' }],
  [0x200b, { shortTag: 'ZWSP', nameZh: '零宽空格 (Zero Width Space)', nameEn: 'Zero Width Space', severity: 'invisible' }],
  [0x200c, { shortTag: 'ZWNJ', nameZh: '零宽非连接符 (ZWNJ)', nameEn: 'Zero Width Non-Joiner', severity: 'invisible' }],
  [0x200d, { shortTag: 'ZWJ', nameZh: '零宽连接符 (ZWJ)', nameEn: 'Zero Width Joiner', severity: 'invisible' }],
  [0x200e, { shortTag: 'LRM', nameZh: '从左至右方向标记 (LRM)', nameEn: 'Left-to-Right Mark', severity: 'bidi' }],
  [0x200f, { shortTag: 'RLM', nameZh: '从右至左方向标记 (RLM)', nameEn: 'Right-to-Left Mark', severity: 'bidi' }],
  [0x202a, { shortTag: 'LRE', nameZh: '从左至右嵌入 (LRE)', nameEn: 'Left-to-Right Embedding', severity: 'bidi' }],
  [0x202b, { shortTag: 'RLE', nameZh: '从右至左嵌入 (RLE)', nameEn: 'Right-to-Left Embedding', severity: 'bidi' }],
  [0x202c, { shortTag: 'PDF', nameZh: '结束方向格式 (PDF)', nameEn: 'Pop Directional Formatting', severity: 'bidi' }],
  [0x202d, { shortTag: 'LRO', nameZh: '强制从左至右覆写 (LRO)', nameEn: 'Left-to-Right Override', severity: 'bidi' }],
  [0x202e, { shortTag: 'RLO', nameZh: '强制从右至左覆写 (RLO 风险)', nameEn: 'Right-to-Left Override', severity: 'bidi' }],
  [0x202f, { shortTag: 'NNBSP', nameZh: '窄不换行空格', nameEn: 'Narrow No-Break Space', severity: 'special-space' }],
  [0x205f, { shortTag: 'MMSP', nameZh: '数学中等空格', nameEn: 'Medium Mathematical Space', severity: 'special-space' }],
  [0x2060, { shortTag: 'WJ', nameZh: '词连接符 (Word Joiner)', nameEn: 'Word Joiner', severity: 'invisible' }],
  [0x2061, { shortTag: 'FA', nameZh: '隐形函数应用符', nameEn: 'Function Application', severity: 'invisible' }],
  [0x2062, { shortTag: 'IT', nameZh: '隐形乘号', nameEn: 'Invisible Times', severity: 'invisible' }],
  [0x2063, { shortTag: 'IS', nameZh: '隐形分隔符', nameEn: 'Invisible Separator', severity: 'invisible' }],
  [0x2064, { shortTag: 'IP', nameZh: '隐形加号', nameEn: 'Invisible Plus', severity: 'invisible' }],
  [0x2066, { shortTag: 'LRI', nameZh: '从左至右隔离 (LRI)', nameEn: 'Left-to-Right Isolate', severity: 'bidi' }],
  [0x2067, { shortTag: 'RLI', nameZh: '从右至左隔离 (RLI)', nameEn: 'Right-to-Left Isolate', severity: 'bidi' }],
  [0x2068, { shortTag: 'FSI', nameZh: '首个强方向隔离 (FSI)', nameEn: 'First Strong Isolate', severity: 'bidi' }],
  [0x2069, { shortTag: 'PDI', nameZh: '结束方向隔离 (PDI)', nameEn: 'Pop Directional Isolate', severity: 'bidi' }],
  [0x3000, { shortTag: 'IDSP', nameZh: '中文全角空格', nameEn: 'Ideographic Space', severity: 'special-space' }],
  [0xfeff, { shortTag: 'BOM', nameZh: 'UTF-8 BOM / 零宽不换行空格', nameEn: 'Byte Order Mark / ZWNBSP', severity: 'invisible' }],
  [0xfffc, { shortTag: 'OBJ', nameZh: '对象替换占位符 (OBJ)', nameEn: 'Object Replacement Character', severity: 'invisible' }],
]);

// 常见同形混淆字符（西里尔/希腊字母伪装 ASCII）
const CONFUSABLE_MAP = new Map<number, string>([
  [0x0410, 'A (Cyrillic А)'],
  [0x0412, 'B (Cyrillic В)'],
  [0x0415, 'E (Cyrillic Е)'],
  [0x041a, 'K (Cyrillic К)'],
  [0x041c, 'M (Cyrillic М)'],
  [0x041d, 'H (Cyrillic Н)'],
  [0x041e, 'O (Cyrillic О)'],
  [0x0420, 'P (Cyrillic Р)'],
  [0x0421, 'C (Cyrillic С)'],
  [0x0422, 'T (Cyrillic Т)'],
  [0x0425, 'X (Cyrillic Х)'],
  [0x0430, 'a (Cyrillic а)'],
  [0x0435, 'e (Cyrillic е)'],
  [0x043e, 'o (Cyrillic о)'],
  [0x0440, 'p (Cyrillic р)'],
  [0x0441, 'c (Cyrillic с)'],
  [0x0443, 'y (Cyrillic у)'],
  [0x0445, 'x (Cyrillic х)'],
  [0x0456, 'i (Cyrillic і)'],
  [0x0391, 'A (Greek Α)'],
  [0x0392, 'B (Greek Β)'],
  [0x039f, 'O (Greek Ο)'],
  [0x03bf, 'o (Greek ο)'],
]);

export function formatCodePointTag(cp: number): string {
  const hex = cp.toString(16).toUpperCase();
  return `U+${hex.length < 4 ? hex.padStart(4, '0') : hex}`;
}

function toUtf16EscapeUnits(char: string): string {
  const units: string[] = [];
  for (let i = 0; i < char.length; i++) {
    units.push(`\\u${char.charCodeAt(i).toString(16).toUpperCase().padStart(4, '0')}`);
  }
  return units.join('');
}

const utf8Encoder = new TextEncoder();

function toUtf8HexBytes(char: string): string {
  const bytes = utf8Encoder.encode(char);
  return Array.from(bytes, (b) => b.toString(16).toUpperCase().padStart(2, '0')).join(' ');
}

function encodeSingleJsUnicode(cp: number, char: string, opt: EscapeOptions): string {
  if (!opt.escapeAscii && cp >= 0x20 && cp <= 0x7e) {
    return char;
  }
  if (cp === 0x0a) return '\\n';
  if (cp === 0x0d) return '\\r';
  if (cp === 0x09) return '\\t';
  if (cp === 0x08) return '\\b';
  if (cp === 0x0c) return '\\f';
  if (cp <= 0xffff) {
    return `\\u${cp.toString(16).toUpperCase().padStart(4, '0')}`;
  }
  if (opt.useBracedCodePoint) {
    return `\\u{${cp.toString(16).toUpperCase()}}`;
  }
  return toUtf16EscapeUnits(char);
}

function decodeJsUnicode(input: string): string {
  // Handle single-char escapes and \u{H+}, \uHHHH (including surrogate pairs), \xHH
  const resolved = input.replace(
    /\\(u\{([0-9a-fA-F]{1,6})\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|n|r|t|b|f|0|\\|'|"|.)/g,
    (full, token: string, braced?: string, u4?: string, x2?: string) => {
      if (braced !== undefined) {
        const cp = parseInt(braced, 16);
        if (cp >= 0 && cp <= 0x10ffff) {
          return String.fromCodePoint(cp);
        }
        throw new Error(`Invalid code point: \\u{${braced}}`);
      }
      if (u4 !== undefined) {
        return String.fromCharCode(parseInt(u4, 16));
      }
      if (x2 !== undefined) {
        return String.fromCharCode(parseInt(x2, 16));
      }
      switch (token) {
        case 'n': return '\n';
        case 'r': return '\r';
        case 't': return '\t';
        case 'b': return '\b';
        case 'f': return '\f';
        case '0': return '\0';
        case '\\': return '\\';
        case '\'': return '\'';
        case '"': return '"';
        default: return full;
      }
    }
  );
  return resolved;
}

function encodeSinglePythonC(cp: number, char: string, opt: EscapeOptions): string {
  if (!opt.escapeAscii && cp >= 0x20 && cp <= 0x7e) {
    return char;
  }
  if (cp === 0x0a) return '\\n';
  if (cp === 0x0d) return '\\r';
  if (cp === 0x09) return '\\t';
  if (cp <= 0xff) {
    return `\\x${cp.toString(16).toLowerCase().padStart(2, '0')}`;
  }
  if (cp <= 0xffff) {
    return `\\u${cp.toString(16).toLowerCase().padStart(4, '0')}`;
  }
  return `\\U${cp.toString(16).toLowerCase().padStart(8, '0')}`;
}

function decodePythonC(input: string): string {
  return input.replace(
    /\\(U([0-9a-fA-F]{8})|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|n|r|t|0|\\|'|"|.)/g,
    (full, token: string, u8?: string, u4?: string, x2?: string) => {
      if (u8 !== undefined) {
        const cp = parseInt(u8, 16);
        if (cp >= 0 && cp <= 0x10ffff) return String.fromCodePoint(cp);
        throw new Error(`Invalid \\U escape: \\U${u8}`);
      }
      if (u4 !== undefined) return String.fromCharCode(parseInt(u4, 16));
      if (x2 !== undefined) return String.fromCharCode(parseInt(x2, 16));
      switch (token) {
        case 'n': return '\n';
        case 'r': return '\r';
        case 't': return '\t';
        case '0': return '\0';
        case '\\': return '\\';
        case '\'': return '\'';
        case '"': return '"';
        default: return full;
      }
    }
  );
}

function encodeHtmlEntities(input: string, opt: EscapeOptions): string {
  let out = '';
  const mustEscapeXmlChars = new Set([0x22, 0x26, 0x27, 0x3c, 0x3e]);
  for (const char of input) {
    const cp = char.codePointAt(0)!;
    const isVisibleAscii = cp >= 0x20 && cp <= 0x7e;
    const shouldEscape =
      opt.escapeAscii ||
      !isVisibleAscii ||
      mustEscapeXmlChars.has(cp);

    if (!shouldEscape || cp === 0x0a || cp === 0x0d) {
      out += char;
      continue;
    }

    if (opt.htmlStyle === 'named-hex') {
      const named = CP_TO_NAMED_ENTITY.get(cp);
      if (named) {
        out += `&${named};`;
        continue;
      }
      out += `&#x${cp.toString(16).toUpperCase()};`;
    } else if (opt.htmlStyle === 'decimal') {
      out += `&#${cp};`;
    } else {
      out += `&#x${cp.toString(16).toUpperCase()};`;
    }
  }
  return out;
}

function decodeHtmlEntities(input: string): string {
  return input.replace(/&(#x([0-9a-fA-F]+)|#(\d+)|([a-zA-Z][a-zA-Z0-9]+));/g, (full, _body, hex?: string, dec?: string, named?: string) => {
    if (hex !== undefined) {
      const cp = parseInt(hex, 16);
      if (cp >= 1 && cp <= 0x10ffff) return String.fromCodePoint(cp);
      return full;
    }
    if (dec !== undefined) {
      const cp = parseInt(dec, 10);
      if (cp >= 1 && cp <= 0x10ffff) return String.fromCodePoint(cp);
      return full;
    }
    if (named !== undefined && Object.prototype.hasOwnProperty.call(NAMED_ENTITY_TO_CP, named)) {
      return String.fromCodePoint(NAMED_ENTITY_TO_CP[named]);
    }
    return full;
  });
}

function encodeCssEscapes(input: string, opt: EscapeOptions): string {
  const chars = Array.from(input);
  let out = '';
  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const cp = ch.codePointAt(0)!;
    if (!opt.escapeAscii && cp >= 0x20 && cp <= 0x7e) {
      out += ch;
      continue;
    }
    const hex = cp.toString(16).toUpperCase();
    const next = chars[i + 1];
    // Add trailing space when fewer than 6 hex digits and next char is hex or space
    const needSpace = hex.length < 6 && next !== undefined && /^[0-9a-fA-F\s]$/.test(next);
    out += `\\${hex}${needSpace ? ' ' : ''}`;
  }
  return out;
}

function decodeCssEscapes(input: string): string {
  return input.replace(/\\([0-9a-fA-F]{1,6}) ?/g, (full, hex: string) => {
    const cp = parseInt(hex, 16);
    if (cp >= 1 && cp <= 0x10ffff) return String.fromCodePoint(cp);
    return full;
  });
}

function encodeCodePoints(input: string, opt: EscapeOptions): string {
  const tokens: string[] = [];
  for (const ch of input) {
    const cp = ch.codePointAt(0)!;
    if (!opt.escapeAscii && cp === 0x0a) {
      tokens.push('\n');
    } else {
      tokens.push(formatCodePointTag(cp));
    }
  }
  return tokens.join(' ').replace(/ \n /g, '\n');
}

function decodeCodePoints(input: string): string {
  return input.replace(/(?:U\+|\\u\+?|\b0x)([0-9a-fA-F]{1,6})\b[,\s]?/gi, (full, hex: string) => {
    const cp = parseInt(hex, 16);
    if (cp >= 0 && cp <= 0x10ffff) return String.fromCodePoint(cp);
    return full;
  });
}

// ==================== RFC 3492 Punycode ====================
const PUNY_BASE = 36;
const PUNY_TMIN = 1;
const PUNY_TMAX = 26;
const PUNY_SKEW = 38;
const PUNY_DAMP = 700;
const PUNY_INIT_BIAS = 72;
const PUNY_INIT_N = 128;

function punyAdapt(delta: number, numPoints: number, firstTime: boolean): number {
  let d = firstTime ? Math.floor(delta / PUNY_DAMP) : delta >> 1;
  d += Math.floor(d / numPoints);
  let k = 0;
  while (d > ((PUNY_BASE - PUNY_TMIN) * PUNY_TMAX) >> 1) {
    d = Math.floor(d / (PUNY_BASE - PUNY_TMIN));
    k += PUNY_BASE;
  }
  return Math.floor(k + ((PUNY_BASE - PUNY_TMIN + 1) * d) / (d + PUNY_SKEW));
}

function encodeDigit(d: number): string {
  return String.fromCharCode(d + 22 + (d < 26 ? 75 : 0));
}

function decodeDigit(cp: number): number {
  if (cp >= 0x30 && cp <= 0x39) return cp - 22; // 0-9 -> 26..35
  if (cp >= 0x41 && cp <= 0x5a) return cp - 65; // A-Z -> 0..25
  if (cp >= 0x61 && cp <= 0x7a) return cp - 97; // a-z -> 0..25
  return PUNY_BASE;
}

export function punycodeEncodeLabel(label: string): string {
  const cps = Array.from(label, (c) => c.codePointAt(0)!);
  if (cps.every((cp) => cp < 0x80)) {
    return label;
  }

  let out = '';
  let basicCount = 0;
  for (const cp of cps) {
    if (cp < 0x80) {
      out += String.fromCodePoint(cp);
      basicCount++;
    }
  }
  if (basicCount > 0) out += '-';

  let n = PUNY_INIT_N;
  let delta = 0;
  let bias = PUNY_INIT_BIAS;
  let handled = basicCount;

  while (handled < cps.length) {
    let minCp = 0x10ffff + 1;
    for (const cp of cps) {
      if (cp >= n && cp < minCp) minCp = cp;
    }

    delta += (minCp - n) * (handled + 1);
    n = minCp;

    for (const cp of cps) {
      if (cp < n) {
        delta++;
      } else if (cp === n) {
        let q = delta;
        for (let k = PUNY_BASE; ; k += PUNY_BASE) {
          const t = k <= bias ? PUNY_TMIN : k >= bias + PUNY_TMAX ? PUNY_TMAX : k - bias;
          if (q < t) break;
          const digit = t + ((q - t) % (PUNY_BASE - t));
          out += encodeDigit(digit);
          q = Math.floor((q - t) / (PUNY_BASE - t));
        }
        out += encodeDigit(q);
        bias = punyAdapt(delta, handled + 1, handled === basicCount);
        delta = 0;
        handled++;
      }
    }
    delta++;
    n++;
  }

  return `xn--${out}`;
}

export function punycodeDecodeLabel(label: string): string {
  if (!label.toLowerCase().startsWith('xn--')) {
    return label;
  }
  const body = label.slice(4);
  const output: number[] = [];
  const lastDash = body.lastIndexOf('-');

  let pos = 0;
  if (lastDash > 0) {
    for (let i = 0; i < lastDash; i++) {
      output.push(body.charCodeAt(i));
    }
    pos = lastDash + 1;
  }

  let n = PUNY_INIT_N;
  let i = 0;
  let bias = PUNY_INIT_BIAS;

  while (pos < body.length) {
    const oldI = i;
    let w = 1;
    for (let k = PUNY_BASE; ; k += PUNY_BASE) {
      if (pos >= body.length) throw new Error(`Invalid Punycode label: ${label}`);
      const digit = decodeDigit(body.charCodeAt(pos++));
      if (digit >= PUNY_BASE) throw new Error(`Invalid Punycode character in: ${label}`);
      i += digit * w;
      const t = k <= bias ? PUNY_TMIN : k >= bias + PUNY_TMAX ? PUNY_TMAX : k - bias;
      if (digit < t) break;
      w *= PUNY_BASE - t;
    }
    const outLen = output.length + 1;
    bias = punyAdapt(i - oldI, outLen, oldI === 0);
    n += Math.floor(i / outLen);
    i %= outLen;
    output.splice(i, 0, n);
    i++;
  }

  return String.fromCodePoint(...output);
}

function transformHostOrUrl(input: string, dir: 'encode' | 'decode'): string {
  // Support multiline list of domains / URLs seamlessly
  return input
    .split(/(\r?\n|\s+)/)
    .map((chunk) => {
      if (!chunk || /^\s+$/.test(chunk)) return chunk;
      // Extract scheme, host, suffix if URL-like
      const match = /^([a-zA-Z][a-zA-Z0-9+.-]*:\/\/)?([^\/?#:@]+@)?([^\/?#:]+)(:\d+)?(.*)$/.exec(chunk);
      if (!match) return chunk;
      const [, scheme = '', auth = '', host, port = '', rest = ''] = match;
      const convertedHost = host
        .split('.')
        .map((lbl) => (lbl ? (dir === 'encode' ? punycodeEncodeLabel(lbl) : punycodeDecodeLabel(lbl)) : lbl))
        .join('.');
      return `${scheme}${auth}${convertedHost}${port}${rest}`;
    })
    .join('');
}

export function transformUnicodeText(
  input: string,
  mode: 'encode' | 'decode',
  format: EscapeFormat,
  options: EscapeOptions
): string {
  if (!input) return '';

  if (mode === 'encode') {
    switch (format) {
      case 'js-unicode':
        return Array.from(input)
          .map((ch) => encodeSingleJsUnicode(ch.codePointAt(0)!, ch, options))
          .join('');
      case 'python-c':
        return Array.from(input)
          .map((ch) => encodeSinglePythonC(ch.codePointAt(0)!, ch, options))
          .join('');
      case 'html-entity':
        return encodeHtmlEntities(input, options);
      case 'css-escape':
        return encodeCssEscapes(input, options);
      case 'codepoints':
        return encodeCodePoints(input, options);
      case 'punycode':
        return transformHostOrUrl(input, 'encode');
    }
  }

  switch (format) {
    case 'js-unicode':
      return decodeJsUnicode(input);
    case 'python-c':
      return decodePythonC(input);
    case 'html-entity':
      return decodeHtmlEntities(input);
    case 'css-escape':
      return decodeCssEscapes(input);
    case 'codepoints':
      return decodeCodePoints(input);
    case 'punycode':
      return transformHostOrUrl(input, 'decode');
  }
}

export function inspectUnicodeText(text: string, maxTokens = 400): TextInspectionReport {
  const chars = Array.from(text);
  const totalUtf16Units = text.length;
  const totalUtf8Bytes = utf8Encoder.encode(text).length;

  const tokens: InspectedToken[] = [];
  const anomalyBuckets = new Map<
    number,
    {
      codePoint: number;
      hexCodePoint: string;
      shortTag: string;
      severity: Exclude<CharSeverity, 'normal'>;
      labelZh: string;
      labelEn: string;
      count: number;
    }
  >();

  let invisibleCount = 0;
  let bidiCount = 0;
  let specialSpaceCount = 0;
  let controlCount = 0;
  let confusableCount = 0;

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const cp = ch.codePointAt(0)!;
    const special = SPECIAL_CHAR_MAP.get(cp);
    const confusable = CONFUSABLE_MAP.get(cp);
    const isC0Control =
      !special && ((cp >= 0x00 && cp <= 0x1f && cp !== 0x0a) || (cp >= 0x7f && cp <= 0x9f));

    let severity: CharSeverity = 'normal';
    let shortTag = '';
    let labelZh = '';
    let labelEn = '';

    if (special) {
      severity = special.severity;
      shortTag = special.shortTag;
      labelZh = special.nameZh;
      labelEn = special.nameEn;
    } else if (isC0Control) {
      severity = 'control';
      shortTag = `CTRL`;
      labelZh = `控制字符 ${formatCodePointTag(cp)}`;
      labelEn = `Control Char ${formatCodePointTag(cp)}`;
    } else if (confusable) {
      severity = 'confusable';
      shortTag = 'HOMO';
      labelZh = `疑似同形字符：形似 ${confusable}`;
      labelEn = `Confusable homoglyph: looks like ${confusable}`;
    }

    if (severity === 'invisible') invisibleCount++;
    else if (severity === 'bidi') bidiCount++;
    else if (severity === 'special-space') specialSpaceCount++;
    else if (severity === 'control') controlCount++;
    else if (severity === 'confusable') confusableCount++;

    if (severity !== 'normal') {
      const existing = anomalyBuckets.get(cp);
      if (existing) {
        existing.count++;
      } else {
        anomalyBuckets.set(cp, {
          codePoint: cp,
          hexCodePoint: formatCodePointTag(cp),
          shortTag,
          severity,
          labelZh,
          labelEn,
          count: 1,
        });
      }
    }

    if (i < maxTokens) {
      const named = CP_TO_NAMED_ENTITY.get(cp);
      tokens.push({
        index: i,
        char: ch,
        codePoint: cp,
        hexCodePoint: formatCodePointTag(cp),
        utf16Escapes: toUtf16EscapeUnits(ch),
        utf8Hex: toUtf8HexBytes(ch),
        htmlEntity: named ? `&${named};` : `&#x${cp.toString(16).toUpperCase()};`,
        isAsciiPrintable: cp >= 0x20 && cp <= 0x7e,
        isNewline: cp === 0x0a,
        severity,
        shortTag,
        labelZh,
        labelEn,
      });
    }
  }

  return {
    totalCodePoints: chars.length,
    totalUtf16Units,
    totalUtf8Bytes,
    tokens,
    truncated: chars.length > maxTokens,
    invisibleCount,
    bidiCount,
    specialSpaceCount,
    controlCount,
    confusableCount,
    anomalySummary: Array.from(anomalyBuckets.values()),
  };
}

export function stripInvisibleAndBidiChars(text: string): string {
  return Array.from(text)
    .filter((ch) => {
      const cp = ch.codePointAt(0)!;
      const info = SPECIAL_CHAR_MAP.get(cp);
      if (info && (info.severity === 'invisible' || info.severity === 'bidi')) {
        return false;
      }
      return true;
    })
    .join('');
}

export function normalizeSpecialSpaces(text: string): string {
  return Array.from(text)
    .map((ch) => {
      const cp = ch.codePointAt(0)!;
      const info = SPECIAL_CHAR_MAP.get(cp);
      if (info && info.severity === 'special-space' && cp !== 0x0009) {
        return ' ';
      }
      return ch;
    })
    .join('');
}
