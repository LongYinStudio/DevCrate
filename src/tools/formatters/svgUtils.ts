/**
 * SVG 处理工具函数库
 * 包含 SVG 验证、格式化、压缩、清理、属性与变换调整、位图光栅化导出以及代码生成
 */

export interface SvgStats {
  originalSize: number;
  currentSize: number;
  savingsPercent: number;
  width: number | null;
  height: number | null;
  viewBox: string | null;
  elementCount: number;
  pathCount: number;
  circleCount: number;
  rectCount: number;
  groupCount: number;
}

export interface SvgValidation {
  isValid: boolean;
  errorMessage?: string;
  line?: number;
}

export interface SvgPreset {
  id: string;
  name: string;
  nameKey: string;
  svg: string;
}

export interface MinifyOptions {
  stripComments?: boolean;
  stripMetadata?: boolean;
  stripEmptyGroups?: boolean;
  precision?: number;
}

/**
 * 校验 SVG 是否为合法的 XML
 */
export function validateSvg(svgString: string): SvgValidation {
  if (!svgString || !svgString.trim()) {
    return { isValid: false, errorMessage: 'SVG 内容为空' };
  }

  if (typeof DOMParser === 'undefined') {
    return { isValid: true };
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const parserError = doc.querySelector('parsererror');

    if (parserError) {
      const errorText = parserError.textContent || 'XML 语法解析错误';
      let line: number | undefined;
      const lineMatch = errorText.match(/line\s+(\d+)/i) || errorText.match(/行\s*(\d+)/i);
      if (lineMatch) {
        line = parseInt(lineMatch[1], 10);
      }
      return { isValid: false, errorMessage: errorText, line };
    }

    const svgElement = doc.querySelector('svg');
    if (!svgElement) {
      return { isValid: false, errorMessage: '未找到根 <svg> 元素' };
    }

    return { isValid: true };
  } catch (err: any) {
    return { isValid: false, errorMessage: err?.message || 'SVG 解析异常' };
  }
}

/**
 * 深度分析 SVG 统计信息
 */
export function analyzeSvg(svgString: string, originalSize = 0): SvgStats {
  const currentSize = new Blob([svgString]).size;
  const orig = originalSize > 0 ? originalSize : currentSize;
  const savingsPercent = orig > 0 ? Math.round(((orig - currentSize) / orig) * 100) : 0;

  let width: number | null = null;
  let height: number | null = null;
  let viewBox: string | null = null;
  let elementCount = 0;
  let pathCount = 0;
  let circleCount = 0;
  let rectCount = 0;
  let groupCount = 0;

  if (typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(svgString, 'image/svg+xml');
      const svgEl = doc.querySelector('svg');
      if (svgEl) {
        const wAttr = svgEl.getAttribute('width');
        const hAttr = svgEl.getAttribute('height');
        viewBox = svgEl.getAttribute('viewBox');

        if (wAttr) {
          const parsedW = parseFloat(wAttr);
          if (!isNaN(parsedW)) width = parsedW;
        }
        if (hAttr) {
          const parsedH = parseFloat(hAttr);
          if (!isNaN(parsedH)) height = parsedH;
        }

        if ((width === null || height === null) && viewBox) {
          const vbParts = viewBox.trim().split(/[\s,]+/).map(Number);
          if (vbParts.length === 4) {
            if (width === null) width = vbParts[2];
            if (height === null) height = vbParts[3];
          }
        }

        elementCount = svgEl.querySelectorAll('*').length;
        pathCount = svgEl.querySelectorAll('path').length;
        circleCount = svgEl.querySelectorAll('circle, ellipse').length;
        rectCount = svgEl.querySelectorAll('rect').length;
        groupCount = svgEl.querySelectorAll('g').length;
      }
    } catch {
      // 容错处理
    }
  }

  return {
    originalSize: orig,
    currentSize,
    savingsPercent,
    width,
    height,
    viewBox,
    elementCount,
    pathCount,
    circleCount,
    rectCount,
    groupCount
  };
}

