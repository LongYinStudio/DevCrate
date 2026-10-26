<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { Sun, Moon, Laptop, ShieldCheck, Keyboard, Github, ExternalLink } from 'lucide-vue-next';
import AppLogo from '../common/AppLogo.vue';
import { themeMode, setTheme, type ThemeMode } from '../../stores/theme';
import { setLocale, type LocaleType } from '../../locales';
import { openExternalLink, GITHUB_REPO_URL } from '../../utils/openUrl';

const { t, locale } = useI18n();

function handleThemeChange(mode: ThemeMode) {
  setTheme(mode);
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
          管理 DevCrate 的外观显示、交互偏好与系统配置
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
            @click="handleThemeChange('light')"
            class="flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-left"
            :class="[
              themeMode === 'light'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-600'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
            ]"
          >
            <Sun class="w-5 h-5 shrink-0" />
            <div class="flex flex-col">
              <span class="text-xs font-semibold">{{ t('settings.themeLight') }}</span>
              <span class="text-[11px] text-zinc-400">明亮清爽</span>
            </div>
          </button>

          <!-- 深色 -->
          <button
            type="button"
            @click="handleThemeChange('dark')"
            class="flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-left"
            :class="[
              themeMode === 'dark'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-600'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
            ]"
          >
            <Moon class="w-5 h-5 shrink-0" />
            <div class="flex flex-col">
              <span class="text-xs font-semibold">{{ t('settings.themeDark') }}</span>
              <span class="text-[11px] text-zinc-400">深沉护眼</span>
            </div>
          </button>

          <!-- 跟随系统 -->
          <button
            type="button"
            @click="handleThemeChange('system')"
            class="flex items-center gap-3 p-3.5 rounded-xl border transition-all cursor-pointer text-left"
            :class="[
              themeMode === 'system'
                ? 'border-blue-600 bg-blue-50/40 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400 ring-1 ring-blue-600'
                : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-800/60 text-zinc-700 dark:text-zinc-300'
            ]"
          >
            <Laptop class="w-5 h-5 shrink-0" />
            <div class="flex flex-col">
              <span class="text-xs font-semibold">{{ t('settings.themeSystem') }}</span>
              <span class="text-[11px] text-zinc-400">自适应 OS</span>
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
        <div class="flex items-center gap-3">
          <AppLogo :size="44" rounded="xl" />
          <div>
            <h2 class="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
              DevCrate
            </h2>
            <p class="text-xs text-zinc-400">
              Version 0.1.0 • Built on Tauri 2
            </p>
          </div>
        </div>

        <p class="text-xs text-zinc-600 dark:text-zinc-300 leading-relaxed">
          {{ t('settings.aboutDesc') }}
        </p>

        <!-- 开源仓库信息 -->
        <div class="flex items-center justify-between p-3 rounded-xl bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-700/60">
          <div class="flex items-center gap-2.5">
            <Github class="w-4 h-4 text-zinc-700 dark:text-zinc-300" />
            <div class="flex flex-col">
              <span class="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{{ t('settings.githubRepo') }}</span>
              <span class="text-[11px] font-mono text-zinc-400">LongYinStudio/DevCrate</span>
            </div>
          </div>
          <button
            type="button"
            @click="openExternalLink(GITHUB_REPO_URL)"
            class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors cursor-pointer"
          >
            <span>访问仓库</span>
            <ExternalLink class="w-3.5 h-3.5" />
          </button>
        </div>

        <div class="flex items-center gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
          <ShieldCheck class="w-4 h-4" />
          <span>离线安全保障：所有工具均在本地运行，绝不上传任何输入数据。</span>
        </div>
      </section>
    </div>
  </div>
</template>
