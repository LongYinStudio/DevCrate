import { ref, nextTick } from 'vue';

export type ThemeMode = 'light' | 'dark' | 'system';

const STORAGE_KEY = 'devcrate_theme';

export const themeMode = ref<ThemeMode>(
  (localStorage.getItem(STORAGE_KEY) as ThemeMode) || 'system'
);

export const isDarkActual = ref<boolean>(false);

/**
 * 实际应用 dark 类名到 documentElement
 */
export function applyTheme(): boolean {
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark = themeMode.value === 'dark' || (themeMode.value === 'system' && isSystemDark);
  isDarkActual.value = dark;

  if (dark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
  return dark;
}

/**
 * 获取点击事件坐标或目标元素中心坐标
 */
function getEventCoordinates(event?: MouseEvent | UIEvent): { x: number; y: number } | null {
  if (!event) return null;

  if ('clientX' in event && typeof event.clientX === 'number' && (event.clientX !== 0 || event.clientY !== 0)) {
    return { x: event.clientX, y: event.clientY };
  }

  const target = (event.currentTarget || event.target) as HTMLElement | null;
  if (target && typeof target.getBoundingClientRect === 'function') {
    const rect = target.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      return {
        x: Math.round(rect.left + rect.width / 2),
        y: Math.round(rect.top + rect.height / 2),
      };
    }
  }

  return null;
}

/**
 * 执行降级平滑过渡（适用于不支持 View Transitions API 的环境）
 */
function applyFallbackTransition(updateFn: () => void) {
  document.documentElement.classList.add('theme-transitioning');
  updateFn();
  window.setTimeout(() => {
    document.documentElement.classList.remove('theme-transitioning');
  }, 350);
}

/**
 * 初始化主题（启动时静默应用，无多余过渡）
 */
export function initTheme() {
  applyTheme();

  // 监听系统偏好变化
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  const listener = () => {
    if (themeMode.value === 'system') {
      const isSystemDark = mediaQuery.matches;
      if (isDarkActual.value !== isSystemDark) {
        setTheme('system');
      }
    }
  };

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', listener);
  } else {
    // 兼容旧版浏览器
    mediaQuery.addListener(listener);
  }
}

/**
 * 设置主题，支持 View Transitions 圆形扩散特效或平滑过渡降级
 */
export function setTheme(mode: ThemeMode, event?: MouseEvent | UIEvent) {
  const isSystemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const targetDark = mode === 'dark' || (mode === 'system' && isSystemDark);
  const darkChanged = isDarkActual.value !== targetDark;

  // 如果模式相同且实际明暗状态无变化，直接忽略
  if (themeMode.value === mode && !darkChanged) {
    return;
  }

  // 如果明暗表现没有改变（例如同为暗色），只需更新设置和持久化存储，无需全屏动效
  if (!darkChanged) {
    themeMode.value = mode;
    localStorage.setItem(STORAGE_KEY, mode);
    applyTheme();
    return;
  }

  const doc = document as any;
  const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canUseViewTransition = typeof doc.startViewTransition === 'function' && !isReducedMotion;

  if (!canUseViewTransition) {
    if (isReducedMotion) {
      themeMode.value = mode;
      localStorage.setItem(STORAGE_KEY, mode);
      applyTheme();
    } else {
      applyFallbackTransition(() => {
        themeMode.value = mode;
        localStorage.setItem(STORAGE_KEY, mode);
        applyTheme();
      });
    }
    return;
  }

  const coords = getEventCoordinates(event);

  try {
    const transition = doc.startViewTransition(async () => {
      themeMode.value = mode;
      localStorage.setItem(STORAGE_KEY, mode);
      applyTheme();
      await nextTick();
    });

    transition.ready.then(() => {
      if (coords) {
        const { x, y } = coords;
        const endRadius = Math.hypot(
          Math.max(x, window.innerWidth - x),
          Math.max(y, window.innerHeight - y)
        );

        doc.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 450,
            easing: 'cubic-bezier(0.2, 0, 0, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      } else {
        doc.documentElement.animate(
          {
            opacity: [0, 1],
          },
          {
            duration: 280,
            easing: 'ease-out',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      }
    }).catch(() => {
      // 动画被中断或忽略
    });
  } catch {
    // startViewTransition 异常时降级处理
    applyFallbackTransition(() => {
      themeMode.value = mode;
      localStorage.setItem(STORAGE_KEY, mode);
      applyTheme();
    });
  }
}

/**
 * 切换主题（循环：浅色 -> 深色 -> 跟随系统 -> 浅色）
 */
export function toggleTheme(event?: MouseEvent | UIEvent) {
  if (themeMode.value === 'light') {
    setTheme('dark', event);
  } else if (themeMode.value === 'dark') {
    setTheme('system', event);
  } else {
    setTheme('light', event);
  }
}