/**
 * 美化与缩进 SVG / XML 文本
 */
export function prettifySvg(svg: string, indentSize = 2): string {
  if (!svg.trim()) return '';

  let formatted = '';
  let indent = 0;
  const pad = (depth: number) => ' '.repeat(Math.max(0, depth * indentSize));

  // 清洗标签间多余换行与空白
  const clean = svg
    .replace(/>\s*</g, '><')
    .trim();

  const tokens = clean.split(/(<[^>]+>)/g).filter(t => t.trim().length > 0);

  for (let i = 0; i < tokens.length; i++) {
    const token = tokens[i];
    if (token.startsWith('</')) {
      indent = Math.max(0, indent - 1);
      formatted += pad(indent) + token + '\n';
    } else if (token.startsWith('<') && token.endsWith('/>')) {
      formatted += pad(indent) + token + '\n';
    } else if (token.startsWith('<!--')) {
      formatted += pad(indent) + token + '\n';
    } else if (token.startsWith('<!') || token.startsWith('<?')) {
      formatted += pad(indent) + token + '\n';
    } else if (token.startsWith('<') && !token.startsWith('</')) {
      const nextToken = tokens[i + 1];
      const afterNext = tokens[i + 2];
      const tagNameMatch = token.match(/^<([a-zA-Z0-9:-]+)/);
      const tagName = tagNameMatch ? tagNameMatch[1] : '';

      if (nextToken && !nextToken.startsWith('<') && afterNext === `</${tagName}>`) {
        formatted += pad(indent) + token + nextToken + afterNext + '\n';
        i += 2;
      } else {
        formatted += pad(indent) + token + '\n';
        indent++;
      }
    } else {
      formatted += pad(indent) + token.trim() + '\n';
    }
  }

  return formatted.trim();
}

/**
 * 压缩 SVG 源码（移除注释、文档声明、多余空白及精度四舍五入）
 */
export function minifySvg(svg: string, options: MinifyOptions = {}): string {
  const {
    stripComments = true,
    stripMetadata = true,
    stripEmptyGroups = true,
    precision = 2
  } = options;

  let res = svg;

  if (stripComments) {
    res = res.replace(/<!--[\s\S]*?-->/g, '');
  }

  if (stripMetadata) {
    res = res.replace(/<\?xml[\s\S]*?\?>/gi, '');
    res = res.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
    res = res.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
    res = res.replace(/<sodipodi:namedview[\s\S]*?(\/|><\/sodipodi:namedview)>/gi, '');
    res = res.replace(/\s+(xmlns:inkscape|xmlns:sodipodi|xmlns:i|xmlns:graph|inkscape:[a-zA-Z0-9_-]+|sodipodi:[a-zA-Z0-9_-]+)="[^"]*"/gi, '');
  }

  if (stripEmptyGroups) {
    res = res.replace(/<g\s*(\/|><\/g)>/gi, '');
  }

  if (precision !== undefined && precision >= 0) {
    res = res.replace(/([0-9]+\.[0-9]{3,})/g, (match) => {
      const num = parseFloat(match);
      return Number(num.toFixed(precision)).toString();
    });
  }

  res = res.replace(/>\s+</g, '><').replace(/\s{2,}/g, ' ').trim();

  return res;
}

/**
 * 深度清理与净化 SVG（去除矢量设计软件冗余元数据、垃圾命名空间、空分组）
 */
