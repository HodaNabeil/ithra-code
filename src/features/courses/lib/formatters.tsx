import { getCourseLevelsOptions } from '@/features/courses/lib/course-formatters';

export type Locale = 'ar' | 'en';

const DATE_FORMATS = {
  ar: {
    timeAgo: {
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
    },
  },
  en: {
    timeAgo: {
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
    },
  },
} as const;

const DURATION_UNITS = {
  ar: {
    hour: { short: 'س', long: 'ساعة' },
    minute: { short: 'د', long: 'دقيقة' },
  },
  en: {
    hour: { short: 'h', long: 'hour' },
    minute: { short: 'min', long: 'minute' },
  },
} as const;

export function formatDuration(
  minutes: number,
  locale: Locale = 'ar',
  verbose = false,
): string {
  // Input validation
  if (!Number.isFinite(minutes) || minutes < 0) {
    console.warn(`Invalid duration: ${minutes}. Defaulting to 0.`);
    return locale === 'ar' ? '0د' : '0min';
  }

  const roundedMinutes = Math.round(minutes);
  const hours = Math.floor(roundedMinutes / 60);
  const remainingMinutes = roundedMinutes % 60;

  const units = DURATION_UNITS[locale];
  const separator = verbose ? ' ' : '';

  // Format helper
  const format = (value: number, unit: 'hour' | 'minute') => {
    const unitText = verbose ? units[unit].long : units[unit].short;
    return verbose ? `${value} ${unitText}` : `${value}${unitText}`;
  };

  // Less than 60 minutes
  if (hours === 0) return format(roundedMinutes, 'minute');

  // Only hours (no remaining minutes)
  if (remainingMinutes === 0) return format(hours, 'hour');

  // Hours and minutes
  return `${format(hours, 'hour')}${separator}${format(remainingMinutes, 'minute')}`;
}

/** Formats a duration in seconds as hours/minutes (snaps float noise at the second boundary). */
export function formatDurationFromSeconds(
  seconds: number,
  locale: Locale = 'ar',
  verbose = false,
): string {
  if (!Number.isFinite(seconds) || seconds <= 0) {
    return formatDuration(0, locale, verbose);
  }

  const totalSeconds = Math.round(seconds);
  const totalMinutes = Math.round(totalSeconds / 60);

  return formatDuration(totalMinutes, locale, verbose);
}

/**
 * Formats API course `totalHours` for display.
 * Snaps floating-point noise at the second boundary, then renders hours/minutes.
 */
export function formatTotalHours(
  hours: number,
  locale: Locale = 'ar',
  verbose = true,
): string {
  if (!Number.isFinite(hours) || hours <= 0) {
    return formatDuration(0, locale, verbose);
  }

  return formatDurationFromSeconds(Math.round(hours * 3600), locale, verbose);
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

export function formatTimestamp(
  date: string | null,
  locale: Locale = 'ar',
): string {
  try {
    const now = new Date();
    const targetDate = new Date(date ?? '');

    // Validate date
    if (isNaN(targetDate.getTime())) {
      console.warn(`Invalid date: ${date}`);
      return locale === 'ar' ? 'تاريخ غير صالح' : 'Invalid date';
    }

    const diffMs = now.getTime() - targetDate.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);
    const diffWeeks = Math.floor(diffDays / 7);
    const diffMonths = Math.floor(diffDays / 30);
    const diffYears = Math.floor(diffDays / 365);

    const formats = DATE_FORMATS[locale].timeAgo;

    // Handle future dates
    if (diffMs < 0) {
      return locale === 'ar' ? 'في المستقبل' : 'in the future';
    }

    // Less than a minute
    if (diffMinutes < 1) {
      return formats.now;
    }

    // Minutes
    if (diffMinutes < 60) {
      if (diffMinutes === 1) {
        return locale === 'ar'
          ? `${formats.ago} ${formats.minute}`
          : `${formats.minute} ${formats.ago}`;
      }
      return locale === 'ar'
        ? `${formats.ago} ${diffMinutes} ${formats.minutes}`
        : `${diffMinutes} ${formats.minutes} ${formats.ago}`;
    }

    // Hours
    if (diffHours < 24) {
      if (diffHours === 1) {
        return locale === 'ar'
          ? `${formats.ago} ${formats.hour}`
          : `${formats.hour} ${formats.ago}`;
      }
      return locale === 'ar'
        ? `${formats.ago} ${diffHours} ${formats.hours}`
        : `${diffHours} ${formats.hours} ${formats.ago}`;
    }

    // Days
    if (diffDays < 7) {
      if (diffDays === 1) {
        return locale === 'ar'
          ? `${formats.ago} ${formats.day}`
          : `${formats.day} ${formats.ago}`;
      }
      return locale === 'ar'
        ? `${formats.ago} ${diffDays} ${formats.days}`
        : `${diffDays} ${formats.days} ${formats.ago}`;
    }

    // Weeks
    if (diffWeeks < 4) {
      if (diffWeeks === 1) {
        return locale === 'ar'
          ? `${formats.ago} ${formats.week}`
          : `${formats.week} ${formats.ago}`;
      }
      return locale === 'ar'
        ? `${formats.ago} ${diffWeeks} ${formats.weeks}`
        : `${diffWeeks} ${formats.weeks} ${formats.ago}`;
    }

    // Months
    if (diffMonths < 12) {
      if (diffMonths === 1) {
        return locale === 'ar'
          ? `${formats.ago} ${formats.month}`
          : `${formats.month} ${formats.ago}`;
      }
      return locale === 'ar'
        ? `${formats.ago} ${diffMonths} ${formats.months}`
        : `${diffMonths} ${formats.months} ${formats.ago}`;
    }

    // Years
    if (diffYears === 1) {
      return locale === 'ar'
        ? `${formats.ago} ${formats.year}`
        : `${formats.year} ${formats.ago}`;
    }
    return locale === 'ar'
      ? `${formats.ago} ${diffYears} ${formats.years}`
      : `${diffYears} ${formats.years} ${formats.ago}`;
  } catch (error) {
    console.error('Error formatting date:', error);
    return locale === 'ar' ? 'خطأ في التاريخ' : 'Date error';
  }
}

export function formatCurrencySymbol(currency: string): string {
  const currencyMap: Record<string, string> = {
    USD: '$',
    EGP: 'ج.م',
  };

  return currencyMap[currency.toUpperCase()] || currency;
}

export function formatPrice(price: number, currency: string): string {
  const symbol = formatCurrencySymbol(currency);
  const formattedNumber = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(price);

  // For Arabic, put symbol after number; for English, before
  return `${formattedNumber} ${symbol}`;
}

export function formatCourseLevel(level: string): string {
  const options = getCourseLevelsOptions();
  const option = options.find(
    (opt) => opt.value.toLowerCase() === level.toLowerCase(),
  );

  return option?.label || level;
}

export function formatCompactNumber(
  count: number,
  locale: Locale = 'ar',
): string {
  if (!Number.isFinite(count) || count < 0) return '0';

  if (locale === 'ar') {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)} مليون`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(0)} ألف`;
    return count.toString();
  }

  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(0)}K`;
  return count.toString();
}
