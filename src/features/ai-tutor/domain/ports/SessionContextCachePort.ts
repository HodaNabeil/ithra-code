import type { TutorSessionContext } from '../models/TutorSessionContext';

export interface SessionContextCachePort {
  get(cacheKey: string): Promise<TutorSessionContext | null>;
  set(cacheKey: string, value: TutorSessionContext): Promise<void>;
  invalidate(cacheKey: string): Promise<void>;
}
