export type ConfigFormat = 'json' | 'yaml' | 'toml' | 'xml' | 'ini' | 'env' | 'properties';
export type InputFormatChoice = 'auto' | ConfigFormat;
export type IndentOption = '2' | '4' | 'tab';
export type FlattenDelimiter = '.' | '_' | '__';

export type WarningCode =
  | 'tomlNullOmitted'
  | 'tomlRootWrapped'
  | 'iniRootWrapped'
  | 'envFlattened'
  | 'propertiesFlattened'
  | 'iniFlattened'
  | 'yamlTabFallback'
  | 'xmlRootWrapped';

export interface ConfigFormatMeta {
  id: ConfigFormat;
  label: string;
  extension: string;
  defaultFilename: string;
  mimeType: string;
  acceptExtensions: string[];
}

export const CONFIG_FORMATS: ConfigFormatMeta[] = [
  {
    id: 'json',
    label: 'JSON',
    extension: 'json',
    defaultFilename: 'config.json',
    mimeType: 'application/json;charset=utf-8',
    acceptExtensions: ['.json', '.jsonc']
  },
  {
    id: 'yaml',
    label: 'YAML',
    extension: 'yaml',
    defaultFilename: 'config.yaml',
    mimeType: 'text/yaml;charset=utf-8',
    acceptExtensions: ['.yaml', '.yml']
  },
  {
    id: 'toml',
    label: 'TOML',
    extension: 'toml',
    defaultFilename: 'config.toml',
    mimeType: 'application/toml;charset=utf-8',
    acceptExtensions: ['.toml']
  },
  {
    id: 'xml',
    label: 'XML',
    extension: 'xml',
    defaultFilename: 'config.xml',
    mimeType: 'application/xml;charset=utf-8',
    acceptExtensions: ['.xml']
  },
  {
    id: 'ini',
    label: 'INI',
    extension: 'ini',
    defaultFilename: 'config.ini',
    mimeType: 'text/plain;charset=utf-8',
    acceptExtensions: ['.ini', '.cfg', '.conf']
  },
  {
    id: 'env',
    label: '.env',
    extension: 'env',
    defaultFilename: '.env',
    mimeType: 'text/plain;charset=utf-8',
    acceptExtensions: ['.env']
  },
  {
    id: 'properties',
    label: '.properties',
    extension: 'properties',
    defaultFilename: 'application.properties',
    mimeType: 'text/plain;charset=utf-8',
    acceptExtensions: ['.properties']
  }
];

export interface ConfigConvertOptions {
  indent: IndentOption;
  sortKeys: boolean;
  tolerantJson: boolean;
  inferTypes: boolean;
  unflattenKeys: boolean;
  unflattenDelimiter: FlattenDelimiter;
  jsonMinify: boolean;
  yamlFlowArrays: boolean;
  xmlRootTag: string;
  xmlDeclaration: boolean;
  envUppercaseKeys: boolean;
  envDelimiter: FlattenDelimiter;
  envQuoteStyle: 'auto' | 'double';
}

export const DEFAULT_CONVERT_OPTIONS: ConfigConvertOptions = {
  indent: '2',
  sortKeys: false,
  tolerantJson: true,
  inferTypes: true,
  unflattenKeys: true,
  unflattenDelimiter: '.',
  jsonMinify: false,
  yamlFlowArrays: false,
  xmlRootTag: 'config',
  xmlDeclaration: true,
  envUppercaseKeys: true,
  envDelimiter: '_',
  envQuoteStyle: 'auto'
};

export interface ConfigStats {
  keys: number;
  depth: number;
  rootType: 'object' | 'array' | 'primitive' | 'empty';
}

export interface ConfigConvertError {
  message: string;
  line: number | null;
  column: number | null;
}

export interface ConfigConvertResult {
  ok: boolean;
  output: string;
  data: unknown;
  detectedFormat: ConfigFormat;
  warnings: WarningCode[];
  stats: ConfigStats;
  error?: ConfigConvertError;
}

export class ConfigParseError extends Error {
  line: number | null;
  column: number | null;

  constructor(message: string, line: number | null = null, column: number | null = null) {
    super(message);
    this.name = 'ConfigParseError';
    this.line = line;
    this.column = column;
  }
}

function isPlainObject(val: unknown): val is Record<string, unknown> {
  return val !== null && typeof val === 'object' && !Array.isArray(val) && !(val instanceof Date);
}

function getIndentString(indent: IndentOption, allowTab = true): string {
  if (indent === 'tab') return allowTab ? '\t' : '  ';
  return indent === '4' ? '    ' : '  ';
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n');
}

function sortKeysRecursive(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map(sortKeysRecursive);
  }
  if (isPlainObject(value)) {
    const out: Record<string, unknown> = {};
    for (const key of Object.keys(value).sort((a, b) => a.localeCompare(b))) {
      out[key] = sortKeysRecursive(value[key]);
    }
    return out;
  }
  return value;
}

/**
 * 统计配置结构中的键数量与最大嵌套深度
 */
export function inspectConfigStats(data: unknown): ConfigStats {
  if (data === undefined) {
    return { keys: 0, depth: 0, rootType: 'empty' };
  }
  if (Array.isArray(data)) {
    let keys = 0;
    let maxDepth = 1;
    const walk = (v: unknown, d: number) => {
      if (d > maxDepth) maxDepth = d;
      if (Array.isArray(v)) {
        for (const item of v) walk(item, d + 1);
      } else if (isPlainObject(v)) {
        const entries = Object.entries(v);
        keys += entries.length;
        for (const [, child] of entries) walk(child, d + 1);
      }
    };
    walk(data, 1);
    return { keys, depth: maxDepth, rootType: 'array' };
  }
  if (isPlainObject(data)) {
    let keys = 0;
    let maxDepth = 0;
    const walk = (v: unknown, d: number) => {
      if (d > maxDepth) maxDepth = d;
      if (Array.isArray(v)) {
        for (const item of v) walk(item, d + 1);
      } else if (isPlainObject(v)) {
        const entries = Object.entries(v);
        keys += entries.length;
        for (const [, child] of entries) walk(child, d + 1);
      }
    };
    walk(data, 1);
    return { keys, depth: Object.keys(data).length === 0 ? 1 : maxDepth, rootType: 'object' };
  }
  return { keys: 0, depth: 0, rootType: 'primitive' };
}

/**
 * 标量类型推断（用于 XML / INI / ENV / Properties 文本值）
 */
function inferScalarValue(raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === 'true') return true;
  if (trimmed === 'false') return false;
  if (trimmed === 'null') return null;
  if (/^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?$/.test(trimmed)) {
    const num = Number(trimmed);
    if (Number.isFinite(num)) return num;
  }
  return raw;
}

/**
 * 展开带分隔符的扁平键名（例如 spring.datasource.url -> { spring: { datasource: { url } } }）
 */
function unflattenObject(flat: Record<string, unknown>, delimiter: FlattenDelimiter): Record<string, unknown> {
  const root: Record<string, unknown> = {};

  for (const [fullKey, value] of Object.entries(flat)) {
    if (!fullKey.includes(delimiter)) {
      root[fullKey] = value;
      continue;
    }

    const parts = fullKey.split(delimiter).filter((p, idx, arr) => {
      // 保留首尾非空分片，避免连续分隔符产生空键
      if (p !== '') return true;
      return idx === 0 && arr.length === 1;
    });

    if (parts.length <= 1) {
      root[fullKey] = value;
      continue;
    }

    let curr: Record<string, unknown> = root;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      const existing = curr[part];
      if (!isPlainObject(existing)) {
        curr[part] = {};
      }
      curr = curr[part] as Record<string, unknown>;
    }
    curr[parts[parts.length - 1]] = value;
  }

  return normalizeNumericArrays(root) as Record<string, unknown>;
}

/**
 * 若对象所有键均为连续 0..N-1 的非负整数索引，则还原为数组
 */
function normalizeNumericArrays(node: unknown): unknown {
  if (Array.isArray(node)) {
    return node.map(normalizeNumericArrays);
  }
  if (!isPlainObject(node)) {
    return node;
  }

  const keys = Object.keys(node);
  if (keys.length === 0) return node;

  const isContiguousIndex = keys.every((k, idx) => /^\d+$/.test(k) && Number(k) === idx);
  if (isContiguousIndex) {
    return keys.map(k => normalizeNumericArrays(node[k]));
  }

  const out: Record<string, unknown> = {};
  for (const key of keys) {
    out[key] = normalizeNumericArrays(node[key]);
  }
  return out;
}

/**
 * 将嵌套对象/数组扁平化为键值对（用于 .env / .properties）
 */
function flattenObject(
  data: unknown,
  delimiter: string,
  prefix = ''
): Array<{ key: string; value: unknown }> {
  const result: Array<{ key: string; value: unknown }> = [];

  if (Array.isArray(data)) {
    data.forEach((item, index) => {
      const nextKey = prefix ? `${prefix}${delimiter}${index}` : String(index);
      if (isPlainObject(item) || Array.isArray(item)) {
        result.push(...flattenObject(item, delimiter, nextKey));
      } else {
        result.push({ key: nextKey, value: item });
      }
    });
    return result;
  }

  if (isPlainObject(data)) {
    const entries = Object.entries(data);
    if (entries.length === 0 && prefix) {
      result.push({ key: prefix, value: '' });
      return result;
    }
    for (const [k, v] of entries) {
      const nextKey = prefix ? `${prefix}${delimiter}${k}` : k;
      if (isPlainObject(v) || Array.isArray(v)) {
        result.push(...flattenObject(v, delimiter, nextKey));
      } else {
        result.push({ key: nextKey, value: v });
      }
    }
    return result;
  }

  if (prefix) {
    result.push({ key: prefix, value: data });
  } else {
    result.push({ key: 'value', value: data });
  }
  return result;
}

function hasNestedStructure(data: unknown): boolean {
  if (Array.isArray(data)) return true;
  if (!isPlainObject(data)) return false;
  return Object.values(data).some(v => isPlainObject(v) || Array.isArray(v));
}

// ============================================================================
// 格式自动识别
// ============================================================================

export function detectFormatFromFilename(filename?: string): ConfigFormat | null {
  if (!filename) return null;
  const lower = filename.toLowerCase().trim();
  const base = lower.split(/[/\\]/).pop() || lower;
  if (base === '.env' || base.startsWith('.env.')) return 'env';
  for (const fmt of CONFIG_FORMATS) {
    if (fmt.acceptExtensions.some(ext => lower.endsWith(ext))) {
      return fmt.id;
    }
  }
  return null;
}

