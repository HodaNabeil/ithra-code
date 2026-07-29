'use server';

import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import {
  myCourseLecturesSelect,
  type DB_MyCourseLectures,
} from '@/server/db/my-course.select';
import { mapMyCourseLecturesToDTO, mapLectureDetailsToDTO } from '@/mappers/my-course.mapper';
import { cache } from '@/lib/cache';
import { revalidateTag } from 'next/cache';

export async function getCourseSections(courseSlug: string) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    return null;
  }

  return cache(
    async () => {
      const course = (await prisma.course.findFirst({
        where: {
          slug: courseSlug,
          enrollments: {
            some: { studentId: userId },
          },
        },
        select: {
          ...myCourseLecturesSelect,
          sections: {
            ...myCourseLecturesSelect.sections,
            select: {
              ...myCourseLecturesSelect.sections.select,
              lectures: {
                ...myCourseLecturesSelect.sections.select.lectures,
                select: {
                  ...myCourseLecturesSelect.sections.select.lectures.select,
                  progress: {
                    where: {
                      enrollment: {
                        studentId: userId,
                      },
                    },
                    select: {
                      isCompleted: true,
                    },
                  },
                },
              },
            },
          },
        },
      })) as DB_MyCourseLectures | null;

      if (!course) return null;

      return mapMyCourseLecturesToDTO(course);
    },
    ['course-lectures', courseSlug, userId],
    {
      tags: ['my-courses', `course-lectures-${courseSlug}`, `user-${userId}`],
      revalidate: 3600,
    },
  )();
}

// جلب بيانات المحاضرة الحالية (الفيديو والوصف)
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

export async function toggleLectureCompletion(
  lectureId: string,
  isCompleted: boolean,
) {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('يجب تسجيل الدخول لتحديث التقدم');
  }

  // Get lecture and course context
  const lecture = await prisma.lecture.findUnique({
    where: { id: lectureId },
    include: {
      section: {
        select: { courseId: true },
      },
    },
  });

  if (!lecture) throw new Error('المحاضرة غير موجودة');

  // Find the enrollment
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      studentId_courseId: {
        studentId: userId,
        courseId: lecture.section.courseId,
      },
    },
  });

  if (!enrollment) {
    throw new Error('أنت غير مسجل في هذا الكورس');
  }

  // إنشاء أو تحديث التقدم
  await prisma.progress.upsert({
    where: {
      enrollmentId_lectureId: {
        enrollmentId: enrollment.id,
        lectureId: lecture.id,
      },
    },
    update: {
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
    create: {
      lectureId: lecture.id,
      enrollmentId: enrollment.id,
      isCompleted,
      completedAt: isCompleted ? new Date() : null,
    },
  });

  // Revalidate cache
  revalidateTag(`user-${userId}`, 'max');
  revalidateTag('my-courses', 'max');

  return { success: true };
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

export async function getStudentCourses() {
  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    throw new Error('Unauthorized');
  }

  return cache(
    async () => {
      try {
        const studentCourses = await prisma.enrollment.findMany({
          where: {
            studentId: userId,
          },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                slug: true,
                thumbnailUrl: true,
                instructor: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
                sections: {
                  select: {
                    lectures: {
                      select: {
                        id: true,
                        progress: {
                          where: {
                            enrollment: {
                              studentId: userId,
                            },
                          },
                          select: {
                            isCompleted: true,
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        });

        return studentCourses.map((enrollment) => {
          const allLectures = enrollment.course.sections.flatMap(
            (s) => s.lectures,
          );
          const totalLectures = allLectures.length;
          const completedLectures = allLectures.filter(
            (l) => l.progress?.[0]?.isCompleted,
          ).length;
          const progress =
            totalLectures > 0
              ? Math.round((completedLectures / totalLectures) * 100)
              : 0;

          return {
            id: enrollment.course.id,
            title: enrollment.course.title,
            slug: enrollment.course.slug,
            thumbnail: enrollment.course.thumbnailUrl,
            instructor: enrollment.course.instructor.firstName,
            progress,
            totalLectures,
            completedLectures,
          };
        });
      } catch (error) {
        console.error(error);
        throw new Error('Failed to fetch courses');
      }
    },
    ['student-courses', userId],
    {
      tags: ['my-courses', `user-${userId}`],
      revalidate: 3600,
    },
  )();
}
