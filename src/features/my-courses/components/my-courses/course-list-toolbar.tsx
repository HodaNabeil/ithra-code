'use client';

import Select from '@/components/shared/select';
import { CoursesSearch } from '@/features/courses/components/courses-search';
import { STUDENT_SORT_OPTIONS } from '@/constants/course';
import { PROGRESS_FILTERS } from '@/constants/my-courses';
import {
  readMyCoursesSearchParams,
  replaceMyCoursesUrl,
} from '@/features/my-courses/lib/my-courses-url';
import { useMyCoursesSearchParams } from '@/features/my-courses/hooks/use-my-courses-search-params';
import { PROGRESS_OPTIONS } from '@/types/course/course.types';

const DEFAULT_SORT = 'recent_access';

export function CourseListToolbar() {
  const searchParams = useMyCoursesSearchParams();

  const sortBy = searchParams.get('sort') || DEFAULT_SORT;
  const progressFilter =
    searchParams.get('progress_filter') || PROGRESS_FILTERS.ALL;

  const updateFilter = (name: string, value: string, defaultValue: string) => {
    const params = readMyCoursesSearchParams();

    if (value === defaultValue) {
      params.delete(name);
    } else {
      params.set(name, value);
    }

    params.delete('page');
    replaceMyCoursesUrl(params);
  };

  return (
    <div className="flex flex-wrap items-center gap-3">
      <CoursesSearch urlMode="replace" />
      <Select
        options={STUDENT_SORT_OPTIONS.map((opt) => opt)}
        value={sortBy}
        onValueChange={(value) => updateFilter('sort', value, DEFAULT_SORT)}
        placeholder="رتب حسب"
        className="h-10 shrink-0 rounded-[100px] lg:h-11.5"
      />
      <Select
        options={PROGRESS_OPTIONS.map((opt) => opt)}
        value={progressFilter}
        onValueChange={(value) =>
          updateFilter('progress_filter', value, PROGRESS_FILTERS.ALL)
        }
        placeholder="التقدم"
        className="h-10 shrink-0 rounded-[100px] lg:h-11.5"
      />
    </div>
  );
}
