export interface GitHubReleaseAsset {
  name: string;
  browserDownloadUrl: string;
  size: number;
  contentType: string;
  downloadCount: number;
}

export interface GitHubReleaseInfo {
  tagName: string;
  version: string;
  name: string;
  body: string;
  htmlUrl: string;
  publishedAt: string;
  prerelease: boolean;
  draft: boolean;
  assets: GitHubReleaseAsset[];
}

export type ReleaseCheckStatus = 'idle' | 'checking' | 'available' | 'up-to-date' | 'error';

export interface ReleaseCheckResult {
  currentVersion: string;
  latestRelease: GitHubReleaseInfo;
  hasUpdate: boolean;
  checkedAt: string;
}

export class GitHubReleaseError extends Error {
  code: 'NETWORK' | 'TIMEOUT' | 'NOT_FOUND' | 'RATE_LIMITED' | 'HTTP' | 'INVALID_RESPONSE';
  status?: number;

  constructor(
    code: GitHubReleaseError['code'],
    message: string,
    status?: number,
  ) {
    super(message);
    this.name = 'GitHubReleaseError';
    this.code = code;
    this.status = status;
  }
}

interface ParsedSemver {
  major: number;
  minor: number;
  patch: number;
  prerelease: string[];
}

/**
 * 解析标准 SemVer 版本号，兼容 v/V 前缀、预发布后缀 (-beta.1) 与构建元数据 (+build)。
 */
export function normalizeSemver(raw: string): ParsedSemver | null {
  if (typeof raw !== 'string') return null;
  const trimmed = raw.trim().replace(/^[vV]+/, '');
  const withoutBuild = trimmed.split('+')[0]?.trim();
  if (!withoutBuild) return null;

  const dashIndex = withoutBuild.indexOf('-');
  const corePart = dashIndex === -1 ? withoutBuild : withoutBuild.slice(0, dashIndex);
  const prePart = dashIndex === -1 ? '' : withoutBuild.slice(dashIndex + 1);

  const coreSegments = corePart.split('.');
  if (coreSegments.length === 0 || coreSegments.length > 3) return null;
  if (!coreSegments.every((seg) => /^\d+$/.test(seg))) return null;

  const major = Number(coreSegments[0] ?? 0);
  const minor = Number(coreSegments[1] ?? 0);
  const patch = Number(coreSegments[2] ?? 0);
  const prerelease = prePart ? prePart.split('.').filter(Boolean) : [];

  return { major, minor, patch, prerelease };
}

/**
 * 去掉版本号前的 v 前缀用于展示或存储比较。
 */
export function stripVersionPrefix(version: string): string {
  return version.trim().replace(/^[vV]+/, '');
}

/**
 * 依据 SemVer 2.0.0 规则比较两个版本字符串：
 * 返回 1 表示 a > b，-1 表示 a < b，0 表示相等或无法判定更高。
 */
export function compareSemver(a: string, b: string): number {
  const parsedA = normalizeSemver(a);
  const parsedB = normalizeSemver(b);

  if (!parsedA || !parsedB) {
    return stripVersionPrefix(a) === stripVersionPrefix(b) ? 0 : 0;
  }

  if (parsedA.major !== parsedB.major) {
    return parsedA.major > parsedB.major ? 1 : -1;
  }
  if (parsedA.minor !== parsedB.minor) {
    return parsedA.minor > parsedB.minor ? 1 : -1;
  }
  if (parsedA.patch !== parsedB.patch) {
    return parsedA.patch > parsedB.patch ? 1 : -1;
  }

  const preA = parsedA.prerelease;
  const preB = parsedB.prerelease;
  if (preA.length === 0 && preB.length === 0) return 0;
  // 正式版高于任何预发布版
  if (preA.length === 0) return 1;
  if (preB.length === 0) return -1;

  const maxLen = Math.max(preA.length, preB.length);
  for (let i = 0; i < maxLen; i++) {
    const idA = preA[i];
    const idB = preB[i];
    if (idA === undefined) return -1;
    if (idB === undefined) return 1;

    const isNumA = /^\d+$/.test(idA);
    const isNumB = /^\d+$/.test(idB);

    if (isNumA && isNumB) {
      const numA = Number(idA);
      const numB = Number(idB);
      if (numA !== numB) return numA > numB ? 1 : -1;
    } else if (isNumA !== isNumB) {
      // 数字标识符优先级低于非数字标识符
      return isNumA ? -1 : 1;
    } else if (idA !== idB) {
      return idA > idB ? 1 : -1;
    }
  }

  return 0;
}

/**
 * 解析 GitHub Releases API 返回的 JSON 数据。
 */
