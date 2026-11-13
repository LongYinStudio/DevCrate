<script setup lang="ts">
import { ref, computed, watch, nextTick, onUnmounted } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Cable,
  Play,
  Square,
  Send,
  Sparkles,
  Trash2,
  Download,
  Search,
  X,
  Plus,
  Copy,
  Check,
  HeartPulse,
  Wand2,
  ArrowUpRight,
  ArrowDownLeft,
  Info,
  AlertCircle,
  ChevronDown,
  ChevronUp
} from 'lucide-vue-next';
import ToolContainer from '../../components/common/ToolContainer.vue';
import CopyButton from '../../components/common/CopyButton.vue';
import { downloadFile } from '../../utils/download';
import {
  SseStreamParser,
  extractSseStreamDelta,
  tryPrettyJson,
  parseHexToBytes,
  bytesToHex,
  bytesToAsciiPreview,
  formatTimeWithMs,
  formatDurationSeconds,
  getUtf8ByteLength,
  formatBytesCompact,
  validateEndpointUrl,
  type ProtocolType,
  type ConnectionStatus,
  type WsPayloadMode,
  type LogEntry
} from './wsSseUtils';

const { t } = useI18n();

// ==================== 协议与连接状态 ====================
const protocol = ref<ProtocolType>('ws');
const wsUrl = ref('ws://localhost:8080/ws');
const sseUrl = ref('http://localhost:3000/events');
const sseMethod = ref<'GET' | 'POST'>('GET');

const status = ref<ConnectionStatus>('disconnected');
const elapsedSeconds = ref(0);
let durationTimer: ReturnType<typeof setInterval> | null = null;

// 底层连接句柄
let wsInstance: WebSocket | null = null;
let sseAbortController: AbortController | null = null;
let mockTimers: ReturnType<typeof setTimeout>[] = [];
let mockInterval: ReturnType<typeof setInterval> | null = null;
let isMockWsSession = false;

// ==================== WebSocket 配置与发送状态 ====================
const showWsAdvanced = ref(false);
const wsSubprotocols = ref('');
const heartbeatEnabled = ref(false);
const heartbeatIntervalSec = ref(15);
const heartbeatPayload = ref('{"type":"ping"}');
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;

const wsPayloadMode = ref<WsPayloadMode>('json');
const wsMessageInput = ref('{\n  "type": "hello",\n  "message": "Hello from DevCrate!"\n}');
const composerError = ref('');

const wsQuickSnippets = [
  { label: 'Ping JSON', mode: 'json' as WsPayloadMode, body: '{\n  "type": "ping"\n}' },
  { label: 'Subscribe', mode: 'json' as WsPayloadMode, body: '{\n  "action": "subscribe",\n  "channel": "updates"\n}' },
  { label: 'Hello Text', mode: 'text' as WsPayloadMode, body: 'Hello WebSocket!' },
  { label: 'Hex Sample', mode: 'hex' as WsPayloadMode, body: '48 65 6C 6C 6F' }
];

// ==================== SSE 请求配置状态 ====================
interface HeaderRow {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
}

const sseHeaders = ref<HeaderRow[]>([
  { id: 'h1', enabled: true, key: 'Accept', value: 'text/event-stream' },
  { id: 'h2', enabled: false, key: 'Authorization', value: 'Bearer ' },
  { id: 'h3', enabled: true, key: 'Content-Type', value: 'application/json' }
]);

const sseBody = ref('{\n  "model": "gpt-4o-mini",\n  "stream": true,\n  "messages": [\n    { "role": "user", "content": "Hello!" }\n  ]\n}');

// ==================== 日志与流视图状态 ====================
const logs = ref<LogEntry[]>([]);
const assembledStreamText = ref('');
const sseViewTab = ref<'logs' | 'stream'>('logs');
const directionFilter = ref<'all' | 'received' | 'sent' | 'system'>('all');
const searchQuery = ref('');
const autoScroll = ref(true);
const prettyJsonView = ref(true);
const logContainerRef = ref<HTMLDivElement | null>(null);
const copiedLogId = ref<string | null>(null);

const currentUrl = computed({
  get: () => (protocol.value === 'ws' ? wsUrl.value : sseUrl.value),
  set: (val: string) => {
    if (protocol.value === 'ws') {
      wsUrl.value = val;
    } else {
      sseUrl.value = val;
    }
  }
});

const isConnectedOrConnecting = computed(() => {
  return status.value === 'connected' || status.value === 'connecting';
});

const filteredLogs = computed(() => {
  const q = searchQuery.value.trim().toLowerCase();
  return logs.value.filter(entry => {
    if (directionFilter.value === 'received' && entry.direction !== 'received') return false;
    if (directionFilter.value === 'sent' && entry.direction !== 'sent') return false;
    if (
      directionFilter.value === 'system' &&
      entry.direction !== 'system' &&
      entry.direction !== 'error'
    ) {
      return false;
    }
    if (q) {
      const inContent = entry.content.toLowerCase().includes(q);
      const inEvent = (entry.sseEvent || '').toLowerCase().includes(q);
      const inId = (entry.sseId || '').toLowerCase().includes(q);
      return inContent || inEvent || inId;
    }
    return true;
  });
});

const composerByteSize = computed(() => {
  if (!wsMessageInput.value) return 0;
  if (wsPayloadMode.value === 'hex') {
    const parsed = parseHexToBytes(wsMessageInput.value);
    return parsed.ok ? parsed.bytes.byteLength : 0;
  }
  return getUtf8ByteLength(wsMessageInput.value);
});

// ==================== 工具辅助函数 ====================
function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function appendLog(partial: Omit<LogEntry, 'id' | 'timestamp'>) {
  logs.value.push({
    ...partial,
    id: makeId(),
    timestamp: formatTimeWithMs()
  });

  // 上限保护，防止超长运行导致 DOM 过大
  if (logs.value.length > 500) {
    logs.value.splice(0, logs.value.length - 500);
  }

  if (autoScroll.value) {
    nextTick(() => {
      if (logContainerRef.value) {
        logContainerRef.value.scrollTop = logContainerRef.value.scrollHeight;
      }
    });
  }
}

