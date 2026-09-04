import { randomUUID } from 'node:crypto';

import {
  CourseLevel,
  CourseStatus,
  CourseVisibility,
  Currency,
  EnrollmentStatus,
  LectureType,
  PathCategory,
  Role,
} from '@prisma/client';

import { prisma } from '@/lib/prisma';

export type CourseProgressTestFixture = {
  suffix: string;
  instructorId: string;
  studentAId: string;
  studentBId: string;
  studentEmptyId: string;
  pathId: string;
  courseId: string;
  courseSlug: string;
  foreignCourseId: string;
  enrollmentAId: string;
  enrollmentBId: string;
  enrollmentEmptyId: string;
  foreignEnrollmentId: string;
  publishedSectionId: string;
  unpublishedSectionId: string;
  publishedLectureId: string;
  unpublishedLectureId: string;
  publishedInUnpublishedSectionId: string;
  unpublishedInUnpublishedSectionId: string;
  foreignLectureId: string;
  /** ISO timestamps seeded on progress rows for lastAccessedAt assertions */
  accessTimes: {
    studentAPublished: string;
    studentAUnpublishedSection: string;
    studentB: string;
    foreign: string;
  };
};

async function createTestPath(suffix: string) {
  return prisma.path.create({
    data: {
      title: `Progress Path ${suffix}`,
      slug: `progress-path-${suffix}`,
      description: 'Course progress integration test path',
      thumbnailUrl: 'https://example.com/path-thumb.jpg',
      category: PathCategory.WEB,
    },
  });
}

function buildCourseData(params: {
  instructorId: string;
  pathId: string;
  title: string;
  slug: string;
}) {
  return {
    instructorId: params.instructorId,
    pathId: params.pathId,
    title: params.title,
    description: 'Course progress integration test course',
    slug: params.slug,
    thumbnailUrl: 'https://example.com/thumb.jpg',
    price: 0,
    currency: Currency.USD,
    level: CourseLevel.BEGINNER,
    status: CourseStatus.PUBLISHED,
    visibility: CourseVisibility.PUBLIC,
    objectives: [],
    requirements: [],
    targetAudience: [],
    tags: [],
  };
}

