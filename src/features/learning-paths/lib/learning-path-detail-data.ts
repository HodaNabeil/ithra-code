import { getPathsBySlug } from '@/features/learning-paths/services/path.queries';
import type { PathDetailDTO } from '@/types/path/path.dto';
import type { GetPathBySlugResult } from '@/types/path/path.types';

const PATH_NOT_FOUND_MESSAGE = 'Path not found';

function isNextNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    String((error as { digest?: string }).digest).startsWith('NEXT_NOT_FOUND'),
  );
}

function isPathNotFoundError(error: unknown): boolean {
  return error instanceof Error && error.message === PATH_NOT_FOUND_MESSAGE;
}

export type LoadPathDetailResult =
  | { status: 'ok'; path: PathDetailDTO }
  | { status: 'not_found' }
  | { status: 'error'; error: unknown };

export async function loadPathDetailBySlug(
  slug: string,
): Promise<LoadPathDetailResult> {
  try {
    const response: GetPathBySlugResult = await getPathsBySlug(slug);
    const path = response.data.path;

    if (!path) {
      return { status: 'not_found' };
    }

    return { status: 'ok', path };
  } catch (error: unknown) {
    if (isNextNotFoundError(error)) {
      throw error;
    }
    if (isPathNotFoundError(error)) {
      return { status: 'not_found' };
    }
    return { status: 'error', error };
  }
}