function startDurationTimer() {
  stopDurationTimer();
  elapsedSeconds.value = 0;
  durationTimer = setInterval(() => {
    elapsedSeconds.value += 1;
  }, 1000);
}

function stopDurationTimer() {
  if (durationTimer) {
    clearInterval(durationTimer);
    durationTimer = null;
  }
}

function clearAllMockTimers() {
  mockTimers.forEach(tId => clearTimeout(tId));
  mockTimers = [];
  if (mockInterval) {
    clearInterval(mockInterval);
    mockInterval = null;
  }
}

function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
}

function startHeartbeat() {
  stopHeartbeat();
  if (!heartbeatEnabled.value || protocol.value !== 'ws' || status.value !== 'connected') {
    return;
  }
  const sec = Math.max(1, Math.min(3600, heartbeatIntervalSec.value || 15));
  heartbeatTimer = setInterval(() => {
    if (status.value === 'connected' && heartbeatPayload.value) {
      sendRawWsText(heartbeatPayload.value);
    }
  }, sec * 1000);
}

watch([heartbeatEnabled, heartbeatIntervalSec], () => {
  if (protocol.value === 'ws' && status.value === 'connected') {
    if (heartbeatEnabled.value) {
      startHeartbeat();
    } else {
      stopHeartbeat();
    }
  }
});

// ==================== 断开与清理 ====================
function disconnect(silent = false) {
  stopHeartbeat();
  stopDurationTimer();
  clearAllMockTimers();

  if (wsInstance) {
    try {
      wsInstance.onopen = null;
      wsInstance.onmessage = null;
      wsInstance.onerror = null;
      wsInstance.onclose = null;
      wsInstance.close(1000, 'Client disconnected');
    } catch {
      // ignore
    }
    wsInstance = null;
    if (!silent) {
      appendLog({
        direction: 'system',
        protocol: 'ws',
        content: t('tools.wsSseTester.wsClosed', { code: 1000, reason: '' }),
        byteSize: 0
      });
    }
  } else if (isMockWsSession) {
    isMockWsSession = false;
    if (!silent) {
      appendLog({
        direction: 'system',
        protocol: 'ws',
        content: t('tools.wsSseTester.wsClosed', { code: 1000, reason: ' (mock)' }),
        byteSize: 0
      });
    }
  }

  if (sseAbortController) {
    sseAbortController.abort();
    sseAbortController = null;
    if (!silent) {
      appendLog({
        direction: 'system',
        protocol: 'sse',
        content: t('tools.wsSseTester.sseCompleted'),
        byteSize: 0
      });
    }
  }

  status.value = 'disconnected';
}

function switchProtocol(next: ProtocolType) {
  if (protocol.value === next) return;
  if (isConnectedOrConnecting.value) {
    disconnect(true);
  }
  protocol.value = next;
  composerError.value = '';
  if (next === 'ws' && sseViewTab.value === 'stream') {
    sseViewTab.value = 'logs';
  }
}

// ==================== WebSocket 连接与收发 ====================
function connectWebSocket(targetUrl: string) {
  disconnect(true);
  status.value = 'connecting';

  if (targetUrl.trim() === 'mock://ws-echo') {
    isMockWsSession = true;
    const tId = setTimeout(() => {
      status.value = 'connected';
      startDurationTimer();
      startHeartbeat();
      appendLog({
        direction: 'system',
        protocol: 'ws',
        content: t('tools.wsSseTester.mockHint'),
        byteSize: 0
      });
      appendLog({
        direction: 'received',
        protocol: 'ws',
        content: JSON.stringify({ server: 'DevCrate Mock WS', status: 'ready', time: new Date().toISOString() }, null, 2),
        byteSize: 64,
        isJson: true
      });
    }, 180);
    mockTimers.push(tId);
    return;
  }

  const protocols = wsSubprotocols.value
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  try {
    wsInstance = protocols.length > 0 ? new WebSocket(targetUrl, protocols) : new WebSocket(targetUrl);
    wsInstance.binaryType = 'arraybuffer';

    wsInstance.onopen = () => {
      status.value = 'connected';
      startDurationTimer();
      startHeartbeat();
      appendLog({
        direction: 'system',
        protocol: 'ws',
        content: t('tools.wsSseTester.wsOpened', { url: targetUrl }),
        byteSize: 0
      });
    };

    wsInstance.onmessage = async (event: MessageEvent) => {
      if (typeof event.data === 'string') {
        const jsonCheck = tryPrettyJson(event.data);
        appendLog({
          direction: 'received',
          protocol: 'ws',
          content: event.data,
          byteSize: getUtf8ByteLength(event.data),
          isJson: jsonCheck.isJson
        });
      } else if (event.data instanceof ArrayBuffer) {
        const bytes = new Uint8Array(event.data);
        const hex = bytesToHex(bytes);
        const ascii = bytesToAsciiPreview(bytes);
        appendLog({
          direction: 'received',
          protocol: 'ws',
          content: ascii,
          byteSize: bytes.byteLength,
          isBinary: true,
          hexView: hex
        });
      } else if (event.data instanceof Blob) {
        const buf = await event.data.arrayBuffer();
        const bytes = new Uint8Array(buf);
        appendLog({
          direction: 'received',
          protocol: 'ws',
          content: bytesToAsciiPreview(bytes),
          byteSize: bytes.byteLength,
          isBinary: true,
          hexView: bytesToHex(bytes)
        });
      }
    };

    wsInstance.onerror = () => {
      status.value = 'error';
      appendLog({
        direction: 'error',
        protocol: 'ws',
        content: t('tools.wsSseTester.wsError'),
        byteSize: 0
      });
    };

    wsInstance.onclose = (event: CloseEvent) => {
      stopHeartbeat();
      stopDurationTimer();
      wsInstance = null;
      if (status.value !== 'error') {
        status.value = 'disconnected';
      }
      const reasonText = event.reason ? `, reason: ${event.reason}` : '';
      appendLog({
        direction: 'system',
        protocol: 'ws',
        content: t('tools.wsSseTester.wsClosed', { code: event.code, reason: reasonText }),
        byteSize: 0
      });
    };
  } catch (err: any) {
    status.value = 'error';
    appendLog({
      direction: 'error',
      protocol: 'ws',
      content: err?.message || t('tools.wsSseTester.wsError'),
      byteSize: 0
    });
  }
}

