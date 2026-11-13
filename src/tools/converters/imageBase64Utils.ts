export type Base64OutputFormat = 'data-uri' | 'raw-base64' | 'html-img' | 'css-bg' | 'markdown';

export interface ParsedBase64Image {
  ok: true;
  dataUri: string;
  rawBase64: string;
  mimeType: string;
  extension: string;
  byteSize: number;
  isDetectedMime: boolean;
}

export interface ParsedBase64Error {
  ok: false;
  errorType: 'empty' | 'invalidBase64';
}

export type ParseBase64Result = ParsedBase64Image | ParsedBase64Error;

const MIME_TO_EXT: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'image/svg+xml': 'svg',
  'image/x-icon': 'ico',
  'image/vnd.microsoft.icon': 'ico',
  'image/bmp': 'bmp',
  'image/avif': 'avif',
  'image/tiff': 'tiff'
};

export function getExtensionFromMime(mimeType: string): string {
  const clean = mimeType.toLowerCase().split(';')[0].trim();
  return MIME_TO_EXT[clean] || clean.split('/')[1]?.replace('+xml', '') || 'png';
}

export function formatBytes(bytes: number): string {
  if (bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  let idx = 0;
  let val = bytes;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx++;
  }
  return idx === 0 ? `${val} B` : `${val.toFixed(2)} ${units[idx]}`;
}

/**
 * 通过文件头魔数识别纯 Base64 图像格式
 */
