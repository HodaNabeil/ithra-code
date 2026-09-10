import { cookies } from 'next/headers';
import { THEME_COOKIE_KEY, type ThemePreference } from '@/lib/theme.shared';

const DEFAULT_THEME: ThemePreference = 'system';

export async function getThemePreference(): Promise<ThemePreference> {
  const cookieStore = await cookies();
  const theme = cookieStore.get(THEME_COOKIE_KEY)?.value;

  if (theme === 'light' || theme === 'dark' || theme === 'system') {
    return theme;
  }

  return DEFAULT_THEME;
}
