<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import {
  Sun,
  Moon,
  Laptop,
  ShieldCheck,
  Keyboard,
  Github,
  ExternalLink,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-vue-next';
import AppLogo from '../common/AppLogo.vue';
import { themeMode, setTheme, type ThemeMode } from '../../stores/theme';
import { setLocale, type LocaleType } from '../../locales';
import { openExternalLink } from '../../utils/openUrl';
import {
  APP_NAME,
  GITHUB_REPO_SLUG,
  GITHUB_REPO_URL,
  GITHUB_RELEASES_URL,
} from '../../utils/appInfo';
import {
  currentAppVersion,
  currentDisplayVersion,
  updateStatus,
  latestRelease,
  updateErrorCode,
  updateErrorMessage,
  lastCheckedAt,
  autoCheckUpdates,
  ignoredVersion,
  hasAvailableUpdate,
  checkForUpdates,
  setAutoCheckUpdates,
  ignoreCurrentUpdate,
  clearIgnoredUpdate,
} from '../../stores/updater';
import { formatAssetSize, pickPreferredAsset } from '../../utils/githubRelease';

const { t, locale } = useI18n();

const isCheckingUpdates = computed(() => updateStatus.value === 'checking');
const preferredAsset = computed(() =>
  latestRelease.value ? pickPreferredAsset(latestRelease.value.assets) : null,
);
const isCurrentLatestIgnored = computed(
  () =>
    updateStatus.value === 'available' &&
    latestRelease.value !== null &&
    ignoredVersion.value === latestRelease.value.version,
);

const formattedLastChecked = computed(() => {
  if (!lastCheckedAt.value) return t('settings.neverChecked');
  const date = new Date(lastCheckedAt.value);
  if (Number.isNaN(date.getTime())) return t('settings.neverChecked');
  return date.toLocaleString(locale.value, {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
});

const formattedPublishedAt = computed(() => {
  const raw = latestRelease.value?.publishedAt;
  if (!raw) return '';
  const date = new Date(raw);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString(locale.value, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
});

const friendlyUpdateError = computed(() => {
  switch (updateErrorCode.value) {
    case 'NOT_FOUND':
      return t('settings.updateErrorNotFound');
    case 'RATE_LIMITED':
      return t('settings.updateErrorRateLimit');
    case 'TIMEOUT':
      return t('settings.updateErrorTimeout');
    default:
      return updateErrorMessage.value || t('settings.updateErrorNetwork');
  }
});

function handleThemeChange(mode: ThemeMode, event?: MouseEvent) {
  setTheme(mode, event);
}

function handleLocaleChange(loc: LocaleType) {
  setLocale(loc);
}
</script>

<template>
  <div class="flex-1 overflow-y-auto p-6 md:p-8 bg-zinc-50/50 dark:bg-zinc-950">
    <div class="max-w-3xl mx-auto flex flex-col gap-6">
      <!-- 页面标题 -->
      <div class="pb-4 border-b border-zinc-200/80 dark:border-zinc-800/80">
        <h1 class="text-xl font-bold text-zinc-900 dark:text-zinc-100">
          {{ t('settings.title') }}
        </h1>
        <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
          {{ locale.startsWith('zh') ? '管理 DevCrate 的外观显示、交互偏好与系统配置' : 'Manage DevCrate appearance, preferences, and system configuration' }}
        </p>
      </div>

      <!-- 主题设置区域 -->
      <section class="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-4">
        <div>
          <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {{ t('settings.appearance') }}
          </h2>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {{ t('settings.appearanceDesc') }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <!-- 浅色 -->
          <button
            type="button"
            @click="handleThemeChange('light', $event)"
            class="group flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left"
            :class="[
              themeMode === 'light'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-600'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
            ]"
          >
            <Sun class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:rotate-12" />
            <div class="flex flex-col">
              <span class="text-xs font-semibold">{{ t('settings.themeLight') }}</span>
              <span class="text-[11px] text-zinc-400">{{ locale.startsWith('zh') ? '明亮清爽' : 'Bright and clean' }}</span>
            </div>
          </button>

          <!-- 深色 -->
          <button
            type="button"
            @click="handleThemeChange('dark', $event)"
            class="group flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left"
            :class="[
              themeMode === 'dark'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-600'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
            ]"
          >
            <Moon class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:-rotate-12" />
            <div class="flex flex-col">
              <span class="text-xs font-semibold">{{ t('settings.themeDark') }}</span>
              <span class="text-[11px] text-zinc-400">{{ locale.startsWith('zh') ? '深沉护眼' : 'Easy on the eyes' }}</span>
            </div>
          </button>

          <!-- 跟随系统 -->
          <button
            type="button"
            @click="handleThemeChange('system', $event)"
            class="group flex items-center gap-3 p-3.5 rounded-xl border transition-all duration-200 cursor-pointer text-left"
            :class="[
              themeMode === 'system'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-600'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
            ]"
          >
            <Laptop class="w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-105" />
            <div class="flex flex-col">
              <span class="text-xs font-semibold">{{ t('settings.themeSystem') }}</span>
              <span class="text-[11px] text-zinc-400">{{ locale.startsWith('zh') ? '自适应 OS' : 'Adaptive to OS' }}</span>
            </div>
          </button>
        </div>
      </section>

      <!-- 语言设置区域 -->
      <section class="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-4">
        <div>
          <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {{ t('settings.language') }}
          </h2>
          <p class="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            {{ t('settings.languageDesc') }}
          </p>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            @click="handleLocaleChange('zh-CN')"
            class="flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer"
            :class="[
              locale === 'zh-CN'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-600'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
            ]"
          >
            <div class="flex flex-col text-left">
              <span class="text-xs font-semibold">简体中文</span>
              <span class="text-[11px] text-zinc-400">Chinese (Simplified)</span>
            </div>
            <span v-if="locale === 'zh-CN'" class="text-xs font-bold text-blue-600">✓</span>
          </button>

          <button
            type="button"
            @click="handleLocaleChange('en-US')"
            class="flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer"
            :class="[
              locale === 'en-US'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-600'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
            ]"
          >
            <div class="flex flex-col text-left">
              <span class="text-xs font-semibold">English</span>
              <span class="text-[11px] text-zinc-400">English (United States)</span>
            </div>
            <span v-if="locale === 'en-US'" class="text-xs font-bold text-blue-600">✓</span>
          </button>
        </div>
      </section>

      <!-- 快捷键指南 -->
      <section class="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-4">
        <div class="flex items-center gap-2">
          <Keyboard class="w-4 h-4 text-blue-500" />
          <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {{ t('settings.shortcuts') }}
          </h2>
        </div>

        <div class="space-y-2.5 text-xs">
          <div class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <span class="text-zinc-600 dark:text-zinc-300">{{ t('settings.shortcutSearchDesc') }}</span>
            <kbd class="px-2 py-1 rounded bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 font-mono text-[11px] text-zinc-700 dark:text-zinc-200 shadow-2xs">
              Ctrl + K / ⌘K
            </kbd>
          </div>

          <div class="flex items-center justify-between p-2.5 rounded-lg bg-zinc-50 dark:bg-zinc-800/50">
            <span class="text-zinc-600 dark:text-zinc-300">{{ t('settings.shortcutEscapeDesc') }}</span>
            <kbd class="px-2 py-1 rounded bg-white dark:bg-zinc-700 border border-zinc-200 dark:border-zinc-600 font-mono text-[11px] text-zinc-700 dark:text-zinc-200 shadow-2xs">
              Escape
            </kbd>
          </div>
        </div>
      </section>

      <!-- 关于与隐私安全 -->
      <section class="p-6 rounded-2xl border border-zinc-200/80 dark:border-zinc-800/80 bg-white dark:bg-zinc-900 shadow-xs flex flex-col gap-4">
        <div class="flex flex-wrap items-center justify-between gap-3">
          <div class="flex items-center gap-3">
            <AppLogo :size="44" rounded="xl" />
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {{ APP_NAME }}
                </h2>
                <span class="px-2 py-0.5 text-[11px] font-mono font-medium rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200/70 dark:border-zinc-700/70">
                  {{ currentDisplayVersion }}
                </span>
              </div>
              <p class="text-xs text-zinc-400 mt-0.5">
                Version {{ currentAppVersion }} • Built on Tauri 2
              </p>
            </div>
          </div>

          <button
            type="button"
            :disabled="isCheckingUpdates"
            @click="checkForUpdates()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-800 dark:hover:bg-zinc-700/80 text-zinc-700 dark:text-zinc-200 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <RefreshCw class="w-3.5 h-3.5" :class="{ 'animate-spin': isCheckingUpdates }" />
            <span>{{ isCheckingUpdates ? t('settings.checkingUpdates') : t('settings.checkUpdates') }}</span>
          </button>
        </div>

        <p class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {{ t('settings.aboutDesc') }}
        </p>

        <!-- GitHub Release 更新检查卡片 -->
        <div class="p-4 rounded-xl bg-zinc-50/90 dark:bg-zinc-800/40 border border-zinc-200/70 dark:border-zinc-700/60 flex flex-col gap-3">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <div class="flex flex-col gap-0.5">
              <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">
                {{ t('settings.updateSectionTitle') }}
              </span>
              <span class="text-[11px] text-zinc-500 dark:text-zinc-400">
                {{ t('settings.lastChecked', { time: formattedLastChecked }) }}
              </span>
            </div>

            <label class="inline-flex items-center gap-2 cursor-pointer select-none">
              <span class="text-xs text-zinc-600 dark:text-zinc-300">
                {{ t('settings.autoCheckUpdates') }}
              </span>
              <button
                type="button"
                role="switch"
                :aria-checked="autoCheckUpdates"
                @click="setAutoCheckUpdates(!autoCheckUpdates)"
                class="relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors cursor-pointer"
                :class="autoCheckUpdates ? 'bg-blue-600' : 'bg-zinc-300 dark:bg-zinc-600'"
              >
                <span
                  class="inline-block h-3.5 w-3.5 rounded-full bg-white shadow-xs transition-transform"
                  :class="autoCheckUpdates ? 'translate-x-4.5' : 'translate-x-1'"
                />
              </button>
            </label>
          </div>

          <!-- 发现新版本 -->
          <div
            v-if="hasAvailableUpdate && latestRelease"
            class="p-3.5 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 flex flex-col gap-3"
          >
            <div class="flex flex-wrap items-start justify-between gap-2">
              <div class="flex items-start gap-2.5">
                <Sparkles class="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <div class="flex flex-col gap-0.5">
                  <div class="flex items-center gap-2 flex-wrap">
                    <span class="text-xs font-semibold text-blue-900 dark:text-blue-100">
                      {{ t('settings.updateAvailable') }}
                    </span>
                    <span class="px-1.5 py-0.5 text-[11px] font-mono font-semibold rounded bg-blue-600 text-white">
                      {{ latestRelease.tagName }}
                    </span>
                    <span v-if="formattedPublishedAt" class="text-[11px] text-blue-700/80 dark:text-blue-300/80">
                      {{ t('settings.publishedAt', { date: formattedPublishedAt }) }}
                    </span>
                  </div>
                  <span class="text-[11px] text-blue-700 dark:text-blue-300">
                    {{ t('settings.updateAvailableDesc', { latest: latestRelease.version, current: currentAppVersion }) }}
                  </span>
                </div>
              </div>

              <button
                type="button"
                @click="ignoreCurrentUpdate"
                class="text-[11px] text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200 underline underline-offset-2 cursor-pointer"
              >
                {{ t('settings.ignoreVersion') }}
              </button>
            </div>

            <div class="flex flex-col gap-1">
              <span class="text-[11px] font-medium text-zinc-600 dark:text-zinc-300">
                {{ t('settings.releaseNotes') }}
              </span>
              <div class="max-h-36 overflow-y-auto p-2.5 rounded-lg bg-white/80 dark:bg-zinc-900/70 border border-blue-200/50 dark:border-blue-900/50 text-xs text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap font-mono leading-relaxed">
                {{ latestRelease.body || t('settings.noReleaseNotes') }}
              </div>
            </div>

            <div class="flex flex-wrap items-center gap-2">
              <button
                v-if="preferredAsset"
                type="button"
                @click="openExternalLink(preferredAsset.browserDownloadUrl)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors cursor-pointer"
              >
                <Download class="w-3.5 h-3.5" />
                <span>{{ t('settings.downloadInstaller', { name: preferredAsset.name, size: formatAssetSize(preferredAsset.size) }) }}</span>
              </button>

              <button
                type="button"
                @click="openExternalLink(latestRelease.htmlUrl)"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-blue-200 dark:border-blue-800 bg-white/80 dark:bg-zinc-900/70 hover:bg-blue-100/70 dark:hover:bg-blue-900/40 text-blue-700 dark:text-blue-300 transition-colors cursor-pointer"
              >
                <span>{{ t('settings.viewReleasePage') }}</span>
                <ExternalLink class="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <!-- 已忽略某个更新版本 -->
          <div
            v-else-if="isCurrentLatestIgnored && latestRelease"
            class="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-xs text-zinc-600 dark:text-zinc-300"
          >
            <span>{{ t('settings.ignoredNotice', { version: latestRelease.tagName }) }}</span>
            <button
              type="button"
              @click="clearIgnoredUpdate"
              class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              {{ t('settings.unignoreVersion') }}
            </button>
          </div>

          <!-- 已是最新版本 -->
          <div
            v-else-if="updateStatus === 'up-to-date'"
            class="flex items-center gap-2 text-xs text-emerald-600 dark:text-emerald-400"
          >
            <CheckCircle2 class="w-4 h-4 shrink-0" />
            <span>{{ t('settings.upToDateDesc', { version: currentAppVersion }) }}</span>
          </div>

          <!-- 检查失败 -->
          <div
            v-else-if="updateStatus === 'error'"
            class="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-lg bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/50 text-xs text-amber-800 dark:text-amber-200"
          >
            <div class="flex items-center gap-2">
              <AlertCircle class="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <span>{{ friendlyUpdateError }}</span>
            </div>
            <button
              type="button"
              @click="openExternalLink(GITHUB_RELEASES_URL)"
              class="inline-flex items-center gap-1 font-medium text-amber-700 dark:text-amber-300 hover:underline cursor-pointer"
            >
              <span>{{ t('settings.viewReleasePage') }}</span>
              <ExternalLink class="w-3 h-3" />
            </button>
          </div>
        </div>

        <!-- 开源仓库信息 -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
          <div class="flex items-center gap-2.5">
            <Github class="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <div class="flex flex-col">
              <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{{ t('settings.githubRepo') }}</span>
              <span class="text-[11px] font-mono text-zinc-400">{{ GITHUB_REPO_SLUG }}</span>
            </div>
          </div>
          <button
            type="button"
            @click="openExternalLink(GITHUB_REPO_URL)"
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
          >
            <span>{{ t('settings.visitRepo') }}</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck class="w-4 h-4" />
          <span>{{ locale.startsWith('zh') ? '离线安全保障：所有工具均在本地运行，绝不上传任何输入数据。' : 'Offline Privacy: All tools run strictly locally and never upload your data.' }}</span>
        </div>
      </section>
    </div>
  </div>
</template>
