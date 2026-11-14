import {
  NGINX_DIRECTIVES,
  type NginxDirectiveDoc,
  type NginxScope,
} from './data/nginxDirectives';

export interface NginxDirectiveNode {
  id: string;
  kind: 'directive';
  name: string;
  value: string;
  enabled: boolean;
  comment?: string;
}

export interface NginxBlockNode {
  id: string;
  kind: 'block';
  name: string;
  args: string;
  enabled: boolean;
  comment?: string;
  children: NginxConfigNode[];
}

export type NginxConfigNode = NginxDirectiveNode | NginxBlockNode;

export interface NginxFormatOptions {
  indentSize: 2 | 4 | 'tab';
  includeDisabledAsComments: boolean;
  includeHeaderComment: boolean;
}

export interface NginxDiagnostic {
  level: 'error' | 'warning' | 'info';
  code: string;
  blockPath: string;
  directive?: string;
  messageZh: string;
  messageEn: string;
}

export interface NginxPreset {
  id: string;
  nameKey: string;
  descKey: string;
  build: () => NginxBlockNode;
}

let uidCounter = 0;

export function nextNodeId(prefix = 'ngx'): string {
  uidCounter += 1;
  return `${prefix}_${uidCounter}`;
}

export function createDirectiveNode(
  name: string,
  value: string,
  options: { enabled?: boolean; comment?: string } = {},
): NginxDirectiveNode {
  return {
    id: nextNodeId('dir'),
    kind: 'directive',
    name: name.trim(),
    value: value.trim(),
    enabled: options.enabled ?? true,
    ...(options.comment ? { comment: options.comment } : {}),
  };
}

export function createBlockNode(
  name: string,
  args = '',
  children: NginxConfigNode[] = [],
  options: { enabled?: boolean; comment?: string } = {},
): NginxBlockNode {
  return {
    id: nextNodeId('blk'),
    kind: 'block',
    name: name.trim(),
    args: args.trim(),
    enabled: options.enabled ?? true,
    ...(options.comment ? { comment: options.comment } : {}),
    children,
  };
}

const CURATED_VALUE_STARTERS: Record<string, string> = {
  user: 'nginx',
  worker_processes: 'auto',
  worker_rlimit_nofile: '65535',
  worker_connections: '4096',
  multi_accept: 'on',
  use: 'epoll',
  pid: '/run/nginx.pid',
  error_log: '/var/log/nginx/error.log warn',
  access_log: '/var/log/nginx/access.log main',
  include: 'mime.types',
  default_type: 'application/octet-stream',
  sendfile: 'on',
  tcp_nopush: 'on',
  tcp_nodelay: 'on',
  keepalive_timeout: '65',
  keepalive_requests: '1000',
  types_hash_max_size: '2048',
  server_tokens: 'off',
  client_max_body_size: '50m',
  client_body_buffer_size: '128k',
  listen: '80',
  server_name: 'example.com www.example.com',
  root: '/var/www/html',
  index: 'index.html index.htm',
  try_files: '$uri $uri/ /index.html',
  proxy_pass: 'http://127.0.0.1:8080',
  proxy_http_version: '1.1',
  proxy_set_header: 'Host $host',
  proxy_connect_timeout: '10s',
  proxy_send_timeout: '60s',
  proxy_read_timeout: '60s',
  proxy_buffering: 'off',
  proxy_cache: 'my_cache',
  proxy_cache_valid: '200 302 10m',
  ssl_certificate: '/etc/nginx/ssl/fullchain.pem',
  ssl_certificate_key: '/etc/nginx/ssl/privkey.pem',
  ssl_protocols: 'TLSv1.2 TLSv1.3',
  ssl_ciphers: 'HIGH:!aNULL:!MD5',
  ssl_prefer_server_ciphers: 'on',
  ssl_session_cache: 'shared:SSL:10m',
  ssl_session_timeout: '1d',
  gzip: 'on',
  gzip_vary: 'on',
  gzip_proxied: 'any',
  gzip_comp_level: '6',
  gzip_min_length: '1024',
  gzip_types:
    'text/plain text/css application/json application/javascript text/xml application/xml text/javascript image/svg+xml',
  add_header: 'X-Content-Type-Options "nosniff" always',
  expires: '30d',
  return: '301 https://$host$request_uri',
  rewrite: '^/old/(.*)$ /new/$1 permanent',
  limit_req_zone: '$binary_remote_addr zone=api_limit:10m rate=10r/s',
  limit_req: 'zone=api_limit burst=20 nodelay',
  limit_conn_zone: '$binary_remote_addr zone=addr:10m',
  limit_conn: 'addr 20',
  allow: '10.0.0.0/8',
  deny: 'all',
  resolver: '8.8.8.8 1.1.1.1 valid=300s',
  server: '127.0.0.1:8080 weight=1 max_fails=3 fail_timeout=30s',
  keepalive: '32',
  least_conn: '',
  ip_hash: '',
  autoindex: 'off',
  charset: 'utf-8',
  fastcgi_pass: '127.0.0.1:9000',
  fastcgi_index: 'index.php',
  uwsgi_pass: '127.0.0.1:8000',
  grpc_pass: 'grpc://127.0.0.1:50051',
};

