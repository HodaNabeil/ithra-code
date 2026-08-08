import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { apiError, apiSuccess } from '@/lib/api-response';
import {
  getPathDetail,
  PathDetailError,
} from '@/features/learning-paths/api';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
): Promise<NextResponse> {
  const { slug } = await params;

  try {
    const session = await auth();
    const data = await getPathDetail({
      slug,
      viewer: session?.user?.id
        ? { id: session.user.id, role: session.user.role }
        : null,
    });

    return apiSuccess(data, 'Path fetched successfully');
  } catch (error) {
    if (error instanceof PathDetailError) {
      return apiError(error.message, error.status);
    }

    console.error('[PATH_DETAIL_ERROR]', error);
    return apiError('Internal Error', 500);
  }
}
