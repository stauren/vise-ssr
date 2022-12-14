import { useEffect } from 'react';
import { IS_SSR } from '@/data/env';

const ThemeName = {
  dark: 'dark',
  light: 'light',
} as const;

type PageThemes = typeof ThemeName[keyof typeof ThemeName];

function getThemeOfTime() {
  const nowHour = (new Date()).getHours();
  return nowHour > 6 && nowHour < 18 ? ThemeName.light : ThemeName.dark;
}
function setThemeOfDocument(newTheme: PageThemes) {
  if (IS_SSR) {
    return;
  }
  const prevTheme = newTheme === ThemeName.dark ? ThemeName.light : ThemeName.dark;
  const html = document.documentElement;
  if (html.classList) {
    html.classList.remove(prevTheme);
    html.classList.add(newTheme);
  } else {
    html.className = html.className
      .replace(/\b(dark|light)\b/g, '')
      .replace(/\s*$/, ` ${newTheme}`);
  }
}

export {
  ThemeName,
};
export default function useTheme(): { currentTheme: PageThemes, toggleTheme: () => void } {
  let currentTheme: PageThemes = ThemeName.light;

  let lastUserToggleTime = 0;

  function setTheme(newTheme: PageThemes) {
    currentTheme = newTheme;
    setThemeOfDocument(currentTheme);
  }

  function toggleTheme() {
    lastUserToggleTime = Date.now();
    setTheme(currentTheme === ThemeName.dark ? ThemeName.light : ThemeName.dark);
  }

  useEffect(() => {
    setTheme(getThemeOfTime());

    // 每分钟自动设置一次
    const idInterval: NodeJS.Timer = setInterval(() => {
      // 用户没操作过，或者已经操作了 10 分钟了
      if (lastUserToggleTime === 0
      || Date.now() - lastUserToggleTime >= 10 * 60 * 1000) { // 10 minutes
        setTheme(getThemeOfTime());
      }
    }, 60 * 1000);

    return () => {
      clearInterval(idInterval);
    };
  });

  return {
    currentTheme,
    toggleTheme,
  };
}
