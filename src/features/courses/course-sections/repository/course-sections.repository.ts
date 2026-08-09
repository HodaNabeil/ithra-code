import { EnrollmentStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { isCuid } from '@/features/courses/lib/is-cuid';
import type {
  CourseSectionsEnrollment,
  CourseSectionsIdentity,
  CourseSectionsProgressRecord,
} from '../dto/course-sections.dto';
import {
  buildCourseSectionsSelect,
  courseSectionsIdentitySelect,
  type DB_CourseSectionsEntity,
  type DB_CourseSectionsIdentity,
} from './course-sections.select';

export interface CourseSectionsRepository {
  findCourseIdentity(idOrSlug: string): Promise<CourseSectionsIdentity | null>;
  findSectionsWithLectures(
    courseId: string,
    options: { publishedOnly: boolean },
  ): Promise<DB_CourseSectionsEntity | null>;
  findEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<CourseSectionsEnrollment | null>;
  findProgressByEnrollment(
    enrollmentId: string,
  ): Promise<CourseSectionsProgressRecord[]>;
}

function mapIdentity(
  entity: DB_CourseSectionsIdentity,
): CourseSectionsIdentity {
  return {
    id: entity.id,
    slug: entity.slug,
    instructorId: entity.instructorId,
    status: entity.status,
  };
}

const PROGRESS_ELIGIBLE_STATUSES: EnrollmentStatus[] = [
  EnrollmentStatus.ACTIVE,
  EnrollmentStatus.COMPLETED,
];

export class PrismaCourseSectionsRepository implements CourseSectionsRepository {
  async findCourseIdentity(
    idOrSlug: string,
  ): Promise<CourseSectionsIdentity | null> {
    const where = isCuid(idOrSlug) ? { id: idOrSlug } : { slug: idOrSlug };

    const entity = await prisma.course.findUnique({
      where,
      select: courseSectionsIdentitySelect,
    });

    return entity ? mapIdentity(entity) : null;
  }

  async findSectionsWithLectures(
    courseId: string,
    options: { publishedOnly: boolean },
  ): Promise<DB_CourseSectionsEntity | null> {
    return prisma.course.findUnique({
      where: { id: courseId },
      select: buildCourseSectionsSelect(options.publishedOnly),
    });
  }

  async findEnrollment(
    studentId: string,
    courseId: string,
  ): Promise<CourseSectionsEnrollment | null> {
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: { studentId, courseId },
      },
      select: { id: true, status: true },
    });

    if (!enrollment) return null;

    return {
      id: enrollment.id,
      status: enrollment.status,
    };
  }

  async findProgressByEnrollment(
    enrollmentId: string,
  ): Promise<CourseSectionsProgressRecord[]> {
    return prisma.progress.findMany({
      where: { enrollmentId },
      select: {
        lectureId: true,
        isCompleted: true,
        timeSpent: true,
        lastAccessedAt: true,
        completedAt: true,
      },
    });
  }
}

export function isProgressEligibleEnrollment(
  enrollment: CourseSectionsEnrollment,
): boolean {
  return PROGRESS_ELIGIBLE_STATUSES.includes(
    enrollment.status as EnrollmentStatus,
  );
}

export const courseSectionsRepository = new PrismaCourseSectionsRepository();