export function cleanSvg(svg: string): string {
  let res = svg;
  res = res.replace(/<!--[\s\S]*?-->/g, '');
  res = res.replace(/<\?xml[\s\S]*?\?>/gi, '');
  res = res.replace(/<!DOCTYPE[\s\S]*?>/gi, '');
  res = res.replace(/<metadata[\s\S]*?<\/metadata>/gi, '');
  res = res.replace(/<sodipodi:namedview[\s\S]*?(\/|><\/sodipodi:namedview)>/gi, '');
  res = res.replace(/<(title|desc)[\s\S]*?<\/\1>/gi, '');
  res = res.replace(/\s+(xmlns:inkscape|xmlns:sodipodi|xmlns:i|xmlns:graph|xmlns:x|inkscape:[a-zA-Z0-9_-]+|sodipodi:[a-zA-Z0-9_-]+|sketch:type)="[^"]*"/gi, '');
  res = res.replace(/<g\s*(\/|><\/g)>/gi, '');
  return prettifySvg(res);
}

/**
 * 几何变换（顺时针/逆时针旋转 90 度，水平/垂直翻转，反转色彩）
 */
export function transformSvg(
  svgString: string,
  action: 'rotate90' | 'rotateMinus90' | 'flipH' | 'flipV' | 'invertColors'
): string {
  if (action === 'invertColors') {
    return invertSvgColors(svgString);
  }

  if (typeof DOMParser === 'undefined') {
    return svgString;
  }

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return svgString;

    let w = parseFloat(svgEl.getAttribute('width') || '');
    let h = parseFloat(svgEl.getAttribute('height') || '');
    const viewBoxAttr = svgEl.getAttribute('viewBox');

    if (viewBoxAttr) {
      const parts = viewBoxAttr.trim().split(/[\s,]+/).map(Number);
      if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
        if (isNaN(w) || w <= 0) w = parts[2];
        if (isNaN(h) || h <= 0) h = parts[3];
      }
    }

    if (isNaN(w) || w <= 0) w = 100;
    if (isNaN(h) || h <= 0) h = 100;

    // 收集需要包裹进变换 group 的子节点，保留 defs
    const childrenToWrap: Element[] = [];
    Array.from(svgEl.children).forEach(child => {
      if (child.tagName.toLowerCase() !== 'defs') {
        childrenToWrap.push(child);
      }
    });

    let transformStr = '';
    let newW = w;
    let newH = h;

    if (action === 'rotate90') {
      // (x, y) -> (h - y, x)
      transformStr = `translate(${h}, 0) rotate(90)`;
      newW = h;
      newH = w;
    } else if (action === 'rotateMinus90') {
      // (x, y) -> (y, w - x)
      transformStr = `translate(0, ${w}) rotate(-90)`;
      newW = h;
      newH = w;
    } else if (action === 'flipH') {
      transformStr = `translate(${w}, 0) scale(-1, 1)`;
    } else if (action === 'flipV') {
      transformStr = `translate(0, ${h}) scale(1, -1)`;
    }

    const gEl = doc.createElementNS('http://www.w3.org/2000/svg', 'g');
    gEl.setAttribute('transform', transformStr);

    childrenToWrap.forEach(child => {
      gEl.appendChild(child);
    });
    svgEl.appendChild(gEl);

    if (action === 'rotate90' || action === 'rotateMinus90') {
      if (svgEl.hasAttribute('width')) svgEl.setAttribute('width', String(newW));
      if (svgEl.hasAttribute('height')) svgEl.setAttribute('height', String(newH));
      if (viewBoxAttr) {
        svgEl.setAttribute('viewBox', `0 0 ${newW} ${newH}`);
      }
    }

    const serializer = new XMLSerializer();
    return prettifySvg(serializer.serializeToString(svgEl));
  } catch {
    return svgString;
  }
}

/**
 * 反转 SVG 中包含的颜色
 */
export function invertSvgColors(svg: string): string {
  return svg.replace(/#([0-9a-fA-F]{3,8})\b/g, (match, hex) => {
    let clean = hex;
    let alpha = '';
    if (clean.length === 3) clean = clean.split('').map((c: string) => c + c).join('');
    if (clean.length === 8) {
      alpha = clean.slice(6, 8);
      clean = clean.slice(0, 6);
    }
    if (clean.length === 6) {
      const r = (255 - parseInt(clean.slice(0, 2), 16)).toString(16).padStart(2, '0');
      const g = (255 - parseInt(clean.slice(2, 4), 16)).toString(16).padStart(2, '0');
      const b = (255 - parseInt(clean.slice(4, 6), 16)).toString(16).padStart(2, '0');
      return '#' + r + g + b + alpha;
    }
    return match;
  });
}

