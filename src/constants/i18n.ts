/**
 * Internationalization (i18n) constants
 */

// Text directions
export const DIRECTIONS = {
  RTL: 'rtl',
  LTR: 'ltr',
} as const;
export type Direction = (typeof DIRECTIONS)[keyof typeof DIRECTIONS];

// Supported languages
export const LANGUAGES = {
  ENGLISH: 'en',
  ARABIC: 'ar',
} as const;
export type Language = (typeof LANGUAGES)[keyof typeof LANGUAGES];

// Language display names
export const LANGUAGE_NAMES = {
  [LANGUAGES.ENGLISH]: 'English',
  [LANGUAGES.ARABIC]: 'العربية',
} as const;

// Default language settings
export const DEFAULT_LANGUAGE = LANGUAGES.ARABIC;
export const DEFAULT_DIRECTION = DIRECTIONS.RTL;
export const FALLBACK_LANGUAGE = LANGUAGES.ENGLISH;
