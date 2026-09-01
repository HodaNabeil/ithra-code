import type { EnrollmentStatus } from '@prisma/client';

export type EnrollmentRecord = {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

export type EnrollmentObject = {
  id: string;
  studentId: string;
  courseId: string;
  status: EnrollmentStatus;
  enrolledAt: string;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

function toIso(value: Date): string {
  return value.toISOString();
}

export class EnrollmentEntity {
  constructor(private readonly props: EnrollmentRecord) {}

  static fromPersistence(record: EnrollmentRecord): EnrollmentEntity {
    return new EnrollmentEntity(record);
  }

  toObject(): EnrollmentObject {
    return {
      id: this.props.id,
      studentId: this.props.studentId,
      courseId: this.props.courseId,
      status: this.props.status,
      enrolledAt: toIso(this.props.enrolledAt),
      completedAt: this.props.completedAt
        ? toIso(this.props.completedAt)
        : null,
      createdAt: toIso(this.props.createdAt),
      updatedAt: toIso(this.props.updatedAt),
    };
  }
}
