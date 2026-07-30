import type { KnowledgeSourceHashRepositoryPort } from '../../../domain/ports/KnowledgeSourceHashRepositoryPort';
import { computeContentHash } from './text-normalizer.service';

export type ChangeDetectionResult = {
  sourceId: string;
  contentHash: string;
  hasChanged: boolean;
};

export function detectContentChange(params: {
  sourceId: string;
  normalizedText: string;
  existingHash: string | null;
}): ChangeDetectionResult {
  const contentHash = computeContentHash(params.normalizedText);

  return {
    sourceId: params.sourceId,
    contentHash,
    hasChanged: params.existingHash !== contentHash,
  };
}

export async function loadExistingHashes(params: {
  courseId: string;
  lectureId?: string;
  hashRepository: KnowledgeSourceHashRepositoryPort;
}): Promise<Map<string, string>> {
  const records = params.lectureId
    ? await params.hashRepository.findByLectureId(params.lectureId)
    : await params.hashRepository.findByCourseId(params.courseId);

  return new Map(records.map((record) => [record.sourceId, record.contentHash]));
}

export async function persistContentHash(params: {
  sourceId: string;
  courseId: string;
  lectureId?: string;
  contentHash: string;
  hashRepository: KnowledgeSourceHashRepositoryPort;
}): Promise<void> {
  await params.hashRepository.upsert({
    sourceId: params.sourceId,
    courseId: params.courseId,
    lectureId: params.lectureId,
    contentHash: params.contentHash,
  });
}

export async function cleanupStaleHashes(params: {
  activeSourceIds: Set<string>;
  courseId: string;
  lectureId?: string;
  hashRepository: KnowledgeSourceHashRepositoryPort;
}): Promise<string[]> {
  const existing = params.lectureId
    ? await params.hashRepository.findByLectureId(params.lectureId)
    : await params.hashRepository.findByCourseId(params.courseId);

  const staleSourceIds = existing
    .map((record) => record.sourceId)
    .filter((sourceId) => !params.activeSourceIds.has(sourceId));

  if (staleSourceIds.length === 0) {
    return [];
  }

  await params.hashRepository.deleteBySourceIds(staleSourceIds);
  return staleSourceIds;
}
