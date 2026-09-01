import { Prisma } from '@prisma/client';

export const courseSectionsIdentitySelect =
  Prisma.validator<Prisma.CourseSelect>()({
    id: true,
    slug: true,
    instructorId: true,
    status: true,
  });

export type DB_CourseSectionsIdentity = Prisma.CourseGetPayload<{
  select: typeof courseSectionsIdentitySelect;
}>;

const lectureSelect = Prisma.validator<Prisma.LectureSelect>()({
  id: true,
  title: true,
  description: true,
  type: true,
  position: true,
  isPublished: true,
  isFree: true,
  video: {
    select: {
      id: true,
      bunnyVideoId: true,
      libraryId: true,
      status: true,
      duration: true,
      thumbnailUrl: true,
      createdAt: true,
      updatedAt: true,
    },
  },
  attachments: {
    orderBy: { position: 'asc' },
    select: {
      id: true,
      name: true,
      type: true,
      url: true,
      isDownloadable: true,
      position: true,
      createdAt: true,
      updatedAt: true,
    },
  },
});

const sectionSelect = Prisma.validator<Prisma.SectionSelect>()({
  id: true,
  courseId: true,
  title: true,
  description: true,
  position: true,
  isPublished: true,
  createdAt: true,
  updatedAt: true,
  lectures: {
    orderBy: { position: 'asc' },
    select: lectureSelect,
  },
});

export function buildCourseSectionsSelect(publishedOnly: boolean) {
  const publishedFilter = publishedOnly ? { isPublished: true } : {};

  return Prisma.validator<Prisma.CourseSelect>()({
    id: true,
    sections: {
      orderBy: { position: 'asc' },
      ...(publishedOnly ? { where: publishedFilter } : {}),
      select: {
        ...sectionSelect,
        lectures: {
          orderBy: { position: 'asc' },
          ...(publishedOnly ? { where: publishedFilter } : {}),
          select: lectureSelect,
        },
      },
    },
  });
}

export type DB_CourseSectionsEntity = Prisma.CourseGetPayload<{
  select: ReturnType<typeof buildCourseSectionsSelect>;
}>;
