import {
  THEME_COOKIE_KEY,
  THEME_COOKIE_MAX_AGE,
  type ThemePreference,
} from '@/lib/theme.shared';

export function setThemeCookie(theme: ThemePreference): void {
  document.cookie = `${THEME_COOKIE_KEY}=${theme}; path=/; max-age=${THEME_COOKIE_MAX_AGE}; SameSite=Lax`;
}

export function syncThemeCookieFromStorage(): void {
  const stored = localStorage.getItem(THEME_COOKIE_KEY);

  if (stored === 'light' || stored === 'dark' || stored === 'system') {
    setThemeCookie(stored);
  }
}
