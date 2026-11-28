export type TargetLang = 'typescript' | 'zod' | 'go' | 'rust' | 'pydantic';

export type StringFormatHint = 'datetime' | 'uuid' | 'email' | 'url';

export interface ConvertOptions {
  rootName: string;
  detectFormats: boolean;
  nullableAsOptional: boolean;
  inlineComments: boolean;
  // TypeScript
  tsUseInterface: boolean;
  tsExport: boolean;
  tsReadonly: boolean;
  // Zod
  zodExport: boolean;
  zodInferType: boolean;
  // Go
  goOmitEmpty: boolean;
  goUseAny: boolean;
  goPointerNullable: boolean;
  // Rust
  rustPublic: boolean;
  rustDeriveSerde: boolean;
  // Pydantic
  pyModernUnion: boolean;
  pyPopulateByName: boolean;
}

export function createDefaultConvertOptions(): ConvertOptions {
  return {
    rootName: 'ApiResponse',
    detectFormats: true,
    nullableAsOptional: true,
    inlineComments: false,
    tsUseInterface: true,
    tsExport: true,
    tsReadonly: false,
    zodExport: true,
    zodInferType: true,
    goOmitEmpty: true,
    goUseAny: true,
    goPointerNullable: true,
    rustPublic: true,
    rustDeriveSerde: true,
    pyModernUnion: true,
    pyPopulateByName: true,
  };
}

// ==================== IR 节点定义 ====================
export type IrType =
  | { kind: 'any' }
  | { kind: 'null' }
  | { kind: 'boolean' }
  | { kind: 'integer' }
  | { kind: 'float' }
  | { kind: 'string'; formats: Set<StringFormatHint> }
  | { kind: 'array'; element: IrType }
  | { kind: 'struct'; name: string; fields: Map<string, IrField> }
  | { kind: 'union'; variants: IrType[] };

export interface IrField {
  key: string;
  type: IrType;
  optional: boolean;
  nullable: boolean;
  sampleNote?: string;
}

export interface NamedStruct {
  name: string;
  fields: IrField[];
}

export interface InferenceStats {
  structCount: number;
  mergedOptionalFields: number;
  nullableFields: number;
}

