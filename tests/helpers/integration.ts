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
import type { TutorSessionContext } from '@/features/ai-tutor/domain/models/TutorSessionContext';
import type { SessionContextCachePort } from '@/features/ai-tutor/domain/ports/SessionContextCachePort';

export const isIntegrationEnabled = process.env.VITEST_INTEGRATION === 'true';

let integrationDatabaseReady: boolean | undefined;

export async function canRunIntegrationTests(): Promise<boolean> {
  if (!isIntegrationEnabled) {
    return false;
  }

  if (integrationDatabaseReady !== undefined) {
    return integrationDatabaseReady;
  }

  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$queryRaw`SELECT 1`;
    integrationDatabaseReady = true;
  } catch {
    integrationDatabaseReady = false;
  }

  return integrationDatabaseReady;
}

export class InMemorySessionContextCache implements SessionContextCachePort {
  private readonly store = new Map<string, TutorSessionContext>();

  async get(cacheKey: string): Promise<TutorSessionContext | null> {
    return this.store.get(cacheKey) ?? null;
  }

  async set(cacheKey: string, value: TutorSessionContext): Promise<void> {
    this.store.set(cacheKey, value);
  }

  async invalidate(cacheKey: string): Promise<void> {
    this.store.delete(cacheKey);
  }
}

export type TutorTestFixture = {
  suffix: string;
  instructorId: string;
  studentId: string;
  pathId: string;
  courseId: string;
  courseSlug: string;
  sectionId: string;
  lectureId: string;
  foreignLectureId: string;
};

async function createTestPath(suffix: string) {
  return prisma.path.create({
    data: {
      title: `Test Path ${suffix}`,
      slug: `test-path-${suffix}`,
      description: 'Integration test path',
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
  description: string;
}) {
  return {
    instructorId: params.instructorId,
    pathId: params.pathId,
    title: params.title,
    description: params.description,
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

export async function createTutorTestFixture(): Promise<TutorTestFixture> {
  const suffix = randomUUID().slice(0, 8);

  const instructor = await prisma.user.create({
    data: {
      email: `instructor-${suffix}@test.local`,
      role: Role.INSTRUCTOR,
      name: 'Instructor',
    },
  });

  const student = await prisma.user.create({
    data: {
      email: `student-${suffix}@test.local`,
      role: Role.STUDENT,
      name: 'Student',
      firstName: 'Student',
    },
  });

  const path = await createTestPath(suffix);

  const course = await prisma.course.create({
    data: buildCourseData({
      instructorId: instructor.id,
      pathId: path.id,
      title: `Test Course ${suffix}`,
      slug: `test-course-${suffix}`,
      description: 'Integration test course',
    }),
  });

  const foreignCourse = await prisma.course.create({
    data: buildCourseData({
      instructorId: instructor.id,
      pathId: path.id,
      title: `Foreign Course ${suffix}`,
      slug: `foreign-course-${suffix}`,
      description: 'Foreign course for lecture validation',
    }),
  });

  const section = await prisma.section.create({
    data: {
      courseId: course.id,
      title: 'Section 1',
      position: 1,
      isPublished: true,
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

  const lecture = await prisma.lecture.create({
    data: {
      sectionId: section.id,
      title: 'Lecture 1',
      type: LectureType.VIDEO,
      position: 1,
      isPublished: true,
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

  await prisma.enrollment.create({
    data: {
      studentId: student.id,
      courseId: course.id,
      status: EnrollmentStatus.ACTIVE,
    },
  });

  return {
    suffix,
    instructorId: instructor.id,
    studentId: student.id,
    pathId: path.id,
    courseId: course.id,
    courseSlug: course.slug,
    sectionId: section.id,
    lectureId: lecture.id,
    foreignLectureId: foreignLecture.id,
  };
}

export async function cleanupTutorTestFixture(
  fixture: TutorTestFixture | undefined,
): Promise<void> {
  if (!fixture) {
    return;
  }
  await prisma.tutorTurnIdempotency.deleteMany({
    where: { userId: fixture.studentId },
  });
  await prisma.tutorMessage.deleteMany({
    where: {
      thread: {
        conversation: {
          userId: fixture.studentId,
        },
      },
    },
  });
  await prisma.tutorThread.deleteMany({
    where: {
      conversation: {
        userId: fixture.studentId,
      },
    },
  });
  await prisma.tutorConversation.deleteMany({
    where: { userId: fixture.studentId },
  });
  await prisma.studentLearningProfile.deleteMany({
    where: { userId: fixture.studentId },
  });
  await prisma.enrollment.deleteMany({
    where: { studentId: fixture.studentId },
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
      id: { in: [fixture.studentId, fixture.instructorId] },
    },
  });
}
