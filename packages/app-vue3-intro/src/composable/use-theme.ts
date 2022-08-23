import { ref, watchEffect, onMounted, onUnmounted } from 'vue';
import { IS_SSR } from '@/data/env';

enum ThemeName {
  dark = 'dark',
  light = 'light',
}

function getThemeOfTime() {
  const nowHour = (new Date()).getHours();
  return nowHour > 6 && nowHour < 18 ? ThemeName.light : ThemeName.dark;
}
function setTheme(newTheme: ThemeName) {
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

export default () => {
  const currentTheme = ref(ThemeName.light);

  let idInterval: NodeJS.Timer;
  let lastUserToggleTime = 0;

  function toggleTheme() {
    lastUserToggleTime = Date.now();
    const prevTheme = currentTheme.value;
    if (prevTheme === ThemeName.dark) {
      currentTheme.value = ThemeName.light;
    } else {
      currentTheme.value = ThemeName.dark;
    }
    setTheme(currentTheme.value);
  }

  watchEffect(() => {
    setTheme(currentTheme.value);
  });

  onMounted(() => {
    currentTheme.value = getThemeOfTime();

    // 每分钟自动设置一次
    idInterval = setInterval(() => {
      // 用户没操作过，或者已经操作了 10 分钟了
      if (lastUserToggleTime === 0
      || Date.now() - lastUserToggleTime >= 10 * 60 * 1000) { // 10 minutes
        currentTheme.value = getThemeOfTime();
      }
    }, 60 * 1000);
  });

  onUnmounted(() => {
    clearInterval(idInterval);
  });

  return {
    currentTheme,
    toggleTheme,
  };
};
