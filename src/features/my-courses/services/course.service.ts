import { prisma } from '@/lib/prisma';

export const getStudentCourses = async (
  userId: string,
  page: number = 1,
  limit: number = 9,
) => {
  const skip = (page - 1) * limit;

  // 1. Get total count for pagination
  const total = await prisma.enrollment.count({
    where: { studentId: userId },
  });

  // 2. Get paginated enrollments
  const enrollments = await prisma.enrollment.findMany({
    where: { studentId: userId },
    skip,
    take: limit,
    orderBy: { enrolledAt: 'desc' },
    include: {
      course: {
        include: {
          track: true,
          instructor: true,
          sections: {
            include: {
              lectures: {
                select: {
                  id: true,
                  title: true,
                  position: true,
                },
              },
            },
          },
        },
      },
      progress: true,
    },
  });

  // 3. For filters, we might need ALL unique tracks/instructors the user has
  // We can do another quick query or just get them from paginated if they are meant to be page-local (unlikely)
  // Let's get all tracks/instructors IDs for filters to keep them consistent across pages
  const allEnrollmentsForFilters = await prisma.enrollment.findMany({
    where: { studentId: userId },
    select: {
      course: {
        select: {
          track: { select: { id: true, title: true } },
          instructor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      },
    },
  });

  // حساب البيانات الإضافية لكل كورس (Progress & Tracks List)
  const coursesWithProgress = enrollments.map((enrollment) => {
    const totalLectures = enrollment.course.sections.reduce(
      (acc, section) => acc + section.lectures.length,
      0,
    );
    const completedLectures = enrollment.progress.filter(
      (p) => p.isCompleted,
    ).length;
    const progressPercentage =
      totalLectures > 0
        ? Math.round((completedLectures / totalLectures) * 100)
        : 0;

    const firstLectureId = enrollment.course.sections[0]?.lectures[0]?.id;

    // Find the last lecture based on the most recent progress record
    const lastWatchedProgress = (enrollment.progress || []).sort(
      (a, b) => b.updatedAt.getTime() - a.updatedAt.getTime(),
    )[0];

    const lastLectureId = lastWatchedProgress?.lectureId || firstLectureId;

    // Find the lecture title
    let lastLectureTitle = '';
    if (lastLectureId) {
      for (const section of enrollment.course.sections) {
        const lecture = section.lectures.find((l) => l.id === lastLectureId);
        if (lecture) {
          lastLectureTitle = lecture.title;
          break;
        }
      }
    }

    return {
      ...enrollment.course,
      price: enrollment.course.price ? Number(enrollment.course.price) : null,
      compareAtPrice: enrollment.course.compareAtPrice
        ? Number(enrollment.course.compareAtPrice)
        : null,
      progressPercentage,
      enrolledAt: enrollment.enrolledAt,
      lastActivity: enrollment.updatedAt,
      firstLectureId,
      lastLectureId,
      lastLectureTitle,
    };
  });

  const uniqueTracks = Array.from(
    new Map(
      allEnrollmentsForFilters
        .map((e) => e.course.track)
        .filter((t): t is NonNullable<typeof t> => !!t)
        .map((t) => [t.id, t]),
    ).values(),
  );

  const uniqueInstructors = Array.from(
    new Map(
      allEnrollmentsForFilters
        .map((e) => e.course.instructor)
        .filter((i): i is NonNullable<typeof i> => !!i)
        .map((i) => [i.id, i]),
    ).values(),
  ).map((user) => ({
    id: user.id,
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email,
  }));

  return {
    courses: coursesWithProgress,
    tracks: uniqueTracks,
    instructors: uniqueInstructors,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};
