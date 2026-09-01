import type { FaqQuery } from '../dto/faq.dto';

export const FAQS_DEFAULT_LIMIT = 10;
export const FAQS_MAX_LIMIT = 50;

export type FaqSearchParamsInput = {
  page?: string;
  limit?: string;
};

/**
 * Parse and validate limit parameter.
 * - Minimum: 1
 * - Maximum: 50
 * - Default: 10
 */
function parseLimit(raw: string | undefined): number {
  const limit = Number(raw);
  if (!Number.isFinite(limit) || limit < 1) {
    return FAQS_DEFAULT_LIMIT;
  }
  return Math.min(Math.floor(limit), FAQS_MAX_LIMIT);
}

/**
 * Parse and validate page parameter.
 * - Minimum: 1
 * - Default: 1
 */
function parsePage(raw: string | undefined): number {
  const page = Number(raw);
  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }
  return Math.floor(page);
}

/**
 * Parse search params into validated FaqQuery.
 */
export function parseFaqSearchParams(
  input: FaqSearchParamsInput,
): FaqQuery {
  return {
    page: parsePage(input.page),
    limit: parseLimit(input.limit),
  };
}