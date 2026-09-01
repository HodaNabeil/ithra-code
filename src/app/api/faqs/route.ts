import { NextResponse } from 'next/server';
import { apiError, apiSuccess } from '@/lib/api-response';
import { parseFaqSearchParams } from '@/features/faqs/api/lib/faq-query';
import { getFaqs } from '@/features/faqs/api/use-cases/get-faqs.use-case';

/**
 * GET /api/faqs
 *
 * Public endpoint to retrieve active FAQs.
 * No authentication required.
 *
 * Query params:
 * - page: optional, default = 1, minimum = 1
 * - limit: optional, default = 10, minimum = 1, maximum = 50
 *
 * Returns paginated list of active FAQs sorted by sortOrder ASC, createdAt ASC.
 */
export async function GET(req: Request): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(req.url);

    const query = parseFaqSearchParams({
      page: searchParams.get('page') ?? undefined,
      limit: searchParams.get('limit') ?? undefined,
    });

    const data = await getFaqs(query);

    return apiSuccess(data, 'تم جلب الأسئلة الشائعة بنجاح');
  } catch (error) {
    console.error('[FAQS_GET_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}