/**
 * 调整 SVG 填充色、描边色与描边宽度
 */
export function updateSvgStyling(
  svgString: string,
  options: {
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
  }
): string {
  if (typeof DOMParser === 'undefined') return svgString;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return svgString;

    if (options.fill !== undefined) {
      svgEl.setAttribute('fill', options.fill);
    }
    if (options.stroke !== undefined) {
      svgEl.setAttribute('stroke', options.stroke);
    }
    if (options.strokeWidth !== undefined) {
      svgEl.setAttribute('stroke-width', String(options.strokeWidth));
    }

    const serializer = new XMLSerializer();
    return prettifySvg(serializer.serializeToString(svgEl));
  } catch {
    return svgString;
  }
}

/**
 * 调整 SVG 尺寸与 ViewBox
 */
export function updateSvgDimensions(
  svgString: string,
  options: {
    width?: number | null;
    height?: number | null;
    viewBox?: string | null;
    makeResponsive?: boolean;
    fixMissingViewBox?: boolean;
  }
): string {
  if (typeof DOMParser === 'undefined') return svgString;

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) return svgString;

    if (options.makeResponsive) {
      // 移除固定宽高，保留 viewBox 以支持响应式自适应容器
      let w = parseFloat(svgEl.getAttribute('width') || '');
      let h = parseFloat(svgEl.getAttribute('height') || '');
      let vb = svgEl.getAttribute('viewBox');

      if (!vb && !isNaN(w) && !isNaN(h) && w > 0 && h > 0) {
        svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
      svgEl.removeAttribute('width');
      svgEl.removeAttribute('height');
    } else {
      if (options.width !== undefined && options.width !== null) {
        svgEl.setAttribute('width', String(options.width));
      }
      if (options.height !== undefined && options.height !== null) {
        svgEl.setAttribute('height', String(options.height));
      }
      if (options.viewBox !== undefined && options.viewBox !== null) {
        svgEl.setAttribute('viewBox', options.viewBox);
      }
      if (options.fixMissingViewBox && !svgEl.hasAttribute('viewBox')) {
        const w = parseFloat(svgEl.getAttribute('width') || '100');
        const h = parseFloat(svgEl.getAttribute('height') || '100');
        svgEl.setAttribute('viewBox', `0 0 ${w} ${h}`);
      }
    }

    const serializer = new XMLSerializer();
    return prettifySvg(serializer.serializeToString(svgEl));
  } catch {
    return svgString;
  }
}

/**
 * 转换为 React JSX / TSX 组件代码
 */
export function svgToReact(svg: string, componentName = 'SvgIcon'): string {
  let code = svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .trim();

  // class 换为 className
  code = code.replace(/\bclass="/g, 'className="');

  // kebab-case SVG 属性转为 camelCase
  const kebabAttrs = [
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'stroke-miterlimit',
    'stroke-dasharray',
    'stroke-dashoffset',
    'stroke-opacity',
    'fill-rule',
    'fill-opacity',
    'clip-path',
    'clip-rule',
    'color-interpolation-filters',
    'stop-color',
    'stop-opacity',
    'font-family',
    'font-size',
    'font-weight',
    'text-anchor',
    'xlink:href',
    'xmlns:xlink'
  ];

  kebabAttrs.forEach(attr => {
    const camel = attr
      .replace(/:([a-z])/g, (_, l) => l.toUpperCase())
      .replace(/-([a-z])/g, (_, l) => l.toUpperCase());
    const reg = new RegExp('\\b' + attr + '="', 'g');
    code = code.replace(reg, camel + '="');
  });

  // 注入 {...props} 到根 svg
  code = code.replace(/<svg\b([^>]*)>/i, '<svg$1 {...props}>');

  return `import React from 'react';

export default function ${componentName}(props: React.SVGProps<SVGSVGElement>) {
  return (
    ${prettifySvg(code, 4).split('\n').join('\n    ')}
  );
}`;
}

/**
 * 转换为 Vue 3 组件代码
 */
export function svgToVue(svg: string): string {
  const clean = svg
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<\?xml[\s\S]*?\?>/gi, '')
    .replace(/<!DOCTYPE[\s\S]*?>/gi, '')
    .trim();

  return `<template>
  ${prettifySvg(clean, 2).split('\n').join('\n  ')}
</template>
`;
}

