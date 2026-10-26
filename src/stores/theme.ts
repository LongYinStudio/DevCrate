import { ref } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'devcrate_theme';

export const themeMode = ref<ThemeMode>(
  (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system'
);

export const isDarkActual = ref<boolean>(false);

function applyTheme() {
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = themeMode.value === 'dark' || (themeMode.value === 'system' && isSystemDark);
  isDarkActual.value = dark;

  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

export function initTheme() {
  applyTheme();

  // 监听系统偏好变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = () => {
    if (themeMode.value === 'system') {
      applyTheme();
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', listener);
  } else {
    // 兼容旧版浏览器
    mediaQuery.addListener(listener);
  }
}

export function setTheme(mode: ThemeMode) {
  themeMode.value = mode;
  localStorage.setItem(STORAGE_KEY, mode);
  applyTheme();
}

export function toggleTheme() {
  if (themeMode.value === 'light') {
    setTheme('dark');
  } else if (themeMode.value === 'dark') {
    setTheme('system');
  } else {
    setTheme('light');
  }
}
