'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

import { readMyCoursesSearchParams } from '@/features/my-courses/lib/my-courses-url';

export function useMyCoursesSearchParams() {
  const searchParams = useSearchParams();
  const [popstateVersion, setPopstateVersion] = useState(0);

  useEffect(() => {
    const handlePopstate = () => {
      setPopstateVersion((version) => version + 1);
    };

    window.addEventListener('popstate', handlePopstate);
    return () => window.removeEventListener('popstate', handlePopstate);
  }, []);

  return useMemo(
    () => readMyCoursesSearchParams(),
    [searchParams, popstateVersion],
  );
}