export function detectMimeFromBase64(rawBase64: string): string | null {
  try {
    const sample = rawBase64.slice(0, 128);
    // 补齐 4 的倍数以便解码前部字节
    const paddedSample = sample.slice(0, Math.floor(sample.length / 4) * 4);
    if (!paddedSample) return null;

    const binary = atob(paddedSample);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }

    // PNG: 89 50 4E 47 0D 0A 1A 0A
    if (bytes.length >= 4 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
      return 'image/png';
    }
    // JPEG: FF D8 FF
    if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
      return 'image/jpeg';
    }
    // GIF: GIF87a / GIF89a
    if (binary.startsWith('GIF87a') || binary.startsWith('GIF89a')) {
      return 'image/gif';
    }
    // WebP: RIFF....WEBP
    if (binary.length >= 12 && binary.slice(0, 4) === 'RIFF' && binary.slice(8, 12) === 'WEBP') {
      return 'image/webp';
    }
    // BMP: BM
    if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) {
      return 'image/bmp';
    }
    // ICO: 00 00 01 00
    if (bytes.length >= 4 && bytes[0] === 0x00 && bytes[1] === 0x00 && bytes[2] === 0x01 && bytes[3] === 0x00) {
      return 'image/x-icon';
    }
    // AVIF: ....ftypavif / ftypavis
    if (binary.length >= 12 && binary.slice(4, 8) === 'ftyp' && (binary.slice(8, 12) === 'avif' || binary.slice(8, 12) === 'avis')) {
      return 'image/avif';
    }
    // SVG: <svg or <?xml ... <svg
    const trimmedText = binary.trimStart().toLowerCase();
    if (trimmedText.startsWith('<svg') || trimmedText.startsWith('<?xml')) {
      return 'image/svg+xml';
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * 清理并规范化 Base64 字符串（兼容 URL-Safe Base64 与换行）
 */
function normalizeBase64String(str: string): string {
  let clean = str.replace(/\s+/g, '');
  clean = clean.replace(/-/g, '+').replace(/_/g, '/');
  while (clean.length % 4 !== 0) {
    clean += '=';
  }
  return clean;
}

/**
 * 从可能包含引号、CSS url(...) 或 HTML <img src="..."> 的文本中提取核心输入
 */
function unwrapImageSnippet(input: string): string {
  let s = input.trim();
  // 若本身已是 data: URI（例如 SVG 内可能含 url(#id)），直接返回避免误提取
  if (s.toLowerCase().startsWith('data:')) {
    return s;
  }
  // 匹配 <img ... src="...">
  const imgSrcMatch = s.match(/src\s*=\s*["']([^"']+)["']/i);
  if (imgSrcMatch) {
    return imgSrcMatch[1].trim();
  }
  // 匹配 url("...") 或 url(...)（兼容完整 CSS 属性声明如 background-image: url(...)）
  const cssUrlQuoted = s.match(/url\(\s*(["'])([\s\S]+?)\1\s*\)/i);
  if (cssUrlQuoted) {
    return cssUrlQuoted[2].trim();
  }
  const cssUrlUnquoted = s.match(/url\(\s*([^)]+?)\s*\)/i);
  if (cssUrlUnquoted) {
    return cssUrlUnquoted[1].trim();
  }
  // 去除首尾成对引号
  if ((s.startsWith('"') && s.endsWith('"')) || (s.startsWith("'") && s.endsWith("'"))) {
    s = s.slice(1, -1).trim();
  }
  return s;
}

/**
 * 解析 Base64 / Data URI 为可用的图像数据结构
 */
export function parseBase64ImageInput(input: string, fallbackMime = 'image/png'): ParseBase64Result {
  const unwrapped = unwrapImageSnippet(input);
  if (!unwrapped) {
    return { ok: false, errorType: 'empty' };
  }

  // 检查是否包含 data: URI 前缀
  const dataUriMatch = unwrapped.match(/^data:([^;,]+)?([^,]*)?,([\s\S]+)$/i);
  if (dataUriMatch) {
    const mimePart = (dataUriMatch[1] || '').trim().toLowerCase();
    const metaPart = (dataUriMatch[2] || '').toLowerCase();
    const payload = dataUriMatch[3];

    if (metaPart.includes(';base64')) {
      const normalized = normalizeBase64String(payload);
      if (!/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
        return { ok: false, errorType: 'invalidBase64' };
      }
      try {
        const binary = atob(normalized);
        const detected = detectMimeFromBase64(normalized);
        const mimeType = mimePart || detected || fallbackMime;
        return {
          ok: true,
          dataUri: `data:${mimeType};base64,${normalized}`,
          rawBase64: normalized,
          mimeType,
          extension: getExtensionFromMime(mimeType),
          byteSize: binary.length,
          isDetectedMime: Boolean(mimePart || detected)
        };
      } catch {
        return { ok: false, errorType: 'invalidBase64' };
      }
    }

    // 处理非 base64 的 SVG Data URI（如 data:image/svg+xml;utf8,<svg...>）
    if (mimePart === 'image/svg+xml') {
      try {
        const decodedSvg = decodeURIComponent(payload);
        const bytes = new TextEncoder().encode(decodedSvg);
        let bin = '';
        for (let i = 0; i < bytes.length; i++) {
          bin += String.fromCharCode(bytes[i]);
        }
        const rawBase64 = btoa(bin);
        return {
          ok: true,
          dataUri: `data:image/svg+xml;base64,${rawBase64}`,
          rawBase64,
          mimeType: 'image/svg+xml',
          extension: 'svg',
          byteSize: bytes.length,
          isDetectedMime: true
        };
      } catch {
        return { ok: false, errorType: 'invalidBase64' };
      }
    }
  }

  // 纯 Base64 输入
  const normalized = normalizeBase64String(unwrapped);
  if (!normalized || !/^[A-Za-z0-9+/]*={0,2}$/.test(normalized)) {
    return { ok: false, errorType: 'invalidBase64' };
  }

  try {
    const binary = atob(normalized);
    if (binary.length === 0) {
      return { ok: false, errorType: 'invalidBase64' };
    }
    const detected = detectMimeFromBase64(normalized);
    const mimeType = detected || fallbackMime;
    return {
      ok: true,
      dataUri: `data:${mimeType};base64,${normalized}`,
      rawBase64: normalized,
      mimeType,
      extension: getExtensionFromMime(mimeType),
      byteSize: binary.length,
      isDetectedMime: Boolean(detected)
    };
  } catch {
    return { ok: false, errorType: 'invalidBase64' };
  }
}

/**
 * 将 rawBase64 转为二进制 Blob 以便下载保存
 */
export function base64ToBlob(rawBase64: string, mimeType: string): Blob {
  const binary = atob(rawBase64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mimeType });
}

/**
 * 根据选定输出格式拼接代码片段
 */
export function formatOutputSnippet(
  dataUri: string,
  rawBase64: string,
  format: Base64OutputFormat,
  meta?: { filename?: string; width?: number; height?: number }
): string {
  if (!dataUri) return '';
  const alt = (meta?.filename || 'image').replace(/\.[^.]+$/, '').replace(/"/g, '&quot;');
  const dims =
    meta?.width && meta?.height ? ` width="${meta.width}" height="${meta.height}"` : '';

  switch (format) {
    case 'raw-base64':
      return rawBase64;
    case 'html-img':
      return `<img src="${dataUri}" alt="${alt}"${dims} />`;
    case 'css-bg':
      return `background-image: url("${dataUri}");`;
    case 'markdown':
      return `![${alt}](${dataUri})`;
    case 'data-uri':
    default:
      return dataUri;
  }
}

/**
 * 内置精美矢量图标示例（用于“加载示例”）
 */
export const SAMPLE_IMAGE_SVG = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 128 128" fill="none">
  <defs>
    <linearGradient id="dc-bg" x1="0" y1="0" x2="128" y2="128" gradientUnits="userSpaceOnUse">
      <stop offset="0%" stop-color="#2563EB"/>
      <stop offset="100%" stop-color="#4F46E5"/>
    </linearGradient>
  </defs>
  <rect width="128" height="128" rx="28" fill="url(#dc-bg)"/>
  <path d="M40 44L24 64L40 84" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M88 44L104 64L88 84" stroke="white" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M72 36L56 92" stroke="#93C5FD" stroke-width="8" stroke-linecap="round"/>
</svg>`;
