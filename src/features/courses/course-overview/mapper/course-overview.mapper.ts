import { formatCourseLevel } from '@/features/courses/lib/course-formatters';
import type {
  CourseOverviewDTO,
  CourseOverviewIdentity,
  CourseOverviewRecord,
} from '../dto/course-overview.dto';

function roundToOneDecimal(value: number): number {
  return Math.round(value * 10) / 10;
}

function secondsToHours(seconds: number): number {
  if (seconds <= 0) return 0;
  return roundToOneDecimal(seconds / 3600);
}

function formatLastUpdated(updatedAt: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'long',
    year: 'numeric',
  }).format(updatedAt);
}

export function mapCourseOverviewRecordToDTO(
  record: CourseOverviewRecord,
): CourseOverviewDTO {
  return {
    totalHours: secondsToHours(record.totalVideoDurationSeconds),
    totalStudents: record.totalStudents,
    rating: roundToOneDecimal(record.averageRating ?? 0),
    ratingsCount: record.ratingsCount,
    lastUpdated: formatLastUpdated(record.updatedAt),
    lecturesCount: record.lecturesCount,
    skillLevel: formatCourseLevel(record.level),
    description: record.description,
  };
}

export function mergeIdentityAndAggregates(
  identity: CourseOverviewIdentity,
  aggregates: Pick<
    CourseOverviewRecord,
    | 'totalVideoDurationSeconds'
    | 'totalStudents'
    | 'averageRating'
    | 'ratingsCount'
    | 'lecturesCount'
  >,
): CourseOverviewRecord {
  return {
    ...identity,
    ...aggregates,
  };
}
