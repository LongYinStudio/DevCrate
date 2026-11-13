export type ProtocolType = 'ws' | 'sse';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';
export type LogDirection = 'sent' | 'received' | 'system' | 'error';
export type WsPayloadMode = 'text' | 'json' | 'hex';

export interface LogEntry {
  id: string;
  timestamp: string;
  direction: LogDirection;
  protocol: ProtocolType;
  content: string;
  byteSize: number;
  isJson?: boolean;
  isBinary?: boolean;
  hexView?: string;
  sseEvent?: string;
  sseId?: string;
}

export interface ParsedSseEvent {
  event: string;
  data: string;
  id?: string;
  retry?: number;
  isComment?: boolean;
}

/**
 * 遵循 WHATWG 规范的流式 SSE（Server-Sent Events）增量解析器
 */
export class SseStreamParser {
  private buffer = '';
  private currentEvent = '';
  private dataLines: string[] = [];
  private lastEventId = '';
  private currentRetry: number | undefined = undefined;
  private hasDataField = false;

  /**
   * 喂入新到达的文本分片，返回本次解析出的完整事件列表
   */
  feed(chunk: string): ParsedSseEvent[] {
    this.buffer += chunk;
    const events: ParsedSseEvent[] = [];

    // 统一将 \r\n 与孤立 \r 切分为行（保留末尾未闭合行在 buffer 中）
    let startIdx = 0;
    for (let i = 0; i < this.buffer.length; i++) {
      const ch = this.buffer[i];
      if (ch === '\r' || ch === '\n') {
        // 若是单独的 \r 且正好位于当前 chunk 末尾，等待下一个字符看是否是 \r\n
        if (ch === '\r' && i === this.buffer.length - 1) {
          break;
        }
        const line = this.buffer.slice(startIdx, i);
        if (ch === '\r' && this.buffer[i + 1] === '\n') {
          i++;
        }
        startIdx = i + 1;
        const evt = this.processLine(line);
        if (evt) events.push(evt);
      }
    }

    this.buffer = this.buffer.slice(startIdx);
    return events;
  }

  /**
   * 流结束时冲刷剩余未提交的事件缓冲
   */
  flush(): ParsedSseEvent[] {
    const events: ParsedSseEvent[] = [];
    if (this.buffer.length > 0) {
      const line = this.buffer.replace(/\r$/, '');
      this.buffer = '';
      const evt = this.processLine(line);
      if (evt) events.push(evt);
    }
    const pending = this.dispatchEvent();
    if (pending) events.push(pending);
    return events;
  }

  private processLine(line: string): ParsedSseEvent | null {
    if (line === '') {
      return this.dispatchEvent();
    }

    // 注释行（常见于心跳保活 `: keep-alive`）
    if (line.startsWith(':')) {
      const comment = line.slice(1).trimStart();
      if (comment) {
        return {
          event: 'comment',
          data: comment,
          isComment: true
        };
      }
      return null;
    }

    const colonIdx = line.indexOf(':');
    let field = '';
    let value = '';
    if (colonIdx === -1) {
      field = line;
      value = '';
    } else {
      field = line.slice(0, colonIdx);
      value = line.slice(colonIdx + 1);
      if (value.startsWith(' ')) {
        value = value.slice(1);
      }
    }

    switch (field) {
      case 'event':
        this.currentEvent = value;
        break;
      case 'data':
        this.dataLines.push(value);
        this.hasDataField = true;
        break;
      case 'id':
        if (!value.includes('\0')) {
          this.lastEventId = value;
        }
        break;
      case 'retry': {
        if (/^\d+$/.test(value)) {
          this.currentRetry = parseInt(value, 10);
        }
        break;
      }
    }

    return null;
  }

  private dispatchEvent(): ParsedSseEvent | null {
    if (!this.hasDataField) {
      this.currentEvent = '';
      this.currentRetry = undefined;
      return null;
    }

    const evt: ParsedSseEvent = {
      event: this.currentEvent || 'message',
      data: this.dataLines.join('\n'),
      id: this.lastEventId || undefined,
      retry: this.currentRetry
    };

    this.currentEvent = '';
    this.dataLines = [];
    this.hasDataField = false;
    this.currentRetry = undefined;
    return evt;
  }
}

