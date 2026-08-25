'use client';

import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';

const RANGE_OPTIONS = [
  { label: '7 أيام', days: 7 },
  { label: '30 يوماً', days: 30 },
  { label: '90 يوماً', days: 90 },
] as const;

type DateRangeFilterProps = {
  selectedDays: number;
};

export function DateRangeFilter({ selectedDays }: DateRangeFilterProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  return (
    <div className="flex flex-wrap gap-2.5">
      {RANGE_OPTIONS.map((option) => {
        const params = new URLSearchParams(searchParams.toString());
        params.set('days', String(option.days));
        const isActive = selectedDays === option.days;

        return (
          <Button
            key={option.days}
            asChild
            size="sm"
            variant={isActive ? 'default' : 'outline'}
          >
            <Link href={`${pathname}?${params.toString()}`}>
              {option.label}
            </Link>
          </Button>
        );
      })}
    </div>
  );
}