const CURATED_BLOCK_ARGS: Record<string, string> = {
  location: '/api/',
  upstream: 'backend_pool',
  if: '($request_method = OPTIONS)',
  limit_except: 'GET HEAD',
  map: '$http_upgrade $connection_upgrade',
  geo: '$geo',
  split_clients: '"${remote_addr}AAA" $variant',
  match: 'server_ok',
  acme_issuer: 'letsencrypt',
  oidc_provider: 'my_oidc',
  charset_map: 'koi8-r utf-8',
  num_map: '$status $mapped',
};

/**
 * 为任意一条官方 Nginx 指令生成可直接插入的合理初始参数或子块模板。
 */
export function suggestDirectiveStarter(doc: NginxDirectiveDoc): {
  isBlock: boolean;
  args: string;
  value: string;
  children?: NginxConfigNode[];
} {
  if (doc.isBlock) {
    const args = CURATED_BLOCK_ARGS[doc.name] ?? '';
    const children: NginxConfigNode[] = [];
    if (doc.name === 'events') {
      children.push(createDirectiveNode('worker_connections', '1024'));
    } else if (doc.name === 'http') {
      children.push(createDirectiveNode('include', 'mime.types'));
      children.push(createDirectiveNode('default_type', 'application/octet-stream'));
      children.push(createDirectiveNode('sendfile', 'on'));
    } else if (doc.name === 'server' && doc.scope === 'http') {
      children.push(createDirectiveNode('listen', '80'));
      children.push(createDirectiveNode('server_name', 'localhost'));
    } else if (doc.name === 'server' && doc.scope === 'stream') {
      children.push(createDirectiveNode('listen', '3306'));
      children.push(createDirectiveNode('proxy_pass', '127.0.0.1:33060'));
    } else if (doc.name === 'location') {
      children.push(createDirectiveNode('proxy_pass', 'http://127.0.0.1:8080'));
    } else if (doc.name === 'upstream') {
      children.push(createDirectiveNode('server', '127.0.0.1:8080'));
    }
    return { isBlock: true, args, value: '', children };
  }

  if (doc.name in CURATED_VALUE_STARTERS) {
    return { isBlock: false, args: '', value: CURATED_VALUE_STARTERS[doc.name] };
  }

  // 从官网 Default 字段提取默认值（如 "gzip_comp_level 1;" -> "1"）
  if (doc.default && doc.default !== '—') {
    const cleaned = doc.default.replace(/;\s*$/, '').trim();
    if (cleaned === doc.name) {
      return { isBlock: false, args: '', value: '' };
    }
    if (cleaned.startsWith(`${doc.name} `)) {
      return { isBlock: false, args: '', value: cleaned.slice(doc.name.length).trim() };
    }
  }

  // 从第一条 Syntax 提取占位参数（如 "foo on | off;" -> "on"）
  const firstSyntax = (doc.syntax.split('  |  ')[0] ?? '').replace(/;\s*$/, '').trim();
  if (firstSyntax.startsWith(`${doc.name} `)) {
    const rest = firstSyntax.slice(doc.name.length).trim();
    const onOffMatch = rest.match(/^(on\s*\|\s*off)/i);
    if (onOffMatch) {
      return { isBlock: false, args: '', value: 'on' };
    }
    return { isBlock: false, args: '', value: rest };
  }

  return { isBlock: false, args: '', value: '' };
}

/**
 * 推导当前块路径在 Nginx 官方文档中对应的 Scope 与 Context 集合。
 */
export function resolveBlockContext(blockChain: string[]): {
  scope: NginxScope | null;
  contextNames: string[];
} {
  const current = blockChain[blockChain.length - 1] ?? 'main';
  const parent = blockChain.length >= 2 ? blockChain[blockChain.length - 2] : '';

  let scope: NginxScope | null = null;
  if (blockChain.includes('http')) scope = 'http';
  else if (blockChain.includes('stream')) scope = 'stream';
  else if (blockChain.includes('mail')) scope = 'mail';
  else if (current === 'main' || current === 'events' || current === 'mgmt' || current === 'otel_exporter') {
    scope = 'core';
  }

  const contextNames = new Set<string>([current, 'any']);
  if (current === 'if') {
    if (parent === 'location' || blockChain.includes('location')) {
      contextNames.add('if in location');
    }
    if (parent === 'server') {
      contextNames.add('if in server');
    }
  }

  return {
    scope,
    contextNames: [...contextNames],
  };
}

/**
 * 判断一条官方指令是否允许放在当前块上下文中。
 */
