'use client';

import { Button } from '@/components/ui/button';
import { SEARCH_PARAMS_KEYS } from '@/constants/my-courses';
import {
  readMyCoursesSearchParams,
  replaceMyCoursesUrl,
} from '@/features/my-courses/lib/my-courses-url';

export function StudentCoursesResetFilters() {
  const handleReset = () => {
    const params = readMyCoursesSearchParams();
    const activeTab = params.get(SEARCH_PARAMS_KEYS.TAB);

    params.forEach((_, key) => {
      params.delete(key);
    });

    if (activeTab) {
      params.set(SEARCH_PARAMS_KEYS.TAB, activeTab);
    }

    replaceMyCoursesUrl(params);
  };

  return (
    <Button variant="default" onClick={handleReset}>
      إعادة ضبط الفلاتر
    </Button>
  );
}
