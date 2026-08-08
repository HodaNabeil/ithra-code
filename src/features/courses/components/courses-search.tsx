'use client';

import { Search } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition, useEffect, useState } from 'react';
import { useDebounce } from '@/hooks/use-debounce';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '@/components/ui/input-group';

export function CoursesSearch() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();
  const [searchTerm, setSearchTerm] = useState(
    searchParams.get('search') || '',
  );
  const [prevSearchParam, setPrevSearchParam] = useState(
    searchParams.get('search') || '',
  );
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Sync input with URL when navigating back/forward (adjusting state during render)
  const currentSearchInUrl = searchParams.get('search') || '';
  if (currentSearchInUrl !== prevSearchParam) {
    setPrevSearchParam(currentSearchInUrl);
    setSearchTerm(currentSearchInUrl);
  }

  useEffect(() => {
    const currentSearch = searchParams.get('search') || '';

    // If the debounced term matches what's already in the URL, do nothing
    if (debouncedSearchTerm === currentSearch) {
      return;
    }

    // If the current searchTerm matches the URL, it means the state was just
    // synced from the URL (e.g. via reset button), so we shouldn't push
    // the old debounced value back to the URL.
    if (searchTerm === currentSearch) {
      return;
    }

    const params = new URLSearchParams(searchParams.toString());
    if (debouncedSearchTerm) {
      params.set('search', debouncedSearchTerm);
    } else {
      params.delete('search');
    }
    params.delete('page');

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(url);
    });
  }, [debouncedSearchTerm, searchTerm, router, searchParams, pathname]);

  return (
    <InputGroup className="flex-1 rounded-[100rem] h-10 lg:h-11.5">
      <InputGroupAddon>
        <div className={isPending ? 'opacity-50' : ''}>
          <Search size={16} />
        </div>
      </InputGroupAddon>
      <InputGroupInput
        type="search"
        placeholder="ابحث عن دورة..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />
    </InputGroup>
  );
}
