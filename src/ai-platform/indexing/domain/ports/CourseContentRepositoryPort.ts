import type { CourseStatus, LectureType, AttachmentType } from '@/generated/prisma/enums';

export type CourseForIndexingDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string | null;
  objectives: string[];
  status: CourseStatus;
  instructorId: string;
  sections: Array<{
    id: string;
    title: string;
    lectures: Array<{
      id: string;
      title: string;
      description: string | null;
      content: string | null;
      type: LectureType;
      attachments: Array<{
        id: string;
        name: string;
        description: string | null;
        content: string | null;
        type: AttachmentType;
        url: string;
        mimeType: string | null;
      }>;
      transcript: {
        id: string;
        content: string;
        source: string;
      } | null;
    }>;
  }>;
};

export interface CourseContentRepositoryPort {
  findPublishedCourseForIndexing(
    courseSlug: string,
  ): Promise<CourseForIndexingDTO | null>;
}
