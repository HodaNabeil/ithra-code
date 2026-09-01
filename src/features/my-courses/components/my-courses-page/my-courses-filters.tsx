'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useTransition, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const STATUS_OPTIONS = [
  { value: 'all', label: 'جميع الحالات' },
  { value: 'ACTIVE', label: 'قيد التعلم' },
  { value: 'COMPLETED', label: 'مكتملة' },
];

export function MyCoursesFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Get current filter values from URL
  const currentStatus = searchParams.get('status') || 'all';
  const searchQuery = searchParams.get('search') || undefined;

  const updateFilter = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'all') {
      params.delete(name);
    } else {
      params.set(name, value);
    }

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(url);
    });
  };

  const clearFilters = () => {
    startTransition(() => {
      router.push(pathname);
    });
  };

  const hasActiveFilters = useMemo(() => {
    return (currentStatus && currentStatus !== 'all') || searchQuery;
  }, [currentStatus, searchQuery]);

  return (
    <div className="flex items-center gap-3 w-full lg:w-auto min-w-0">
      <div className="flex-1 lg:flex-none min-w-40">
        {/* Status Filter */}
        <Select
          value={currentStatus}
          onValueChange={(v) => updateFilter('status', v)}
        >
          <SelectTrigger className="w-full h-10! lg:h-11.5! px-4 text-xs sm:text-sm flex items-center justify-between gap-2 rounded-[100px]">
            <SelectValue placeholder="الحالة">
              {STATUS_OPTIONS.find((o) => o.value === currentStatus)?.label}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-10 lg:h-11.5 px-4 rounded-[100px] border border-brand text-muted-foreground hover:text-foreground flex items-center gap-2"
          disabled={isPending}
        >
          <X size={16} />
          <span className="hidden sm:inline">مسح الكل</span>
        </Button>
      )}
    </div>
  );
}
