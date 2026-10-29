import type { HarArchive, HarEntry } from './types';

export function formatBytes(bytes?: number): string {
  if (bytes === undefined || bytes === null || isNaN(bytes) || bytes < 0) {
    return '0 B';
  }
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  if (i >= sizes.length) return (bytes / Math.pow(k, sizes.length - 1)).toFixed(1) + ' GB';
  return (bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1) + ' ' + sizes[i];
}

export function formatDuration(ms?: number): string {
  if (ms === undefined || ms === null || isNaN(ms) || ms < 0) {
    return '0 ms';
  }
  if (ms < 1) return '< 1 ms';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function parseUrl(urlStr: string) {
  try {
    const parsed = new URL(urlStr);
    const pathname = parsed.pathname || '/';
    const parts = pathname.split('/').filter(Boolean);
    const filename = parts.length > 0 ? parts[parts.length - 1] : pathname;
    return {
      hostname: parsed.hostname,
      pathname,
      search: parsed.search,
      filename: filename || '/'
    };
  } catch {
    // If not a valid absolute URL (e.g. relative or invalid)
    const questionIdx = urlStr.indexOf('?');
    const pathOnly = questionIdx !== -1 ? urlStr.substring(0, questionIdx) : urlStr;
    const parts = pathOnly.split('/').filter(Boolean);
    return {
      hostname: '',
      pathname: pathOnly || '/',
      search: questionIdx !== -1 ? urlStr.substring(questionIdx) : '',
      filename: parts[parts.length - 1] || pathOnly || '/'
    };
  }
}

export function inferResourceType(mimeType: string = '', url: string = ''): HarEntry['_resourceType'] {
  const mime = mimeType.toLowerCase();
  const lowerUrl = url.toLowerCase();

  if (mime.includes('json') || mime.includes('xml') || lowerUrl.includes('/api/')) {
    return 'xhr';
  }
  if (mime.includes('javascript') || mime.includes('ecmascript') || lowerUrl.endsWith('.js') || lowerUrl.includes('.js?')) {
    return 'js';
  }
  if (mime.includes('css') || lowerUrl.endsWith('.css') || lowerUrl.includes('.css?')) {
    return 'css';
  }
  if (
    mime.startsWith('image/') ||
    mime.includes('svg') ||
    lowerUrl.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|bmp|avif)(\?|$)/)
  ) {
    return 'img';
  }
  if (mime.startsWith('audio/') || mime.startsWith('video/') || lowerUrl.match(/\.(mp4|mp3|webm|ogg|wav|mov)(\?|$)/)) {
    return 'media';
  }
  if (mime.includes('font') || lowerUrl.match(/\.(woff|woff2|ttf|otf|eot)(\?|$)/)) {
    return 'font';
  }
  if (mime.includes('html') || mime.includes('text/plain') || lowerUrl.endsWith('.html') || lowerUrl.endsWith('.htm')) {
    return 'doc';
  }
  return 'other';
}

