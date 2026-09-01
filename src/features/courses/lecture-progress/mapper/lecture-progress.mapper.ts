import {
  prismaDateToIso,
  prismaDateToIsoNullable,
} from '@/features/courses/course-detail/mapper/shared';

import type { ProgressRecordDTO } from '../dto/lecture-progress.dto';

type ProgressEntity = {
  id: string;
  enrollmentId: string;
  lectureId: string;
  isCompleted: boolean;
  completedAt: Date | null;
  lastAccessedAt: Date;
  timeSpent: number;
  createdAt: Date;
  updatedAt: Date;
};

export function mapProgressToDTO(progress: ProgressEntity): ProgressRecordDTO {
  return {
    id: progress.id,
    enrollmentId: progress.enrollmentId,
    lectureId: progress.lectureId,
    isCompleted: progress.isCompleted,
    completedAt: prismaDateToIsoNullable(progress.completedAt),
    lastAccessedAt: prismaDateToIso(progress.lastAccessedAt),
    timeSpent: progress.timeSpent,
    createdAt: prismaDateToIso(progress.createdAt),
    updatedAt: prismaDateToIso(progress.updatedAt),
  };
}