// ==================== Relaxed JSON / JSONC Parser ====================
export function stripJsonCommentsAndTrailingCommas(raw: string): string {
  let out = '';
  let inString = false;
  let escaped = false;
  let i = 0;

  while (i < raw.length) {
    const ch = raw[i];
    const next = raw[i + 1];

    if (inString) {
      out += ch;
      if (escaped) {
        escaped = false;
      } else if (ch === '\\') {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      i++;
      continue;
    }

    if (ch === '"') {
      inString = true;
      out += ch;
      i++;
      continue;
    }

    // Line comment
    if (ch === '/' && next === '/') {
      i += 2;
      while (i < raw.length && raw[i] !== '\n') i++;
      continue;
    }

    // Block comment
    if (ch === '/' && next === '*') {
      i += 2;
      while (i < raw.length && !(raw[i] === '*' && raw[i + 1] === '/')) {
        if (raw[i] === '\n') out += '\n';
        i++;
      }
      i += 2;
      continue;
    }

    out += ch;
    i++;
  }

  // Strip trailing commas outside strings cleanly
  let clean = '';
  inString = false;
  escaped = false;
  for (let j = 0; j < out.length; j++) {
    const ch = out[j];
    if (inString) {
      clean += ch;
      if (escaped) escaped = false;
      else if (ch === '\\') escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') {
      inString = true;
      clean += ch;
      continue;
    }
    if (ch === ',') {
      let k = j + 1;
      while (k < out.length && /\s/.test(out[k])) k++;
      if (out[k] === '}' || out[k] === ']') {
        continue;
      }
    }
    clean += ch;
  }

  return clean;
}

export function parseRelaxedJson(raw: string): unknown {
  const cleaned = stripJsonCommentsAndTrailingCommas(raw).trim();
  if (!cleaned) {
    throw new Error('Empty JSON input');
  }
  return JSON.parse(cleaned);
}

// ==================== Naming Helpers ====================
const GO_INITIALISMS = new Set([
  'id',
  'ids',
  'url',
  'urls',
  'uri',
  'api',
  'http',
  'https',
  'json',
  'xml',
  'html',
  'css',
  'uuid',
  'ip',
  'tcp',
  'udp',
  'dns',
  'tls',
  'ssl',
  'ssh',
  'sql',
  'uid',
  'gid',
  'cpu',
  'ram',
  'ttl',
  'jwt',
  'eof',
]);

function splitWords(raw: string): string[] {
  const normalized = raw
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim();
  if (!normalized) return [];
  return normalized.split(/\s+/).filter(Boolean);
}

export function toPascalCase(raw: string, goInitialisms = false): string {
  const words = splitWords(raw);
  if (words.length === 0) return 'Field';
  let result = words
    .map((w) => {
      const lower = w.toLowerCase();
      if (goInitialisms && GO_INITIALISMS.has(lower)) {
        return lower === 'ids' ? 'IDs' : lower.toUpperCase();
      }
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join('');
  if (/^\d/.test(result)) result = `N${result}`;
  return result;
}

export function toSnakeCase(raw: string): string {
  const words = splitWords(raw);
  if (words.length === 0) return 'field';
  let res = words.map((w) => w.toLowerCase()).join('_');
  if (/^\d/.test(res)) res = `f_${res}`;
  return res;
}

function singularize(word: string): string {
  if (word.endsWith('ies') && word.length > 4) return `${word.slice(0, -3)}y`;
  if (word.endsWith('ses') && word.length > 4) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss') && word.length > 2) return word.slice(0, -1);
  return `${word}Item`;
}

// ==================== Format Detection ====================
const RE_UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const RE_DATETIME = /^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;
const RE_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RE_URL = /^https?:\/\/[^\s/$.?#].[^\s]*$/i;

function detectStringFormat(val: string): StringFormatHint | null {
  if (!val || val.length > 160) return null;
  if (RE_UUID.test(val)) return 'uuid';
  if (RE_DATETIME.test(val) && !Number.isNaN(Date.parse(val))) return 'datetime';
  if (RE_URL.test(val)) return 'url';
  if (RE_EMAIL.test(val)) return 'email';
  return null;
}

// ==================== Type Inference & Merging ====================
function inferValue(val: unknown, suggestedName: string, detectFormats: boolean): IrType {
  if (val === null) return { kind: 'null' };
  if (typeof val === 'boolean') return { kind: 'boolean' };
  if (typeof val === 'number') {
    return Number.isInteger(val) ? { kind: 'integer' } : { kind: 'float' };
  }
  if (typeof val === 'string') {
    const formats = new Set<StringFormatHint>();
    if (detectFormats) {
      const fmt = detectStringFormat(val);
      if (fmt) formats.add(fmt);
    }
    return { kind: 'string', formats };
  }
  if (Array.isArray(val)) {
    if (val.length === 0) {
      return { kind: 'array', element: { kind: 'any' } };
    }
    const itemName = singularize(suggestedName);
    let merged: IrType = inferValue(val[0], itemName, detectFormats);
    for (let i = 1; i < val.length; i++) {
      merged = mergeTypes(merged, inferValue(val[i], itemName, detectFormats), itemName);
    }
    return { kind: 'array', element: merged };
  }
  if (typeof val === 'object') {
    const record = val as Record<string, unknown>;
    const fields = new Map<string, IrField>();
    for (const [k, v] of Object.entries(record)) {
      const subName = toPascalCase(k);
      const rawType = inferValue(v, subName, detectFormats);
      const { cleaned, nullable } = extractNullability(rawType);
      fields.set(k, {
        key: k,
        type: cleaned,
        optional: false,
        nullable,
      });
    }
    return { kind: 'struct', name: toPascalCase(suggestedName), fields };
  }
  return { kind: 'any' };
}

function extractNullability(t: IrType): { cleaned: IrType; nullable: boolean } {
  if (t.kind === 'null') {
    return { cleaned: { kind: 'any' }, nullable: true };
  }
  if (t.kind === 'union') {
    let hasNull = false;
    const nonNull: IrType[] = [];
    for (const v of t.variants) {
      if (v.kind === 'null') hasNull = true;
      else nonNull.push(v);
    }
    if (nonNull.length === 0) return { cleaned: { kind: 'any' }, nullable: true };
    if (nonNull.length === 1) return { cleaned: nonNull[0], nullable: hasNull };
    return { cleaned: { kind: 'union', variants: nonNull }, nullable: hasNull };
  }
  return { cleaned: t, nullable: false };
}

function mergeTypes(a: IrType, b: IrType, preferredName: string): IrType {
  if (a.kind === 'any' || b.kind === 'any') return { kind: 'any' };
  if (a.kind === 'null' && b.kind === 'null') return { kind: 'null' };

  if (a.kind === 'integer' && b.kind === 'integer') return { kind: 'integer' };
  if (
    (a.kind === 'integer' || a.kind === 'float') &&
    (b.kind === 'integer' || b.kind === 'float')
  ) {
    return { kind: 'float' };
  }
  if (a.kind === 'boolean' && b.kind === 'boolean') return { kind: 'boolean' };

  if (a.kind === 'string' && b.kind === 'string') {
    // Keep format hint only if every observed string shares that same hint
    const shared = new Set<StringFormatHint>();
    for (const fmt of a.formats) {
      if (b.formats.has(fmt)) shared.add(fmt);
    }
    return { kind: 'string', formats: shared };
  }

  if (a.kind === 'array' && b.kind === 'array') {
    return {
      kind: 'array',
      element: mergeTypes(a.element, b.element, singularize(preferredName)),
    };
  }

  if (a.kind === 'struct' && b.kind === 'struct') {
    const mergedFields = new Map<string, IrField>();
    const allKeys = new Set<string>([...a.fields.keys(), ...b.fields.keys()]);

    for (const key of allKeys) {
      const fa = a.fields.get(key);
      const fb = b.fields.get(key);
      if (fa && fb) {
        const subName = toPascalCase(key);
        const combinedType = mergeTypes(
          fa.nullable && fa.type.kind === 'any' ? { kind: 'null' } : fa.type,
          fb.nullable && fb.type.kind === 'any' ? { kind: 'null' } : fb.type,
          subName
        );
        const { cleaned, nullable } = extractNullability(combinedType);
        mergedFields.set(key, {
          key,
          type: cleaned,
          optional: fa.optional || fb.optional,
          nullable: fa.nullable || fb.nullable || nullable,
        });
      } else {
        const present = (fa ?? fb)!;
        mergedFields.set(key, {
          ...present,
          optional: true,
        });
      }
    }

    return {
      kind: 'struct',
      name: a.name || b.name || preferredName,
      fields: mergedFields,
    };
  }

  // Build deduplicated union
  const variants: IrType[] = [];
  const pushVariant = (candidate: IrType) => {
    if (candidate.kind === 'union') {
      candidate.variants.forEach(pushVariant);
      return;
    }
    const existingIdx = variants.findIndex((v) => v.kind === candidate.kind);
    if (existingIdx >= 0) {
      variants[existingIdx] = mergeTypes(variants[existingIdx], candidate, preferredName);
    } else if (
      candidate.kind === 'float' &&
      variants.some((v) => v.kind === 'integer')
    ) {
      const intIdx = variants.findIndex((v) => v.kind === 'integer');
      variants[intIdx] = { kind: 'float' };
    } else if (
      candidate.kind === 'integer' &&
      variants.some((v) => v.kind === 'float')
    ) {
      // float subsumes integer
    } else {
      variants.push(candidate);
    }
  };

  pushVariant(a);
  pushVariant(b);
  return variants.length === 1 ? variants[0] : { kind: 'union', variants };
}

// ==================== Collect & Disambiguate Named Structs ====================
function signatureOfIrType(t: IrType): string {
  switch (t.kind) {
    case 'any':
    case 'null':
    case 'boolean':
    case 'integer':
    case 'float':
      return t.kind;
    case 'string':
      return `string(${Array.from(t.formats).sort().join(',')})`;
    case 'array':
      return `[${signatureOfIrType(t.element)}]`;
    case 'union':
      return `(${t.variants.map(signatureOfIrType).sort().join('|')})`;
    case 'struct': {
      const entries = Array.from(t.fields.values())
        .sort((x, y) => x.key.localeCompare(y.key))
        .map((f) => `${f.key}${f.optional ? '?' : ''}${f.nullable ? '!' : ''}:${signatureOfIrType(f.type)}`);
      return `{${entries.join(';')}}`;
    }
  }
}

function collectStructsAndNormalize(
  rootIr: IrType,
  rootName: string,
  topDown: boolean
): {
  rootType: IrType;
  structs: NamedStruct[];
  stats: InferenceStats;
} {
  const sigToName = new Map<string, string>();
  const usedNames = new Set<string>();
  const structs: NamedStruct[] = [];
  let mergedOptionalFields = 0;
  let nullableFields = 0;

  function allocateName(desired: string, sig: string): { name: string; alreadyCreated: boolean } {
    const existing = sigToName.get(sig);
    if (existing) {
      return { name: existing, alreadyCreated: true };
    }
    let candidate = desired || 'Model';
    let suffix = 2;
    while (usedNames.has(candidate)) {
      candidate = `${desired}${suffix++}`;
    }
    usedNames.add(candidate);
    sigToName.set(sig, candidate);
    return { name: candidate, alreadyCreated: false };
  }

  function visit(node: IrType, hint: string, isRoot = false): IrType {
    if (node.kind === 'array') {
      return { kind: 'array', element: visit(node.element, singularize(hint), false) };
    }
    if (node.kind === 'union') {
      return { kind: 'union', variants: node.variants.map((v) => visit(v, hint, false)) };
    }
    if (node.kind === 'struct') {
      const sig = signatureOfIrType(node);
      if (node.fields.size === 0 && !isRoot) {
        return { kind: 'any' };
      }
      const desired = isRoot ? rootName : toPascalCase(hint || node.name);
      const { name, alreadyCreated } = allocateName(desired, sig);
      if (alreadyCreated) {
        return { kind: 'struct', name, fields: node.fields };
      }

      const fieldsList: IrField[] = [];
      const placeholder: NamedStruct = { name, fields: fieldsList };
      if (topDown) structs.push(placeholder);

      for (const field of node.fields.values()) {
        if (field.optional) mergedOptionalFields++;
        if (field.nullable) nullableFields++;
        const resolvedSub = visit(field.type, toPascalCase(field.key), false);
        fieldsList.push({
          ...field,
          type: resolvedSub,
        });
      }

      if (!topDown) structs.push(placeholder);
      return { kind: 'struct', name, fields: node.fields };
    }
    return node;
  }

  const normalizedRoot = visit(rootIr, rootName, true);
  return {
    rootType: normalizedRoot,
    structs,
    stats: {
      structCount: structs.length,
      mergedOptionalFields,
      nullableFields,
    },
  };
}

// ==================== Language Emitters ====================
function isValidJsIdentifier(key: string): boolean {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key);
}

function formatTsKey(key: string): string {
  return isValidJsIdentifier(key) ? key : JSON.stringify(key);
}

function emitTsType(t: IrType): string {
  switch (t.kind) {
    case 'any':
      return 'unknown';
    case 'null':
      return 'null';
    case 'boolean':
      return 'boolean';
    case 'integer':
    case 'float':
      return 'number';
    case 'string':
      return 'string';
    case 'struct':
      return t.name;
    case 'array': {
      const inner = emitTsType(t.element);
      return t.element.kind === 'union' ? `(${inner})[]` : `${inner}[]`;
    }
    case 'union':
      return t.variants.map(emitTsType).join(' | ');
  }
}

function emitTypeScript(
  rootType: IrType,
  structs: NamedStruct[],
  rootName: string,
  opt: ConvertOptions
): string {
  const exp = opt.tsExport ? 'export ' : '';
  const ro = opt.tsReadonly ? 'readonly ' : '';
  const blocks: string[] = [];

  for (const st of structs) {
    const header = opt.tsUseInterface ? `${exp}interface ${st.name} {` : `${exp}type ${st.name} = {`;
    const body = st.fields.map((f) => {
      const isOpt = f.optional || (opt.nullableAsOptional && f.nullable);
      let typeExpr = emitTsType(f.type);
      if (f.nullable && !(f.type.kind === 'any' && opt.nullableAsOptional && !f.optional)) {
        if (f.type.kind === 'any') typeExpr = 'unknown | null';
        else typeExpr = `${typeExpr} | null`;
      }
      const qMark = isOpt ? '?' : '';
      const comment =
        opt.inlineComments && (f.optional || f.nullable)
          ? ` // ${[f.optional ? 'optional' : '', f.nullable ? 'nullable' : ''].filter(Boolean).join(', ')}`
          : '';
      return `  ${ro}${formatTsKey(f.key)}${qMark}: ${typeExpr};${comment}`;
    });
    blocks.push([header, ...body, '}'].join('\n'));
  }

  if (rootType.kind !== 'struct') {
    blocks.unshift(`${exp}type ${rootName} = ${emitTsType(rootType)};`);
  }

  return `${blocks.join('\n\n')}\n`;
}

function zodSchemaName(structName: string): string {
  return `${structName}Schema`;
}

function emitZodType(t: IrType, opt: ConvertOptions): string {
  switch (t.kind) {
    case 'any':
      return 'z.unknown()';
    case 'null':
      return 'z.null()';
    case 'boolean':
      return 'z.boolean()';
    case 'integer':
      return 'z.number().int()';
    case 'float':
      return 'z.number()';
    case 'string': {
      if (opt.detectFormats && t.formats.size === 1) {
        const fmt = Array.from(t.formats)[0];
        if (fmt === 'uuid') return 'z.string().uuid()';
        if (fmt === 'datetime') return 'z.string().datetime()';
        if (fmt === 'email') return 'z.string().email()';
        if (fmt === 'url') return 'z.string().url()';
      }
      return 'z.string()';
    }
    case 'struct':
      return zodSchemaName(t.name);
    case 'array':
      return `z.array(${emitZodType(t.element, opt)})`;
    case 'union': {
      const parts = t.variants.map((v) => emitZodType(v, opt));
      return `z.union([${parts.join(', ')}])`;
    }
  }
}

function emitZod(
  rootType: IrType,
  structs: NamedStruct[],
  rootName: string,
  opt: ConvertOptions
): string {
  const exp = opt.zodExport ? 'export ' : '';
  const blocks: string[] = [`import { z } from 'zod';`];

  for (const st of structs) {
    const schemaName = zodSchemaName(st.name);
    const lines: string[] = [`${exp}const ${schemaName} = z.object({`];
    for (const f of st.fields) {
      let expr = emitZodType(f.type, opt);
      if (f.nullable) expr += '.nullable()';
      if (f.optional || (opt.nullableAsOptional && f.nullable)) expr += '.optional()';
      lines.push(`  ${formatTsKey(f.key)}: ${expr},`);
    }
    lines.push('});');
    if (opt.zodInferType) {
      lines.push(`${exp}type ${st.name} = z.infer<typeof ${schemaName}>;`);
    }
    blocks.push(lines.join('\n'));
  }

  if (rootType.kind !== 'struct') {
    const schemaName = zodSchemaName(rootName);
    const decl = `${exp}const ${schemaName} = ${emitZodType(rootType, opt)};`;
    const inferLine = opt.zodInferType
      ? `\n${exp}type ${rootName} = z.infer<typeof ${schemaName}>;`
      : '';
    blocks.push(`${decl}${inferLine}`);
  }

  return `${blocks.join('\n\n')}\n`;
}

const GO_KEYWORDS = new Set([
  'break', 'default', 'func', 'interface', 'select', 'case', 'defer', 'go', 'map', 'struct',
  'chan', 'else', 'goto', 'package', 'switch', 'const', 'fallthrough', 'if', 'range', 'type',
  'continue', 'for', 'import', 'return', 'var',
]);

function sanitizeGoFieldName(key: string, used: Set<string>): string {
  let name = toPascalCase(key, true);
  if (GO_KEYWORDS.has(name.toLowerCase())) name = `${name}Val`;
  let final = name;
  let i = 2;
  while (used.has(final)) final = `${name}${i++}`;
  used.add(final);
  return final;
}

function emitGoType(t: IrType, opt: ConvertOptions): string {
  const anyType = opt.goUseAny ? 'any' : 'interface{}';
  switch (t.kind) {
    case 'any':
    case 'null':
    case 'union':
      return anyType;
    case 'boolean':
      return 'bool';
    case 'integer':
      return 'int64';
    case 'float':
      return 'float64';
    case 'string':
      return 'string';
    case 'struct':
      return t.name;
    case 'array':
      return `[]${emitGoType(t.element, opt)}`;
  }
}

function emitGo(
  rootType: IrType,
  structs: NamedStruct[],
  rootName: string,
  opt: ConvertOptions
): string {
  const blocks: string[] = [];

  if (rootType.kind !== 'struct') {
    blocks.push(`type ${rootName} = ${emitGoType(rootType, opt)}`);
  }

  for (const st of structs) {
    const usedFieldNames = new Set<string>();
    const lines = [`type ${st.name} struct {`];
    for (const f of st.fields) {
      const goName = sanitizeGoFieldName(f.key, usedFieldNames);
      let goType = emitGoType(f.type, opt);
      const isOptOrNull = f.optional || f.nullable;
      const shouldPtr =
        opt.goPointerNullable &&
        isOptOrNull &&
        f.type.kind !== 'array' &&
        f.type.kind !== 'any' &&
        f.type.kind !== 'union' &&
        f.type.kind !== 'null';
      if (shouldPtr) goType = `*${goType}`;

      const omitTag = opt.goOmitEmpty && isOptOrNull ? ',omitempty' : '';
      lines.push(`\t${goName} ${goType} \`json:"${f.key}${omitTag}"\``);
    }
    lines.push('}');
    blocks.push(lines.join('\n'));
  }

  return `${blocks.join('\n\n')}\n`;
}

const RUST_KEYWORDS = new Set([
  'as', 'break', 'const', 'continue', 'crate', 'else', 'enum', 'extern', 'false', 'fn', 'for',
  'if', 'impl', 'in', 'let', 'loop', 'match', 'mod', 'move', 'mut', 'pub', 'ref', 'return',
  'self', 'Self', 'static', 'struct', 'super', 'trait', 'true', 'type', 'unsafe', 'use', 'where',
  'while', 'async', 'await', 'dyn', 'abstract', 'become', 'box', 'do', 'final', 'macro',
  'override', 'priv', 'typeof', 'unsized', 'virtual', 'yield', 'try',
]);

function sanitizeRustField(key: string, used: Set<string>): { ident: string; needsRename: boolean } {
  const snake = toSnakeCase(key);
  let ident = RUST_KEYWORDS.has(snake) ? `r#${snake}` : snake;
  const base = ident;
  let i = 2;
  while (used.has(ident)) {
    ident = `${base.replace(/^r#/, '')}_${i++}`;
  }
  used.add(ident);
  const rawIdent = ident.replace(/^r#/, '');
  return { ident, needsRename: rawIdent !== key };
}

function emitRustType(t: IrType): string {
  switch (t.kind) {
    case 'any':
    case 'null':
    case 'union':
      return 'serde_json::Value';
    case 'boolean':
      return 'bool';
    case 'integer':
      return 'i64';
    case 'float':
      return 'f64';
    case 'string':
      return 'String';
    case 'struct':
      return t.name;
    case 'array':
      return `Vec<${emitRustType(t.element)}>`;
  }
}

function emitRust(
  rootType: IrType,
  structs: NamedStruct[],
  rootName: string,
  opt: ConvertOptions
): string {
  const pub = opt.rustPublic ? 'pub ' : '';
  const blocks: string[] = [];

  if (opt.rustDeriveSerde) {
    blocks.push('use serde::{Deserialize, Serialize};');
  }

  if (rootType.kind !== 'struct') {
    blocks.push(`${pub}type ${rootName} = ${emitRustType(rootType)};`);
  }

  for (const st of structs) {
    const used = new Set<string>();
    const lines: string[] = [];
    if (opt.rustDeriveSerde) {
      lines.push('#[derive(Debug, Clone, Serialize, Deserialize)]');
    } else {
      lines.push('#[derive(Debug, Clone)]');
    }
    lines.push(`${pub}struct ${st.name} {`);
    for (const f of st.fields) {
      const { ident, needsRename } = sanitizeRustField(f.key, used);
      let rustType = emitRustType(f.type);
      const isOptional = f.optional || f.nullable;
      if (isOptional && rustType !== 'serde_json::Value') {
        rustType = `Option<${rustType}>`;
      }
      if (opt.rustDeriveSerde && needsRename) {
        lines.push(`    #[serde(rename = ${JSON.stringify(f.key)})]`);
      }
      lines.push(`    ${pub}${ident}: ${rustType},`);
    }
    lines.push('}');
    blocks.push(lines.join('\n'));
  }

  return `${blocks.join('\n\n')}\n`;
}

const PYTHON_KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await', 'break', 'class', 'continue',
  'def', 'del', 'elif', 'else', 'except', 'finally', 'for', 'from', 'global', 'if', 'import', 'in',
  'is', 'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return', 'try', 'while', 'with',
  'yield', 'type', 'id', 'list', 'dict', 'set', 'str', 'int', 'float', 'bool',
]);

function sanitizePythonField(key: string, used: Set<string>): { ident: string; needsAlias: boolean } {
  const snake = toSnakeCase(key);
  let ident = PYTHON_KEYWORDS.has(snake) ? `${snake}_` : snake;
  const base = ident;
  let i = 2;
  while (used.has(ident)) {
    ident = `${base}_${i++}`;
  }
  used.add(ident);
  return { ident, needsAlias: ident !== key };
}

function emitPythonType(t: IrType, opt: ConvertOptions): string {
  switch (t.kind) {
    case 'any':
      return 'Any';
    case 'null':
      return 'None';
    case 'boolean':
      return 'bool';
    case 'integer':
      return 'int';
    case 'float':
      return 'float';
    case 'string':
      return 'str';
    case 'struct':
      return t.name;
    case 'array':
      return `list[${emitPythonType(t.element, opt)}]`;
    case 'union': {
      const parts = t.variants.map((v) => emitPythonType(v, opt));
      return opt.pyModernUnion ? parts.join(' | ') : `Union[${parts.join(', ')}]`;
    }
  }
}

function emitPydantic(
  rootType: IrType,
  structs: NamedStruct[],
  rootName: string,
  opt: ConvertOptions
): string {
  const typingImports = ['Any'];
  if (!opt.pyModernUnion) typingImports.push('Optional', 'Union');

  const pydanticImports = ['BaseModel', 'Field'];
  if (opt.pyPopulateByName) pydanticImports.push('ConfigDict');

  const blocks: string[] = [
    `from typing import ${typingImports.join(', ')}\nfrom pydantic import ${pydanticImports.join(', ')}`,
  ];

  for (const st of structs) {
    const used = new Set<string>();
    const lines = [`class ${st.name}(BaseModel):`];
    if (opt.pyPopulateByName) {
      lines.push('    model_config = ConfigDict(populate_by_name=True)');
      lines.push('');
    }
    for (const f of st.fields) {
      const { ident, needsAlias } = sanitizePythonField(f.key, used);
      const baseType = emitPythonType(f.type, opt);
      const isOpt = f.optional || f.nullable;
      let pyType = baseType;
      if (isOpt && baseType !== 'None') {
        pyType = opt.pyModernUnion ? `${baseType} | None` : `Optional[${baseType}]`;
      }

      if (needsAlias && isOpt) {
        lines.push(`    ${ident}: ${pyType} = Field(default=None, alias=${JSON.stringify(f.key)})`);
      } else if (needsAlias) {
        lines.push(`    ${ident}: ${pyType} = Field(alias=${JSON.stringify(f.key)})`);
      } else if (isOpt) {
        lines.push(`    ${ident}: ${pyType} = None`);
      } else {
        lines.push(`    ${ident}: ${pyType}`);
      }
    }
    blocks.push(lines.join('\n'));
  }

  if (rootType.kind !== 'struct') {
    blocks.push(`${rootName} = ${emitPythonType(rootType, opt)}`);
  }

  return `${blocks.join('\n\n\n')}\n`;
}

// ==================== Public Conversion Entry ====================
export function getOutputFilename(lang: TargetLang): string {
  switch (lang) {
    case 'typescript':
      return 'types.ts';
    case 'zod':
      return 'schema.zod.ts';
    case 'go':
      return 'types.go';
    case 'rust':
      return 'types.rs';
    case 'pydantic':
      return 'models.py';
  }
}

export function convertJsonToTargetTypes(
  rawJson: string,
  lang: TargetLang,
  rawOptions: ConvertOptions
): {
  code: string;
  stats: InferenceStats;
} {
  const parsed = parseRelaxedJson(rawJson);
  const rootName = toPascalCase(rawOptions.rootName.trim() || 'ApiResponse');
  const rootIr = inferValue(parsed, rootName, rawOptions.detectFormats);
  const topDown = lang !== 'zod' && lang !== 'pydantic';
  const { rootType, structs, stats } = collectStructsAndNormalize(rootIr, rootName, topDown);

  let code = '';
  switch (lang) {
    case 'typescript':
      code = emitTypeScript(rootType, structs, rootName, rawOptions);
      break;
    case 'zod':
      code = emitZod(rootType, structs, rootName, rawOptions);
      break;
    case 'go':
      code = emitGo(rootType, structs, rootName, rawOptions);
      break;
    case 'rust':
      code = emitRust(rootType, structs, rootName, rawOptions);
      break;
    case 'pydantic':
      code = emitPydantic(rootType, structs, rootName, rawOptions);
      break;
  }

  return { code, stats };
}
