export type TextBinaryEncoding = 'utf-8' | 'ascii' | 'utf-16be' | 'utf-16le';
export type BinaryDelimiter = 'space' | 'none' | 'newline' | 'comma' | 'hyphen';

export interface TextBinaryOptions {
  encoding: TextBinaryEncoding;
  delimiter: BinaryDelimiter;
  padZero: boolean;
  prefix: boolean;
}

export interface TextToBinaryResult {
  ok: boolean;
  binary: string;
  byteCount: number;
  bitCount: number;
  errorType?: 'nonAscii';
  errorDetail?: string;
}

export interface BinaryToTextResult {
  ok: boolean;
  text: string;
  byteCount: number;
  bitCount: number;
  errorType?:
    | 'invalidChar'
    | 'invalidLength'
    | 'tokenTooLong'
    | 'invalidUtf8'
    | 'invalidAsciiByte'
    | 'oddUtf16Bytes';
  errorDetail?: string;
}

export interface ByteDetail {
  dec: number;
  hex: string;
  bin: string;
}

export interface CharByteBreakdown {
  index: number;
  char: string;
  displayChar: string;
  isControl: boolean;
  codePoint: string;
  bytes: ByteDetail[];
  outOfAsciiRange?: boolean;
}

const DELIMITER_MAP: Record<BinaryDelimiter, string> = {
  space: ' ',
  none: '',
  newline: '\n',
  comma: ', ',
  hyphen: '-'
};

/**
 * 将字符串按指定编码转换为字节数组
 */
export function encodeTextToBytes(
  text: string,
  encoding: TextBinaryEncoding
): { ok: true; bytes: Uint8Array } | { ok: false; errorType: 'nonAscii'; errorDetail: string } {
  if (!text) {
    return { ok: true, bytes: new Uint8Array(0) };
  }

  if (encoding === 'utf-8') {
    return { ok: true, bytes: new TextEncoder().encode(text) };
  }

  if (encoding === 'ascii') {
    const chars = Array.from(text);
    const bytes = new Uint8Array(chars.length);
    const invalid: string[] = [];
    for (let i = 0; i < chars.length; i++) {
      const cp = chars[i].codePointAt(0) ?? 0;
      if (cp > 127) {
        if (invalid.length < 3) invalid.push(chars[i]);
      } else {
        bytes[i] = cp;
      }
    }
    if (invalid.length > 0) {
      return { ok: false, errorType: 'nonAscii', errorDetail: invalid.join(' ') };
    }
    return { ok: true, bytes };
  }

  // UTF-16BE / UTF-16LE（按 JavaScript UTF-16 代码单元处理，完整保留代理对）
  const bytes = new Uint8Array(text.length * 2);
  const isLE = encoding === 'utf-16le';
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (isLE) {
      bytes[i * 2] = code & 0xff;
      bytes[i * 2 + 1] = (code >> 8) & 0xff;
    } else {
      bytes[i * 2] = (code >> 8) & 0xff;
      bytes[i * 2 + 1] = code & 0xff;
    }
  }
  return { ok: true, bytes };
}

/**
 * 将文本转换为二进制字符串
 */
export function textToBinary(text: string, options: TextBinaryOptions): TextToBinaryResult {
  if (!text) {
    return { ok: true, binary: '', byteCount: 0, bitCount: 0 };
  }

  const encoded = encodeTextToBytes(text, options.encoding);
  if (!encoded.ok) {
    return {
      ok: false,
      binary: '',
      byteCount: 0,
      bitCount: 0,
      errorType: encoded.errorType,
      errorDetail: encoded.errorDetail
    };
  }

  const { bytes } = encoded;
  const sep = DELIMITER_MAP[options.delimiter];
  const parts: string[] = [];
  let totalBits = 0;

  for (let i = 0; i < bytes.length; i++) {
    let bin = bytes[i].toString(2);
    if (options.padZero) {
      bin = bin.padStart(8, '0');
    }
    totalBits += bin.length;
    if (options.prefix) {
      bin = '0b' + bin;
    }
    parts.push(bin);
  }

  return {
    ok: true,
    binary: parts.join(sep),
    byteCount: bytes.length,
    bitCount: totalBits
  };
}

/**
 * 将二进制字符串解码为文本（自动兼容多种分隔符及 0b 前缀）
 */