export function isDirectiveCompatibleWithBlock(
  doc: NginxDirectiveDoc,
  blockChain: string[],
): boolean {
  const { scope, contextNames } = resolveBlockContext(blockChain);
  if (doc.contexts.length === 0) return true;

  const hasAnyContext = doc.contexts.includes('any');
  const contextMatched = hasAnyContext || doc.contexts.some((c) => contextNames.includes(c));
  if (!contextMatched) return false;

  // 对同名指令（如 server/listen/proxy_pass 在 http/stream/mail 中各有一份）做作用域精确匹配
  if (scope === 'stream' && (doc.scope === 'http' || doc.scope === 'mail')) return false;
  if (scope === 'mail' && (doc.scope === 'http' || doc.scope === 'stream')) return false;
  if (scope === 'http' && (doc.scope === 'stream' || doc.scope === 'mail')) return false;

  // main 顶层下，core 指令及顶层容器块 (http/stream/mail/events/mgmt) 允许直接添加
  if (scope === 'core' && blockChain[blockChain.length - 1] === 'main') {
    return doc.contexts.includes('main') || doc.contexts.includes('any');
  }

  return true;
}

/**
 * 在配置树中查找指定 id 的块节点及其祖先路径名称。
 */
export function findBlockAndPath(
  root: NginxBlockNode,
  targetId: string,
  ancestors: string[] = [],
): { block: NginxBlockNode; chain: string[] } | null {
  const nextChain = [...ancestors, root.name];
  if (root.id === targetId) {
    return { block: root, chain: nextChain };
  }
  for (const child of root.children) {
    if (child.kind === 'block') {
      const found = findBlockAndPath(child, targetId, nextChain);
      if (found) return found;
    }
  }
  return null;
}

/**
 * 在配置树中查找包含指定节点 id 的父块及其索引位置。
 */
export function findParentBlock(
  root: NginxBlockNode,
  targetId: string,
): { parent: NginxBlockNode; index: number } | null {
  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i];
    if (child.id === targetId) {
      return { parent: root, index: i };
    }
    if (child.kind === 'block') {
      const nested = findParentBlock(child, targetId);
      if (nested) return nested;
    }
  }
  return null;
}

function getIndentUnit(size: NginxFormatOptions['indentSize']): string {
  if (size === 'tab') return '\t';
  return ' '.repeat(size);
}

function renderNodeLines(
  node: NginxConfigNode,
  depth: number,
  indentUnit: string,
  options: NginxFormatOptions,
  out: string[],
) {
  const pad = indentUnit.repeat(depth);
  const disabledPrefix = !node.enabled ? '# ' : '';

  if (!node.enabled && !options.includeDisabledAsComments) {
    return;
  }

  if (node.comment) {
    for (const commentLine of node.comment.split(/\r?\n/)) {
      const trimmed = commentLine.trim();
      if (trimmed) {
        out.push(`${pad}# ${trimmed}`);
      }
    }
  }

  if (node.kind === 'directive') {
    const line = node.value ? `${node.name} ${node.value};` : `${node.name};`;
    out.push(`${pad}${disabledPrefix}${line}`);
    return;
  }

  const header = node.args ? `${node.name} ${node.args} {` : `${node.name} {`;
  out.push(`${pad}${disabledPrefix}${header}`);
  for (let i = 0; i < node.children.length; i++) {
    const child = node.children[i];
    if (child.kind === 'block' && i > 0 && out[out.length - 1] !== '') {
      out.push('');
    }
    renderNodeLines(child, depth + 1, indentUnit, options, out);
  }
  out.push(`${pad}${disabledPrefix}}`);
}

/**
 * 将结构化配置树渲染为格式规范的 nginx.conf 文本。
 */
export function generateNginxConfig(
  root: NginxBlockNode,
  options: Partial<NginxFormatOptions> = {},
): string {
  const resolved: NginxFormatOptions = {
    indentSize: options.indentSize ?? 4,
    includeDisabledAsComments: options.includeDisabledAsComments ?? true,
    includeHeaderComment: options.includeHeaderComment ?? true,
  };
  const indentUnit = getIndentUnit(resolved.indentSize);
  const lines: string[] = [];

  if (resolved.includeHeaderComment) {
    lines.push('# Generated by DevCrate Nginx Config Studio');
    lines.push('# Official Directives Reference: https://nginx.org/en/docs/dirindex.html');
    lines.push('');
  }

  for (let i = 0; i < root.children.length; i++) {
    const child = root.children[i];
    if (child.kind === 'block' && i > 0 && lines[lines.length - 1] !== '') {
      lines.push('');
    }
    renderNodeLines(child, 0, indentUnit, resolved, lines);
  }

  return `${lines.join('\n').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`;
}

interface Token {
  type: 'word' | 'lbrace' | 'rbrace' | 'semi' | 'comment';
  value: string;
  line: number;
}

