'use server';

import { getFaqs } from '../api/use-cases/get-faqs.use-case';
import type { FaqItem } from '../api/dto/faq.dto';

/**
 * Server action to fetch FAQs for display on pages.
 * Returns active FAQs sorted by sortOrder ASC, createdAt ASC.
 */
export async function getFaqsAction(params?: {
  page?: number;
  limit?: number;
}): Promise<{
  items: FaqItem[];
  total: number;
  success: boolean;
  error?: string;
}> {
  try {
    const result = await getFaqs({
      page: params?.page ?? 1,
      limit: params?.limit ?? 10,
    });

    return {
      items: result.items,
      total: result.total,
      success: true,
    };
  } catch (error) {
    console.error('[GET_FAQS_ACTION_ERROR]', error);
    return {
      items: [],
      total: 0,
      success: false,
      error: 'Failed to fetch FAQs',
    };
  }
}