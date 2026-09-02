import type { Currency } from '@prisma/client';

/** Platform default currency for new records and fallbacks. */
export const DEFAULT_CURRENCY = 'USD' satisfies Currency;

/** Currencies accepted at checkout for new purchases. */
export const SUPPORTED_CHECKOUT_CURRENCIES: readonly Currency[] = [
  DEFAULT_CURRENCY,
];