export function buildCurlCommand(entry: HarEntry): string {
  const req = entry.request;
  const parts: string[] = ['curl'];

  // Method
  const method = (req.method || 'GET').toUpperCase();
  if (method !== 'GET') {
    parts.push(`-X ${method}`);
  }

  // URL
  parts.push(`"${req.url}"`);

  // Headers (skip pseudo headers like :authority or internal ones)
  if (req.headers && req.headers.length > 0) {
    req.headers.forEach(h => {
      if (!h.name.startsWith(':')) {
        // Escape quotes
        const val = h.value.replace(/"/g, '\\"');
        parts.push(`-H "${h.name}: ${val}"`);
      }
    });
  }

  // Body data
  if (req.postData && req.postData.text) {
    const rawData = req.postData.text;
    // For single line or multiline data
    const escaped = rawData.replace(/'/g, "'\\''");
    parts.push(`--data-raw '${escaped}'`);
  }

  return parts.join(' \\\n  ');
}

export function processRawHar(raw: any): HarArchive {
  if (!raw || typeof raw !== 'object' || !raw.log) {
    throw new Error('Invalid HAR structure: missing root "log" property');
  }

  const log = raw.log;
  const rawEntries: any[] = Array.isArray(log.entries) ? log.entries : [];

  let minTime = Infinity;

  const entries: HarEntry[] = rawEntries.map((e, index) => {
    const req = e.request || {};
    const res = e.response || {};
    const timings = e.timings || {};

    const url = req.url || '';
    const mimeType = (res.content && res.content.mimeType) || '';
    const parsed = parseUrl(url);
    const resourceType = inferResourceType(mimeType, url);

    const started = e.startedDateTime ? new Date(e.startedDateTime).getTime() : 0;
    if (started > 0 && started < minTime) {
      minTime = started;
    }

    return {
      id: `entry_${index}_${Math.random().toString(36).substring(2, 7)}`,
      startedDateTime: e.startedDateTime || new Date().toISOString(),
      time: typeof e.time === 'number' && e.time >= 0 ? e.time : 0,
      request: {
        method: (req.method || 'GET').toUpperCase(),
        url,
        httpVersion: req.httpVersion || 'HTTP/1.1',
        cookies: Array.isArray(req.cookies) ? req.cookies : [],
        headers: Array.isArray(req.headers) ? req.headers : [],
        queryString: Array.isArray(req.queryString) ? req.queryString : [],
        postData: req.postData,
        headersSize: req.headersSize || 0,
        bodySize: req.bodySize || 0
      },
      response: {
        status: typeof res.status === 'number' ? res.status : 0,
        statusText: res.statusText || '',
        httpVersion: res.httpVersion || 'HTTP/1.1',
        cookies: Array.isArray(res.cookies) ? res.cookies : [],
        headers: Array.isArray(res.headers) ? res.headers : [],
        content: {
          size: res.content?.size || 0,
          compression: res.content?.compression || 0,
          mimeType: res.content?.mimeType || '',
          text: res.content?.text || '',
          encoding: res.content?.encoding
        },
        redirectURL: res.redirectURL || '',
        headersSize: res.headersSize || 0,
        bodySize: res.bodySize || 0
      },
      timings: {
        blocked: timings.blocked ?? 0,
        dns: timings.dns ?? 0,
        connect: timings.connect ?? 0,
        ssl: timings.ssl ?? 0,
        send: timings.send ?? 0,
        wait: timings.wait ?? 0,
        receive: timings.receive ?? 0
      },
      serverIPAddress: e.serverIPAddress,
      connection: e.connection,
      pageref: e.pageref,
      _parsedUrl: parsed,
      _resourceType: resourceType,
      _startTimeMs: started
    };
  });

  return {
    log: {
      version: log.version || '1.2',
      creator: log.creator || { name: 'Unknown', version: '1.0' },
      browser: log.browser,
      pages: log.pages,
      entries
    }
  };
}

export function getStatusStyle(status: number): {
  badgeBg: string;
  badgeText: string;
  dotColor: string;
} {
  if (status >= 200 && status < 300) {
    return {
      badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
      badgeText: 'text-emerald-700 dark:text-emerald-300 font-semibold',
      dotColor: 'bg-emerald-500'
    };
  }
  if (status >= 300 && status < 400) {
    return {
      badgeBg: 'bg-sky-50 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800/60',
      badgeText: 'text-sky-700 dark:text-sky-300 font-semibold',
      dotColor: 'bg-sky-500'
    };
  }
  if (status >= 400 && status < 500) {
    return {
      badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
      badgeText: 'text-amber-700 dark:text-amber-300 font-semibold',
      dotColor: 'bg-amber-500'
    };
  }
  if (status >= 500) {
    return {
      badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
      badgeText: 'text-rose-700 dark:text-rose-300 font-semibold',
      dotColor: 'bg-rose-500'
    };
  }
  return {
    badgeBg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
    badgeText: 'text-zinc-600 dark:text-zinc-400 font-medium',
    dotColor: 'bg-zinc-400'
  };
}

export function getMethodStyle(method: string): {
  badgeBg: string;
  badgeText: string;
} {
  const m = method.toUpperCase();
  switch (m) {
    case 'GET':
      return {
        badgeBg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800/60',
        badgeText: 'text-blue-700 dark:text-blue-400'
      };
    case 'POST':
      return {
        badgeBg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800/60',
        badgeText: 'text-emerald-700 dark:text-emerald-400'
      };
    case 'PUT':
      return {
        badgeBg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800/60',
        badgeText: 'text-amber-700 dark:text-amber-400'
      };
    case 'PATCH':
      return {
        badgeBg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800/60',
        badgeText: 'text-purple-700 dark:text-purple-400'
      };
    case 'DELETE':
      return {
        badgeBg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800/60',
        badgeText: 'text-rose-700 dark:text-rose-400'
      };
    case 'OPTIONS':
    case 'HEAD':
      return {
        badgeBg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
        badgeText: 'text-zinc-700 dark:text-zinc-300'
      };
    default:
      return {
        badgeBg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
        badgeText: 'text-zinc-600 dark:text-zinc-400'
      };
  }
}
