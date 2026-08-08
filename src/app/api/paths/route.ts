import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import {
  getPathCatalog,
  PathCatalogError,
  parsePathCatalogSearchParams,
} from '@/features/learning-paths/api';

export async function GET(req: Request): Promise<NextResponse> {
  try {
    const session = await auth();
    const { searchParams } = new URL(req.url);

    const data = await getPathCatalog({
      query: parsePathCatalogSearchParams({
        page: searchParams.get('page') ?? undefined,
        limit: searchParams.get('limit') ?? undefined,
        search: searchParams.get('search') ?? undefined,
        sort: searchParams.get('sort') ?? undefined,
        category: searchParams.get('category') ?? undefined,
      }),
      viewer: session?.user?.id
        ? { id: session.user.id, role: session.user.role }
        : null,
    });

    return apiSuccess(data, 'Paths fetched successfully');
  } catch (error) {
    if (error instanceof PathCatalogError) {
      return apiError(error.message, error.status);
    }

    console.error('[PATH_CATALOG_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
