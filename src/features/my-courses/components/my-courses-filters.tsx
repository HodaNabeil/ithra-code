'use client';

import Select from '@/components/shared/select';
import { STUDENT_SORT_OPTIONS } from '@/constants/course';
import { PROGRESS_FILTERS } from '@/constants/my-courses';
import { PROGRESS_OPTIONS } from '@/types/course/course.types';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

const DEFAULT_SORT = 'recent_access';

export function MyCoursesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  const sortBy = searchParams.get('sort') || DEFAULT_SORT;
  const progressFilter =
    searchParams.get('progress_filter') || PROGRESS_FILTERS.ALL;

  const updateFilter = (name: string, value: string, defaultValue: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === defaultValue) {
      params.delete(name);
    } else {
      params.set(name, value);
    }

    params.delete('page');

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(url);
    });
  };

  return (
    <>
      <Select
        options={STUDENT_SORT_OPTIONS.map((opt) => opt)}
        value={sortBy}
        onValueChange={(value) => updateFilter('sort', value, DEFAULT_SORT)}
        placeholder="رتب حسب"
        className="h-10 shrink-0 rounded-[100px] lg:h-11.5"
        disabled={isPending}
      />
      <Select
        options={PROGRESS_OPTIONS.map((opt) => opt)}
        value={progressFilter}
        onValueChange={(value) =>
          updateFilter('progress_filter', value, PROGRESS_FILTERS.ALL)
        }
        placeholder="التقدم"
        className="h-10 shrink-0 rounded-[100px] lg:h-11.5"
        disabled={isPending}
      />
    </>
  );
}
