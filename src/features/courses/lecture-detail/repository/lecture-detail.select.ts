import { Prisma } from '@prisma/client';

const lectureDetailCourseSelect = Prisma.validator<Prisma.CourseSelect>()({
  id: true,
  instructorId: true,
  title: true,
  slug: true,
  description: true,
  shortDescription: true,
  thumbnailUrl: true,
  previewVideo: true,
  price: true,
  compareAtPrice: true,
  currency: true,
  level: true,
  status: true,
  visibility: true,
  isFeatured: true,
  duration: true,
  requirements: true,
  objectives: true,
  targetAudience: true,
  tags: true,
  metaTitle: true,
  metaDescription: true,
  certificateEnabled: true,
  maxStudents: true,
  pathId: true,
  createdAt: true,
  updatedAt: true,
  publishedAt: true,
});

export const lectureDetailSelect = Prisma.validator<Prisma.LectureSelect>()({
  id: true,
  sectionId: true,
  title: true,
  description: true,
  type: true,
  content: true,
  videoId: true,
  position: true,
  isPublished: true,
  isFree: true,
  createdAt: true,
  updatedAt: true,
  video: {
    select: {
      id: true,
      bunnyVideoId: true,
      libraryId: true,
      status: true,
    },
  },
  section: {
    select: {
      course: {
        select: lectureDetailCourseSelect,
      },
    },
  },
});

export type DB_LectureDetailEntity = Prisma.LectureGetPayload<{
  select: typeof lectureDetailSelect;
}>;

export type DB_LectureDetailCourseEntity = Prisma.CourseGetPayload<{
  select: typeof lectureDetailCourseSelect;
}>;