/**
 * 转换为 Data URI
 */
export function svgToDataUri(svg: string, format: 'utf8' | 'base64'): string {
  const minified = minifySvg(svg, { stripComments: true, stripMetadata: true });
  if (format === 'utf8') {
    const encoded = encodeURIComponent(minified)
      .replace(/%20/g, ' ')
      .replace(/%3D/g, '=')
      .replace(/%3A/g, ':')
      .replace(/%2F/g, '/');
    return `data:image/svg+xml;charset=utf-8,${encoded}`;
  } else {
    const bytes = new TextEncoder().encode(minified);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return `data:image/svg+xml;base64,${btoa(binary)}`;
  }
}

/**
 * 转换为 HTML img 标签
 */
export function svgToHtmlImg(svg: string): string {
  const dataUri = svgToDataUri(svg, 'base64');
  return `<img src="${dataUri}" alt="SVG Icon" />`;
}

/**
 * 转换为 CSS background-image
 */
export function svgToCssBg(svg: string): string {
  const dataUri = svgToDataUri(svg, 'utf8');
  return `background-image: url("${dataUri}");`;
}

/**
 * 导出位图（PNG、JPEG、WebP）
 */
export async function rasterizeSvg(
  svgString: string,
  format: 'png' | 'jpeg' | 'webp',
  scale = 1,
  backgroundColor?: string
): Promise<{ blob: Blob; dataUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    if (typeof DOMParser === 'undefined') {
      return reject(new Error('DOMParser 不可用'));
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(svgString, 'image/svg+xml');
    const svgEl = doc.querySelector('svg');
    if (!svgEl) {
      return reject(new Error('无效的 SVG 格式'));
    }

    let w = parseFloat(svgEl.getAttribute('width') || '');
    let h = parseFloat(svgEl.getAttribute('height') || '');

    if (isNaN(w) || isNaN(h) || w <= 0 || h <= 0) {
      const viewBox = svgEl.getAttribute('viewBox');
      if (viewBox) {
        const parts = viewBox.trim().split(/[\s,]+/).map(Number);
        if (parts.length === 4 && parts[2] > 0 && parts[3] > 0) {
          w = parts[2];
          h = parts[3];
        }
      }
    }

    if (isNaN(w) || w <= 0) w = 300;
    if (isNaN(h) || h <= 0) h = 150;

    const targetWidth = Math.round(w * scale);
    const targetHeight = Math.round(h * scale);

    svgEl.setAttribute('width', String(w));
    svgEl.setAttribute('height', String(h));
    const serialized = new XMLSerializer().serializeToString(svgEl);

    const blob = new Blob([serialized], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        return reject(new Error('Canvas 2D 上下文获取失败'));
      }

      if (backgroundColor) {
        ctx.fillStyle = backgroundColor;
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      } else if (format === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const mimeType = format === 'jpeg' ? 'image/jpeg' : format === 'webp' ? 'image/webp' : 'image/png';
      canvas.toBlob(
        (outBlob) => {
          if (!outBlob) {
            return reject(new Error('创建位图 Blob 失败'));
          }
          const dataUrl = canvas.toDataURL(mimeType, 0.95);
          resolve({ blob: outBlob, dataUrl, width: targetWidth, height: targetHeight });
        },
        mimeType,
        0.95
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('渲染 SVG 图像失败'));
    };

    img.src = url;
  });
}

