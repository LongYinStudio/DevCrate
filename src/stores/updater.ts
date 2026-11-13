import { computed, ref } from 'vue';
import {
  APP_VERSION,
  GITHUB_LATEST_RELEASE_API,
} from '../utils/appInfo';
import {
  GitHubReleaseError,
  fetchLatestGitHubRelease,
  stripVersionPrefix,
  type GitHubReleaseInfo,
  type ReleaseCheckStatus,
} from '../utils/githubRelease';

const STORAGE_AUTO_CHECK_KEY = 'devcrate_auto_check_updates';
const STORAGE_IGNORED_VERSION_KEY = 'devcrate_ignored_update_version';
const STORAGE_LAST_CHECK_KEY = 'devcrate_last_update_check_at';
const AUTO_CHECK_COOLDOWN_MS = 6 * 60 * 60 * 1000;

function readBoolStorage(key: string, defaultValue: boolean): boolean {
  try {
    const val = localStorage.getItem(key);
    if (val === null) return defaultValue;
    return val === 'true';
  } catch {
    return defaultValue;
  }
}

function readStringStorage(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string | null) {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // 忽略存储限制异常
  }
}

export const currentAppVersion = ref<string>(stripVersionPrefix(APP_VERSION));
export const currentDisplayVersion = computed(() => `v${currentAppVersion.value}`);

export const updateStatus = ref<ReleaseCheckStatus>('idle');
export const latestRelease = ref<GitHubReleaseInfo | null>(null);
export const updateErrorCode = ref<GitHubReleaseError['code'] | null>(null);
export const updateErrorMessage = ref<string | null>(null);
export const lastCheckedAt = ref<string | null>(readStringStorage(STORAGE_LAST_CHECK_KEY));
export const autoCheckUpdates = ref<boolean>(readBoolStorage(STORAGE_AUTO_CHECK_KEY, true));
export const ignoredVersion = ref<string | null>(readStringStorage(STORAGE_IGNORED_VERSION_KEY));

export const hasAvailableUpdate = computed(() => {
  if (updateStatus.value !== 'available' || !latestRelease.value) return false;
  return latestRelease.value.version !== ignoredVersion.value;
});

let inflightCheck: Promise<void> | null = null;
let updaterInitialized = false;

export interface CheckForUpdatesOptions {
  silent?: boolean;
}

export async function checkForUpdates(options: CheckForUpdatesOptions = {}): Promise<void> {
  if (inflightCheck) return inflightCheck;

  const { silent = false } = options;

  inflightCheck = (async () => {
    if (!silent) {
      updateStatus.value = 'checking';
    }
    updateErrorCode.value = null;
    updateErrorMessage.value = null;

    try {
      const result = await fetchLatestGitHubRelease({
        apiUrl: GITHUB_LATEST_RELEASE_API,
        currentVersion: currentAppVersion.value,
      });

      latestRelease.value = result.latestRelease;
      lastCheckedAt.value = result.checkedAt;
      writeStorage(STORAGE_LAST_CHECK_KEY, result.checkedAt);

      if (result.hasUpdate) {
        updateStatus.value = 'available';
      } else {
        updateStatus.value = 'up-to-date';
        // 已经处于最新版或更高版本时清理过期忽略记录
        if (ignoredVersion.value) {
          ignoredVersion.value = null;
          writeStorage(STORAGE_IGNORED_VERSION_KEY, null);
        }
      }
    } catch (error) {
      if (silent) {
        // 启动静默检查遇到离线、限流或未发布 Release 时保持安静，不打扰纯本地使用
        if (updateStatus.value === 'checking') {
          updateStatus.value = 'idle';
        }
        return;
      }

      updateStatus.value = 'error';
      if (error instanceof GitHubReleaseError) {
        updateErrorCode.value = error.code;
        updateErrorMessage.value = error.message;
      } else {
        updateErrorCode.value = 'NETWORK';
        updateErrorMessage.value = error instanceof Error ? error.message : String(error);
      }
    } finally {
      inflightCheck = null;
    }
  })();

  return inflightCheck;
}

export function setAutoCheckUpdates(enabled: boolean) {
  autoCheckUpdates.value = enabled;
  writeStorage(STORAGE_AUTO_CHECK_KEY, String(enabled));
}

export function ignoreCurrentUpdate() {
  if (!latestRelease.value) return;
  ignoredVersion.value = latestRelease.value.version;
  writeStorage(STORAGE_IGNORED_VERSION_KEY, latestRelease.value.version);
}

export function clearIgnoredUpdate() {
  ignoredVersion.value = null;
  writeStorage(STORAGE_IGNORED_VERSION_KEY, null);
}

export async function initUpdater() {
  currentAppVersion.value = stripVersionPrefix(APP_VERSION);

  if (updaterInitialized) return;
  updaterInitialized = true;

  if (!autoCheckUpdates.value) return;

  if (lastCheckedAt.value) {
    const elapsed = Date.now() - new Date(lastCheckedAt.value).getTime();
    if (!Number.isNaN(elapsed) && elapsed < AUTO_CHECK_COOLDOWN_MS) {
      return;
    }
  }

  void checkForUpdates({ silent: true });
}
