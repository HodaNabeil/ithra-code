import {
  CourseStatus,
  CourseVisibility,
  EnrollmentStatus,
  Prisma,
} from '@prisma/client';

import { isCuid } from '@/features/courses/lib/is-cuid';
import { prisma } from '@/lib/prisma';

import type { EnrollInFreeCourseOutputDTO } from '../../application/dto/enroll-free-course.dto';
import { EnrollmentError } from '../../application/errors/enrollment.errors';
import type { FreeEnrollmentRepository } from '../../application/ports/free-enrollment.repository';
import {
  assertCourseEligibleForFreeEnrollment,
  assertCourseHasCapacity,
  assertEnrollmentEligibleForFreeEnrollment,
  willIncreaseActiveEnrollmentCount,
  type CourseForFreeEnrollment,
} from '../../domain/policies/free-course-enrollment.policy';

type LockedCourseRow = {
  id: string;
  slug: string;
  price: Prisma.Decimal;
  status: CourseStatus;
  visibility: CourseVisibility;
  maxStudents: number | null;
};

function toCourseForFreeEnrollment(row: LockedCourseRow): CourseForFreeEnrollment {
  return {
    id: row.id,
    slug: row.slug,
    price: Number(row.price),
    status: row.status,
    visibility: row.visibility,
    maxStudents: row.maxStudents,
  };
}

async function lockCourseRow(
  tx: Prisma.TransactionClient,
  courseIdOrSlug: string,
): Promise<LockedCourseRow | null> {
  if (isCuid(courseIdOrSlug)) {
    const rows = await tx.$queryRaw<LockedCourseRow[]>`
      SELECT
        id,
        slug,
        price,
        status,
        visibility,
        max_students AS "maxStudents"
      FROM courses
      WHERE id = ${courseIdOrSlug}
      FOR UPDATE
    `;
    return rows[0] ?? null;
  }

  const rows = await tx.$queryRaw<LockedCourseRow[]>`
    SELECT
      id,
      slug,
      price,
      status,
      visibility,
      max_students AS "maxStudents"
    FROM courses
    WHERE slug = ${courseIdOrSlug}
    FOR UPDATE
  `;
  return rows[0] ?? null;
}

async function resolveFirstLectureId(
  tx: Prisma.TransactionClient,
  courseId: string,
): Promise<string | null> {
  const lecture = await tx.lecture.findFirst({
    where: {
      section: { courseId },
      isPublished: true,
    },
    orderBy: [{ section: { position: 'asc' } }, { position: 'asc' }],
    select: { id: true },
  });

  return lecture?.id ?? null;
}

async function writeFreeEnrollment(
  tx: Prisma.TransactionClient,
  studentId: string,
  courseId: string,
  existingStatus: EnrollmentStatus | null,
): Promise<void> {
  const enrolledAt = new Date();

  if (existingStatus === EnrollmentStatus.DROPPED) {
    await tx.enrollment.update({
      where: {
        studentId_courseId: { studentId, courseId },
      },
      data: {
        status: EnrollmentStatus.ACTIVE,
        enrolledAt,
      },
    });
    return;
  }

  try {
    await tx.enrollment.create({
      data: {
        studentId,
        courseId,
        status: EnrollmentStatus.ACTIVE,
        enrolledAt,
      },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      const raced = await tx.enrollment.findUnique({
        where: { studentId_courseId: { studentId, courseId } },
        select: { status: true },
      });
      assertEnrollmentEligibleForFreeEnrollment(raced);

      if (raced?.status === EnrollmentStatus.DROPPED) {
        await writeFreeEnrollment(tx, studentId, courseId, raced.status);
        return;
      }

      throw new EnrollmentError(
        400,
        'أنت مسجل بالفعل في هذه الدورة',
        'ALREADY_ENROLLED',
      );
    }

    throw error;
  }
}

/**
 * Atomically enrolls a student in a free course.
 * Locks the course row (FOR UPDATE) so price/status cannot change between
 * validation and the enrollment write.
 */
export class PrismaFreeEnrollmentRepository implements FreeEnrollmentRepository {
  async enrollInFreeCourse(
    studentId: string,
    courseIdOrSlug: string,
  ): Promise<EnrollInFreeCourseOutputDTO> {
    return prisma.$transaction(async (tx) => {
      const lockedCourse = await lockCourseRow(tx, courseIdOrSlug);

      if (!lockedCourse) {
        throw new EnrollmentError(
          404,
          'هذه الدورة غير موجودة',
          'COURSE_NOT_FOUND',
        );
      }

      const course = toCourseForFreeEnrollment(lockedCourse);
      assertCourseEligibleForFreeEnrollment(course);

      const existingEnrollment = await tx.enrollment.findUnique({
        where: {
          studentId_courseId: {
            studentId,
            courseId: course.id,
          },
        },
        select: { status: true },
      });

      assertEnrollmentEligibleForFreeEnrollment(existingEnrollment);

      const willIncreaseActive = willIncreaseActiveEnrollmentCount(
        existingEnrollment,
      );

      if (willIncreaseActive && course.maxStudents != null) {
        const activeEnrollmentCount = await tx.enrollment.count({
          where: {
            courseId: course.id,
            status: EnrollmentStatus.ACTIVE,
          },
        });

        assertCourseHasCapacity(
          course.maxStudents,
          activeEnrollmentCount,
          willIncreaseActive,
        );
      }

      await writeFreeEnrollment(
        tx,
        studentId,
        course.id,
        existingEnrollment?.status ?? null,
      );

      const firstLectureId = await resolveFirstLectureId(tx, course.id);

      return {
        courseId: course.id,
        slug: course.slug,
        firstLectureId,
      };
    });
  }
}

export const prismaFreeEnrollmentRepository =
  new PrismaFreeEnrollmentRepository();