export function parseGitHubReleasePayload(raw: unknown): GitHubReleaseInfo {
  if (!raw || typeof raw !== 'object') {
    throw new GitHubReleaseError('INVALID_RESPONSE', 'Invalid GitHub release payload');
  }

  const data = raw as Record<string, unknown>;
  const tagName = typeof data.tag_name === 'string' ? data.tag_name.trim() : '';
  const htmlUrl = typeof data.html_url === 'string' ? data.html_url.trim() : '';

  if (!tagName || !htmlUrl) {
    throw new GitHubReleaseError(
      'INVALID_RESPONSE',
      'Missing tag_name or html_url in GitHub release payload',
    );
  }

  const rawAssets = Array.isArray(data.assets) ? data.assets : [];
  const assets: GitHubReleaseAsset[] = rawAssets
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map((item) => ({
      name: typeof item.name === 'string' ? item.name : '',
      browserDownloadUrl:
        typeof item.browser_download_url === 'string' ? item.browser_download_url : '',
      size: typeof item.size === 'number' ? item.size : 0,
      contentType: typeof item.content_type === 'string' ? item.content_type : '',
      downloadCount: typeof item.download_count === 'number' ? item.download_count : 0,
    }))
    .filter((asset) => asset.name.length > 0 && asset.browserDownloadUrl.length > 0);

  return {
    tagName,
    version: stripVersionPrefix(tagName),
    name: typeof data.name === 'string' && data.name.trim() ? data.name.trim() : tagName,
    body: typeof data.body === 'string' ? data.body.trim() : '',
    htmlUrl,
    publishedAt: typeof data.published_at === 'string' ? data.published_at : '',
    prerelease: Boolean(data.prerelease),
    draft: Boolean(data.draft),
    assets,
  };
}

/**
 * 根据运行平台优先匹配最适合的安装包附件（忽略签名与校验文件）。
 */
export function pickPreferredAsset(
  assets: GitHubReleaseAsset[],
  platformHint: string = typeof navigator !== 'undefined' ? `${navigator.platform} ${navigator.userAgent}` : '',
): GitHubReleaseAsset | null {
  if (assets.length === 0) return null;

  const installers = assets.filter(
    (asset) => !/\.(sig|sha256|sha512|asc|txt|blockmap)$/i.test(asset.name),
  );
  if (installers.length === 0) return null;

  const hint = platformHint.toLowerCase();
  const isMac = /mac|darwin/.test(hint);
  const isWin = /win/.test(hint);
  const isLinux = /linux|x11/.test(hint);

  const matchByExtensions = (exts: RegExp[]) => {
    for (const pattern of exts) {
      const matched = installers.find((asset) => pattern.test(asset.name));
      if (matched) return matched;
    }
    return null;
  };

  if (isMac) {
    return matchByExtensions([/\.dmg$/i, /\.app\.tar\.gz$/i, /\.zip$/i]) ?? installers[0];
  }
  if (isWin) {
    return matchByExtensions([/-setup\.exe$/i, /\.exe$/i, /\.msi$/i, /\.zip$/i]) ?? installers[0];
  }
  if (isLinux) {
    return matchByExtensions([/\.AppImage$/i, /\.deb$/i, /\.rpm$/i, /\.tar\.gz$/i]) ?? installers[0];
  }

  return installers[0];
}

/**
 * 格式化文件字节大小用于附件展示。
 */
export function formatAssetSize(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const kb = bytes / 1024;
  if (kb < 1024) return `${kb.toFixed(1)} KB`;
  const mb = kb / 1024;
  return `${mb.toFixed(1)} MB`;
}

export interface FetchLatestReleaseOptions {
  apiUrl: string;
  currentVersion: string;
  timeoutMs?: number;
  fetchImpl?: typeof fetch;
}

/**
 * 请求 GitHub Releases API 检查是否存在新版本。
 */
export async function fetchLatestGitHubRelease(
  options: FetchLatestReleaseOptions,
): Promise<ReleaseCheckResult> {
  const {
    apiUrl,
    currentVersion,
    timeoutMs = 10000,
    fetchImpl = fetch,
  } = options;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetchImpl(apiUrl, {
      method: 'GET',
      headers: {
        Accept: 'application/vnd.github+json',
      },
      signal: controller.signal,
    });

    if (response.status === 404) {
      throw new GitHubReleaseError(
        'NOT_FOUND',
        'No published GitHub releases found yet',
        404,
      );
    }

    if (response.status === 403 || response.status === 429) {
      throw new GitHubReleaseError(
        'RATE_LIMITED',
        `GitHub API rate limit exceeded (${response.status})`,
        response.status,
      );
    }

    if (!response.ok) {
      throw new GitHubReleaseError(
        'HTTP',
        `GitHub API returned HTTP ${response.status}`,
        response.status,
      );
    }

    const payload: unknown = await response.json();
    const latestRelease = parseGitHubReleasePayload(payload);
    const hasUpdate = compareSemver(latestRelease.version, currentVersion) > 0;

    return {
      currentVersion: stripVersionPrefix(currentVersion),
      latestRelease,
      hasUpdate,
      checkedAt: new Date().toISOString(),
    };
  } catch (error) {
    if (error instanceof GitHubReleaseError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new GitHubReleaseError('TIMEOUT', 'GitHub release check timed out');
    }
    if (error instanceof Error && error.name === 'AbortError') {
      throw new GitHubReleaseError('TIMEOUT', 'GitHub release check timed out');
    }
    throw new GitHubReleaseError(
      'NETWORK',
      error instanceof Error ? error.message : 'Network error while checking releases',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}
