export type IndexLectureResultDTO = {
  courseId: string;
  courseSlug: string;
  lectureId: string;
  chunksIndexed: number;
  sourcesProcessed: number;
  attachmentsSkipped?: number;
  sourcesUnchanged?: number;
  errors?: number;
  indexedAt: string;
};
