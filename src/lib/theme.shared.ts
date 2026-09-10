export const THEME_COOKIE_KEY = 'theme';
export const THEME_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export type ThemePreference = 'light' | 'dark' | 'system';
export type ThemeTriggerIcon = 'sun' | 'moon' | 'monitor';

export function getThemeTriggerIcon(theme: ThemePreference): ThemeTriggerIcon {
  switch (theme) {
    case 'system':
      return 'monitor';
    case 'dark':
      return 'moon';
    case 'light':
      return 'sun';
  }
}

export function getTriggerIconKey(
  theme: ThemePreference,
  resolvedTheme?: string,
): ThemeTriggerIcon {
  if (theme === 'system') {
    return 'monitor';
  }

  if (theme === 'dark' || resolvedTheme === 'dark') {
    return 'moon';
  }

  return 'sun';
}