export function binaryToText(binary: string, encoding: TextBinaryEncoding): BinaryToTextResult {
  const trimmed = binary.trim();
  if (!trimmed) {
    return { ok: true, text: '', byteCount: 0, bitCount: 0 };
  }

  // 移除诸如 0b01001000 或 ,0b01001000 中的 0b / 0B 前缀
  const normalized = trimmed.replace(/\b0[bB](?=[01])/g, ' ');
  const rawTokens = normalized.split(/[\s,;|_\-]+/).filter(Boolean);

  if (rawTokens.length === 0) {
    return { ok: true, text: '', byteCount: 0, bitCount: 0 };
  }

  const byteList: number[] = [];
  let bitCount = 0;

  for (const token of rawTokens) {
    if (!/^[01]+$/.test(token)) {
      const badChar = token.match(/[^01]/)?.[0] || token;
      return {
        ok: false,
        text: '',
        byteCount: 0,
        bitCount: 0,
        errorType: 'invalidChar',
        errorDetail: badChar
      };
    }

    if (token.length <= 8) {
      byteList.push(parseInt(token, 2));
      bitCount += token.length;
    } else if (token.length % 8 === 0) {
      // 连续无分隔符或 16-bit 合并块，按 8 位一组切分
      for (let i = 0; i < token.length; i += 8) {
        const chunk = token.slice(i, i + 8);
        byteList.push(parseInt(chunk, 2));
      }
      bitCount += token.length;
    } else {
      return {
        ok: false,
        text: '',
        byteCount: 0,
        bitCount: token.length,
        errorType: rawTokens.length === 1 ? 'invalidLength' : 'tokenTooLong',
        errorDetail: String(token.length)
      };
    }
  }

  const bytes = new Uint8Array(byteList);

  if (encoding === 'ascii') {
    for (let i = 0; i < bytes.length; i++) {
      if (bytes[i] > 127) {
        return {
          ok: false,
          text: '',
          byteCount: bytes.length,
          bitCount,
          errorType: 'invalidAsciiByte',
          errorDetail: `0x${bytes[i].toString(16).toUpperCase()}`
        };
      }
    }
    const text = new TextDecoder('ascii').decode(bytes);
    return { ok: true, text, byteCount: bytes.length, bitCount };
  }

  if (encoding === 'utf-16be' || encoding === 'utf-16le') {
    if (bytes.length % 2 !== 0) {
      return {
        ok: false,
        text: '',
        byteCount: bytes.length,
        bitCount,
        errorType: 'oddUtf16Bytes',
        errorDetail: String(bytes.length)
      };
    }
    try {
      const text = new TextDecoder(encoding, { fatal: true }).decode(bytes);
      return { ok: true, text, byteCount: bytes.length, bitCount };
    } catch {
      return {
        ok: false,
        text: '',
        byteCount: bytes.length,
        bitCount,
        errorType: 'invalidUtf8'
      };
    }
  }

  // UTF-8
  try {
    const text = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    return { ok: true, text, byteCount: bytes.length, bitCount };
  } catch {
    return {
      ok: false,
      text: '',
      byteCount: bytes.length,
      bitCount,
      errorType: 'invalidUtf8'
    };
  }
}

function formatDisplayChar(ch: string): { displayChar: string; isControl: boolean } {
  const controlMap: Record<string, string> = {
    ' ': 'SPACE',
    '\n': 'LF (\\n)',
    '\r': 'CR (\\r)',
    '\t': 'TAB (\\t)',
    '\0': 'NUL (\\0)'
  };
  if (controlMap[ch]) {
    return { displayChar: controlMap[ch], isControl: true };
  }
  const cp = ch.codePointAt(0) ?? 0;
  if (cp < 32 || cp === 127) {
    return {
      displayChar: `CTRL (0x${cp.toString(16).toUpperCase().padStart(2, '0')})`,
      isControl: true
    };
  }
  return { displayChar: ch, isControl: false };
}

/**
 * 拆解文本中每个 Unicode 字符及其对应的字节/二进制详情
 */
export function inspectTextBytes(
  text: string,
  encoding: TextBinaryEncoding,
  maxItems = 100
): { items: CharByteBreakdown[]; totalChars: number; truncated: boolean } {
  if (!text) {
    return { items: [], totalChars: 0, truncated: false };
  }

  const chars = Array.from(text);
  const limit = Math.min(chars.length, maxItems);
  const items: CharByteBreakdown[] = [];

  for (let i = 0; i < limit; i++) {
    const ch = chars[i];
    const cp = ch.codePointAt(0) ?? 0;
    const codePoint = `U+${cp.toString(16).toUpperCase().padStart(4, '0')}`;
    const { displayChar, isControl } = formatDisplayChar(ch);

    const encoded = encodeTextToBytes(ch, encoding);
    if (!encoded.ok) {
      items.push({
        index: i,
        char: ch,
        displayChar,
        isControl,
        codePoint,
        bytes: [],
        outOfAsciiRange: true
      });
      continue;
    }

    const bytes: ByteDetail[] = Array.from(encoded.bytes).map(b => ({
      dec: b,
      hex: b.toString(16).toUpperCase().padStart(2, '0'),
      bin: b.toString(2).padStart(8, '0')
    }));

    items.push({
      index: i,
      char: ch,
      displayChar,
      isControl,
      codePoint,
      bytes
    });
  }

  return {
    items,
    totalChars: chars.length,
    truncated: chars.length > maxItems
  };
}