/**
 * 触发文件下载
 */
export function downloadFile(content: Blob | string, filename: string, mimeType = 'image/svg+xml') {
  const blob = typeof content === 'string' ? new Blob([content], { type: mimeType }) : content;
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * 内置优质预设样例
 */
export const SAMPLE_SVG_PRESETS: SvgPreset[] = [
  {
    id: 'shield',
    name: '安全盾牌徽章',
    nameKey: 'tools.svgEditor.presetShield',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 4.81 17 6 19 6a1 1 0 0 1 1 1z"/>
  <path d="m9 12 2 2 4-4"/>
</svg>`
  },
  {
    id: 'gradient-badge',
    name: '渐变六边形 Logo',
    nameKey: 'tools.svgEditor.presetBadge',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
  <defs>
    <linearGradient id="badgeGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#3b82f6"/>
      <stop offset="100%" stop-color="#8b5cf6"/>
    </linearGradient>
    <linearGradient id="badgeGrad2" x1="0%" y1="100%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#06b6d4"/>
      <stop offset="100%" stop-color="#3b82f6"/>
    </linearGradient>
  </defs>
  <polygon points="50,5 90,25 90,75 50,95 10,75 10,25" fill="url(#badgeGrad1)"/>
  <polygon points="50,20 80,35 80,65 50,80 20,65 20,35" fill="#0f172a"/>
  <path d="M38 52 L47 61 L64 41" fill="none" stroke="url(#badgeGrad2)" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>
</svg>`
  },
  {
    id: 'terminal',
    name: '开发者终端窗口',
    nameKey: 'tools.svgEditor.presetTerminal',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 90" width="120" height="90">
  <rect x="5" y="5" width="110" height="80" rx="8" fill="#0f172a" stroke="#334155" stroke-width="2"/>
  <circle cx="18" cy="18" r="4" fill="#ef4444"/>
  <circle cx="28" cy="18" r="4" fill="#f59e0b"/>
  <circle cx="38" cy="18" r="4" fill="#10b981"/>
  <line x1="5" y1="28" x2="115" y2="28" stroke="#334155" stroke-width="1.5"/>
  <text x="16" y="48" fill="#38bdf8" font-family="monospace" font-size="10" font-weight="bold">&gt; devcrate</text>
  <text x="16" y="65" fill="#94a3b8" font-family="monospace" font-size="9">build ready</text>
  <rect x="78" y="56" width="6" height="11" fill="#38bdf8"/>
</svg>`
  },
  {
    id: 'robot',
    name: '智能机器人吉祥物',
    nameKey: 'tools.svgEditor.presetRobot',
    svg: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128">
  <defs>
    <linearGradient id="robotGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#2563eb"/>
    </linearGradient>
  </defs>
  <rect x="24" y="36" width="80" height="64" rx="16" fill="url(#robotGrad)"/>
  <rect x="36" y="48" width="56" height="36" rx="8" fill="#0f172a"/>
  <circle cx="50" cy="66" r="6" fill="#38bdf8"/>
  <circle cx="78" cy="66" r="6" fill="#38bdf8"/>
  <circle cx="52" cy="64" r="2" fill="#ffffff"/>
  <circle cx="80" cy="64" r="2" fill="#ffffff"/>
  <line x1="64" y1="16" x2="64" y2="36" stroke="#93c5fd" stroke-width="4" stroke-linecap="round"/>
  <circle cx="64" cy="14" r="6" fill="#f59e0b"/>
  <rect x="12" y="56" width="12" height="24" rx="4" fill="#3b82f6"/>
  <rect x="104" y="56" width="12" height="24" rx="4" fill="#3b82f6"/>
  <path d="M54 90 Q64 96 74 90" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round"/>
</svg>`
  }
];
