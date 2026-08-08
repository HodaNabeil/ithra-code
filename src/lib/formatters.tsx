// ================= TYPES =================
export type Locale = 'ar' | 'en';

// ================= CONFIG =================
const CONFIG = {
  currencyMap: {
    USD: '$',
    EGP: 'ج.م',
    SAR: 'ر.س',
  },
} as const;

// ================= CURRENCY =================
export function formatCurrencySymbol(currency?: string): string {
  if (!currency) return '';

  const upper = currency.toUpperCase();
  return (
    CONFIG.currencyMap[upper as keyof typeof CONFIG.currencyMap] || currency
  );
}

export function formatCurrency(
  amount: number,
  currency: string = 'SAR',
  locale: Locale = 'ar',
): string {
  const safeAmount = Number.isFinite(amount) ? amount : 0;

  const formatted = new Intl.NumberFormat(locale === 'ar' ? 'ar-EG' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeAmount);

  const symbol = formatCurrencySymbol(currency);

  return locale === 'ar' ? `${formatted} ${symbol}` : `${symbol}${formatted}`;
}

export function formatPrice(
  price: number,
  currency?: string,
  locale: Locale = 'ar',
): string {
  if (!Number.isFinite(price)) {
    return locale === 'ar' ? '0' : '0';
  }

  if (price === 0) {
    return locale === 'ar' ? 'مجاني' : 'Free';
  }

  return formatCurrency(price, currency || 'SAR', locale);
}

// ================= DURATION =================
const DURATION_UNITS = {
  ar: {
    hour: { short: 'س', long: 'ساعة' },
    minute: { short: 'د', long: 'دقيقة' },
  },
  en: {
    hour: { short: 'h', long: 'hour' },
    minute: { short: 'm', long: 'minute' },
  },
} as const;

export function formatDuration(
  minutes: number,
  locale: Locale = 'ar',
  verbose = false,
): string {
  // Input validation
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 0;

  if (safeMinutes === 0) {
    const defaultUnit = locale === 'ar' ? '0د' : '0m';
    return defaultUnit;
  }

  const roundedMinutes = Math.round(safeMinutes);
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  const units = DURATION_UNITS[locale] || DURATION_UNITS.ar;
  const separator = verbose ? ' ' : '';

  // Format helper
  const format = (value: number, unit: 'hour' | 'minute') => {
    const unitText = verbose ? units[unit].long : units[unit].short;
    return verbose ? `${value} ${unitText}` : `${value}${unitText}`;
  };

  // Less than 60 minutes
  if (hours === 0) return format(remainingMinutes, 'minute');

  // Only hours
  if (remainingMinutes === 0) return format(hours, 'hour');

  // Hours and minutes
  return `${format(hours, 'hour')}${separator}${format(remainingMinutes, 'minute')}`;
}

// ================= DATE =================
const DATE_FORMATS = {
  ar: {
    now: 'الآن',
    minute: 'دقيقة واحدة',
    minutes: 'دقائق',
    hour: 'ساعة واحدة',
    hours: 'ساعات',
    day: 'يوم واحد',
    days: 'أيام',
    week: 'أسبوع واحد',
    weeks: 'أسابيع',
    month: 'شهر واحد',
    months: 'أشهر',
    year: 'سنة واحدة',
    years: 'سنوات',
    ago: 'منذ',
    future: 'في المستقبل',
    invalid: 'تاريخ غير صالح',
  },
  en: {
    now: 'now',
    minute: 'a minute',
    minutes: 'minutes',
    hour: 'an hour',
    hours: 'hours',
    day: 'a day',
    days: 'days',
    week: 'a week',
    weeks: 'weeks',
    month: 'a month',
    months: 'months',
    year: 'a year',
    years: 'years',
    ago: 'ago',
    future: 'in the future',
    invalid: 'Invalid date',
  },
} as const;

// helper يقلل التكرار
type DateFormatStrings = (typeof DATE_FORMATS)[Locale];

function formatAgo(
  value: number,
  unit: string,
  locale: Locale,
  t: DateFormatStrings,
) {
  return locale === 'ar'
    ? `${t.ago} ${value} ${unit}`
    : `${value} ${unit} ${t.ago}`;
}

export function formatTimestamp(
  date: string | number | Date | null | undefined,
  locale: Locale = 'ar',
): string {
  const t = DATE_FORMATS[locale];

  if (!date) return t.invalid;

  const targetDate = new Date(date);
  if (isNaN(targetDate.getTime())) return t.invalid;

  const now = new Date();
  const diffMs = now.getTime() - targetDate.getTime();

  if (diffMs < 0) return t.future;

  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffMinutes < 1) return t.now;

  if (diffMinutes < 60) {
    if (diffMinutes === 1)
      return locale === 'ar' ? `${t.ago} ${t.minute}` : `${t.minute} ${t.ago}`;
    return formatAgo(diffMinutes, t.minutes, locale, t);
  }

  if (diffHours < 24) {
    if (diffHours === 1)
      return locale === 'ar' ? `${t.ago} ${t.hour}` : `${t.hour} ${t.ago}`;
    return formatAgo(diffHours, t.hours, locale, t);
  }

  if (diffDays < 7) {
    if (diffDays === 1)
      return locale === 'ar' ? `${t.ago} ${t.day}` : `${t.day} ${t.ago}`;
    return formatAgo(diffDays, t.days, locale, t);
  }

  if (diffWeeks < 4) {
    if (diffWeeks === 1)
      return locale === 'ar' ? `${t.ago} ${t.week}` : `${t.week} ${t.ago}`;
    return formatAgo(diffWeeks, t.weeks, locale, t);
  }

  if (diffMonths < 12) {
    if (diffMonths === 1)
      return locale === 'ar' ? `${t.ago} ${t.month}` : `${t.month} ${t.ago}`;
    return formatAgo(diffMonths, t.months, locale, t);
  }

  if (diffYears === 1) {
    return locale === 'ar' ? `${t.ago} ${t.year}` : `${t.year} ${t.ago}`;
  }

  return formatAgo(diffYears, t.years, locale, t);
}

/** Compact video timestamp for a single clip (e.g. `5:30`). Input in seconds. */
export function formatVideoTimestamp(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return '0:00';
  }

  const total = Math.round(seconds);
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  const pad = (value: number) => value.toString().padStart(2, '0');

  if (hours > 0) {
    return `${hours}:${pad(minutes)}:${pad(secs)}`;
  }

  return `${minutes}:${pad(secs)}`;
}
