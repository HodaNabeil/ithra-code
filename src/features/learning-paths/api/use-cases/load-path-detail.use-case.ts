import { auth } from '@/lib/auth';
import type { PathDetailDTO } from '@/types/path/path.dto';
import type { PathViewer } from '../dto/path-catalog.dto';
import { PathDetailError } from '../errors/path.errors';
import { mapPathDetailItemToDTO } from '../mapper/to-list-dto';
import { getPathDetail } from './get-path-detail.use-case';

async function resolveViewer(): Promise<PathViewer> {
  try {
    const session = await auth();
    if (!session?.user?.id) return null;
    return { id: session.user.id, role: session.user.role };
  } catch {
    return null;
  }
}

export type LoadPathDetailResult =
  | { status: 'ok'; path: PathDetailDTO }
  | { status: 'not_found' }
  | { status: 'error'; error: unknown };

function isNextNotFoundError(error: unknown): boolean {
  return Boolean(
    error &&
    typeof error === 'object' &&
    'digest' in error &&
    String((error as { digest?: string }).digest).startsWith('NEXT_NOT_FOUND'),
  );
}

/** SSR / server-side path detail loader with RBAC visibility. */
export async function loadPathDetailBySlug(
  slug: string,
): Promise<LoadPathDetailResult> {
  try {
    const viewer = await resolveViewer();
    const result = await getPathDetail({ slug, viewer });

    return { status: 'ok', path: mapPathDetailItemToDTO(result.path) };
  } catch (error: unknown) {
    if (isNextNotFoundError(error)) {
      throw error;
    }
    if (error instanceof PathDetailError && error.status === 404) {
      return { status: 'not_found' };
    }
    return { status: 'error', error };
  }
}