export function detectConfigFormat(input: string, filenameHint?: string): ConfigFormat {
  const byName = detectFormatFromFilename(filenameHint);
  const text = stripBom(normalizeNewlines(input)).trim();
  if (!text) return byName || 'json';

  // 1. XML 检测
  if (text.startsWith('<?xml') || (/^<[A-Za-z_][\w:.-]*[\s>\/]/.test(text) && text.endsWith('>'))) {
    return 'xml';
  }

  // 2. JSON / JSONC 检测（注意区分 [section] 与 JSON 数组 [...]）
  const firstNonComment = stripJsoncForDetection(text).trimStart();
  if (firstNonComment.startsWith('{')) {
    return 'json';
  }
  if (firstNonComment.startsWith('[')) {
    const firstLine = firstNonComment.split('\n')[0].trim();
    const looksLikeSectionHeader =
      /^\[\[[^\]\n]+\]\]\s*(#.*)?$/.test(firstLine) ||
      /^\[[^\]"'\n]+\]\s*(#.*|;.*)?$/.test(firstLine);
    if (!looksLikeSectionHeader) {
      return 'json';
    }
  }

  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const nonCommentLines = lines.filter(l => !l.startsWith('#') && !l.startsWith(';') && !l.startsWith('!'));

  // 3. TOML 强特征：[[array_of_tables]]、带类型的 = 赋值或内联表
  const hasDoubleBracket = nonCommentLines.some(l => /^\[\[[^\]\n]+\]\](\s*#.*)?$/.test(l));
  if (hasDoubleBracket) return 'toml';

  const hasSectionHeader = nonCommentLines.some(l => /^\[[^\]\n]+\](\s*(#|;).*)?$/.test(l));
  const hasSemicolonComment = lines.some(l => l.startsWith(';'));

  if (hasSectionHeader) {
    if (hasSemicolonComment) return 'ini';
    const eqLines = nonCommentLines.filter(l => !l.startsWith('[') && l.includes('='));
    const looksToml = eqLines.some(l => {
      const rhs = l.slice(l.indexOf('=') + 1).trim();
      return (
        rhs.startsWith('"') ||
        rhs.startsWith("'") ||
        rhs.startsWith('[') ||
        rhs.startsWith('{') ||
        rhs === 'true' ||
        rhs === 'false' ||
        /^-?\d[\d_]*(\.\d[\d_]*)?$/.test(rhs)
      );
    });
    const hasBareWords = eqLines.some(l => {
      const rhs = l.slice(l.indexOf('=') + 1).trim().replace(/\s*[#;].*$/, '').trim();
      return (
        rhs.length > 0 &&
        !rhs.startsWith('"') &&
        !rhs.startsWith("'") &&
        !rhs.startsWith('[') &&
        !rhs.startsWith('{') &&
        rhs !== 'true' &&
        rhs !== 'false' &&
        !/^-?\d[\d_]*(\.\d[\d_]*)?([eE][+-]?\d+)?$/.test(rhs) &&
        !/^\d{4}-\d{2}-\d{2}/.test(rhs)
      );
    });
    if (hasBareWords) return 'ini';
    if (looksToml) return 'toml';
    return 'ini';
  }

  // 4. YAML 强特征：--- 文档头、- 列表项、缩进键值结构
  if (nonCommentLines[0] === '---' || nonCommentLines.some(l => l.startsWith('- '))) {
    return 'yaml';
  }

  const rawLines = text.split('\n').filter(l => l.trim() && !l.trim().startsWith('#') && !l.trim().startsWith('!'));
  const hasIndentedColon = rawLines.some(l => /^\s{2,}[A-Za-z0-9_.-]+\s*:/.test(l));
  const hasKeyOnlyColon = nonCommentLines.some(l => /^[A-Za-z0-9_."' -]+:\s*(#.*)?$/.test(l));
  if (hasIndentedColon || hasKeyOnlyColon) {
    return 'yaml';
  }

  // 5. .env vs .properties vs TOML vs INI (无 section header 的情况)
  const hasExclamationComment = lines.some(l => l.startsWith('!'));
  if (hasExclamationComment) return 'properties';

  const hasExportEnv = nonCommentLines.some(l => /^export\s+[A-Za-z_][A-Za-z0-9_]*\s*=/.test(l));
  if (hasExportEnv) return 'env';

  const eqCount = nonCommentLines.filter(l => /^[A-Za-z0-9_."'-]+\s*=/.test(l)).length;
  const colonCount = nonCommentLines.filter(l => /^[A-Za-z0-9_."'-]+\s*:\s*/.test(l)).length;

  if (eqCount >= colonCount && eqCount > 0) {
    const hasUpperEnvKeys = nonCommentLines.some(l => /^[A-Z][A-Z0-9_]{1,}=/.test(l));
    const hasDottedKeys = nonCommentLines.some(l => /^[a-z0-9_-]+(\.[a-z0-9_-]+)+\s*[=:]/.test(l));
    const hasTomlSpacedEq = nonCommentLines.some(l => {
      const m = l.match(/^[A-Za-z0-9_.-]+\s+=\s+(.+)$/);
      if (!m) return false;
      const rhs = m[1].trim();
      return rhs.startsWith('"') || rhs.startsWith("'") || rhs.startsWith('[') || rhs.startsWith('{') || rhs === 'true' || rhs === 'false' || /^-?\d/.test(rhs);
    });

    if (hasTomlSpacedEq) return 'toml';
    if (hasDottedKeys && !hasUpperEnvKeys) return 'properties';
    if (hasUpperEnvKeys) return 'env';
    if (byName) return byName;
    return 'env';
  }

  if (colonCount > 0) {
    // 区分 YAML (`key: value`) 与 Properties (`a.b.c:value` / `\uXXXX`)
    const looksLikeProperties =
      nonCommentLines.every(l => /^[A-Za-z0-9_.-]+\s*[:=]/.test(l)) &&
      nonCommentLines.some(l => /^[a-z0-9_-]+\.[a-z0-9_.-]+\s*[:=]/.test(l));
    if (looksLikeProperties && !nonCommentLines.some(l => l.includes(': '))) {
      return 'properties';
    }
    return 'yaml';
  }

  return byName || 'yaml';
}

function stripJsoncForDetection(text: string): string {
  return text.replace(/^\s*(\/\/.*|\/\*[\s\S]*?\*\/)\s*/gm, '');
}

// ============================================================================
// 1. JSON 解析与序列化
// ============================================================================

/**
 * 字符级 JSONC 清洗（保留换行以维持行号映射，仅去除字符串外的注释和尾随逗号）
 */
function stripJsoncCommentsAndTrailingCommas(text: string): string {
  const chars = text.split('');
  const out: string[] = [];
  const len = chars.length;
  let i = 0;

  while (i < len) {
    const ch = chars[i];
    // 字符串字面量
    if (ch === '"') {
      out.push(ch);
      i++;
      while (i < len) {
        const c = chars[i];
        out.push(c);
        if (c === '\\' && i + 1 < len) {
          i++;
          out.push(chars[i]);
        } else if (c === '"') {
          i++;
          break;
        }
        i++;
      }
      continue;
    }

    // 单行注释 //...
    if (ch === '/' && chars[i + 1] === '/') {
      while (i < len && chars[i] !== '\n') {
        out.push(' ');
        i++;
      }
      continue;
    }

    // 多行注释 /* ... */
    if (ch === '/' && chars[i + 1] === '*') {
      out.push(' ', ' ');
      i += 2;
      while (i < len) {
        if (chars[i] === '*' && chars[i + 1] === '/') {
          out.push(' ', ' ');
          i += 2;
          break;
        }
        out.push(chars[i] === '\n' ? '\n' : ' ');
        i++;
      }
      continue;
    }

    // 尾随逗号
    if (ch === ',') {
      let j = i + 1;
      let skipped = false;
      while (j < len) {
        const next = chars[j];
        if (next === ' ' || next === '\t' || next === '\n' || next === '\r') {
          j++;
          continue;
        }
        if (next === '/' && chars[j + 1] === '/') {
          while (j < len && chars[j] !== '\n') j++;
          continue;
        }
        if (next === '/' && chars[j + 1] === '*') {
          j += 2;
          while (j < len && !(chars[j] === '*' && chars[j + 1] === '/')) j++;
          j += 2;
          continue;
        }
        if (next === '}' || next === ']') {
          skipped = true;
        }
        break;
      }
      if (skipped) {
        out.push(' ');
        i++;
        continue;
      }
    }

    out.push(ch);
    i++;
  }

  return out.join('');
}

function locateJsonError(text: string): { line: number; column: number } | null {
  const len = text.length;
  let pos = 0;
  let line = 1;
  let col = 1;

  const advance = (n = 1) => {
    for (let k = 0; k < n && pos < len; k++) {
      if (text[pos] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      pos++;
    }
  };

  const skipWs = () => {
    while (pos < len && (text[pos] === ' ' || text[pos] === '\t' || text[pos] === '\n' || text[pos] === '\r')) {
      advance();
    }
  };

  const errPos = () => ({ line, column: col });

  function parseValue(): { line: number; column: number } | null {
    skipWs();
    if (pos >= len) return errPos();
    const ch = text[pos];

    if (ch === '{') {
      advance();
      skipWs();
      if (text[pos] === '}') {
        advance();
        return null;
      }
      while (pos < len) {
        skipWs();
        if (text[pos] !== '"') return errPos();
        const strErr = parseString();
        if (strErr) return strErr;
        skipWs();
        if (text[pos] !== ':') return errPos();
        advance();
        const valErr = parseValue();
        if (valErr) return valErr;
        skipWs();
        if (text[pos] === ',') {
          advance();
          continue;
        }
        if (text[pos] === '}') {
          advance();
          return null;
        }
        return errPos();
      }
      return errPos();
    }

    if (ch === '[') {
      advance();
      skipWs();
      if (text[pos] === ']') {
        advance();
        return null;
      }
      while (pos < len) {
        const valErr = parseValue();
        if (valErr) return valErr;
        skipWs();
        if (text[pos] === ',') {
          advance();
          continue;
        }
        if (text[pos] === ']') {
          advance();
          return null;
        }
        return errPos();
      }
      return errPos();
    }

    if (ch === '"') return parseString();
    if (text.startsWith('true', pos)) { advance(4); return null; }
    if (text.startsWith('false', pos)) { advance(5); return null; }
    if (text.startsWith('null', pos)) { advance(4); return null; }

    if (ch === '-' || (ch >= '0' && ch <= '9')) {
      const slice = text.slice(pos);
      const m = slice.match(/^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?/);
      if (!m) return errPos();
      advance(m[0].length);
      return null;
    }

    return errPos();
  }

  function parseString(): { line: number; column: number } | null {
    advance(); // skip opening '"'
    while (pos < len) {
      const ch = text[pos];
      if (ch === '"') {
        advance();
        return null;
      }
      if (ch === '\n' || ch === '\r' || ch.charCodeAt(0) < 0x20) {
        return errPos();
      }
      if (ch === '\\') {
        advance();
        if (pos >= len) return errPos();
        const esc = text[pos];
        if (!'"\\/bfnrtu'.includes(esc)) return errPos();
        if (esc === 'u') {
          if (!/^[0-9a-fA-F]{4}/.test(text.slice(pos + 1, pos + 5))) return errPos();
          advance(5);
          continue;
        }
      }
      advance();
    }
    return errPos();
  }

  const res = parseValue();
  if (res) return res;
  skipWs();
  if (pos < len) return errPos();
  return null;
}

function parseJson(input: string, options: ConfigConvertOptions): unknown {
  const clean = stripBom(normalizeNewlines(input));
  const target = options.tolerantJson ? stripJsoncCommentsAndTrailingCommas(clean) : clean;
  try {
    return JSON.parse(target);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid JSON';
    let line: number | null = null;
    let column: number | null = null;
    const lcMatch = msg.match(/line\s+(\d+)\s+column\s+(\d+)/i);
    if (lcMatch) {
      line = Number(lcMatch[1]);
      column = Number(lcMatch[2]);
    } else {
      const posMatch = msg.match(/position\s+(\d+)/i);
      if (posMatch) {
        const pos = Number(posMatch[1]);
        const before = target.slice(0, pos).split('\n');
        line = before.length;
        column = before[before.length - 1].length + 1;
      } else {
        const located = locateJsonError(target);
        if (located) {
          line = located.line;
          column = located.column;
        }
      }
    }
    throw new ConfigParseError(msg, line, column);
  }
}

function serializeJson(data: unknown, options: ConfigConvertOptions): string {
  if (options.jsonMinify) {
    return JSON.stringify(data);
  }
  const indent = options.indent === 'tab' ? '\t' : Number(options.indent);
  return JSON.stringify(data, null, indent);
}

// ============================================================================
// 2. YAML 解析与序列化
// ============================================================================

interface YamlLine {
  lineNo: number;
  raw: string;
  indent: number;
  content: string; // 已移除前导缩进及行尾注释
}

function stripYamlComment(line: string): string {
  let inSingle = false;
  let inDouble = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === "'" && !inDouble) {
      if (inSingle && line[i + 1] === "'") {
        i++;
        continue;
      }
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      let backslashes = 0;
      let k = i - 1;
      while (k >= 0 && line[k] === '\\') {
        backslashes++;
        k--;
      }
      if (backslashes % 2 === 0) {
        inDouble = !inDouble;
      }
    } else if (ch === '#' && !inSingle && !inDouble) {
      if (i === 0 || /\s/.test(line[i - 1])) {
        return line.slice(0, i).replace(/\s+$/, '');
      }
    }
  }
  return line.replace(/\s+$/, '');
}

function unescapeYamlDoubleString(s: string, lineNo: number): string {
  let out = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch !== '\\') {
      out += ch;
      continue;
    }
    i++;
    if (i >= s.length) throw new ConfigParseError('Unterminated escape in YAML double-quoted string', lineNo);
    const esc = s[i];
    switch (esc) {
      case '0': out += '\0'; break;
      case 'a': out += '\x07'; break;
      case 'b': out += '\b'; break;
      case 't': out += '\t'; break;
      case 'n': out += '\n'; break;
      case 'v': out += '\v'; break;
      case 'f': out += '\f'; break;
      case 'r': out += '\r'; break;
      case 'e': out += '\x1b'; break;
      case ' ': out += ' '; break;
      case '"': out += '"'; break;
      case '/': out += '/'; break;
      case '\\': out += '\\'; break;
      case 'N': out += '\u0085'; break;
      case '_': out += '\u00a0'; break;
      case 'x': {
        const hex = s.slice(i + 1, i + 3);
        if (!/^[0-9a-fA-F]{2}$/.test(hex)) throw new ConfigParseError(`Invalid \\x escape: \\x${hex}`, lineNo);
        out += String.fromCharCode(parseInt(hex, 16));
        i += 2;
        break;
      }
      case 'u': {
        const hex = s.slice(i + 1, i + 5);
        if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw new ConfigParseError(`Invalid \\u escape: \\u${hex}`, lineNo);
        out += String.fromCharCode(parseInt(hex, 16));
        i += 4;
        break;
      }
      case 'U': {
        const hex = s.slice(i + 1, i + 9);
        if (!/^[0-9a-fA-F]{8}$/.test(hex)) throw new ConfigParseError(`Invalid \\U escape: \\U${hex}`, lineNo);
        out += String.fromCodePoint(parseInt(hex, 16));
        i += 8;
        break;
      }
      default:
        out += esc;
    }
  }
  return out;
}

function parseYamlScalar(raw: string, lineNo: number): unknown {
  const trimmed = raw.trim();
  if (trimmed === '' || trimmed === 'null' || trimmed === 'Null' || trimmed === 'NULL' || trimmed === '~') {
    return null;
  }
  if (trimmed === 'true' || trimmed === 'True' || trimmed === 'TRUE') return true;
  if (trimmed === 'false' || trimmed === 'False' || trimmed === 'FALSE') return false;

  if (trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) {
    return unescapeYamlDoubleString(trimmed.slice(1, -1), lineNo);
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2) {
    return trimmed.slice(1, -1).replace(/''/g, "'");
  }

  // 整数与浮点数（避免将 "0123"、版本号 "1.2.3" 或日期 "2026-11-15" 误转为数字）
  if (/^-?(0|[1-9][0-9]*)$/.test(trimmed)) {
    const n = Number(trimmed);
    if (Number.isSafeInteger(n)) return n;
  }
  if (/^0x[0-9a-fA-F]+$/.test(trimmed)) {
    return parseInt(trimmed.slice(2), 16);
  }
  if (/^0o[0-7]+$/.test(trimmed)) {
    return parseInt(trimmed.slice(2), 8);
  }
  if (/^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?$/.test(trimmed) && (trimmed.includes('.') || /[eE]/.test(trimmed))) {
    const f = Number(trimmed);
    if (Number.isFinite(f)) return f;
  }

  return trimmed;
}

function splitYamlFlowItems(inner: string, lineNo: number): string[] {
  const items: string[] = [];
  let current = '';
  let depthBracket = 0;
  let depthBrace = 0;
  let inSingle = false;
  let inDouble = false;

  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i];
    if (ch === "'" && !inDouble) {
      if (inSingle && inner[i + 1] === "'") {
        current += "''";
        i++;
        continue;
      }
      inSingle = !inSingle;
      current += ch;
    } else if (ch === '"' && !inSingle) {
      let backslashes = 0;
      let k = i - 1;
      while (k >= 0 && inner[k] === '\\') {
        backslashes++;
        k--;
      }
      if (backslashes % 2 === 0) inDouble = !inDouble;
      current += ch;
    } else if (!inSingle && !inDouble) {
      if (ch === '[') depthBracket++;
      else if (ch === ']') depthBracket--;
      else if (ch === '{') depthBrace++;
      else if (ch === '}') depthBrace--;

      if (ch === ',' && depthBracket === 0 && depthBrace === 0) {
        if (current.trim()) items.push(current.trim());
        current = '';
        continue;
      }
      current += ch;
    } else {
      current += ch;
    }
  }

  if (inSingle || inDouble) {
    throw new ConfigParseError('Unterminated string in YAML flow collection', lineNo);
  }
  if (depthBracket !== 0 || depthBrace !== 0) {
    throw new ConfigParseError('Mismatched brackets in YAML flow collection', lineNo);
  }
  if (current.trim()) items.push(current.trim());
  return items;
}

function findYamlColonOutsideQuotes(text: string): number {
  let inSingle = false;
  let inDouble = false;
  let depthBracket = 0;
  let depthBrace = 0;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch === "'" && !inDouble) {
      if (inSingle && text[i + 1] === "'") {
        i++;
        continue;
      }
      inSingle = !inSingle;
    } else if (ch === '"' && !inSingle) {
      let backslashes = 0;
      let k = i - 1;
      while (k >= 0 && text[k] === '\\') {
        backslashes++;
        k--;
      }
      if (backslashes % 2 === 0) inDouble = !inDouble;
    } else if (!inSingle && !inDouble) {
      if (ch === '[') depthBracket++;
      else if (ch === ']') depthBracket--;
      else if (ch === '{') depthBrace++;
      else if (ch === '}') depthBrace--;
      else if (ch === ':' && depthBracket === 0 && depthBrace === 0) {
        if (i + 1 === text.length || /\s/.test(text[i + 1])) {
          return i;
        }
      }
    }
  }
  return -1;
}

function parseYamlFlowValue(raw: string, lineNo: number, anchors: Map<string, unknown>): unknown {
  const s = raw.trim();
  if (s.startsWith('*')) {
    const name = s.slice(1).trim();
    if (!anchors.has(name)) throw new ConfigParseError(`Unknown YAML alias: *${name}`, lineNo);
    return structuredCloneSafe(anchors.get(name));
  }
  if (s.startsWith('[') && s.endsWith(']')) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return [];
    return splitYamlFlowItems(inner, lineNo).map(item => parseYamlFlowValue(item, lineNo, anchors));
  }
  if (s.startsWith('{') && s.endsWith('}')) {
    const inner = s.slice(1, -1).trim();
    if (!inner) return {};
    const obj: Record<string, unknown> = {};
    for (const pair of splitYamlFlowItems(inner, lineNo)) {
      const colonIdx = findYamlColonOutsideQuotes(pair);
      if (colonIdx === -1) {
        throw new ConfigParseError(`Invalid flow mapping entry: ${pair}`, lineNo);
      }
      const rawKey = pair.slice(0, colonIdx).trim();
      const rawVal = pair.slice(colonIdx + 1).trim();
      const key = String(parseYamlScalar(rawKey, lineNo) ?? '');
      obj[key] = rawVal ? parseYamlFlowValue(rawVal, lineNo, anchors) : null;
    }
    return obj;
  }
  return parseYamlScalar(s, lineNo);
}

function structuredCloneSafe<T>(val: T): T {
  if (val === null || typeof val !== 'object') return val;
  if (Array.isArray(val)) return val.map(v => structuredCloneSafe(v)) as unknown as T;
  const copy: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(val as Record<string, unknown>)) {
    copy[k] = structuredCloneSafe(v);
  }
  return copy as T;
}

function extractAnchor(text: string): { anchor: string | null; rest: string } {
  const match = text.match(/^&([A-Za-z0-9_-]+)(?:\s+(.*))?$/);
  if (!match) return { anchor: null, rest: text };
  return { anchor: match[1], rest: (match[2] ?? '').trim() };
}

function parseYaml(input: string): unknown {
  const rawLines = stripBom(normalizeNewlines(input)).split('\n');
  const parsedLines: YamlLine[] = [];

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (!raw.trim()) continue;
    const indentMatch = raw.match(/^([ \t]*)/);
    const leading = indentMatch ? indentMatch[1] : '';
    if (leading.includes('\t')) {
      throw new ConfigParseError('YAML indentation cannot contain tab characters', i + 1, leading.indexOf('\t') + 1);
    }
    const stripped = stripYamlComment(raw.slice(leading.length));
    if (!stripped) continue;
    parsedLines.push({
      lineNo: i + 1,
      raw,
      indent: leading.length,
      content: stripped
    });
  }

  if (parsedLines.length === 0) return {};

  // 分割多文档 --- / ...
  const docSlices: YamlLine[][] = [];
  let currentDoc: YamlLine[] = [];
  for (const line of parsedLines) {
    if (line.indent === 0 && (line.content === '---' || line.content.startsWith('--- '))) {
      if (currentDoc.length > 0) {
        docSlices.push(currentDoc);
        currentDoc = [];
      }
      const after = line.content.slice(3).trim();
      if (after) {
        currentDoc.push({ ...line, content: after });
      }
      continue;
    }
    if (line.indent === 0 && line.content === '...') {
      if (currentDoc.length > 0) {
        docSlices.push(currentDoc);
        currentDoc = [];
      }
      continue;
    }
    currentDoc.push(line);
  }
  if (currentDoc.length > 0) docSlices.push(currentDoc);

  if (docSlices.length === 0) return {};
  if (docSlices.length === 1) {
    return parseYamlLines(docSlices[0], rawLines);
  }
  return docSlices.map(doc => parseYamlLines(doc, rawLines));
}

function parseYamlLines(lines: YamlLine[], rawLines: string[]): unknown {
  const anchors = new Map<string, unknown>();
  let idx = 0;

  function collectMultilineFlow(startContent: string, startLineNo: number): string {
    let buf = startContent;
    let openBrackets = 0;
    let openBraces = 0;
    const countDelims = (str: string) => {
      let inS = false;
      let inD = false;
      for (let i = 0; i < str.length; i++) {
        const ch = str[i];
        if (ch === "'" && !inD) inS = !inS;
        else if (ch === '"' && !inS && str[i - 1] !== '\\') inD = !inD;
        else if (!inS && !inD) {
          if (ch === '[') openBrackets++;
          else if (ch === ']') openBrackets--;
          else if (ch === '{') openBraces++;
          else if (ch === '}') openBraces--;
        }
      }
    };
    countDelims(buf);
    while ((openBrackets > 0 || openBraces > 0) && idx < lines.length) {
      const next = lines[idx++];
      buf += ' ' + next.content;
      openBrackets = 0;
      openBraces = 0;
      countDelims(buf);
    }
    if (openBrackets !== 0 || openBraces !== 0) {
      throw new ConfigParseError('Unterminated YAML flow collection', startLineNo);
    }
    return buf;
  }

  function parseBlockScalar(header: string, parentIndent: number, headerLineNo: number): string {
    const mode = header[0] as '|' | '>';
    let chomp: 'clip' | 'strip' | 'keep' = 'clip';
    let explicitIndent: number | null = null;
    for (const ch of header.slice(1)) {
      if (ch === '-') chomp = 'strip';
      else if (ch === '+') chomp = 'keep';
      else if (/[1-9]/.test(ch)) explicitIndent = Number(ch);
    }

    // 使用原始行保留空行与缩进
    const startRawIdx = headerLineNo; // 0-based index of next raw line (headerLineNo is 1-based)
    const collected: string[] = [];
    let blockIndent: number | null = explicitIndent !== null ? parentIndent + explicitIndent : null;
    let consumedRaw = 0;

    for (let r = startRawIdx; r < rawLines.length; r++) {
      const rawLine = rawLines[r];
      const trimmed = rawLine.trim();
      if (!trimmed) {
        collected.push('');
        consumedRaw++;
        continue;
      }
      const indentLen = (rawLine.match(/^( *)/)?.[1] ?? '').length;
      if (blockIndent === null) {
        if (indentLen <= parentIndent) break;
        blockIndent = indentLen;
      } else if (indentLen < blockIndent) {
        break;
      }
      collected.push(rawLine.slice(blockIndent));
      consumedRaw++;
    }

    const lastLineNo = startRawIdx + consumedRaw;
    while (idx < lines.length && lines[idx].lineNo <= lastLineNo) {
      idx++;
    }

    // 尾部空行处理
    let trailingNewlines = 0;
    while (collected.length > 0 && collected[collected.length - 1] === '') {
      collected.pop();
      trailingNewlines++;
    }

    let body: string;
    if (mode === '|') {
      body = collected.join('\n');
    } else {
      // 折叠模式 >
      const paragraphs: string[] = [];
      let buf: string[] = [];
      for (const l of collected) {
        if (l === '') {
          if (buf.length > 0) {
            paragraphs.push(buf.join(' '));
            buf = [];
          }
          paragraphs.push('');
        } else if (/^\s/.test(l)) {
          if (buf.length > 0) {
            paragraphs.push(buf.join(' '));
            buf = [];
          }
          paragraphs.push(l);
        } else {
          buf.push(l);
        }
      }
      if (buf.length > 0) paragraphs.push(buf.join(' '));
      body = paragraphs.join('\n');
    }

    if (collected.length === 0 && trailingNewlines === 0) return '';
    if (chomp === 'strip') return body;
    if (chomp === 'keep') return body + '\n'.repeat(1 + trailingNewlines);
    return body + '\n';
  }

  function parseInlineOrBlockValue(
    rawVal: string,
    parentIndent: number,
    lineNo: number
  ): unknown {
    const { anchor, rest } = extractAnchor(rawVal);

    let val: unknown;
    if (!rest) {
      if (idx < lines.length && lines[idx].indent > parentIndent) {
        val = parseNode(lines[idx].indent);
      } else {
        val = null;
      }
    } else if (/^[|>][-+\d]*$/.test(rest)) {
      val = parseBlockScalar(rest, parentIndent, lineNo);
    } else if (rest.startsWith('[') || rest.startsWith('{')) {
      const fullFlow = collectMultilineFlow(rest, lineNo);
      val = parseYamlFlowValue(fullFlow, lineNo, anchors);
    } else if (rest.startsWith('*')) {
      const name = rest.slice(1).trim();
      if (!anchors.has(name)) throw new ConfigParseError(`Unknown YAML alias: *${name}`, lineNo);
      val = structuredCloneSafe(anchors.get(name));
    } else {
      val = parseYamlScalar(rest, lineNo);
    }

    if (anchor) anchors.set(anchor, val);
    return val;
  }

  function isSequenceLine(content: string): boolean {
    return content === '-' || content.startsWith('- ');
  }

  function parseNode(expectedIndent: number): unknown {
    if (idx >= lines.length) return null;
    const first = lines[idx];

    if (first.indent < expectedIndent) return null;

    if (isSequenceLine(first.content)) {
      return parseSequence(first.indent);
    }

    const colonIdx = findYamlColonOutsideQuotes(first.content);
    if (colonIdx !== -1) {
      return parseMapping(first.indent);
    }

    // 顶层纯流式或单标量值
    idx++;
    if (first.content.startsWith('[') || first.content.startsWith('{')) {
      const fullFlow = collectMultilineFlow(first.content, first.lineNo);
      return parseYamlFlowValue(fullFlow, first.lineNo, anchors);
    }
    return parseYamlScalar(first.content, first.lineNo);
  }

  function parseSequence(seqIndent: number): unknown[] {
    const arr: unknown[] = [];

    while (idx < lines.length) {
      const line = lines[idx];
      if (line.indent < seqIndent) break;
      if (line.indent > seqIndent) {
        throw new ConfigParseError('Unexpected YAML indentation in sequence', line.lineNo, line.indent + 1);
      }
      if (!isSequenceLine(line.content)) break;

      idx++;
      const afterDash = line.content.slice(1).trim();

      if (!afterDash) {
        if (idx < lines.length && lines[idx].indent > seqIndent) {
          arr.push(parseNode(lines[idx].indent));
        } else {
          arr.push(null);
        }
        continue;
      }

      // 处理 `- - nested`
      if (isSequenceLine(afterDash)) {
        const innerIndent = seqIndent + 2;
        lines.splice(idx, 0, {
          lineNo: line.lineNo,
          raw: line.raw,
          indent: innerIndent,
          content: afterDash
        });
        arr.push(parseSequence(innerIndent));
        continue;
      }

      // 处理 `- key: value`（行内开始的映射项）
      const colonIdx = findYamlColonOutsideQuotes(afterDash);
      if (colonIdx !== -1) {
        const itemIndent = line.indent + (line.raw.slice(line.indent).indexOf(afterDash));
        const itemObj: Record<string, unknown> = {};
        const keyRaw = afterDash.slice(0, colonIdx).trim();
        const valRaw = afterDash.slice(colonIdx + 1).trim();
        const key = String(parseYamlScalar(keyRaw, line.lineNo) ?? '');
        const firstVal = parseInlineOrBlockValue(valRaw, itemIndent, line.lineNo);
        if (key === '<<') {
          mergeYamlAlias(itemObj, firstVal, line.lineNo);
        } else {
          itemObj[key] = firstVal;
        }
        if (idx < lines.length && lines[idx].indent === itemIndent && !isSequenceLine(lines[idx].content)) {
          const restMap = parseMapping(itemIndent);
          Object.assign(itemObj, restMap);
        }
        arr.push(itemObj);
        continue;
      }

      arr.push(parseInlineOrBlockValue(afterDash, seqIndent, line.lineNo));
    }

    return arr;
  }

  function mergeYamlAlias(target: Record<string, unknown>, src: unknown, lineNo: number) {
    if (isPlainObject(src)) {
      for (const [k, v] of Object.entries(src)) {
        if (!(k in target)) target[k] = structuredCloneSafe(v);
      }
    } else if (Array.isArray(src)) {
      for (const item of src) {
        if (!isPlainObject(item)) {
          throw new ConfigParseError('YAML merge key << requires mapping or sequence of mappings', lineNo);
        }
        for (const [k, v] of Object.entries(item)) {
          if (!(k in target)) target[k] = structuredCloneSafe(v);
        }
      }
    } else {
      throw new ConfigParseError('YAML merge key << requires mapping alias', lineNo);
    }
  }

  function parseMapping(mapIndent: number): Record<string, unknown> {
    const obj: Record<string, unknown> = {};

    while (idx < lines.length) {
      const line = lines[idx];
      if (line.indent < mapIndent) break;
      if (line.indent > mapIndent) {
        throw new ConfigParseError('Unexpected YAML indentation in mapping', line.lineNo, line.indent + 1);
      }
      if (isSequenceLine(line.content)) break;

      const colonIdx = findYamlColonOutsideQuotes(line.content);
      if (colonIdx === -1) {
        throw new ConfigParseError(`Expected ':' in YAML mapping entry`, line.lineNo);
      }

      idx++;
      const keyRaw = line.content.slice(0, colonIdx).trim();
      const valRaw = line.content.slice(colonIdx + 1).trim();
      const key = String(parseYamlScalar(keyRaw, line.lineNo) ?? '');
      const val = parseInlineOrBlockValue(valRaw, mapIndent, line.lineNo);

      if (key === '<<') {
        mergeYamlAlias(obj, val, line.lineNo);
      } else {
        obj[key] = val;
      }
    }

    return obj;
  }

  return parseNode(lines[0].indent);
}

function needsYamlKeyQuotes(key: string): boolean {
  if (key === '') return true;
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(key)) return true;
  if (/^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?$/.test(key)) return true;
  if (/^[\s]|[\s]$/.test(key)) return true;
  return /[:#\[\]{},&*!|>'"%@`?]/.test(key) || /[\n\r\t]/.test(key);
}

function formatYamlKey(key: string): string {
  return needsYamlKeyQuotes(key) ? JSON.stringify(key) : key;
}

function needsYamlStringQuotes(val: string): boolean {
  if (val === '') return true;
  if (/^(true|false|null|yes|no|on|off|~)$/i.test(val)) return true;
  if (/^-?\d+(\.\d+)?([eE][+-]?\d+)?$/.test(val) || /^0[xo][0-9a-fA-F]+$/.test(val)) return true;
  if (/^\s|\s$/.test(val)) return true;
  if (/^[-?:,\[\]{}#&*!|>'"%@`]/.test(val)) return true;
  if (val.includes(': ') || val.includes(' #') || val.endsWith(':')) return true;
  if (/[\x00-\x08\x0b\x0c\x0e-\x1f\t]/.test(val)) return true;
  return false;
}

function serializeYaml(data: unknown, options: ConfigConvertOptions): { output: string; warnings: WarningCode[] } {
  const warnings: WarningCode[] = [];
  if (options.indent === 'tab') {
    warnings.push('yamlTabFallback');
  }
  const indentUnit = getIndentString(options.indent, false);

  function renderScalar(val: unknown): string {
    if (val === null || val === undefined) return 'null';
    if (typeof val === 'boolean' || typeof val === 'number') return String(val);
    if (val instanceof Date) return val.toISOString();
    const s = String(val);
    return needsYamlStringQuotes(s) ? JSON.stringify(s) : s;
  }

  function isSimplePrimitiveArray(arr: unknown[]): boolean {
    return arr.length > 0 && arr.length <= 8 && arr.every(v => v === null || typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean');
  }

  function renderNode(val: unknown, level: number): string[] {
    const pad = indentUnit.repeat(level);

    if (val === null || typeof val !== 'object' || val instanceof Date) {
      return [`${pad}${renderScalar(val)}`];
    }

    if (Array.isArray(val)) {
      if (val.length === 0) return [`${pad}[]`];
      const lines: string[] = [];
      for (const item of val) {
        if (isPlainObject(item)) {
          const entries = Object.entries(item);
          if (entries.length === 0) {
            lines.push(`${pad}- {}`);
            continue;
          }
          entries.forEach(([k, v], idx) => {
            const prefix = idx === 0 ? `${pad}- ` : `${pad}  `;
            const keyStr = formatYamlKey(k);
            if (typeof v === 'string' && v.includes('\n')) {
              const chomp = v.endsWith('\n') ? '|' : '|-';
              lines.push(`${prefix}${keyStr}: ${chomp}`);
              const bodyLines = (v.endsWith('\n') ? v.slice(0, -1) : v).split('\n');
              for (const bl of bodyLines) {
                lines.push(bl === '' ? '' : `${pad}  ${indentUnit}${bl}`);
              }
            } else if (Array.isArray(v) && v.length === 0) {
              lines.push(`${prefix}${keyStr}: []`);
            } else if (Array.isArray(v) && options.yamlFlowArrays && isSimplePrimitiveArray(v)) {
              lines.push(`${prefix}${keyStr}: [${v.map(renderScalar).join(', ')}]`);
            } else if (isPlainObject(v) && Object.keys(v).length === 0) {
              lines.push(`${prefix}${keyStr}: {}`);
            } else if (isPlainObject(v) || Array.isArray(v)) {
              lines.push(`${prefix}${keyStr}:`);
              lines.push(...renderNode(v, level + 2));
            } else {
              lines.push(`${prefix}${keyStr}: ${renderScalar(v)}`);
            }
          });
        } else if (Array.isArray(item)) {
          if (item.length === 0) {
            lines.push(`${pad}- []`);
          } else {
            lines.push(`${pad}-`);
            lines.push(...renderNode(item, level + 1));
          }
        } else if (typeof item === 'string' && item.includes('\n')) {
          const chomp = item.endsWith('\n') ? '|' : '|-';
          lines.push(`${pad}- ${chomp}`);
          const bodyLines = (item.endsWith('\n') ? item.slice(0, -1) : item).split('\n');
          for (const bl of bodyLines) {
            lines.push(bl === '' ? '' : `${pad}${indentUnit}${bl}`);
          }
        } else {
          lines.push(`${pad}- ${renderScalar(item)}`);
        }
      }
      return lines;
    }

    const entries = Object.entries(val as Record<string, unknown>);
    if (entries.length === 0) return [`${pad}{}`];

    const lines: string[] = [];
    for (const [k, v] of entries) {
      const keyStr = formatYamlKey(k);
      if (typeof v === 'string' && v.includes('\n')) {
        const chomp = v.endsWith('\n') ? '|' : '|-';
        lines.push(`${pad}${keyStr}: ${chomp}`);
        const bodyLines = (v.endsWith('\n') ? v.slice(0, -1) : v).split('\n');
        for (const bl of bodyLines) {
          lines.push(bl === '' ? '' : `${pad}${indentUnit}${bl}`);
        }
      } else if (Array.isArray(v) && v.length === 0) {
        lines.push(`${pad}${keyStr}: []`);
      } else if (Array.isArray(v) && options.yamlFlowArrays && isSimplePrimitiveArray(v)) {
        lines.push(`${pad}${keyStr}: [${v.map(renderScalar).join(', ')}]`);
      } else if (isPlainObject(v) && Object.keys(v).length === 0) {
        lines.push(`${pad}${keyStr}: {}`);
      } else if (isPlainObject(v) || Array.isArray(v)) {
        lines.push(`${pad}${keyStr}:`);
        lines.push(...renderNode(v, level + 1));
      } else {
        lines.push(`${pad}${keyStr}: ${renderScalar(v)}`);
      }
    }
    return lines;
  }

  return {
    output: renderNode(data, 0).join('\n'),
    warnings
  };
}

// ============================================================================
// 3. TOML 解析与序列化
// ============================================================================

function parseToml(input: string): Record<string, unknown> {
  const src = stripBom(normalizeNewlines(input));
  let pos = 0;
  let line = 1;
  let col = 1;
  const len = src.length;

  const root: Record<string, unknown> = {};
  let currentTable: Record<string, unknown> = root;
  const definedTables = new Set<string>();
  const arrayTables = new Set<string>();

  function peek(offset = 0): string {
    return pos + offset < len ? src[pos + offset] : '';
  }

  function advance(): string {
    const ch = src[pos++];
    if (ch === '\n') {
      line++;
      col = 1;
    } else {
      col++;
    }
    return ch;
  }

  function errorHere(msg: string): ConfigParseError {
    return new ConfigParseError(msg, line, col);
  }

  function skipHorizontalSpace() {
    while (pos < len && (src[pos] === ' ' || src[pos] === '\t')) {
      advance();
    }
  }

  function skipWhitespaceAndComments() {
    while (pos < len) {
      const ch = src[pos];
      if (ch === ' ' || ch === '\t' || ch === '\n') {
        advance();
      } else if (ch === '#') {
        while (pos < len && src[pos] !== '\n') advance();
      } else {
        break;
      }
    }
  }

  function expectLineEnd() {
    skipHorizontalSpace();
    if (pos < len && src[pos] === '#') {
      while (pos < len && src[pos] !== '\n') advance();
    }
    if (pos < len) {
      if (src[pos] === '\n') {
        advance();
      } else {
        throw errorHere(`Unexpected token '${src[pos]}' at end of line`);
      }
    }
  }

  function parseBasicString(multiline: boolean): string {
    let out = '';
    if (multiline && src[pos] === '\n') {
      advance();
    }
    while (pos < len) {
      if (multiline) {
        if (src.slice(pos, pos + 3) === '"""') {
          pos += 3;
          col += 3;
          // TOML 允许 """" 或 """"" 末尾最多额外 2 个引号
          while (src[pos] === '"' && out.length >= 0) {
            if (src.slice(pos, pos + 3) === '"""') break;
            out += '"';
            advance();
          }
          return out;
        }
      } else if (src[pos] === '"') {
        advance();
        return out;
      } else if (src[pos] === '\n') {
        throw errorHere('Unterminated TOML basic string');
      }

      const ch = advance();
      if (ch === '\\') {
        if (pos >= len) throw errorHere('Unterminated escape sequence');
        if (multiline && (src[pos] === '\n' || src[pos] === ' ' || src[pos] === '\t')) {
          // 行尾反斜杠：跳过直到下一个非空白字符
          let sawNewline = false;
          while (pos < len && (src[pos] === ' ' || src[pos] === '\t' || src[pos] === '\n')) {
            if (src[pos] === '\n') sawNewline = true;
            advance();
          }
          if (!sawNewline) throw errorHere('Invalid line-ending backslash in multiline string');
          continue;
        }
        const esc = advance();
        switch (esc) {
          case 'b': out += '\b'; break;
          case 't': out += '\t'; break;
          case 'n': out += '\n'; break;
          case 'f': out += '\f'; break;
          case 'r': out += '\r'; break;
          case '"': out += '"'; break;
          case '\\': out += '\\'; break;
          case 'u': {
            const hex = src.slice(pos, pos + 4);
            if (!/^[0-9a-fA-F]{4}$/.test(hex)) throw errorHere(`Invalid \\u escape: ${hex}`);
            out += String.fromCharCode(parseInt(hex, 16));
            for (let k = 0; k < 4; k++) advance();
            break;
          }
          case 'U': {
            const hex = src.slice(pos, pos + 8);
            if (!/^[0-9a-fA-F]{8}$/.test(hex)) throw errorHere(`Invalid \\U escape: ${hex}`);
            out += String.fromCodePoint(parseInt(hex, 16));
            for (let k = 0; k < 8; k++) advance();
            break;
          }
          default:
            throw errorHere(`Invalid escape sequence \\${esc}`);
        }
      } else {
        out += ch;
      }
    }
    throw errorHere('Unterminated TOML string');
  }

  function parseLiteralString(multiline: boolean): string {
    let out = '';
    if (multiline && src[pos] === '\n') {
      advance();
    }
    while (pos < len) {
      if (multiline) {
        if (src.slice(pos, pos + 3) === "'''") {
          pos += 3;
          col += 3;
          while (src[pos] === "'") {
            out += "'";
            advance();
          }
          return out;
        }
      } else if (src[pos] === "'") {
        advance();
        return out;
      } else if (src[pos] === '\n') {
        throw errorHere('Unterminated TOML literal string');
      }
      out += advance();
    }
    throw errorHere('Unterminated TOML literal string');
  }

  function parseKeyPart(): string {
    skipHorizontalSpace();
    if (pos >= len) throw errorHere('Expected key');
    const ch = src[pos];
    if (ch === '"') {
      advance();
      return parseBasicString(false);
    }
    if (ch === "'") {
      advance();
      return parseLiteralString(false);
    }
    let key = '';
    while (pos < len && /[A-Za-z0-9_-]/.test(src[pos])) {
      key += advance();
    }
    if (!key) throw errorHere(`Invalid TOML key character '${src[pos] ?? 'EOF'}'`);
    return key;
  }

  function parseKeyPath(): string[] {
    const parts: string[] = [parseKeyPart()];
    while (true) {
      skipHorizontalSpace();
      if (src[pos] === '.') {
        advance();
        parts.push(parseKeyPart());
      } else {
        break;
      }
    }
    return parts;
  }

  function setDottedKey(target: Record<string, unknown>, path: string[], value: unknown) {
    let curr = target;
    for (let i = 0; i < path.length - 1; i++) {
      const seg = path[i];
      if (!(seg in curr)) {
        curr[seg] = {};
      } else if (!isPlainObject(curr[seg])) {
        throw errorHere(`Cannot redefine non-table key '${seg}' as table`);
      }
      curr = curr[seg] as Record<string, unknown>;
    }
    const leaf = path[path.length - 1];
    if (leaf in curr) {
      throw errorHere(`Duplicate TOML key '${path.join('.')}'`);
    }
    curr[leaf] = value;
  }

  function parseArray(): unknown[] {
    advance(); // skip '['
    const arr: unknown[] = [];
    while (pos < len) {
      skipWhitespaceAndComments();
      if (src[pos] === ']') {
        advance();
        return arr;
      }
      arr.push(parseValue());
      skipWhitespaceAndComments();
      if (src[pos] === ',') {
        advance();
        continue;
      }
      if (src[pos] === ']') {
        advance();
        return arr;
      }
      throw errorHere(`Expected ',' or ']' in TOML array`);
    }
    throw errorHere('Unterminated TOML array');
  }

  function parseInlineTable(): Record<string, unknown> {
    advance(); // skip '{'
    const obj: Record<string, unknown> = {};
    skipHorizontalSpace();
    if (src[pos] === '}') {
      advance();
      return obj;
    }
    while (pos < len) {
      skipHorizontalSpace();
      if (src[pos] === '}') {
        advance();
        return obj;
      }
      const keyPath = parseKeyPath();
      skipHorizontalSpace();
      if (src[pos] !== '=') throw errorHere(`Expected '=' in inline table`);
      advance();
      skipHorizontalSpace();
      const val = parseValue();
      setDottedKey(obj, keyPath, val);
      skipHorizontalSpace();
      if (src[pos] === ',') {
        advance();
        continue;
      }
      if (src[pos] === '}') {
        advance();
        return obj;
      }
      throw errorHere(`Expected ',' or '}' in TOML inline table`);
    }
    throw errorHere('Unterminated TOML inline table');
  }

  function parseValue(): unknown {
    skipHorizontalSpace();
    if (pos >= len) throw errorHere('Expected TOML value');
    const ch = src[pos];

    if (ch === '"') {
      if (src.slice(pos, pos + 3) === '"""') {
        pos += 3;
        col += 3;
        return parseBasicString(true);
      }
      advance();
      return parseBasicString(false);
    }

    if (ch === "'") {
      if (src.slice(pos, pos + 3) === "'''") {
        pos += 3;
        col += 3;
        return parseLiteralString(true);
      }
      advance();
      return parseLiteralString(false);
    }

    if (ch === '[') return parseArray();
    if (ch === '{') return parseInlineTable();

    // 裸值（布尔、数字、日期时间）
    let token = '';
    while (pos < len && !/[\s,\]}#]/.test(src[pos])) {
      token += advance();
    }

    if (token === 'true') return true;
    if (token === 'false') return false;
    if (/^[+-]?inf$/.test(token)) return token.startsWith('-') ? -Infinity : Infinity;
    if (/^[+-]?nan$/.test(token)) return NaN;

    // 带下划线进制整数
    if (/^0x[0-9a-fA-F](_?[0-9a-fA-F])*$/.test(token)) {
      return parseInt(token.replace(/_/g, '').slice(2), 16);
    }
    if (/^0o[0-7](_?[0-7])*$/.test(token)) {
      return parseInt(token.replace(/_/g, '').slice(2), 8);
    }
    if (/^0b[01](_?[01])*$/.test(token)) {
      return parseInt(token.replace(/_/g, '').slice(2), 2);
    }
    if (/^[+-]?(0|[1-9](_?[0-9])*)$/.test(token)) {
      return Number(token.replace(/_/g, ''));
    }
    if (/^[+-]?(0|[1-9](_?[0-9])*)(\.[0-9](_?[0-9])*)?([eE][+-]?[0-9](_?[0-9])*)?$/.test(token)) {
      return Number(token.replace(/_/g, ''));
    }

    // 日期 / 时间（如 2026-11-15T22:34:27+08:00，保留为字符串以兼容各格式）
    if (/^\d{4}-\d{2}-\d{2}/.test(token) || /^\d{2}:\d{2}:\d{2}/.test(token)) {
      // 若包含空格分隔日期时间（如 2026-11-15 10:00:00Z）
      if (src[pos] === ' ' && /^\d{2}:\d{2}/.test(src.slice(pos + 1))) {
        token += advance();
        while (pos < len && !/[\s,\]}#]/.test(src[pos])) {
          token += advance();
        }
      }
      return token;
    }

    throw errorHere(`Invalid TOML value '${token}'`);
  }

  function navigateTable(path: string[], isArrayTable: boolean): Record<string, unknown> {
    let curr: Record<string, unknown> = root;
    const prefixParts: string[] = [];

    for (let i = 0; i < path.length - 1; i++) {
      const seg = path[i];
      prefixParts.push(seg);
      const existing = curr[seg];
      if (existing === undefined) {
        curr[seg] = {};
        curr = curr[seg] as Record<string, unknown>;
      } else if (Array.isArray(existing)) {
        if (existing.length === 0) throw errorHere(`Empty array of tables '${prefixParts.join('.')}'`);
        const last = existing[existing.length - 1];
        if (!isPlainObject(last)) throw errorHere(`Invalid array table element`);
        curr = last;
      } else if (isPlainObject(existing)) {
        curr = existing;
      } else {
        throw errorHere(`Key '${prefixParts.join('.')}' is not a table`);
      }
    }

    const leaf = path[path.length - 1];
    const fullKey = path.join('\0');

    if (isArrayTable) {
      if (definedTables.has(fullKey)) {
        throw errorHere(`Cannot redefine table '${path.join('.')}' as array of tables`);
      }
      if (!(leaf in curr)) {
        curr[leaf] = [];
      } else if (!Array.isArray(curr[leaf])) {
        throw errorHere(`Key '${path.join('.')}' is not an array of tables`);
      }
      arrayTables.add(fullKey);
      const newEntry: Record<string, unknown> = {};
      (curr[leaf] as unknown[]).push(newEntry);
      return newEntry;
    }

    if (arrayTables.has(fullKey) || definedTables.has(fullKey)) {
      throw errorHere(`Duplicate TOML table '[${path.join('.')}]'`);
    }
    definedTables.add(fullKey);

    if (!(leaf in curr)) {
      curr[leaf] = {};
    } else if (!isPlainObject(curr[leaf])) {
      throw errorHere(`Cannot redefine key '${path.join('.')}' as table`);
    }
    return curr[leaf] as Record<string, unknown>;
  }

  while (pos < len) {
    skipWhitespaceAndComments();
    if (pos >= len) break;

    if (src[pos] === '[') {
      advance();
      const isArrayTable = peek() === '[';
      if (isArrayTable) advance();
      const path = parseKeyPath();
      skipHorizontalSpace();
      if (src[pos] !== ']') throw errorHere(`Expected ']' in table header`);
      advance();
      if (isArrayTable) {
        if (src[pos] !== ']') throw errorHere(`Expected ']]' in array of tables header`);
        advance();
      }
      expectLineEnd();
      currentTable = navigateTable(path, isArrayTable);
    } else {
      const path = parseKeyPath();
      skipHorizontalSpace();
      if (src[pos] !== '=') throw errorHere(`Expected '=' after TOML key '${path.join('.')}'`);
      advance();
      const val = parseValue();
      expectLineEnd();
      setDottedKey(currentTable, path, val);
    }
  }

  return root;
}

function formatTomlKey(key: string): string {
  return /^[A-Za-z0-9_-]+$/.test(key) ? key : JSON.stringify(key);
}

function isArrayOfTables(arr: unknown[]): arr is Record<string, unknown>[] {
  return arr.length > 0 && arr.every(v => isPlainObject(v));
}

function serializeToml(data: unknown): { output: string; warnings: WarningCode[] } {
  const warnings: WarningCode[] = [];
  let nullOmitted = false;
  let rootObj: Record<string, unknown>;

  if (isPlainObject(data)) {
    rootObj = data;
  } else {
    warnings.push('tomlRootWrapped');
    rootObj = { data };
  }

  const sections: string[] = [];

  function formatInlineValue(val: unknown): string {
    if (typeof val === 'boolean') return String(val);
    if (typeof val === 'number') {
      if (Number.isNaN(val)) return 'nan';
      if (val === Infinity) return 'inf';
      if (val === -Infinity) return '-inf';
      return String(val);
    }
    if (val instanceof Date) return val.toISOString();
    if (typeof val === 'string') {
      if (val.includes('\n') && !val.includes('"""') && !val.endsWith('"')) {
        return `"""\n${val.replace(/\\/g, '\\\\')}"""`;
      }
      return JSON.stringify(val);
    }
    if (Array.isArray(val)) {
      const items = val
        .filter(item => {
          if (item === null || item === undefined) {
            nullOmitted = true;
            return false;
          }
          return true;
        })
        .map(item => formatInlineValue(item));
      return `[${items.join(', ')}]`;
    }
    if (isPlainObject(val)) {
      const pairs: string[] = [];
      for (const [k, v] of Object.entries(val)) {
        if (v === null || v === undefined) {
          nullOmitted = true;
          continue;
        }
        pairs.push(`${formatTomlKey(k)} = ${formatInlineValue(v)}`);
      }
      return `{ ${pairs.join(', ')} }`;
    }
    return JSON.stringify(String(val));
  }

  function emitTable(obj: Record<string, unknown>, path: string[], headerType: 'none' | 'table' | 'arrayTable') {
    const lines: string[] = [];
    if (headerType === 'table') {
      lines.push(`[${path.map(formatTomlKey).join('.')}]`);
    } else if (headerType === 'arrayTable') {
      lines.push(`[[${path.map(formatTomlKey).join('.')}]]`);
    }

    const subTables: Array<[string, Record<string, unknown>]> = [];
    const arrTables: Array<[string, Record<string, unknown>[]]> = [];

    for (const [key, value] of Object.entries(obj)) {
      if (value === null || value === undefined) {
        nullOmitted = true;
        continue;
      }
      if (isPlainObject(value)) {
        subTables.push([key, value]);
      } else if (Array.isArray(value) && isArrayOfTables(value)) {
        arrTables.push([key, value]);
      } else {
        lines.push(`${formatTomlKey(key)} = ${formatInlineValue(value)}`);
      }
    }

    if (lines.length > 0 && (headerType !== 'none' || lines.length > 0)) {
      sections.push(lines.join('\n'));
    }

    for (const [key, sub] of subTables) {
      const nextPath = [...path, key];
      const subEntries = Object.entries(sub).filter(([, v]) => v !== null && v !== undefined);
      const hasOnlyNestedTables =
        subEntries.length > 0 &&
        subEntries.every(([, v]) => isPlainObject(v) || (Array.isArray(v) && isArrayOfTables(v)));

      if (hasOnlyNestedTables) {
        emitTable(sub, nextPath, 'none');
      } else {
        emitTable(sub, nextPath, 'table');
      }
    }

    for (const [key, items] of arrTables) {
      const nextPath = [...path, key];
      for (const item of items) {
        emitTable(item, nextPath, 'arrayTable');
      }
    }
  }

  emitTable(rootObj, [], 'none');

  if (nullOmitted) warnings.push('tomlNullOmitted');

  return {
    output: sections.filter(Boolean).join('\n\n'),
    warnings
  };
}

// ============================================================================
// 4. XML 解析与序列化
// ============================================================================

interface XmlElementNode {
  tag: string;
  attrs: Record<string, string>;
  children: XmlElementNode[];
  text: string;
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCodePoint(parseInt(dec, 10)))
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, '&');
}

function escapeXmlText(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXmlAttr(str: string): string {
  return escapeXmlText(str)
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function parseXml(input: string, options: ConfigConvertOptions): Record<string, unknown> {
  const src = stripBom(normalizeNewlines(input));
  const len = src.length;
  let pos = 0;
  let line = 1;
  let col = 1;

  function advance(count = 1) {
    for (let i = 0; i < count; i++) {
      if (src[pos] === '\n') {
        line++;
        col = 1;
      } else {
        col++;
      }
      pos++;
    }
  }

  function errorHere(msg: string): ConfigParseError {
    return new ConfigParseError(msg, line, col);
  }

  function skipWs() {
    while (pos < len && /\s/.test(src[pos])) advance();
  }

  function skipMisc() {
    while (pos < len) {
      skipWs();
      if (src.startsWith('<?', pos)) {
        const end = src.indexOf('?>', pos + 2);
        if (end === -1) throw errorHere('Unterminated XML processing instruction');
        advance(end + 2 - pos);
      } else if (src.startsWith('<!--', pos)) {
        const end = src.indexOf('-->', pos + 4);
        if (end === -1) throw errorHere('Unterminated XML comment');
        advance(end + 3 - pos);
      } else if (src.startsWith('<!DOCTYPE', pos)) {
        const end = src.indexOf('>', pos + 9);
        if (end === -1) throw errorHere('Unterminated DOCTYPE declaration');
        advance(end + 1 - pos);
      } else {
        break;
      }
    }
  }

  function readName(): string {
    let name = '';
    while (pos < len && /[A-Za-z0-9_.:-]/.test(src[pos])) {
      name += src[pos];
      advance();
    }
    if (!name) throw errorHere(`Expected XML tag or attribute name`);
    return name;
  }

  function parseElement(): XmlElementNode {
    if (src[pos] !== '<') throw errorHere(`Expected '<'`);
    advance();
    const tag = readName();
    const attrs: Record<string, string> = {};

    while (pos < len) {
      skipWs();
      if (src.startsWith('/>', pos)) {
        advance(2);
        return { tag, attrs, children: [], text: '' };
      }
      if (src[pos] === '>') {
        advance();
        break;
      }
      const attrName = readName();
      skipWs();
      if (src[pos] !== '=') throw errorHere(`Expected '=' after XML attribute '${attrName}'`);
      advance();
      skipWs();
      const quote = src[pos];
      if (quote !== '"' && quote !== "'") throw errorHere(`Expected quote for XML attribute '${attrName}'`);
      advance();
      let attrVal = '';
      while (pos < len && src[pos] !== quote) {
        attrVal += src[pos];
        advance();
      }
      if (src[pos] !== quote) throw errorHere(`Unterminated XML attribute value`);
      advance();
      attrs[attrName] = decodeXmlEntities(attrVal);
    }

    const children: XmlElementNode[] = [];
    let textBuf = '';

    while (pos < len) {
      if (src.startsWith('</', pos)) {
        advance(2);
        const closeTag = readName();
        skipWs();
        if (src[pos] !== '>') throw errorHere(`Expected '>' in closing tag </${closeTag}>`);
        advance();
        if (closeTag !== tag) {
          throw errorHere(`Mismatched XML closing tag </${closeTag}>, expected </${tag}>`);
        }
        return { tag, attrs, children, text: textBuf.trim() };
      }

      if (src.startsWith('<!--', pos)) {
        const end = src.indexOf('-->', pos + 4);
        if (end === -1) throw errorHere('Unterminated XML comment');
        advance(end + 3 - pos);
        continue;
      }

      if (src.startsWith('<![CDATA[', pos)) {
        const end = src.indexOf(']]>', pos + 9);
        if (end === -1) throw errorHere('Unterminated CDATA section');
        textBuf += src.slice(pos + 9, end);
        advance(end + 3 - pos);
        continue;
      }

      if (src[pos] === '<') {
        children.push(parseElement());
        continue;
      }

      const nextTag = src.indexOf('<', pos);
      const rawText = nextTag === -1 ? src.slice(pos) : src.slice(pos, nextTag);
      textBuf += decodeXmlEntities(rawText);
      advance(rawText.length);
    }

    throw errorHere(`Unclosed XML tag <${tag}>`);
  }

  function convertNode(node: XmlElementNode): unknown {
    const hasAttrs = Object.keys(node.attrs).length > 0;
    const hasChildren = node.children.length > 0;
    const valOrText = (s: string): unknown => (options.inferTypes ? inferScalarValue(s) : s);

    if (!hasAttrs && !hasChildren) {
      return node.text === '' ? '' : valOrText(node.text);
    }

    const obj: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(node.attrs)) {
      obj[`@${k}`] = valOrText(v);
    }

    if (hasChildren) {
      const grouped = new Map<string, unknown[]>();
      for (const child of node.children) {
        const converted = convertNode(child);
        const list = grouped.get(child.tag) ?? [];
        list.push(converted);
        grouped.set(child.tag, list);
      }
      for (const [childTag, list] of grouped.entries()) {
        obj[childTag] = list.length === 1 ? list[0] : list;
      }
      if (node.text) {
        obj['#text'] = valOrText(node.text);
      }
    } else if (node.text) {
      obj['#text'] = valOrText(node.text);
    }

    return obj;
  }

  skipMisc();
  if (pos >= len) throw errorHere('Empty XML document');
  const rootNode = parseElement();
  skipMisc();
  if (pos < len) throw errorHere('Unexpected trailing content after root XML element');

  return {
    [rootNode.tag]: convertNode(rootNode)
  };
}

function sanitizeXmlTagName(name: string): string {
  let clean = name.replace(/[^A-Za-z0-9_.-]/g, '_');
  if (!clean || !/^[A-Za-z_]/.test(clean)) {
    clean = `_${clean}`;
  }
  return clean;
}

function serializeXml(data: unknown, options: ConfigConvertOptions): { output: string; warnings: WarningCode[] } {
  const warnings: WarningCode[] = [];
  const indentUnit = getIndentString(options.indent, true);
  const lines: string[] = [];

  if (options.xmlDeclaration) {
    lines.push('<?xml version="1.0" encoding="UTF-8"?>');
  }

  let rootTag = sanitizeXmlTagName((options.xmlRootTag || 'config').trim() || 'config');
  let rootValue: unknown = data;

  // 若输入恰好是单根节点对象（例如刚从 XML 解析而来），避免重复包裹一层 <config>
  if (isPlainObject(data)) {
    const keys = Object.keys(data);
    if (keys.length === 1 && (keys[0] === rootTag || !options.xmlRootTag.trim())) {
      rootTag = sanitizeXmlTagName(keys[0]);
      rootValue = data[keys[0]];
    } else if (keys.length > 1 || (keys.length === 1 && keys[0] !== rootTag)) {
      warnings.push('xmlRootWrapped');
    }
  } else {
    warnings.push('xmlRootWrapped');
  }

  function renderElement(tagName: string, value: unknown, level: number): void {
    const pad = indentUnit.repeat(level);
    const safeTag = sanitizeXmlTagName(tagName);

    if (value === null || value === undefined || value === '') {
      lines.push(`${pad}<${safeTag} />`);
      return;
    }

    if (Array.isArray(value)) {
      if (value.length === 0) {
        lines.push(`${pad}<${safeTag} />`);
        return;
      }
      for (const item of value) {
        renderElement(safeTag, item, level);
      }
      return;
    }

    if (isPlainObject(value)) {
      const attrs: string[] = [];
      const childEntries: Array<[string, unknown]> = [];
      let textContent: string | null = null;

      for (const [k, v] of Object.entries(value)) {
        if (k.startsWith('@') && k.length > 1 && (v === null || typeof v !== 'object')) {
          attrs.push(`${sanitizeXmlTagName(k.slice(1))}="${escapeXmlAttr(String(v ?? ''))}"`);
        } else if (k === '#text' && (v === null || typeof v !== 'object')) {
          textContent = String(v ?? '');
        } else {
          childEntries.push([k, v]);
        }
      }

      const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

      if (childEntries.length === 0 && (textContent === null || textContent === '')) {
        lines.push(`${pad}<${safeTag}${attrStr} />`);
        return;
      }

      if (childEntries.length === 0 && textContent !== null) {
        lines.push(`${pad}<${safeTag}${attrStr}>${escapeXmlText(textContent)}</${safeTag}>`);
        return;
      }

      lines.push(`${pad}<${safeTag}${attrStr}>`);
      if (textContent) {
        lines.push(`${pad}${indentUnit}${escapeXmlText(textContent)}`);
      }
      for (const [childKey, childVal] of childEntries) {
        if (Array.isArray(childVal) && childVal.some(Array.isArray)) {
          lines.push(`${pad}${indentUnit}<${sanitizeXmlTagName(childKey)}>`);
          for (const sub of childVal) {
            renderElement('item', sub, level + 2);
          }
          lines.push(`${pad}${indentUnit}</${sanitizeXmlTagName(childKey)}>`);
        } else {
          renderElement(childKey, childVal, level + 1);
        }
      }
      lines.push(`${pad}</${safeTag}>`);
      return;
    }

    lines.push(`${pad}<${safeTag}>${escapeXmlText(String(value))}</${safeTag}>`);
  }

  renderElement(rootTag, rootValue, 0);

  return {
    output: lines.join('\n'),
    warnings
  };
}

// ============================================================================
// 5. INI 解析与序列化
// ============================================================================

function parseQuotedOrRawIniValue(raw: string, inferTypes: boolean): unknown {
  const trimmed = raw.trim();
  if ((trimmed.startsWith('"') && trimmed.endsWith('"') && trimmed.length >= 2) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'") && trimmed.length >= 2)) {
    const inner = trimmed.slice(1, -1);
    return trimmed[0] === '"'
      ? inner.replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      : inner;
  }
  // 剥离非引号包裹的行尾注释
  let unquoted = trimmed;
  const commentMatch = unquoted.match(/\s+[;#]/);
  if (commentMatch && commentMatch.index !== undefined) {
    unquoted = unquoted.slice(0, commentMatch.index).trim();
  }
  return inferTypes ? inferScalarValue(unquoted) : unquoted;
}

function parseIni(input: string, options: ConfigConvertOptions): Record<string, unknown> {
  const lines = stripBom(normalizeNewlines(input)).split('\n');
  const root: Record<string, unknown> = {};
  let currentSectionPath: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const trimmed = lines[i].trim();
    if (!trimmed || trimmed.startsWith(';') || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('[')) {
      const closeIdx = trimmed.indexOf(']');
      if (closeIdx === -1) {
        throw new ConfigParseError('Unterminated INI section header', lineNo);
      }
      const after = trimmed.slice(closeIdx + 1).trim();
      if (after && !after.startsWith(';') && !after.startsWith('#')) {
        throw new ConfigParseError('Unexpected characters after INI section header', lineNo);
      }
      const sectionName = trimmed.slice(1, closeIdx).trim();
      if (!sectionName) {
        throw new ConfigParseError('Empty INI section name', lineNo);
      }
      currentSectionPath = options.unflattenKeys ? sectionName.split('.').filter(Boolean) : [sectionName];
      continue;
    }

    const eqIdx = trimmed.indexOf('=');
    const colonIdx = trimmed.indexOf(':');
    const sepIdx = eqIdx !== -1 ? eqIdx : colonIdx;
    if (sepIdx === -1) {
      throw new ConfigParseError(`Expected '=' or ':' in INI entry`, lineNo);
    }

    const rawKey = trimmed.slice(0, sepIdx).trim();
    const rawVal = trimmed.slice(sepIdx + 1);
    if (!rawKey) {
      throw new ConfigParseError('Empty key in INI entry', lineNo);
    }

    const parsedVal = parseQuotedOrRawIniValue(rawVal, options.inferTypes);
    let target = root;
    for (const sec of currentSectionPath) {
      if (!isPlainObject(target[sec])) {
        target[sec] = {};
      }
      target = target[sec] as Record<string, unknown>;
    }

    if (options.unflattenKeys && rawKey.includes('.')) {
      const parts = rawKey.split('.').filter(Boolean);
      let cursor = target;
      for (let p = 0; p < parts.length - 1; p++) {
        if (!isPlainObject(cursor[parts[p]])) cursor[parts[p]] = {};
        cursor = cursor[parts[p]] as Record<string, unknown>;
      }
      cursor[parts[parts.length - 1]] = parsedVal;
    } else {
      target[rawKey] = parsedVal;
    }
  }

  return normalizeNumericArrays(root) as Record<string, unknown>;
}

function serializeIni(data: unknown): { output: string; warnings: WarningCode[] } {
  const warnings: WarningCode[] = [];
  let rootObj: Record<string, unknown>;

  if (isPlainObject(data)) {
    rootObj = data;
  } else {
    warnings.push('iniRootWrapped');
    rootObj = { general: { data } };
  }

  const globalLines: string[] = [];
  const sectionBlocks: string[] = [];
  let flattened = false;

  function formatIniScalar(val: unknown): string {
    if (val === null || val === undefined) return '';
    if (typeof val === 'boolean' || typeof val === 'number') return String(val);
    const s = String(val);
    if (/[\n\r;#]/.test(s) || /^\s|\s$/.test(s)) {
      return `"${s.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n').replace(/\r/g, '\\r')}"`;
    }
    return s;
  }

  function emitSection(obj: Record<string, unknown>, sectionPath: string[]) {
    const lines: string[] = [];
    if (sectionPath.length > 0) {
      lines.push(`[${sectionPath.join('.')}]`);
    }

    const childSections: Array<[string, Record<string, unknown>]> = [];

    for (const [k, v] of Object.entries(obj)) {
      if (isPlainObject(v)) {
        childSections.push([k, v]);
      } else if (Array.isArray(v)) {
        if (v.every(item => item === null || typeof item !== 'object')) {
          lines.push(`${k} = ${v.map(formatIniScalar).join(', ')}`);
          flattened = true;
        } else {
          flattened = true;
          v.forEach((item, idx) => {
            if (isPlainObject(item)) {
              childSections.push([`${k}.${idx}`, item]);
            } else {
              lines.push(`${k}.${idx} = ${formatIniScalar(item)}`);
            }
          });
        }
      } else {
        lines.push(`${k} = ${formatIniScalar(v)}`);
      }
    }

    if (lines.length > 0) {
      if (sectionPath.length === 0) {
        globalLines.push(...lines);
      } else {
        sectionBlocks.push(lines.join('\n'));
      }
    }

    for (const [childKey, childObj] of childSections) {
      emitSection(childObj, [...sectionPath, childKey]);
    }
  }

  emitSection(rootObj, []);

  if (flattened) warnings.push('iniFlattened');

  const allBlocks: string[] = [];
  if (globalLines.length > 0) allBlocks.push(globalLines.join('\n'));
  allBlocks.push(...sectionBlocks);

  return {
    output: allBlocks.join('\n\n'),
    warnings
  };
}

// ============================================================================
// 6. .env 解析与序列化
// ============================================================================

function parseEnv(input: string, options: ConfigConvertOptions): Record<string, unknown> {
  const src = stripBom(normalizeNewlines(input));
  const len = src.length;
  let pos = 0;
  let line = 1;
  const flat: Record<string, unknown> = {};

  function skipLineRest() {
    while (pos < len && src[pos] !== '\n') pos++;
    if (src[pos] === '\n') {
      pos++;
      line++;
    }
  }

  while (pos < len) {
    while (pos < len && (src[pos] === ' ' || src[pos] === '\t')) pos++;
    if (pos >= len) break;

    if (src[pos] === '\n') {
      pos++;
      line++;
      continue;
    }
    if (src[pos] === '#') {
      skipLineRest();
      continue;
    }

    // 可选 `export ` 前缀
    if (src.startsWith('export', pos) && /\s/.test(src[pos + 6] ?? '')) {
      pos += 6;
      while (pos < len && (src[pos] === ' ' || src[pos] === '\t')) pos++;
    }

    const keyStartLine = line;
    let key = '';
    while (pos < len && src[pos] !== '=' && src[pos] !== '\n') {
      key += src[pos++];
    }
    key = key.trim();
    if (src[pos] !== '=') {
      throw new ConfigParseError(`Expected '=' in .env entry`, keyStartLine);
    }
    if (!key) {
      throw new ConfigParseError(`Empty variable name in .env entry`, keyStartLine);
    }
    pos++; // skip '='

    while (pos < len && (src[pos] === ' ' || src[pos] === '\t')) pos++;

    let value: unknown = '';
    const quote = src[pos];
    if (quote === '"' || quote === "'" || quote === '`') {
      pos++;
      let buf = '';
      let closed = false;
      while (pos < len) {
        const ch = src[pos++];
        if (ch === '\n') line++;
        if (quote === '"' && ch === '\\' && pos < len) {
          const next = src[pos++];
          if (next === 'n') buf += '\n';
          else if (next === 'r') buf += '\r';
          else if (next === 't') buf += '\t';
          else if (next === '"') buf += '"';
          else if (next === '\\') buf += '\\';
          else buf += '\\' + next;
          continue;
        }
        if (ch === quote) {
          closed = true;
          break;
        }
        buf += ch;
      }
      if (!closed) {
        throw new ConfigParseError(`Unterminated ${quote} quote in .env value for '${key}'`, keyStartLine);
      }
      skipLineRest();
      value = quote === '"' || quote === "'" ? buf : buf;
      // 引号包裹的值视为字符串（避免把 "1234" 误判为数字，除非用户仅对无引号或统一推断？保留引号语义为字符串更符合 .env 规范）
    } else {
      let rawVal = '';
      while (pos < len && src[pos] !== '\n') {
        rawVal += src[pos++];
      }
      if (src[pos] === '\n') {
        pos++;
        line++;
      }
      // 剥离空格后的行内注释
      const commentIdx = rawVal.search(/\s+#/);
      if (commentIdx !== -1) {
        rawVal = rawVal.slice(0, commentIdx);
      }
      rawVal = rawVal.trim();
      value = options.inferTypes ? inferScalarValue(rawVal) : rawVal;
    }

    flat[key] = value;
  }

  return options.unflattenKeys ? unflattenObject(flat, options.unflattenDelimiter) : flat;
}

function serializeEnv(data: unknown, options: ConfigConvertOptions): { output: string; warnings: WarningCode[] } {
  const warnings: WarningCode[] = [];
  if (hasNestedStructure(data)) {
    warnings.push('envFlattened');
  }

  const entries = flattenObject(data, options.envDelimiter);
  const lines = entries.map(({ key, value }) => {
    let envKey = key.replace(/[^A-Za-z0-9_.-]/g, '_');
    if (options.envUppercaseKeys) envKey = envKey.toUpperCase();

    const strVal = value === null || value === undefined ? '' : String(value);
    const needsQuotes =
      options.envQuoteStyle === 'double' ||
      /[\s#"'`$=\n\r\t]/.test(strVal);

    if (needsQuotes) {
      const escaped = strVal
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, '\\n')
        .replace(/\r/g, '\\r')
        .replace(/\t/g, '\\t');
      return `${envKey}="${escaped}"`;
    }
    return `${envKey}=${strVal}`;
  });

  return {
    output: lines.join('\n'),
    warnings
  };
}

// ============================================================================
// 7. Java .properties 解析与序列化
// ============================================================================

function unescapePropertiesText(text: string): string {
  let out = '';
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (ch !== '\\') {
      out += ch;
      continue;
    }
    i++;
    if (i >= text.length) break;
    const esc = text[i];
    switch (esc) {
      case 'n': out += '\n'; break;
      case 'r': out += '\r'; break;
      case 't': out += '\t'; break;
      case 'f': out += '\f'; break;
      case '\\': out += '\\'; break;
      case 'u': {
        const hex = text.slice(i + 1, i + 5);
        if (/^[0-9a-fA-F]{4}$/.test(hex)) {
          out += String.fromCharCode(parseInt(hex, 16));
          i += 4;
        } else {
          out += '\\u';
        }
        break;
      }
      default:
        out += esc;
    }
  }
  return out;
}

function parseProperties(input: string, options: ConfigConvertOptions): Record<string, unknown> {
  const rawLines = stripBom(normalizeNewlines(input)).split('\n');
  const flat: Record<string, unknown> = {};

  let i = 0;
  while (i < rawLines.length) {
    let line = rawLines[i];
    const trimmedStart = line.trimStart();
    if (!trimmedStart || trimmedStart.startsWith('#') || trimmedStart.startsWith('!')) {
      i++;
      continue;
    }

    // 处理末尾反斜杠续行
    let logicalLine = trimmedStart;
    while (logicalLine.endsWith('\\') && !logicalLine.endsWith('\\\\')) {
      // 检查奇数个连续反斜杠
      let bs = 0;
      for (let k = logicalLine.length - 1; k >= 0 && logicalLine[k] === '\\'; k--) bs++;
      if (bs % 2 === 0) break;

      logicalLine = logicalLine.slice(0, -1);
      i++;
      if (i >= rawLines.length) break;
      logicalLine += rawLines[i].trimStart();
    }

    // 查找未转义的分隔符 (`=` / `:` / 空白)
    let keyEnd = -1;
    let sepPos = -1;
    for (let j = 0; j < logicalLine.length; j++) {
      const ch = logicalLine[j];
      if (ch === '\\') {
        j++;
        continue;
      }
      if (ch === '=' || ch === ':') {
        keyEnd = j;
        sepPos = j;
        break;
      }
      if (ch === ' ' || ch === '\t') {
        keyEnd = j;
        let k = j + 1;
        while (k < logicalLine.length && (logicalLine[k] === ' ' || logicalLine[k] === '\t')) k++;
        if (logicalLine[k] === '=' || logicalLine[k] === ':') {
          sepPos = k;
        } else {
          sepPos = j;
        }
        break;
      }
    }

    const rawKey = keyEnd === -1 ? logicalLine : logicalLine.slice(0, keyEnd);
    const rawVal = sepPos === -1 ? '' : logicalLine.slice(sepPos + 1).trimStart();
    const key = unescapePropertiesText(rawKey);
    const valStr = unescapePropertiesText(rawVal);

    flat[key] = options.inferTypes ? inferScalarValue(valStr) : valStr;
    i++;
  }

  return options.unflattenKeys ? unflattenObject(flat, '.') : flat;
}

function serializeProperties(data: unknown): { output: string; warnings: WarningCode[] } {
  const warnings: WarningCode[] = [];
  if (hasNestedStructure(data)) {
    warnings.push('propertiesFlattened');
  }

  const entries = flattenObject(data, '.');
  const lines = entries.map(({ key, value }) => {
    const escKey = key
      .replace(/\\/g, '\\\\')
      .replace(/=/g, '\\=')
      .replace(/:/g, '\\:')
      .replace(/\s/g, '\\ ');
    const strVal = value === null || value === undefined ? '' : String(value);
    const escVal = strVal
      .replace(/\\/g, '\\\\')
      .replace(/\n/g, '\\n')
      .replace(/\r/g, '\\r')
      .replace(/\t/g, '\\t');
    return `${escKey}=${escVal}`;
  });

  return {
    output: lines.join('\n'),
    warnings
  };
}

// ============================================================================
// 统一入口
// ============================================================================

export function parseConfig(
  input: string,
  format: ConfigFormat,
  options: ConfigConvertOptions
): unknown {
  switch (format) {
    case 'json':
      return parseJson(input, options);
    case 'yaml':
      return parseYaml(input);
    case 'toml':
      return parseToml(input);
    case 'xml':
      return parseXml(input, options);
    case 'ini':
      return parseIni(input, options);
    case 'env':
      return parseEnv(input, options);
    case 'properties':
      return parseProperties(input, options);
  }
}

export function serializeConfig(
  data: unknown,
  format: ConfigFormat,
  options: ConfigConvertOptions
): { output: string; warnings: WarningCode[] } {
  switch (format) {
    case 'json':
      return { output: serializeJson(data, options), warnings: [] };
    case 'yaml':
      return serializeYaml(data, options);
    case 'toml':
      return serializeToml(data);
    case 'xml':
      return serializeXml(data, options);
    case 'ini':
      return serializeIni(data);
    case 'env':
      return serializeEnv(data, options);
    case 'properties':
      return serializeProperties(data);
  }
}

export function convertConfig(
  input: string,
  sourceFormat: InputFormatChoice,
  targetFormat: ConfigFormat,
  options: ConfigConvertOptions = DEFAULT_CONVERT_OPTIONS,
  filenameHint?: string
): ConfigConvertResult {
  const detectedFormat: ConfigFormat =
    sourceFormat === 'auto' ? detectConfigFormat(input, filenameHint) : sourceFormat;

  if (!input.trim()) {
    return {
      ok: true,
      output: '',
      data: null,
      detectedFormat,
      warnings: [],
      stats: { keys: 0, depth: 0, rootType: 'empty' }
    };
  }

  try {
    let parsed = parseConfig(input, detectedFormat, options);
    if (options.sortKeys) {
      parsed = sortKeysRecursive(parsed);
    }
    const { output, warnings } = serializeConfig(parsed, targetFormat, options);
    const stats = inspectConfigStats(parsed);

    return {
      ok: true,
      output,
      data: parsed,
      detectedFormat,
      warnings: Array.from(new Set(warnings)),
      stats
    };
  } catch (err: unknown) {
    if (err instanceof ConfigParseError) {
      return {
        ok: false,
        output: '',
        data: null,
        detectedFormat,
        warnings: [],
        stats: { keys: 0, depth: 0, rootType: 'empty' },
        error: {
          message: err.message,
          line: err.line,
          column: err.column
        }
      };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return {
      ok: false,
      output: '',
      data: null,
      detectedFormat,
      warnings: [],
      stats: { keys: 0, depth: 0, rootType: 'empty' },
      error: {
        message: msg,
        line: null,
        column: null
      }
    };
  }
}

// ============================================================================
// 内置示例预设
// ============================================================================

export interface ConfigSamplePreset {
  id: string;
  format: ConfigFormat;
  content: string;
}

export const CONFIG_SAMPLES: ConfigSamplePreset[] = [
  {
    id: 'appYaml',
    format: 'yaml',
    content: `# DevCrate Service Configuration
app:
  name: devcrate-api
  version: 2.4.0
  debug: false
  tags:
    - production
    - gateway

server:
  host: 0.0.0.0
  port: 8080
  cors:
    enabled: true
    origins:
      - https://devcrate.app
      - https://docs.devcrate.app

database:
  driver: postgres
  pool:
    min: 2
    max: 20
  ssl: true

routes:
  - path: /api/v1/health
    auth: false
  - path: /api/v1/users
    auth: true`
  },
  {
    id: 'cargoToml',
    format: 'toml',
    content: `[package]
name = "devcrate-worker"
version = "0.4.0"
edition = "2024"
authors = ["LongYinStudio <team@devcrate.app>"]

[dependencies]
tokio = { version = "1.40", features = ["full"] }
serde = { version = "1.0", features = ["derive"] }

[[services]]
name = "http-ingress"
port = 8443
tls = true

[[services]]
name = "metrics"
port = 9090
tls = false`
  },
  {
    id: 'dockerEnv',
    format: 'env',
    content: `# Application Environment
APP_NAME=DevCrate
APP_ENV=production
APP_PORT=3000
APP_DEBUG=false

# Database
DATABASE_URL="postgresql://postgres:secret@db:5432/devcrate?sslmode=require"
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
CORS_ORIGINS="https://app.example.com,https://admin.example.com"`
  },
  {
    id: 'springProperties',
    format: 'properties',
    content: `# Spring Boot Application Properties
spring.application.name=devcrate-service
server.port=8080
server.servlet.context-path=/api

spring.datasource.url=jdbc:postgresql://localhost:5432/app
spring.datasource.username=admin
spring.datasource.hikari.maximum-pool-size=16

logging.level.root=INFO
management.endpoints.web.exposure.include=health,info,metrics`
  },
  {
    id: 'appJson',
    format: 'json',
    content: `{
  // JSONC comments and trailing commas are supported
  "service": "auth-gateway",
  "port": 9000,
  "features": {
    "rateLimit": true,
    "maxRequestsPerMinute": 1200,
    "providers": ["github", "google", "oidc"]
  },
  "logging": {
    "level": "info",
    "pretty": false
  },
}`
  },
  {
    id: 'phpIni',
    format: 'ini',
    content: `; Service Configuration
app_name = DevCrate
debug = false

[database]
host = 127.0.0.1
port = 3306
name = devcrate_db
charset = utf8mb4

[cache.redis]
host = localhost
port = 6379
ttl = 3600`
  },
  {
    id: 'serviceXml',
    format: 'xml',
    content: `<?xml version="1.0" encoding="UTF-8"?>
<config version="1.0">
  <service>
    <name>devcrate-edge</name>
    <port>8080</port>
    <tls>true</tls>
  </service>
  <upstream>
    <node weight="10">10.0.1.11</node>
    <node weight="5">10.0.1.12</node>
  </upstream>
</config>`
  }
];
