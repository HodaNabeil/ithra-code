import { EnrollmentStatus } from '@prisma/client';
import { describe, expect, it } from 'vitest';

import { EnrollmentEntity } from '@/features/enrollments/domain/enrollment.entity';

describe('EnrollmentEntity', () => {
  it('serializes dates to ISO strings via toObject()', () => {
    const enrolledAt = new Date('2026-02-01T10:00:00.000Z');
    const entity = EnrollmentEntity.fromPersistence({
      id: 'enr-1',
      studentId: 'student-1',
      courseId: 'course-1',
      status: EnrollmentStatus.ACTIVE,
      enrolledAt,
      completedAt: null,
      createdAt: enrolledAt,
      updatedAt: enrolledAt,
    });

    expect(entity.toObject()).toEqual({
      id: 'enr-1',
      studentId: 'student-1',
      courseId: 'course-1',
      status: 'ACTIVE',
      enrolledAt: '2026-02-01T10:00:00.000Z',
      completedAt: null,
      createdAt: '2026-02-01T10:00:00.000Z',
      updatedAt: '2026-02-01T10:00:00.000Z',
    });
  });
});