function sendRawWsText(text: string) {
  if (isMockWsSession) {
    const jsonCheck = tryPrettyJson(text);
    appendLog({
      direction: 'sent',
      protocol: 'ws',
      content: text,
      byteSize: getUtf8ByteLength(text),
      isJson: jsonCheck.isJson
    });

    const echoDelay = setTimeout(() => {
      if (!isMockWsSession) return;
      let reply = text;
      if (text.trim().toLowerCase() === 'ping') {
        reply = 'pong';
      } else if (jsonCheck.isJson) {
        try {
          const parsed = JSON.parse(text);
          reply = JSON.stringify({ echo: parsed, receivedAt: new Date().toISOString() }, null, 2);
        } catch {
          // keep text
        }
      }
      const replyJson = tryPrettyJson(reply);
      appendLog({
        direction: 'received',
        protocol: 'ws',
        content: reply,
        byteSize: getUtf8ByteLength(reply),
        isJson: replyJson.isJson
      });
    }, 120);
    mockTimers.push(echoDelay);
    return;
  }

  if (!wsInstance || wsInstance.readyState !== WebSocket.OPEN) return;
  wsInstance.send(text);
  const jsonCheck = tryPrettyJson(text);
  appendLog({
    direction: 'sent',
    protocol: 'ws',
    content: text,
    byteSize: getUtf8ByteLength(text),
    isJson: jsonCheck.isJson
  });
}

function handleSendWsMessage() {
  composerError.value = '';
  if (status.value !== 'connected') return;

  const raw = wsMessageInput.value;
  if (!raw.trim()) return;

  if (wsPayloadMode.value === 'hex') {
    const parsed = parseHexToBytes(raw);
    if (!parsed.ok) {
      composerError.value = t('tools.wsSseTester.invalidHex');
      return;
    }
    const hexFormatted = bytesToHex(parsed.bytes);
    const ascii = bytesToAsciiPreview(parsed.bytes);

    if (isMockWsSession) {
      appendLog({
        direction: 'sent',
        protocol: 'ws',
        content: ascii,
        byteSize: parsed.bytes.byteLength,
        isBinary: true,
        hexView: hexFormatted
      });
      const tId = setTimeout(() => {
        if (!isMockWsSession) return;
        appendLog({
          direction: 'received',
          protocol: 'ws',
          content: ascii,
          byteSize: parsed.bytes.byteLength,
          isBinary: true,
          hexView: hexFormatted
        });
      }, 120);
      mockTimers.push(tId);
      return;
    }

    if (wsInstance && wsInstance.readyState === WebSocket.OPEN) {
      wsInstance.send(parsed.bytes);
      appendLog({
        direction: 'sent',
        protocol: 'ws',
        content: ascii,
        byteSize: parsed.bytes.byteLength,
        isBinary: true,
        hexView: hexFormatted
      });
    }
    return;
  }

  if (wsPayloadMode.value === 'json') {
    try {
      JSON.parse(raw);
    } catch {
      composerError.value = t('tools.wsSseTester.invalidJsonSend');
      return;
    }
  }

  sendRawWsText(raw);
}

function prettifyComposerJson() {
  composerError.value = '';
  const res = tryPrettyJson(wsMessageInput.value);
  if (res.isJson) {
    wsMessageInput.value = res.formatted;
  } else {
    composerError.value = t('tools.wsSseTester.invalidJsonSend');
  }
}

function prettifySseBodyJson() {
  const res = tryPrettyJson(sseBody.value);
  if (res.isJson) {
    sseBody.value = res.formatted;
  }
}

function applyWsSnippet(snippet: { mode: WsPayloadMode; body: string }) {
  wsPayloadMode.value = snippet.mode;
  wsMessageInput.value = snippet.body;
  composerError.value = '';
}

function onComposerKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleSendWsMessage();
  }
}

