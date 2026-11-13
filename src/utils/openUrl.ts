import { openUrl as tauriOpenUrl } from '@tauri-apps/plugin-opener';
import { GITHUB_REPO_URL } from './appInfo';

export { GITHUB_REPO_URL };

export async function openExternalLink(url: string = GITHUB_REPO_URL) {
  try {
    await tauriOpenUrl(url);
  } catch {
    // 降级为普通网页环境
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
