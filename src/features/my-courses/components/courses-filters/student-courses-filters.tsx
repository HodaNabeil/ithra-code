'use client';

import { useMemo } from 'react';
import Select from '@/components/shared/select';
import { Button } from '@/components/ui/button';
import {
  PROGRESS_OPTIONS,
  Instructor,
  StudentFilters,
} from '@/types/course/course.types';
import MobileCoursesFilters from './mobile-courses-filters';

interface StudentCoursesFiltersProps {
  categories?: Array<{ value: string; label: string }>;
  instructors?: Instructor[];
  filters: StudentFilters;
  onFilterChange: (key: keyof StudentFilters, value: string) => void;
  onReset: () => void;
}

export default function StudentCoursesFilters({
  categories = [],
  instructors = [],
  filters,
  onFilterChange,
  onReset,
}: StudentCoursesFiltersProps) {
  const instructorOptions = useMemo(
    () => instructors.map((inst) => ({ value: inst.id, label: inst.name })),
    [instructors],
  );

  const hasActiveFilters =
    filters.category !== 'all' ||
    filters.progress !== 'all' ||
    filters.instructor !== 'all';

  return (
    <div className="flex items-center gap-3 w-full">
      <div className="hidden md:flex md:items-center gap-3">
        <Select
          options={[{ value: 'all', label: 'كل الفئات' }, ...categories]}
          value={filters.category}
          onValueChange={(val) => onFilterChange('category', val)}
          placeholder="الفئات"
          className="px-4 h-10 rounded-full border-muted-foreground/20 bg-background/50 font-medium"
        />

        <Select
          options={PROGRESS_OPTIONS}
          value={filters.progress}
          onValueChange={(val) => onFilterChange('progress', val)}
          placeholder="التقدم"
          className="px-4 h-10 rounded-full border-muted-foreground/20 bg-background/50 font-medium"
        />

        <Select
          options={[
            { value: 'all', label: 'كل المحاضرين' },
            ...instructorOptions,
          ]}
          value={filters.instructor}
          onValueChange={(val) => onFilterChange('instructor', val)}
          placeholder="المحاضر"
          className="px-4 h-10 rounded-full border-muted-foreground/20 bg-background/50 font-medium"
        />

        {hasActiveFilters && (
          <Button
            variant="outline"
            onClick={onReset}
            className="border-none text-primary font-bold hover:bg-transparent hover:text-primary"
          >
            إعادة تعيين
          </Button>
        )}
      </div>

      <div className="md:hidden w-full">
        <MobileCoursesFilters
          categories={categories}
          instructors={instructors}
          filters={filters}
          onFilterChange={onFilterChange}
          onReset={onReset}
        />
      </div>
    </div>
  );
}
