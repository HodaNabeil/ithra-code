'use client';

import { Button } from '@/components/ui/button';
import { SEARCH_PARAMS_KEYS } from '@/constants/my-courses';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTransition } from 'react';

export function MyCoursesResetFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const handleReset = () => {
    const params = new URLSearchParams();
    const activeTab = searchParams.get(SEARCH_PARAMS_KEYS.TAB);

    if (activeTab) {
      params.set(SEARCH_PARAMS_KEYS.TAB, activeTab);
    }

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(url);
    });
  };

  return (
    <Button variant="default" onClick={handleReset} disabled={isPending}>
      إعادة ضبط الفلاتر
    </Button>
  );
}
