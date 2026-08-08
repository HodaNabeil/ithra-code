import { auth } from '@/lib/auth';
import type { GetCoursesParams, GetCoursesResult } from '@/types/course/course.types';
import type { CatalogViewer } from '../dto/course-catalog.dto';
import { getCoursesParamsToCatalogQuery } from '../lib/catalog-query';
import { mapCatalogResultToGetCoursesResult } from '../mapper/to-list-dto';
import { getCourseCatalog } from './get-course-catalog.use-case';

async function resolveViewer(): Promise<CatalogViewer> {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    return { id: session.user.id, role: session.user.role };
  } catch {
    return null;
  }
}

/** SSR / server-side catalog loader with RBAC + optional auth signals. */
export async function getCourses(
  params: GetCoursesParams,
): Promise<GetCoursesResult> {
  const viewer = await resolveViewer();
  const result = await getCourseCatalog({
    query: getCoursesParamsToCatalogQuery(params),
    viewer,
  });

  return mapCatalogResultToGetCoursesResult(result);
}
