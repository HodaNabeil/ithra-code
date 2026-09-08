'use client';

import { useEffect } from 'react';
import { Monitor, Moon, Sun, type LucideIcon } from 'lucide-react';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  getTriggerIconKey,
  type ThemePreference,
  type ThemeTriggerIcon,
} from '@/lib/theme.shared';
import { setThemeCookie, syncThemeCookieFromStorage } from '@/lib/theme-client';

const themes = [
  { value: 'light', label: 'فاتح', icon: Sun },
  { value: 'dark', label: 'داكن', icon: Moon },
  { value: 'system', label: 'النظام', icon: Monitor },
] as const;

const triggerIcons: Record<ThemeTriggerIcon, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  monitor: Monitor,
};

type ThemeToggleButtonProps = {
  initialTheme: ThemePreference;
};

export default function ThemeToggleButton({
  initialTheme,
}: ThemeToggleButtonProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const currentTheme = (theme ?? initialTheme) as ThemePreference;

  useEffect(() => {
    syncThemeCookieFromStorage();
  }, []);

  const handleThemeChange = (value: string) => {
    setTheme(value);
    setThemeCookie(value as ThemePreference);
  };

  const TriggerIcon =
    triggerIcons[getTriggerIconKey(currentTheme, resolvedTheme)] ?? Sun;

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-primary hover:bg-primary/10 hover:text-primary"
          aria-label="تغيير المظهر"
        >
          <TriggerIcon className="size-4" />
          <span className="sr-only">تغيير المظهر</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        sideOffset={8}
        className="min-w-36 bg-card/95 text-card-foreground backdrop-blur-sm"
      >
        <DropdownMenuRadioGroup
          value={currentTheme}
          onValueChange={handleThemeChange}
        >
          {themes.map(({ value, label, icon: Icon }) => (
            <DropdownMenuRadioItem
              key={value}
              value={value}
              dir="ltr"
              className="flex w-full items-center gap-3 px-3 focus:bg-foreground/10 focus:text-foreground data-highlighted:bg-foreground/10 data-highlighted:text-foreground data-[state=checked]:bg-transparent data-[state=checked]:text-foreground **:data-[slot=dropdown-menu-radio-item-indicator]:hidden"
            >
              <span className="flex size-4 shrink-0 items-center justify-center">
                {currentTheme === value ? (
                  <span className="size-1.5 rounded-full bg-foreground" />
                ) : null}
              </span>
              <span className="flex-1 text-right">{label}</span>
              <Icon className="size-4 shrink-0" />
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