export async function createCourseProgressTestFixture(): Promise<CourseProgressTestFixture> {
  const suffix = randomUUID().slice(0, 8);

  const instructor = await prisma.user.create({
    data: {
      email: `progress-instructor-${suffix}@test.local`,
      role: Role.INSTRUCTOR,
      name: 'Progress Instructor',
    },
  });

  const studentA = await prisma.user.create({
    data: {
      email: `progress-student-a-${suffix}@test.local`,
      role: Role.STUDENT,
      name: 'Student A',
      firstName: 'Student',
    },
  });

  const studentB = await prisma.user.create({
    data: {
      email: `progress-student-b-${suffix}@test.local`,
      role: Role.STUDENT,
      name: 'Student B',
      firstName: 'Student',
    },
  });

  const studentEmpty = await prisma.user.create({
    data: {
      email: `progress-student-empty-${suffix}@test.local`,
      role: Role.STUDENT,
      name: 'Student Empty',
      firstName: 'Student',
    },
  });

  const path = await createTestPath(suffix);

  const course = await prisma.course.create({
    data: buildCourseData({
      instructorId: instructor.id,
      pathId: path.id,
      title: `Progress Course ${suffix}`,
      slug: `progress-course-${suffix}`,
    }),
  });

  const foreignCourse = await prisma.course.create({
    data: buildCourseData({
      instructorId: instructor.id,
      pathId: path.id,
      title: `Foreign Progress Course ${suffix}`,
      slug: `foreign-progress-course-${suffix}`,
    }),
  });

  const publishedSection = await prisma.section.create({
    data: {
      courseId: course.id,
      title: 'Published Section',
      position: 1,
      isPublished: true,
    },
  });

  const unpublishedSection = await prisma.section.create({
    data: {
      courseId: course.id,
      title: 'Unpublished Section',
      position: 2,
      isPublished: false,
    },
  });

  const foreignSection = await prisma.section.create({
    data: {
      courseId: foreignCourse.id,
      title: 'Foreign Section',
      position: 1,
      isPublished: true,
    },
  });

  const publishedLecture = await prisma.lecture.create({
    data: {
      sectionId: publishedSection.id,
      title: 'Published Lecture',
      type: LectureType.VIDEO,
      position: 1,
      isPublished: true,
    },
  });

  const unpublishedLecture = await prisma.lecture.create({
    data: {
      sectionId: publishedSection.id,
      title: 'Unpublished Lecture',
      type: LectureType.VIDEO,
      position: 2,
      isPublished: false,
    },
  });

  const publishedInUnpublishedSection = await prisma.lecture.create({
    data: {
      sectionId: unpublishedSection.id,
      title: 'Published Lecture In Unpublished Section',
      type: LectureType.VIDEO,
      position: 1,
      isPublished: true,
    },
  });

  const unpublishedInUnpublishedSection = await prisma.lecture.create({
    data: {
      sectionId: unpublishedSection.id,
      title: 'Unpublished Lecture In Unpublished Section',
      type: LectureType.VIDEO,
      position: 2,
      isPublished: false,
    },
  });

  const foreignLecture = await prisma.lecture.create({
    data: {
      sectionId: foreignSection.id,
      title: 'Foreign Lecture',
      type: LectureType.VIDEO,
      position: 1,
      isPublished: true,
    },
  });

  const enrollmentA = await prisma.enrollment.create({
    data: {
      studentId: studentA.id,
      courseId: course.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  const enrollmentB = await prisma.enrollment.create({
    data: {
      studentId: studentB.id,
      courseId: course.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  const enrollmentEmpty = await prisma.enrollment.create({
    data: {
      studentId: studentEmpty.id,
      courseId: course.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  const foreignEnrollment = await prisma.enrollment.create({
    data: {
      studentId: studentA.id,
      courseId: foreignCourse.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  const accessTimes = {
    studentAPublished: '2026-01-10T10:00:00.000Z',
    studentAUnpublishedSection: '2026-01-15T12:00:00.000Z',
    studentB: '2026-01-20T08:00:00.000Z',
    foreign: '2026-01-25T16:00:00.000Z',
  };

  await prisma.progress.createMany({
    data: [
      {
        enrollmentId: enrollmentA.id,
        lectureId: publishedLecture.id,
        isCompleted: true,
        timeSpent: 100,
        lastAccessedAt: new Date(accessTimes.studentAPublished),
        completedAt: new Date(accessTimes.studentAPublished),
      },
      {
        enrollmentId: enrollmentA.id,
        lectureId: unpublishedLecture.id,
        isCompleted: true,
        timeSpent: 999,
        lastAccessedAt: new Date('2026-01-11T10:00:00.000Z'),
        completedAt: new Date('2026-01-11T10:00:00.000Z'),
      },
      {
        enrollmentId: enrollmentA.id,
        lectureId: publishedInUnpublishedSection.id,
        isCompleted: false,
        timeSpent: 200,
        lastAccessedAt: new Date(accessTimes.studentAUnpublishedSection),
      },
      {
        enrollmentId: enrollmentA.id,
        lectureId: unpublishedInUnpublishedSection.id,
        isCompleted: true,
        timeSpent: 888,
        lastAccessedAt: new Date('2026-01-12T10:00:00.000Z'),
        completedAt: new Date('2026-01-12T10:00:00.000Z'),
      },
      {
        enrollmentId: enrollmentB.id,
        lectureId: publishedLecture.id,
        isCompleted: true,
        timeSpent: 50,
        lastAccessedAt: new Date(accessTimes.studentB),
        completedAt: new Date(accessTimes.studentB),
      },
      {
        enrollmentId: foreignEnrollment.id,
        lectureId: foreignLecture.id,
        isCompleted: true,
        timeSpent: 5000,
        lastAccessedAt: new Date(accessTimes.foreign),
        completedAt: new Date(accessTimes.foreign),
      },
    ],
  });

  return {
    suffix,
    instructorId: instructor.id,
    studentAId: studentA.id,
    studentBId: studentB.id,
    studentEmptyId: studentEmpty.id,
    pathId: path.id,
    courseId: course.id,
    courseSlug: course.slug,
    foreignCourseId: foreignCourse.id,
    enrollmentAId: enrollmentA.id,
    enrollmentBId: enrollmentB.id,
    enrollmentEmptyId: enrollmentEmpty.id,
    foreignEnrollmentId: foreignEnrollment.id,
    publishedSectionId: publishedSection.id,
    unpublishedSectionId: unpublishedSection.id,
    publishedLectureId: publishedLecture.id,
    unpublishedLectureId: unpublishedLecture.id,
    publishedInUnpublishedSectionId: publishedInUnpublishedSection.id,
    unpublishedInUnpublishedSectionId: unpublishedInUnpublishedSection.id,
    foreignLectureId: foreignLecture.id,
    accessTimes,
  };
}

export async function cleanupCourseProgressTestFixture(
  fixture: CourseProgressTestFixture | undefined,
): Promise<void> {
  if (!fixture) {
    return;
  }

  const studentIds = [
    fixture.studentAId,
    fixture.studentBId,
    fixture.studentEmptyId,
  ];

  await prisma.progress.deleteMany({
    where: {
      enrollment: {
        studentId: { in: studentIds },
      },
    },
  });

  await prisma.enrollment.deleteMany({
    where: {
      studentId: { in: studentIds },
    },
  });

  await prisma.lecture.deleteMany({
    where: {
      section: {
        course: {
          instructorId: fixture.instructorId,
        },
      },
    },
  });

  await prisma.section.deleteMany({
    where: {
      course: {
        instructorId: fixture.instructorId,
      },
    },
  });

  await prisma.course.deleteMany({
    where: { instructorId: fixture.instructorId },
  });

  await prisma.path.deleteMany({
    where: { id: fixture.pathId },
  });

  await prisma.user.deleteMany({
    where: {
      id: { in: [fixture.instructorId, ...studentIds] },
    },
  });
}

/**
 * Number of progress-eligible lectures under the section + lecture publication rule.
 *
 * Fixture layout:
 *   Published Section
 *     A1 — published lecture        → ELIGIBLE (section ✓, lecture ✓)
 *     A2 — unpublished lecture      → excluded  (lecture ✗)
 *   Unpublished Section
 *     B1 — published lecture        → excluded  (section ✗)
 *     B2 — unpublished lecture      → excluded  (section ✗, lecture ✗)
 *
 * Result: 1 eligible lecture.
 */
export function expectedPublishedLectureCount(): number {
  return 1;
}