function tokenizeNginxConfig(input: string): { tokens: Token[]; errors: string[] } {
  const tokens: Token[] = [];
  const errors: string[] = [];
  let i = 0;
  let line = 1;
  const len = input.length;

  while (i < len) {
    const ch = input[i];
    if (ch === '\n') {
      line += 1;
      i += 1;
      continue;
    }
    if (/\s/.test(ch)) {
      i += 1;
      continue;
    }
    if (ch === '#') {
      let end = i + 1;
      while (end < len && input[end] !== '\n') end += 1;
      tokens.push({ type: 'comment', value: input.slice(i + 1, end).trim(), line });
      i = end;
      continue;
    }
    if (ch === '{') {
      tokens.push({ type: 'lbrace', value: '{', line });
      i += 1;
      continue;
    }
    if (ch === '}') {
      tokens.push({ type: 'rbrace', value: '}', line });
      i += 1;
      continue;
    }
    if (ch === ';') {
      tokens.push({ type: 'semi', value: ';', line });
      i += 1;
      continue;
    }

    // 读取完整单词或带引号的字符串参数
    let word = '';
    let quote: string | null = null;
    const startLine = line;

    while (i < len) {
      const c = input[i];
      if (quote) {
        if (c === '\\' && i + 1 < len) {
          word += c + input[i + 1];
          i += 2;
          continue;
        }
        word += c;
        if (c === '\n') line += 1;
        if (c === quote) {
          quote = null;
          i += 1;
          // 引号结束后若紧跟空白或分界符，结束该 token
          if (i < len && /[\s{};#]/.test(input[i])) break;
          continue;
        }
        i += 1;
        continue;
      }

      if (c === '"' || c === "'") {
        quote = c;
        word += c;
        i += 1;
        continue;
      }

      if (/[\s{};#]/.test(c)) {
        break;
      }
      word += c;
      i += 1;
    }

    if (quote) {
      errors.push(`Unclosed quote ${quote} at line ${startLine}`);
    }
    if (word) {
      tokens.push({ type: 'word', value: word, line: startLine });
    }
  }

  return { tokens, errors };
}

/**
 * 解析现有 nginx.conf 文本为结构化配置树，支持注释、引号与任意嵌套块。
 */
export function parseNginxConfig(input: string): {
  root: NginxBlockNode;
  errors: string[];
} {
  const { tokens, errors } = tokenizeNginxConfig(input);
  const root = createBlockNode('main', '', []);
  const stack: NginxBlockNode[] = [root];
  let currentWords: string[] = [];
  let pendingComments: string[] = [];

  for (const token of tokens) {
    if (token.type === 'comment') {
      // 跳过工具自生成的固定头部注释
      if (
        !token.value.startsWith('Generated by DevCrate') &&
        !token.value.startsWith('Official Directives Reference:')
      ) {
        pendingComments.push(token.value);
      }
      continue;
    }

    if (token.type === 'word') {
      currentWords.push(token.value);
      continue;
    }

    if (token.type === 'semi') {
      if (currentWords.length > 0) {
        const [name, ...rest] = currentWords;
        const comment = pendingComments.length > 0 ? pendingComments.join('\n') : undefined;
        stack[stack.length - 1].children.push(
          createDirectiveNode(name, rest.join(' '), { comment }),
        );
        pendingComments = [];
        currentWords = [];
      }
      continue;
    }

    if (token.type === 'lbrace') {
      if (currentWords.length === 0) {
        errors.push(`Unexpected '{' without block name at line ${token.line}`);
        continue;
      }
      const [name, ...rest] = currentWords;
      const comment = pendingComments.length > 0 ? pendingComments.join('\n') : undefined;
      const block = createBlockNode(name, rest.join(' '), [], { comment });
      stack[stack.length - 1].children.push(block);
      stack.push(block);
      pendingComments = [];
      currentWords = [];
      continue;
    }

    if (token.type === 'rbrace') {
      if (currentWords.length > 0) {
        errors.push(
          `Missing ';' before '}' near '${currentWords.join(' ')}' at line ${token.line}`,
        );
        currentWords = [];
      }
      if (stack.length <= 1) {
        errors.push(`Unexpected extra '}' at line ${token.line}`);
      } else {
        stack.pop();
      }
      pendingComments = [];
    }
  }

  if (currentWords.length > 0) {
    errors.push(`Unterminated directive '${currentWords.join(' ')}' (missing ';')`);
  }
  if (stack.length > 1) {
    errors.push(`Unclosed block '${stack[stack.length - 1].name} {' (missing '}')`);
  }

  return { root, errors };
}

const DIRECTIVES_BY_NAME = new Map<string, NginxDirectiveDoc[]>();
for (const doc of NGINX_DIRECTIVES) {
  const list = DIRECTIVES_BY_NAME.get(doc.name) ?? [];
  list.push(doc);
  DIRECTIVES_BY_NAME.set(doc.name, list);
}

export function lookupDirectiveDocs(name: string): NginxDirectiveDoc[] {
  return DIRECTIVES_BY_NAME.get(name.trim()) ?? [];
}

/**
 * 对当前配置树进行语义与上下文校验，提示常见错误与官网上下文不兼容项。
 */
export function lintNginxConfig(root: NginxBlockNode): NginxDiagnostic[] {
  const diagnostics: NginxDiagnostic[] = [];

  function walk(block: NginxBlockNode, chain: string[]) {
    if (!block.enabled) return;
    const blockPath = chain.join(' > ');

    if (block.name === 'server') {
      const enabledDirs = block.children.filter(
        (c): c is NginxDirectiveNode => c.kind === 'directive' && c.enabled,
      );
      const listens = enabledDirs.filter((d) => d.name === 'listen');
      const hasSslCert = enabledDirs.some((d) => d.name === 'ssl_certificate');
      const hasSslKey = enabledDirs.some((d) => d.name === 'ssl_certificate_key');
      const hasSslListen = listens.some((d) => /\bssl\b/i.test(d.value));
      const isHttpServer = chain.includes('http');

      if (listens.length === 0) {
        diagnostics.push({
          level: 'warning',
          code: 'SERVER_NO_LISTEN',
          blockPath,
          directive: 'listen',
          messageZh: `${blockPath} 缺少 listen 指令（将默认监听 80/8000）`,
          messageEn: `${blockPath} has no listen directive (defaults to port 80/8000)`,
        });
      }
      if (hasSslCert && !hasSslKey) {
        diagnostics.push({
          level: 'error',
          code: 'SSL_MISSING_KEY',
          blockPath,
          directive: 'ssl_certificate_key',
          messageZh: `${blockPath} 已配置 ssl_certificate，但缺少 ssl_certificate_key`,
          messageEn: `${blockPath} configures ssl_certificate without ssl_certificate_key`,
        });
      }
      if (isHttpServer && hasSslListen && !hasSslCert) {
        diagnostics.push({
          level: 'warning',
          code: 'SSL_LISTEN_NO_CERT',
          blockPath,
          directive: 'ssl_certificate',
          messageZh: `${blockPath} 已启用 listen ... ssl，但未配置 ssl_certificate`,
          messageEn: `${blockPath} enables listen ... ssl without ssl_certificate`,
        });
      }
    }

    for (const child of block.children) {
      if (!child.enabled) continue;
      if (child.kind === 'directive') {
        if (child.name === 'proxy_pass' && chain.includes('http')) {
          if (child.value && !/^(https?:\/\/|unix:|http:\/\/\$|https:\/\/\$|\$)/i.test(child.value)) {
            diagnostics.push({
              level: 'warning',
              code: 'PROXY_PASS_SCHEME',
              blockPath,
              directive: 'proxy_pass',
              messageZh: `${blockPath} 中的 proxy_pass "${child.value}" 通常需要以 http:// 或 https:// 开头`,
              messageEn: `proxy_pass "${child.value}" in ${blockPath} usually requires http:// or https://`,
            });
          }
        }

        const docs = lookupDirectiveDocs(child.name);
        if (docs.length > 0 && block.name !== 'types' && block.name !== 'map' && block.name !== 'geo' && block.name !== 'charset_map' && block.name !== 'num_map' && block.name !== 'split_clients') {
          const allowed = docs.some((doc) => isDirectiveCompatibleWithBlock(doc, chain));
          if (!allowed) {
            const allowedContexts = [...new Set(docs.flatMap((d) => d.contexts))].join(', ');
            diagnostics.push({
              level: 'warning',
              code: 'CONTEXT_MISMATCH',
              blockPath,
              directive: child.name,
              messageZh: `指令 "${child.name}" 放在 ${blockPath} 可能不被允许（官网适用上下文: ${allowedContexts}）`,
              messageEn: `Directive "${child.name}" may not be allowed in ${blockPath} (allowed: ${allowedContexts})`,
            });
          }
        }
      } else {
        walk(child, [...chain, child.name]);
      }
    }
  }

  for (const child of root.children) {
    if (child.kind === 'block') {
      walk(child, [child.name]);
    } else if (child.enabled) {
      const docs = lookupDirectiveDocs(child.name);
      if (docs.length > 0 && !docs.some((d) => isDirectiveCompatibleWithBlock(d, ['main']))) {
        const allowedContexts = [...new Set(docs.flatMap((d) => d.contexts))].join(', ');
        diagnostics.push({
          level: 'warning',
          code: 'CONTEXT_MISMATCH',
          blockPath: 'main',
          directive: child.name,
          messageZh: `指令 "${child.name}" 放在 main 顶层可能不被允许（官网适用上下文: ${allowedContexts}）`,
          messageEn: `Directive "${child.name}" may not be allowed in main context (allowed: ${allowedContexts})`,
        });
      }
    }
  }

  return diagnostics;
}

export const NGINX_PRESETS: NginxPreset[] = [
  {
    id: 'reverse-proxy',
    nameKey: 'tools.nginxConfig.presetReverseProxy',
    descKey: 'tools.nginxConfig.presetReverseProxyDesc',
    build: () =>
      createBlockNode('main', '', [
        createDirectiveNode('worker_processes', 'auto'),
        createDirectiveNode('error_log', '/var/log/nginx/error.log warn'),
        createDirectiveNode('pid', '/run/nginx.pid'),
        createBlockNode('events', '', [
          createDirectiveNode('worker_connections', '4096'),
        ]),
        createBlockNode('http', '', [
          createDirectiveNode('include', 'mime.types'),
          createDirectiveNode('default_type', 'application/octet-stream'),
          createDirectiveNode('sendfile', 'on'),
          createDirectiveNode('keepalive_timeout', '65'),
          createDirectiveNode('client_max_body_size', '50m'),
          createDirectiveNode('gzip', 'on'),
          createDirectiveNode('gzip_comp_level', '6'),
          createDirectiveNode(
            'gzip_types',
            'text/plain text/css application/json application/javascript text/xml application/xml text/javascript',
          ),
          createBlockNode('upstream', 'app_backend', [
            createDirectiveNode('server', '127.0.0.1:8080 max_fails=3 fail_timeout=30s'),
            createDirectiveNode('keepalive', '32'),
          ]),
          createBlockNode('server', '', [
            createDirectiveNode('listen', '80'),
            createDirectiveNode('server_name', 'api.example.com'),
            createBlockNode('location', '/', [
              createDirectiveNode('proxy_pass', 'http://app_backend'),
              createDirectiveNode('proxy_http_version', '1.1'),
              createDirectiveNode('proxy_set_header', 'Host $host'),
              createDirectiveNode('proxy_set_header', 'X-Real-IP $remote_addr'),
              createDirectiveNode('proxy_set_header', 'X-Forwarded-For $proxy_add_x_forwarded_for'),
              createDirectiveNode('proxy_set_header', 'X-Forwarded-Proto $scheme'),
              createDirectiveNode('proxy_set_header', 'Upgrade $http_upgrade'),
              createDirectiveNode('proxy_set_header', 'Connection "upgrade"'),
              createDirectiveNode('proxy_read_timeout', '60s'),
            ]),
          ]),
        ]),
      ]),
  },
  {
    id: 'https-site',
    nameKey: 'tools.nginxConfig.presetHttps',
    descKey: 'tools.nginxConfig.presetHttpsDesc',
    build: () =>
      createBlockNode('main', '', [
        createDirectiveNode('worker_processes', 'auto'),
        createBlockNode('events', '', [
          createDirectiveNode('worker_connections', '4096'),
        ]),
        createBlockNode('http', '', [
          createDirectiveNode('include', 'mime.types'),
          createDirectiveNode('default_type', 'application/octet-stream'),
          createDirectiveNode('sendfile', 'on'),
          createDirectiveNode('server_tokens', 'off'),
          createBlockNode('server', '', [
            createDirectiveNode('listen', '80'),
            createDirectiveNode('server_name', 'example.com www.example.com'),
            createDirectiveNode('return', '301 https://$host$request_uri'),
          ]),
          createBlockNode('server', '', [
            createDirectiveNode('listen', '443 ssl http2'),
            createDirectiveNode('server_name', 'example.com www.example.com'),
            createDirectiveNode('ssl_certificate', '/etc/nginx/ssl/fullchain.pem'),
            createDirectiveNode('ssl_certificate_key', '/etc/nginx/ssl/privkey.pem'),
            createDirectiveNode('ssl_protocols', 'TLSv1.2 TLSv1.3'),
            createDirectiveNode('ssl_ciphers', 'HIGH:!aNULL:!MD5'),
            createDirectiveNode('ssl_session_cache', 'shared:SSL:10m'),
            createDirectiveNode('ssl_session_timeout', '1d'),
            createDirectiveNode('add_header', 'Strict-Transport-Security "max-age=31536000; includeSubDomains" always'),
            createDirectiveNode('add_header', 'X-Frame-Options "SAMEORIGIN" always'),
            createDirectiveNode('add_header', 'X-Content-Type-Options "nosniff" always'),
            createBlockNode('location', '/', [
              createDirectiveNode('proxy_pass', 'http://127.0.0.1:3000'),
              createDirectiveNode('proxy_set_header', 'Host $host'),
              createDirectiveNode('proxy_set_header', 'X-Forwarded-Proto $scheme'),
            ]),
          ]),
        ]),
      ]),
  },
  {
    id: 'spa-static',
    nameKey: 'tools.nginxConfig.presetSpa',
    descKey: 'tools.nginxConfig.presetSpaDesc',
    build: () =>
      createBlockNode('main', '', [
        createDirectiveNode('worker_processes', 'auto'),
        createBlockNode('events', '', [
          createDirectiveNode('worker_connections', '2048'),
        ]),
        createBlockNode('http', '', [
          createDirectiveNode('include', 'mime.types'),
          createDirectiveNode('default_type', 'application/octet-stream'),
          createDirectiveNode('sendfile', 'on'),
          createDirectiveNode('gzip', 'on'),
          createDirectiveNode('gzip_vary', 'on'),
          createDirectiveNode('gzip_min_length', '1024'),
          createDirectiveNode(
            'gzip_types',
            'text/plain text/css application/json application/javascript image/svg+xml',
          ),
          createBlockNode('server', '', [
            createDirectiveNode('listen', '80'),
            createDirectiveNode('server_name', 'app.example.com'),
            createDirectiveNode('root', '/var/www/dist'),
            createDirectiveNode('index', 'index.html'),
            createBlockNode('location', '/', [
              createDirectiveNode('try_files', '$uri $uri/ /index.html'),
            ]),
            createBlockNode('location', '~* \\.(js|css|png|jpg|jpeg|gif|ico|svg|woff2?)$', [
              createDirectiveNode('expires', '30d'),
              createDirectiveNode('add_header', 'Cache-Control "public, immutable"'),
              createDirectiveNode('access_log', 'off'),
            ]),
          ]),
        ]),
      ]),
  },
  {
    id: 'load-balancer',
    nameKey: 'tools.nginxConfig.presetLoadBalancer',
    descKey: 'tools.nginxConfig.presetLoadBalancerDesc',
    build: () =>
      createBlockNode('main', '', [
        createDirectiveNode('worker_processes', 'auto'),
        createBlockNode('events', '', [
          createDirectiveNode('worker_connections', '8192'),
        ]),
        createBlockNode('http', '', [
          createDirectiveNode('include', 'mime.types'),
          createDirectiveNode('default_type', 'application/octet-stream'),
          createBlockNode('upstream', 'cluster_nodes', [
            createDirectiveNode('least_conn', ''),
            createDirectiveNode('server', '10.0.1.10:8080 weight=3 max_fails=3 fail_timeout=30s'),
            createDirectiveNode('server', '10.0.1.11:8080 weight=2 max_fails=3 fail_timeout=30s'),
            createDirectiveNode('server', '10.0.1.12:8080 backup'),
            createDirectiveNode('keepalive', '64'),
          ]),
          createBlockNode('server', '', [
            createDirectiveNode('listen', '80'),
            createDirectiveNode('server_name', 'lb.example.com'),
            createBlockNode('location', '/', [
              createDirectiveNode('proxy_pass', 'http://cluster_nodes'),
              createDirectiveNode('proxy_http_version', '1.1'),
              createDirectiveNode('proxy_set_header', 'Connection ""'),
              createDirectiveNode('proxy_set_header', 'Host $host'),
              createDirectiveNode('proxy_next_upstream', 'error timeout http_502 http_503 http_504'),
            ]),
          ]),
        ]),
      ]),
  },
  {
    id: 'api-gateway',
    nameKey: 'tools.nginxConfig.presetApiGateway',
    descKey: 'tools.nginxConfig.presetApiGatewayDesc',
    build: () =>
      createBlockNode('main', '', [
        createDirectiveNode('worker_processes', 'auto'),
        createBlockNode('events', '', [
          createDirectiveNode('worker_connections', '4096'),
        ]),
        createBlockNode('http', '', [
          createDirectiveNode('include', 'mime.types'),
          createDirectiveNode('default_type', 'application/json'),
          createDirectiveNode('limit_req_zone', '$binary_remote_addr zone=api_rate:10m rate=20r/s'),
          createBlockNode('server', '', [
            createDirectiveNode('listen', '80'),
            createDirectiveNode('server_name', 'gateway.example.com'),
            createDirectiveNode('client_max_body_size', '20m'),
            createBlockNode('location', '/api/', [
              createDirectiveNode('limit_req', 'zone=api_rate burst=40 nodelay'),
              createDirectiveNode('add_header', 'Access-Control-Allow-Origin "*" always'),
              createDirectiveNode('add_header', 'Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always'),
              createDirectiveNode('add_header', 'Access-Control-Allow-Headers "Authorization, Content-Type" always'),
              createBlockNode('if', '($request_method = OPTIONS)', [
                createDirectiveNode('return', '204'),
              ]),
              createDirectiveNode('proxy_pass', 'http://127.0.0.1:9000'),
              createDirectiveNode('proxy_set_header', 'Host $host'),
              createDirectiveNode('proxy_set_header', 'X-Real-IP $remote_addr'),
            ]),
          ]),
        ]),
      ]),
  },
  {
    id: 'stream-proxy',
    nameKey: 'tools.nginxConfig.presetStream',
    descKey: 'tools.nginxConfig.presetStreamDesc',
    build: () =>
      createBlockNode('main', '', [
        createDirectiveNode('worker_processes', 'auto'),
        createBlockNode('events', '', [
          createDirectiveNode('worker_connections', '2048'),
        ]),
        createBlockNode('stream', '', [
          createBlockNode('upstream', 'db_cluster', [
            createDirectiveNode('server', '10.0.2.10:3306 max_fails=2 fail_timeout=10s'),
            createDirectiveNode('server', '10.0.2.11:3306 backup'),
          ]),
          createBlockNode('server', '', [
            createDirectiveNode('listen', '3306'),
            createDirectiveNode('proxy_connect_timeout', '5s'),
            createDirectiveNode('proxy_timeout', '30m'),
            createDirectiveNode('proxy_pass', 'db_cluster'),
          ]),
        ]),
      ]),
  },
  {
    id: 'blank',
    nameKey: 'tools.nginxConfig.presetBlank',
    descKey: 'tools.nginxConfig.presetBlankDesc',
    build: () =>
      createBlockNode('main', '', [
        createDirectiveNode('worker_processes', 'auto'),
        createBlockNode('events', '', [
          createDirectiveNode('worker_connections', '1024'),
        ]),
        createBlockNode('http', '', [
          createDirectiveNode('include', 'mime.types'),
          createDirectiveNode('default_type', 'application/octet-stream'),
          createBlockNode('server', '', [
            createDirectiveNode('listen', '80'),
            createDirectiveNode('server_name', 'localhost'),
            createBlockNode('location', '/', [
              createDirectiveNode('root', '/usr/share/nginx/html'),
              createDirectiveNode('index', 'index.html index.htm'),
            ]),
          ]),
        ]),
      ]),
  },
];

export const CONTEXT_QUICK_DIRECTIVES: Record<string, string[]> = {
  main: ['worker_processes', 'user', 'error_log', 'pid', 'worker_rlimit_nofile', 'include'],
  events: ['worker_connections', 'multi_accept', 'use', 'accept_mutex'],
  http: [
    'include',
    'default_type',
    'sendfile',
    'keepalive_timeout',
    'gzip',
    'gzip_types',
    'client_max_body_size',
    'server_tokens',
    'limit_req_zone',
    'access_log',
  ],
  server: [
    'listen',
    'server_name',
    'root',
    'index',
    'ssl_certificate',
    'ssl_certificate_key',
    'ssl_protocols',
    'client_max_body_size',
    'access_log',
    'error_log',
    'return',
  ],
  location: [
    'proxy_pass',
    'proxy_set_header',
    'proxy_http_version',
    'try_files',
    'root',
    'alias',
    'add_header',
    'expires',
    'limit_req',
    'return',
    'rewrite',
  ],
  upstream: ['server', 'least_conn', 'ip_hash', 'keepalive', 'zone'],
  stream: ['proxy_connect_timeout', 'proxy_timeout', 'resolver', 'access_log'],
  mail: ['auth_http', 'proxy_pass_error_message', 'xclient'],
};

export const ALLOWED_CHILD_BLOCKS: Record<string, Array<{ name: string; defaultArgs: string }>> = {
  main: [
    { name: 'events', defaultArgs: '' },
    { name: 'http', defaultArgs: '' },
    { name: 'stream', defaultArgs: '' },
    { name: 'mail', defaultArgs: '' },
    { name: 'mgmt', defaultArgs: '' },
  ],
  http: [
    { name: 'server', defaultArgs: '' },
    { name: 'upstream', defaultArgs: 'backend' },
    { name: 'map', defaultArgs: '$http_upgrade $connection_upgrade' },
    { name: 'geo', defaultArgs: '$geo' },
    { name: 'split_clients', defaultArgs: '"${remote_addr}AAA" $variant' },
    { name: 'types', defaultArgs: '' },
    { name: 'acme_issuer', defaultArgs: 'letsencrypt' },
    { name: 'oidc_provider', defaultArgs: 'provider' },
  ],
  server: [
    { name: 'location', defaultArgs: '/' },
    { name: 'if', defaultArgs: '($request_method = OPTIONS)' },
  ],
  location: [
    { name: 'location', defaultArgs: '~* \\.(js|css)$' },
    { name: 'if', defaultArgs: '($request_method = OPTIONS)' },
    { name: 'limit_except', defaultArgs: 'GET HEAD' },
  ],
  stream: [
    { name: 'server', defaultArgs: '' },
    { name: 'upstream', defaultArgs: 'stream_backend' },
    { name: 'map', defaultArgs: '$remote_addr $target' },
    { name: 'geo', defaultArgs: '$geo' },
  ],
  mail: [{ name: 'server', defaultArgs: '' }],
};