// ==================== SSE 连接与流式解析 ====================
async function connectSse(targetUrl: string) {
  disconnect(true);
  status.value = 'connecting';
  assembledStreamText.value = '';

  // 本地 Mock AI SSE 流演示通道
  if (targetUrl.trim() === 'mock://sse-ai-stream') {
    const parser = new SseStreamParser();
    const tokens = [
      'Hello! ',
      'This is ',
      'a **DevCrate** ',
      'local SSE ',
      'streaming ',
      'simulation.\n\n',
      'You can inspect ',
      'raw `event` / `id` / `data` ',
      'frames or switch ',
      'to the merged ',
      'text stream tab!'
    ];

    const startTimer = setTimeout(() => {
      status.value = 'connected';
      startDurationTimer();
      appendLog({
        direction: 'system',
        protocol: 'sse',
        content: t('tools.wsSseTester.mockHint'),
        byteSize: 0
      });
      appendLog({
        direction: 'system',
        protocol: 'sse',
        content: t('tools.wsSseTester.sseConnected', {
          method: sseMethod.value,
          url: targetUrl,
          status: 200
        }),
        byteSize: 0
      });

      const metaChunk = `event: status\nid: 0\ndata: {"status":"started","model":"devcrate-mock"}\n\n`;
      for (const evt of parser.feed(metaChunk)) {
        handleParsedSseEvent(evt);
      }

      let idx = 0;
      mockInterval = setInterval(() => {
        if (idx < tokens.length) {
          const payload = JSON.stringify({
            id: `chatcmpl-mock-${idx + 1}`,
            choices: [{ index: 0, delta: { content: tokens[idx] } }]
          });
          const chunk = `id: ${idx + 1}\ndata: ${payload}\n\n`;
          for (const evt of parser.feed(chunk)) {
            handleParsedSseEvent(evt);
          }
          idx++;
        } else {
          const doneChunk = `: keep-alive\n\ndata: [DONE]\n\n`;
          for (const evt of parser.feed(doneChunk)) {
            handleParsedSseEvent(evt);
          }
          for (const evt of parser.flush()) {
            handleParsedSseEvent(evt);
          }
          clearAllMockTimers();
          stopDurationTimer();
          status.value = 'disconnected';
          appendLog({
            direction: 'system',
            protocol: 'sse',
            content: t('tools.wsSseTester.sseCompleted'),
            byteSize: 0
          });
        }
      }, 160);
    }, 150);
    mockTimers.push(startTimer);
    return;
  }

  sseAbortController = new AbortController();
  const headersObj: Record<string, string> = {};
  for (const row of sseHeaders.value) {
    if (row.enabled && row.key.trim()) {
      headersObj[row.key.trim()] = row.value;
    }
  }

  const fetchInit: RequestInit = {
    method: sseMethod.value,
    headers: headersObj,
    signal: sseAbortController.signal
  };

  if (sseMethod.value === 'POST' && sseBody.value.trim()) {
    fetchInit.body = sseBody.value;
  }

  try {
    const response = await fetch(targetUrl, fetchInit);
    if (!response.ok) {
      status.value = 'error';
      stopDurationTimer();
      appendLog({
        direction: 'error',
        protocol: 'sse',
        content: t('tools.wsSseTester.sseHttpError', {
          status: response.status,
          statusText: response.statusText
        }),
        byteSize: 0
      });
      sseAbortController = null;
      return;
    }

    if (!response.body) {
      status.value = 'error';
      appendLog({
        direction: 'error',
        protocol: 'sse',
        content: t('tools.wsSseTester.sseNoBody'),
        byteSize: 0
      });
      sseAbortController = null;
      return;
    }

    status.value = 'connected';
    startDurationTimer();
    appendLog({
      direction: 'system',
      protocol: 'sse',
      content: t('tools.wsSseTester.sseConnected', {
        method: sseMethod.value,
        url: targetUrl,
        status: response.status
      }),
      byteSize: 0
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    const parser = new SseStreamParser();

    while (true) {
      const { value, done } = await reader.read();
      if (done) {
        const remaining = decoder.decode();
        if (remaining) {
          for (const evt of parser.feed(remaining)) {
            handleParsedSseEvent(evt);
          }
        }
        for (const evt of parser.flush()) {
          handleParsedSseEvent(evt);
        }
        break;
      }

      const chunk = decoder.decode(value, { stream: true });
      for (const evt of parser.feed(chunk)) {
        handleParsedSseEvent(evt);
      }
    }

    stopDurationTimer();
    sseAbortController = null;
    status.value = 'disconnected';
    appendLog({
      direction: 'system',
      protocol: 'sse',
      content: t('tools.wsSseTester.sseCompleted'),
      byteSize: 0
    });
  } catch (err: any) {
    stopDurationTimer();
    sseAbortController = null;
    if (err?.name === 'AbortError') {
      status.value = 'disconnected';
      return;
    }
    status.value = 'error';
    appendLog({
      direction: 'error',
      protocol: 'sse',
      content: t('tools.wsSseTester.sseNetworkError', { detail: err?.message || 'Network Error' }),
      byteSize: 0
    });
  }
}

function handleParsedSseEvent(evt: { event: string; data: string; id?: string; isComment?: boolean }) {
  if (evt.isComment) {
    appendLog({
      direction: 'system',
      protocol: 'sse',
      content: `: ${evt.data}`,
      byteSize: getUtf8ByteLength(evt.data),
      sseEvent: 'comment'
    });
    return;
  }

  const jsonCheck = tryPrettyJson(evt.data);
  appendLog({
    direction: 'received',
    protocol: 'sse',
    content: evt.data,
    byteSize: getUtf8ByteLength(evt.data),
    isJson: jsonCheck.isJson,
    sseEvent: evt.event,
    sseId: evt.id
  });

  const delta = extractSseStreamDelta(evt.data);
  if (delta !== null) {
    assembledStreamText.value += delta;
  }
}

// ==================== 统一连接入口 & Mock 触发 ====================
function handleToggleConnection() {
  if (isConnectedOrConnecting.value) {
    disconnect();
    return;
  }

  const url = currentUrl.value.trim();
  if (!validateEndpointUrl(url, protocol.value)) {
    appendLog({
      direction: 'error',
      protocol: protocol.value,
      content: t('tools.wsSseTester.invalidUrl'),
      byteSize: 0
    });
    return;
  }

  if (protocol.value === 'ws') {
    connectWebSocket(url);
  } else {
    connectSse(url);
  }
}

function startMockDemo() {
  if (protocol.value === 'ws') {
    wsUrl.value = 'mock://ws-echo';
    connectWebSocket('mock://ws-echo');
  } else {
    sseUrl.value = 'mock://sse-ai-stream';
    sseMethod.value = 'POST';
    connectSse('mock://sse-ai-stream');
  }
}

function addHeaderRow() {
  sseHeaders.value.push({
    id: makeId(),
    enabled: true,
    key: '',
    value: ''
  });
}

function removeHeaderRow(id: string) {
  sseHeaders.value = sseHeaders.value.filter(h => h.id !== id);
}

function clearLogs() {
  logs.value = [];
  assembledStreamText.value = '';
}

function exportLogs() {
  if (logs.value.length === 0) return;
  const payload = JSON.stringify(logs.value, null, 2);
  downloadFile(payload, `${protocol.value}-logs-${Date.now()}.json`, 'application/json;charset=utf-8');
}

function copyLogContent(entry: LogEntry) {
  const text = prettyJsonView.value && entry.isJson ? tryPrettyJson(entry.content).formatted : entry.content;
  navigator.clipboard.writeText(text).then(() => {
    copiedLogId.value = entry.id;
    setTimeout(() => {
      if (copiedLogId.value === entry.id) {
        copiedLogId.value = null;
      }
    }, 1400);
  });
}

function displayLogContent(entry: LogEntry): string {
  if (prettyJsonView.value && entry.isJson) {
    return tryPrettyJson(entry.content).formatted;
  }
  return entry.content;
}

onUnmounted(() => {
  disconnect(true);
});
</script>

<template>
  <ToolContainer
    toolId="ws-sse-tester"
    nameKey="tools.wsSseTester.name"
    descKey="tools.wsSseTester.desc"
    :icon="Cable"
    :wide="true"
    :fullHeight="true"
  >
    <div class="flex flex-col flex-1 min-h-0 gap-3.5 h-full">
      <!-- 顶部连接栏 -->
      <div class="p-3.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs space-y-2.5 shrink-0">
        <div class="flex flex-wrap items-center justify-between gap-2.5">
          <!-- 协议切换与状态指示 -->
          <div class="flex flex-wrap items-center gap-2.5">
            <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80">
              <button
                type="button"
                @click="switchProtocol('ws')"
                class="px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
                :class="protocol === 'ws'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
              >
                {{ t('tools.wsSseTester.protocolWs') }}
              </button>
              <button
                type="button"
                @click="switchProtocol('sse')"
                class="px-3 py-1 rounded-md text-xs font-medium transition-all cursor-pointer"
                :class="protocol === 'sse'
                  ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'"
              >
                {{ t('tools.wsSseTester.protocolSse') }}
              </button>
            </div>

            <!-- 实时连接状态徽章 -->
            <div
              class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium border"
              :class="{
                'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60': status === 'connected',
                'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60': status === 'connecting',
                'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60': status === 'error',
                'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-700': status === 'disconnected'
              }"
            >
              <span
                class="w-2 h-2 rounded-full"
                :class="{
                  'bg-emerald-500 animate-pulse': status === 'connected',
                  'bg-amber-500 animate-ping': status === 'connecting',
                  'bg-rose-500': status === 'error',
                  'bg-zinc-400': status === 'disconnected'
                }"
              />
              <span>
                {{
                  status === 'connected'
                    ? t('tools.wsSseTester.connected')
                    : status === 'connecting'
                      ? t('tools.wsSseTester.connecting')
                      : status === 'error'
                        ? t('tools.wsSseTester.errorStatus')
                        : t('tools.wsSseTester.disconnected')
                }}
              </span>
              <span v-if="status === 'connected'" class="font-mono text-[11px] opacity-80 ml-0.5">
                {{ formatDurationSeconds(elapsedSeconds) }}
              </span>
            </div>
          </div>

          <!-- 一键本地 Mock 模拟按钮 -->
          <button
            type="button"
            @click="startMockDemo"
            class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50/70 hover:bg-blue-100/80 dark:bg-blue-950/40 dark:hover:bg-blue-900/50 border border-blue-200/80 dark:border-blue-800/60 transition-colors cursor-pointer"
          >
            <Sparkles class="w-3.5 h-3.5" />
            <span>{{ protocol === 'ws' ? t('tools.wsSseTester.loadMockWs') : t('tools.wsSseTester.loadMockSse') }}</span>
          </button>
        </div>

        <!-- 地址输入与连接按钮行 -->
        <div class="flex items-center gap-2">
          <!-- SSE HTTP Method 选择 -->
          <div
            v-if="protocol === 'sse'"
            class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200 dark:border-zinc-700 shrink-0"
          >
            <button
              type="button"
              :disabled="isConnectedOrConnecting"
              @click="sseMethod = 'GET'"
              class="px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer disabled:opacity-50"
              :class="sseMethod === 'GET' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-xs' : 'text-zinc-500'"
            >
              GET
            </button>
            <button
              type="button"
              :disabled="isConnectedOrConnecting"
              @click="sseMethod = 'POST'"
              class="px-2.5 py-1.5 rounded-md text-xs font-mono font-semibold transition-colors cursor-pointer disabled:opacity-50"
              :class="sseMethod === 'POST' ? 'bg-white dark:bg-zinc-700 text-amber-600 dark:text-amber-400 shadow-xs' : 'text-zinc-500'"
            >
              POST
            </button>
          </div>

          <input
            v-model="currentUrl"
            type="text"
            :disabled="isConnectedOrConnecting"
            @keydown.enter="handleToggleConnection"
            :placeholder="protocol === 'ws' ? t('tools.wsSseTester.wsUrlPlaceholder') : t('tools.wsSseTester.sseUrlPlaceholder')"
            class="flex-1 px-3 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
          />

          <button
            type="button"
            @click="handleToggleConnection"
            class="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium text-white transition-colors cursor-pointer shrink-0 shadow-xs"
            :class="isConnectedOrConnecting
              ? 'bg-rose-600 hover:bg-rose-500'
              : 'bg-blue-600 hover:bg-blue-500'"
          >
            <component :is="isConnectedOrConnecting ? Square : Play" class="w-3.5 h-3.5" />
            <span>{{ isConnectedOrConnecting ? t('tools.wsSseTester.disconnect') : t('tools.wsSseTester.connect') }}</span>
          </button>
        </div>
      </div>

      <!-- 主左右工作区 -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-4 flex-1 min-h-0">
        <!-- 左侧：协议配置与消息发送器 -->
        <div class="lg:col-span-5 flex flex-col gap-3.5 min-h-0">
          <!-- WebSocket 模式左侧 -->
          <template v-if="protocol === 'ws'">
            <!-- 子协议与心跳保活面板 -->
            <div class="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs shrink-0 overflow-hidden">
              <button
                type="button"
                @click="showWsAdvanced = !showWsAdvanced"
                class="w-full px-3.5 py-2 flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200 hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors cursor-pointer"
              >
                <span class="flex items-center gap-1.5">
                  <HeartPulse class="w-3.5 h-3.5 text-rose-500" />
                  <span>{{ t('tools.wsSseTester.heartbeatTitle') }} & {{ t('tools.wsSseTester.subprotocols') }}</span>
                  <span
                    v-if="heartbeatEnabled"
                    class="px-1.5 py-0.2 rounded text-[10px] bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 font-mono"
                  >
                    {{ heartbeatIntervalSec }}s
                  </span>
                </span>
                <component :is="showWsAdvanced ? ChevronUp : ChevronDown" class="w-4 h-4 text-zinc-400" />
              </button>

              <div v-if="showWsAdvanced" class="px-3.5 pb-3.5 pt-2 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3 text-xs">
                <div>
                  <label class="block text-[11px] font-medium text-zinc-500 dark:text-zinc-400 mb-1">
                    {{ t('tools.wsSseTester.subprotocols') }}
                  </label>
                  <input
                    v-model="wsSubprotocols"
                    :disabled="isConnectedOrConnecting"
                    type="text"
                    :placeholder="t('tools.wsSseTester.subprotocolsPlaceholder')"
                    class="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-60"
                  />
                </div>

                <div class="pt-1 space-y-2">
                  <div class="flex items-center justify-between">
                    <label class="inline-flex items-center gap-2 cursor-pointer select-none text-zinc-700 dark:text-zinc-300">
                      <input
                        v-model="heartbeatEnabled"
                        type="checkbox"
                        class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                      />
                      <span>{{ t('tools.wsSseTester.heartbeatEnable') }}</span>
                    </label>

                    <div class="flex items-center gap-1.5">
                      <span class="text-[11px] text-zinc-500">{{ t('tools.wsSseTester.heartbeatInterval') }}:</span>
                      <input
                        v-model.number="heartbeatIntervalSec"
                        type="number"
                        min="1"
                        max="3600"
                        class="w-16 px-2 py-0.5 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 text-center"
                      />
                    </div>
                  </div>

                  <input
                    v-model="heartbeatPayload"
                    type="text"
                    :placeholder="t('tools.wsSseTester.heartbeatPayload')"
                    class="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            <!-- WebSocket 消息发送器 -->
            <div class="flex-1 min-h-[240px] rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col overflow-hidden">
              <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
                <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80 text-xs">
                  <button
                    type="button"
                    @click="wsPayloadMode = 'text'; composerError = ''"
                    class="px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer"
                    :class="wsPayloadMode === 'text' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500'"
                  >
                    {{ t('tools.wsSseTester.payloadText') }}
                  </button>
                  <button
                    type="button"
                    @click="wsPayloadMode = 'json'; composerError = ''"
                    class="px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer"
                    :class="wsPayloadMode === 'json' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500'"
                  >
                    {{ t('tools.wsSseTester.payloadJson') }}
                  </button>
                  <button
                    type="button"
                    @click="wsPayloadMode = 'hex'; composerError = ''"
                    class="px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer"
                    :class="wsPayloadMode === 'hex' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500'"
                  >
                    {{ t('tools.wsSseTester.payloadHex') }}
                  </button>
                </div>

                <button
                  v-if="wsPayloadMode === 'json'"
                  type="button"
                  @click="prettifyComposerJson"
                  class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  <Wand2 class="w-3.5 h-3.5" />
                  <span>{{ t('tools.wsSseTester.formatJson') }}</span>
                </button>
              </div>

              <!-- 快捷消息芯片 -->
              <div class="px-3.5 py-1.5 border-b border-zinc-100 dark:border-zinc-800/60 flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink-0">
                <span class="text-[11px] text-zinc-400 shrink-0">{{ t('tools.wsSseTester.quickSnippets') }}:</span>
                <button
                  v-for="snip in wsQuickSnippets"
                  :key="snip.label"
                  type="button"
                  @click="applyWsSnippet(snip)"
                  class="px-2 py-0.5 rounded text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-600 dark:text-zinc-300 shrink-0 transition-colors cursor-pointer"
                >
                  {{ snip.label }}
                </button>
              </div>

              <textarea
                v-model="wsMessageInput"
                @keydown="onComposerKeydown"
                :placeholder="wsPayloadMode === 'json'
                  ? t('tools.wsSseTester.messagePlaceholderJson')
                  : wsPayloadMode === 'hex'
                    ? t('tools.wsSseTester.messagePlaceholderHex')
                    : t('tools.wsSseTester.messagePlaceholderText')"
                class="flex-1 w-full p-3.5 text-xs font-mono bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none focus:outline-none leading-relaxed"
              />

              <div
                v-if="composerError"
                class="px-3.5 py-1.5 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-[11px] border-t border-rose-200/70 dark:border-rose-800/50 flex items-center gap-1.5 shrink-0"
              >
                <AlertCircle class="w-3.5 h-3.5 shrink-0" />
                <span>{{ composerError }}</span>
              </div>

              <div class="px-3.5 py-2 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/60 dark:bg-zinc-900/50 flex items-center justify-between gap-2 shrink-0">
                <div class="flex items-center gap-2 text-[11px] text-zinc-400 font-mono">
                  <span>{{ formatBytesCompact(composerByteSize) }}</span>
                  <span>·</span>
                  <span>{{ t('tools.wsSseTester.sendShortcut') }}</span>
                </div>

                <button
                  type="button"
                  @click="handleSendWsMessage"
                  :disabled="status !== 'connected' || !wsMessageInput.trim()"
                  class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-xs transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Send class="w-3.5 h-3.5" />
                  <span>{{ t('tools.wsSseTester.sendBtn') }}</span>
                </button>
              </div>
            </div>
          </template>

          <!-- SSE 模式左侧：Headers 与 POST Body -->
          <template v-else>
            <div class="flex-1 min-h-0 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs flex flex-col overflow-hidden">
              <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex items-center justify-between text-xs font-semibold text-zinc-800 dark:text-zinc-200 shrink-0">
                <span>{{ t('tools.wsSseTester.sseHeaders') }}</span>
                <button
                  type="button"
                  @click="addHeaderRow"
                  class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors cursor-pointer"
                >
                  <Plus class="w-3.5 h-3.5" />
                  <span>{{ t('tools.wsSseTester.addHeader') }}</span>
                </button>
              </div>

              <div class="p-3 space-y-2 overflow-y-auto max-h-48 border-b border-zinc-100 dark:border-zinc-800/80 shrink-0">
                <div
                  v-for="row in sseHeaders"
                  :key="row.id"
                  class="flex items-center gap-1.5"
                >
                  <input
                    v-model="row.enabled"
                    type="checkbox"
                    class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer shrink-0"
                  />
                  <input
                    v-model="row.key"
                    type="text"
                    :placeholder="t('tools.wsSseTester.headerKey')"
                    class="w-2/5 px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <input
                    v-model="row.value"
                    type="text"
                    :placeholder="t('tools.wsSseTester.headerValue')"
                    class="flex-1 px-2 py-1 text-xs font-mono rounded border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    @click="removeHeaderRow(row.id)"
                    class="p-1 text-zinc-400 hover:text-rose-500 rounded cursor-pointer shrink-0"
                  >
                    <X class="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <!-- POST Body 编辑区 -->
              <div class="flex-1 flex flex-col min-h-[140px]">
                <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/40 flex items-center justify-between text-xs shrink-0">
                  <span class="font-semibold text-zinc-800 dark:text-zinc-200">
                    {{ t('tools.wsSseTester.sseBody') }}
                    <span v-if="sseMethod === 'GET'" class="font-normal text-[11px] text-zinc-400 ml-1">(GET disabled)</span>
                  </span>
                  <button
                    v-if="sseMethod === 'POST'"
                    type="button"
                    @click="prettifySseBodyJson"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
                  >
                    <Wand2 class="w-3.5 h-3.5" />
                    <span>{{ t('tools.wsSseTester.formatJson') }}</span>
                  </button>
                </div>

                <textarea
                  v-model="sseBody"
                  :disabled="sseMethod === 'GET'"
                  :placeholder="t('tools.wsSseTester.sseBodyPlaceholder')"
                  class="flex-1 w-full p-3.5 text-xs font-mono bg-transparent text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 resize-none focus:outline-none leading-relaxed disabled:opacity-40"
                />
              </div>
            </div>
          </template>
        </div>

        <!-- 右侧：通信日志与流合并预览 -->
        <div class="lg:col-span-7 flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-xs overflow-hidden min-h-[280px] h-full">
          <!-- 日志头部栏 -->
          <div class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/80 dark:bg-zinc-900/60 flex flex-wrap items-center justify-between gap-2 shrink-0">
            <div class="flex items-center gap-2">
              <!-- SSE 模式下允许切换「事件日志」与「AI / 文本流合并」 -->
              <div
                v-if="protocol === 'sse'"
                class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 border border-zinc-200/80 dark:border-zinc-700/80 text-xs"
              >
                <button
                  type="button"
                  @click="sseViewTab = 'logs'"
                  class="px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer"
                  :class="sseViewTab === 'logs' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500'"
                >
                  {{ t('tools.wsSseTester.tabLogs') }}
                </button>
                <button
                  type="button"
                  @click="sseViewTab = 'stream'"
                  class="px-2.5 py-0.5 rounded font-medium transition-colors cursor-pointer"
                  :class="sseViewTab === 'stream' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-xs' : 'text-zinc-500'"
                >
                  {{ t('tools.wsSseTester.tabStreamText') }}
                </button>
              </div>
              <span v-else class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {{ t('tools.wsSseTester.logTitle') }}
              </span>

              <span class="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400">
                {{ t('tools.wsSseTester.msgCount', { count: filteredLogs.length }) }}
              </span>
            </div>

            <div class="flex items-center gap-1.5">
              <label class="inline-flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400 cursor-pointer select-none px-1.5">
                <input
                  v-model="prettyJsonView"
                  type="checkbox"
                  class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>{{ t('tools.wsSseTester.prettyJsonToggle') }}</span>
              </label>

              <label class="inline-flex items-center gap-1 text-[11px] text-zinc-600 dark:text-zinc-400 cursor-pointer select-none px-1.5">
                <input
                  v-model="autoScroll"
                  type="checkbox"
                  class="rounded border-zinc-300 dark:border-zinc-700 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span>{{ t('tools.wsSseTester.autoScroll') }}</span>
              </label>

              <button
                type="button"
                @click="exportLogs"
                :disabled="logs.length === 0"
                class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-200/60 dark:hover:bg-zinc-800 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                :title="t('tools.wsSseTester.exportLogs')"
              >
                <Download class="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                @click="clearLogs"
                :disabled="logs.length === 0 && !assembledStreamText"
                class="inline-flex items-center gap-1 px-2 py-1 rounded text-xs text-zinc-600 hover:text-rose-600 dark:text-zinc-400 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                :title="t('tools.wsSseTester.clearLogs')"
              >
                <Trash2 class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 过滤条（仅日志视图下展示） -->
          <div
            v-if="protocol === 'ws' || sseViewTab === 'logs'"
            class="px-3.5 py-2 border-b border-zinc-100 dark:border-zinc-800/60 flex flex-wrap items-center gap-2 shrink-0"
          >
            <div class="inline-flex rounded-lg bg-zinc-100 dark:bg-zinc-800 p-0.5 text-[11px]">
              <button
                type="button"
                @click="directionFilter = 'all'"
                class="px-2 py-0.5 rounded font-medium cursor-pointer"
                :class="directionFilter === 'all' ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-2xs' : 'text-zinc-500'"
              >
                {{ t('tools.wsSseTester.filterAll') }}
              </button>
              <button
                type="button"
                @click="directionFilter = 'received'"
                class="px-2 py-0.5 rounded font-medium cursor-pointer"
                :class="directionFilter === 'received' ? 'bg-white dark:bg-zinc-700 text-emerald-600 dark:text-emerald-400 shadow-2xs' : 'text-zinc-500'"
              >
                {{ t('tools.wsSseTester.filterReceived') }}
              </button>
              <button
                v-if="protocol === 'ws'"
                type="button"
                @click="directionFilter = 'sent'"
                class="px-2 py-0.5 rounded font-medium cursor-pointer"
                :class="directionFilter === 'sent' ? 'bg-white dark:bg-zinc-700 text-blue-600 dark:text-blue-400 shadow-2xs' : 'text-zinc-500'"
              >
                {{ t('tools.wsSseTester.filterSent') }}
              </button>
              <button
                type="button"
                @click="directionFilter = 'system'"
                class="px-2 py-0.5 rounded font-medium cursor-pointer"
                :class="directionFilter === 'system' ? 'bg-white dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200 shadow-2xs' : 'text-zinc-500'"
              >
                {{ t('tools.wsSseTester.filterSystem') }}
              </button>
            </div>

            <div class="relative flex-1 min-w-[160px]">
              <Search class="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input
                v-model="searchQuery"
                type="text"
                :placeholder="t('tools.wsSseTester.searchLogsPlaceholder')"
                class="w-full pl-8 pr-7 py-1 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <button
                v-if="searchQuery"
                type="button"
                @click="searchQuery = ''"
                class="absolute right-2 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                <X class="w-3 h-3" />
              </button>
            </div>
          </div>

          <!-- 视图 1：结构化消息/事件时间线 -->
          <div
            v-if="protocol === 'ws' || sseViewTab === 'logs'"
            ref="logContainerRef"
            class="flex-1 min-h-0 overflow-y-auto p-3 space-y-2 bg-zinc-50/40 dark:bg-zinc-950/30"
          >
            <div
              v-if="filteredLogs.length === 0"
              class="h-full flex flex-col items-center justify-center p-6 text-center text-zinc-400 dark:text-zinc-500"
            >
              <Cable class="w-9 h-9 mb-2.5 opacity-40" />
              <p class="text-xs max-w-sm leading-relaxed">{{ t('tools.wsSseTester.emptyLogs') }}</p>
            </div>

            <div
              v-for="entry in filteredLogs"
              :key="entry.id"
              class="rounded-lg border p-2.5 text-xs transition-colors group"
              :class="{
                'bg-blue-50/40 dark:bg-blue-950/20 border-blue-200/70 dark:border-blue-900/50': entry.direction === 'sent',
                'bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800': entry.direction === 'received',
                'bg-zinc-100/70 dark:bg-zinc-800/40 border-zinc-200/70 dark:border-zinc-800': entry.direction === 'system',
                'bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/60': entry.direction === 'error'
              }"
            >
              <!-- 消息元数据头 -->
              <div class="flex items-center justify-between gap-2 mb-1.5">
                <div class="flex items-center gap-1.5 flex-wrap">
                  <span
                    class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase"
                    :class="{
                      'bg-blue-100 text-blue-700 dark:bg-blue-900/60 dark:text-blue-300': entry.direction === 'sent',
                      'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/60 dark:text-emerald-300': entry.direction === 'received',
                      'bg-zinc-200 text-zinc-700 dark:bg-zinc-700 dark:text-zinc-300': entry.direction === 'system',
                      'bg-rose-100 text-rose-700 dark:bg-rose-900/60 dark:text-rose-300': entry.direction === 'error'
                    }"
                  >
                    <ArrowUpRight v-if="entry.direction === 'sent'" class="w-3 h-3" />
                    <ArrowDownLeft v-else-if="entry.direction === 'received'" class="w-3 h-3" />
                    <AlertCircle v-else-if="entry.direction === 'error'" class="w-3 h-3" />
                    <Info v-else class="w-3 h-3" />
                    <span>
                      {{
                        entry.direction === 'sent'
                          ? t('tools.wsSseTester.dirSent')
                          : entry.direction === 'received'
                            ? t('tools.wsSseTester.dirReceived')
                            : entry.direction === 'error'
                              ? t('tools.wsSseTester.dirError')
                              : t('tools.wsSseTester.dirSystem')
                      }}
                    </span>
                  </span>

                  <span
                    v-if="entry.sseEvent"
                    class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-indigo-50 dark:bg-indigo-950/50 text-indigo-600 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-800/50"
                  >
                    event: {{ entry.sseEvent }}
                  </span>

                  <span
                    v-if="entry.sseId"
                    class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400"
                  >
                    id: {{ entry.sseId }}
                  </span>

                  <span
                    v-if="entry.isBinary"
                    class="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                  >
                    BINARY
                  </span>
                </div>

                <div class="flex items-center gap-2 text-[11px] font-mono text-zinc-400">
                  <span v-if="entry.byteSize > 0">{{ formatBytesCompact(entry.byteSize) }}</span>
                  <span>{{ entry.timestamp }}</span>
                  <button
                    type="button"
                    @click="copyLogContent(entry)"
                    class="p-0.5 rounded text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    :title="t('common.copy')"
                  >
                    <component :is="copiedLogId === entry.id ? Check : Copy" class="w-3.5 h-3.5" :class="copiedLogId === entry.id ? 'text-emerald-500 opacity-100' : ''" />
                  </button>
                </div>
              </div>

              <!-- 载荷内容展示 -->
              <div v-if="entry.isBinary && entry.hexView" class="space-y-1 font-mono text-[11px]">
                <div class="p-2 rounded bg-zinc-50 dark:bg-zinc-950 border border-zinc-200/70 dark:border-zinc-800 text-amber-700 dark:text-amber-300 break-all">
                  HEX: {{ entry.hexView }}
                </div>
                <div class="text-zinc-500 dark:text-zinc-400 break-all px-1">
                  ASCII: {{ entry.content }}
                </div>
              </div>
              <pre
                v-else
                class="font-mono text-[11.5px] leading-relaxed whitespace-pre-wrap break-all"
                :class="entry.direction === 'error'
                  ? 'text-rose-700 dark:text-rose-300'
                  : entry.direction === 'system'
                    ? 'text-zinc-600 dark:text-zinc-400'
                    : 'text-zinc-800 dark:text-zinc-200'"
              >{{ displayLogContent(entry) }}</pre>
            </div>
          </div>

          <!-- 视图 2：SSE 文本流聚合预览 -->
          <div
            v-else
            class="flex-1 min-h-0 flex flex-col p-3.5 bg-zinc-50/40 dark:bg-zinc-950/30"
          >
            <div class="flex items-center justify-between mb-2 shrink-0">
              <span class="text-xs font-medium text-zinc-600 dark:text-zinc-300">
                {{ t('tools.wsSseTester.streamPreviewTitle') }}
              </span>
              <CopyButton :text="assembledStreamText" variant="secondary" size="sm" />
            </div>

            <div class="flex-1 min-h-0 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3.5">
              <div
                v-if="!assembledStreamText"
                class="h-full flex items-center justify-center text-center text-xs text-zinc-400 dark:text-zinc-500"
              >
                <p class="max-w-xs leading-relaxed">{{ t('tools.wsSseTester.emptyStream') }}</p>
              </div>
              <pre
                v-else
                class="text-xs font-mono text-zinc-800 dark:text-zinc-200 whitespace-pre-wrap break-words leading-relaxed"
              >{{ assembledStreamText }}<span v-if="status === 'connected'" class="inline-block w-1.5 h-3.5 bg-blue-500 animate-pulse align-middle ml-0.5" /></pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  </ToolContainer>
</template>
