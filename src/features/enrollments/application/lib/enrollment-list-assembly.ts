import type { EnrollmentProgressDTO } from '../dto/enrollment-list.dto';
import type { EnrollmentListQuery } from '../dto/enrollment-list.dto';
import type { EnrollmentRecord } from '../../domain/enrollment.entity';

type SortableEnrollmentRow = {
  enrollment: EnrollmentRecord;
  course: { title: string };
  progress: EnrollmentProgressDTO;
};

export function filterEnrollmentsByTitle<T extends SortableEnrollmentRow>(
  rows: T[],
  search: string | undefined,
): T[] {
  const query = search?.trim().toLowerCase();
  if (!query) {
    return rows;
  }

  return rows.filter((row) => row.course.title.toLowerCase().includes(query));
}

export function sortEnrollmentRows<T extends SortableEnrollmentRow>(
  rows: T[],
  query: Pick<EnrollmentListQuery, 'sortBy' | 'sortOrder'>,
): T[] {
  const direction = query.sortOrder === 'asc' ? 1 : -1;
  const sorted = [...rows];

  sorted.sort((left, right) => {
    if (query.sortBy === 'title') {
      return (
        left.course.title.localeCompare(right.course.title, undefined, {
          sensitivity: 'base',
        }) * direction
      );
    }

    return (
      (left.enrollment.enrolledAt.getTime() -
        right.enrollment.enrolledAt.getTime()) *
      direction
    );
  });

  return sorted;
}

export function paginateItems<T>(
  items: T[],
  page: number,
  limit: number,
): { items: T[]; totalItems: number; totalPages: number } {
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / limit);
  const start = (page - 1) * limit;

  return {
    items: items.slice(start, start + limit),
    totalItems,
    totalPages,
  };
}