/**
 * 从常见 SSE JSON 分片（OpenAI / Anthropic / Ollama / 通用格式）提取增量文本
 */
export function extractSseStreamDelta(data: string): string | null {
  const trimmed = data.trim();
  if (!trimmed || trimmed === '[DONE]') return null;

  if (trimmed.startsWith('{')) {
    try {
      const obj = JSON.parse(trimmed);
      // OpenAI / DeepSeek / Compatible
      const choiceDelta = obj?.choices?.[0]?.delta;
      if (choiceDelta) {
        if (typeof choiceDelta.content === 'string') return choiceDelta.content;
        if (typeof choiceDelta.reasoning_content === 'string') return choiceDelta.reasoning_content;
      }
      if (typeof obj?.choices?.[0]?.text === 'string') {
        return obj.choices[0].text;
      }
      // Anthropic
      if (typeof obj?.delta?.text === 'string') {
        return obj.delta.text;
      }
      // Ollama
      if (typeof obj?.message?.content === 'string') {
        return obj.message.content;
      }
      if (typeof obj?.response === 'string') {
        return obj.response;
      }
      // 通用字段
      if (typeof obj?.content === 'string') return obj.content;
      if (typeof obj?.text === 'string') return obj.text;
      if (typeof obj?.delta === 'string') return obj.delta;
      return null;
    } catch {
      return data;
    }
  }

  return data;
}

/**
 * 尝试美化 JSON 文本
 */
export function tryPrettyJson(text: string): { isJson: boolean; formatted: string } {
  const trimmed = text.trim();
  if (!trimmed || (!trimmed.startsWith('{') && !trimmed.startsWith('['))) {
    return { isJson: false, formatted: text };
  }
  try {
    const parsed = JSON.parse(trimmed);
    return { isJson: true, formatted: JSON.stringify(parsed, null, 2) };
  } catch {
    return { isJson: false, formatted: text };
  }
}

/**
 * 将十六进制字符串解析为 Uint8Array（支持空格、逗号、0x 前缀）
 */
export function parseHexToBytes(hexInput: string): { ok: true; bytes: Uint8Array<ArrayBuffer> } | { ok: false } {
  const cleaned = hexInput
    .replace(/0[xX]/g, '')
    .replace(/[\s,:-]+/g, '');

  if (!cleaned || cleaned.length % 2 !== 0 || !/^[0-9a-fA-F]+$/.test(cleaned)) {
    return { ok: false };
  }

  const buffer = new ArrayBuffer(cleaned.length / 2);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(cleaned.slice(i * 2, i * 2 + 2), 16);
  }
  return { ok: true, bytes };
}

/**
 * 将 Uint8Array 格式化为紧凑十六进制字符串
 */
export function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => b.toString(16).toUpperCase().padStart(2, '0'))
    .join(' ');
}

/**
 * 将 Uint8Array 转为可读 ASCII 预览（不可见字符替换为 '.'）
 */
export function bytesToAsciiPreview(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map(b => (b >= 32 && b <= 126 ? String.fromCharCode(b) : '.'))
    .join('');
}

export function formatTimeWithMs(date: Date = new Date()): string {
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  const ss = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${hh}:${mm}:${ss}.${ms}`;
}

export function formatDurationSeconds(totalSeconds: number): string {
  const hrs = Math.floor(totalSeconds / 3600);
  const mins = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hrs > 0) {
    return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export function getUtf8ByteLength(text: string): number {
  return new TextEncoder().encode(text).byteLength;
}

export function formatBytesCompact(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function validateEndpointUrl(url: string, protocol: ProtocolType): boolean {
  const trimmed = url.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('mock://')) return true;
  try {
    const parsed = new URL(trimmed);
    if (protocol === 'ws') {
      return parsed.protocol === 'ws:' || parsed.protocol === 'wss:';
    }
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}
