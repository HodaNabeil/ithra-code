import { getThemePreference } from '@/lib/theme.server';
import ThemeToggleButton from './theme-toggle-button';

export async function ThemeToggle() {
  const initialTheme = await getThemePreference();

  return <ThemeToggleButton initialTheme={initialTheme} />;
}
