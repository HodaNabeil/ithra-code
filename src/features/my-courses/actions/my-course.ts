'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { mapLectureDetailsToDTO } from '@/features/my-courses/lib/my-course.mapper';
import { cache } from '@/lib/cache';

export async function getLectureDetails(lectureId: string, courseSlug: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return cache(
    async () => {
      const lecture = await prisma.lecture.findFirst({
        where: {
          id: lectureId,
          section: {
            course: {
              slug: courseSlug,
              enrollments: {
                some: { studentId: userId },
              },
            },
          },
        },
        select: {
          id: true,
          title: true,
          description: true,
          updatedAt: true,
          section: {
            select: {
              course: {
                select: {
                  slug: true,
                  sections: {
                    orderBy: { position: 'asc' },
                    select: {
                      lectures: {
                        orderBy: { position: 'asc' },
                        select: { id: true },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!lecture) return null;

      return mapLectureDetailsToDTO(lecture, lectureId);
    },
    ['lecture-details', lectureId, courseSlug, userId],
    {
      tags: [`lecture-${lectureId}`, `user-${userId}`],
      revalidate: 3600,
    },
  )();
}

export async function getLectureNavigation(
  lectureId: string,
  courseSlug: string,
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return cache(
    async () => {
      const lecture = await prisma.lecture.findFirst({
        where: {
          id: lectureId,
          section: {
            course: {
              slug: courseSlug,
              enrollments: {
                some: { studentId: userId },
              },
            },
          },
        },
        include: {
          section: {
            include: {
              course: {
                include: {
                  sections: {
                    orderBy: { position: 'asc' },
                    include: {
                      lectures: { orderBy: { position: 'asc' } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!lecture) return null;

      const allLectures = lecture.section.course.sections.flatMap(
        (section) => section.lectures,
      );

      const currentIndex = allLectures.findIndex((l) => l.id === lectureId);

      return {
        prevLectureId: allLectures[currentIndex - 1]?.id || null,
        prevLectureTitle: allLectures[currentIndex - 1]?.title || null,
        prevLecturePosition: allLectures[currentIndex - 1]?.position || null,
        nextLectureId: allLectures[currentIndex + 1]?.id || null,
        nextLectureTitle: allLectures[currentIndex + 1]?.title || null,
        nextLecturePosition: allLectures[currentIndex + 1]?.position || null,
        courseSlug: lecture.section.course.slug,
      };
    },
    ['lecture-navigation', lectureId, courseSlug, userId],
    {
      tags: [`lecture-${lectureId}`, `user-${userId}`],
      revalidate: 3600,
    },
  )();
}
