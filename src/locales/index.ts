import { createI18n } from 'vue-i18n';
import zhCN from './zh-CN';
import enUS from './en-US';

export type LocaleType = 'zh-CN' | 'en-US';

const STORAGE_KEY = 'devcrate_locale';

// 检测默认语言：先读取 localStorage，没有则按系统语言判定
export function getDefaultLocale(): LocaleType {
  const saved = localStorage.getItem(STORAGE_KEY) as LocaleType | null;
  if (saved && (saved === 'zh-CN' || saved === 'en-US')) {
    return saved;
  }
  const navLang = navigator.language.toLowerCase();
  return navLang.startsWith('zh') ? 'zh-CN' : 'en-US';
}

export const i18n = createI18n({
  legacy: false,
  locale: getDefaultLocale(),
  fallbackLocale: 'en-US',
  messages: {
    'zh-CN': zhCN,
    'en-US': enUS,
  },
});

export function setLocale(locale: LocaleType) {
  i18n.global.locale.value = locale;
  localStorage.setItem(STORAGE_KEY, locale);
}
