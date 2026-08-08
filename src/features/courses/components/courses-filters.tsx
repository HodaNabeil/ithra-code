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
import type { PathListDTO } from '@/types/path/path.dto';
import {
  CourseLevel,
  levelCourse,
  SORT_OPTIONS,
} from '@/types/course/course.types';
import { getCourseLevelsOptions } from '@/features/courses/lib/course-formatters';
import { CoursesFiltersSlider } from './courses-filters-slider';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

const DEFAULT_SORT_OPTION = SORT_OPTIONS[0]!;

const FILTER_TRIGGER_CLASS =
  'w-full h-10! lg:h-11.5! px-4 text-xs! sm:text-sm! flex items-center justify-between gap-2 min-w-[130px] rounded-[100px]';

// Path Filter Component
interface PathFilterProps {
  paths: PathListDTO[];
  selectedPath?: string;
  onValueChange: (value: string) => void;
}

function PathFilter({ paths, selectedPath, onValueChange }: PathFilterProps) {
  const selectedLabel =
    paths.find((p) => p.slug === selectedPath)?.title || 'جميع المسارات';

  return (
    <Select value={selectedPath || 'all'} onValueChange={onValueChange}>
      <SelectTrigger className={FILTER_TRIGGER_CLASS}>
        <SelectValue placeholder="المسار">
          {selectedPath ? selectedLabel : 'جميع المسارات'}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">جميع المسارات</SelectItem>
        {paths.map((path) => (
          <SelectItem key={path.id} value={path.slug}>
            {path.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Level Filter Component
interface LevelFilterProps {
  selectedLevel?: string;
  onValueChange: (value: string) => void;
}

function LevelFilter({ selectedLevel, onValueChange }: LevelFilterProps) {
  const levels = getCourseLevelsOptions();
  const selectedLabel =
    levels.find((l) => l.value === selectedLevel)?.label || 'المستوى';

  return (
    <Select
      value={selectedLevel || CourseLevel.ALL_LEVELS}
      onValueChange={onValueChange}
    >
      <SelectTrigger className={FILTER_TRIGGER_CLASS}>
        <SelectValue placeholder="المستوى">
          {selectedLevel ? selectedLabel : levelCourse[CourseLevel.ALL_LEVELS]}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {levels.map((level) => (
          <SelectItem key={level.value} value={level.value}>
            {level.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Sort Filter Component
interface SortFilterProps {
  selectedSort?: string;
  onValueChange: (value: string) => void;
}

function SortFilter({ selectedSort, onValueChange }: SortFilterProps) {
  const selectedLabel =
    SORT_OPTIONS.find((f) => f.value === selectedSort)?.label ||
    DEFAULT_SORT_OPTION.label;

  return (
    <Select
      value={selectedSort || DEFAULT_SORT_OPTION.value}
      onValueChange={onValueChange}
    >
      <SelectTrigger className={FILTER_TRIGGER_CLASS}>
        <SelectValue placeholder="الترتيب">
          {selectedSort ? selectedLabel : DEFAULT_SORT_OPTION.label}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {SORT_OPTIONS.map((filter) => (
          <SelectItem key={filter.value} value={filter.value}>
            {filter.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// Main Filters Component (Client-side)
export function CoursesFilters({ paths }: { paths: PathListDTO[] }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  // Get current filter values from URL
  const currentPath = searchParams.get('path') || undefined;
  const currentLevel = searchParams.get('level') || undefined;
  const currentSort = searchParams.get('sort') || undefined;
  const currentFeatured = searchParams.get('featured') || undefined;

  const updateFilter = (name: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());

    if (value === 'all' || value === CourseLevel.ALL_LEVELS) {
      params.delete(name);
    } else {
      params.set(name, value);
    }

    params.delete('page'); // Reset to page 1 (omit from URL)

    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;

    startTransition(() => {
      router.push(url);
    });
  };

  const clearFilters = () => {
    const params = new URLSearchParams();
    params.delete('page');
    const queryString = params.toString();
    const url = queryString ? `${pathname}?${queryString}` : pathname;
    startTransition(() => {
      router.push(url);
    });
  };

  const hasActiveFilters = useMemo(() => {
    return (
      currentPath ||
      (currentLevel && currentLevel !== CourseLevel.ALL_LEVELS) ||
      (currentSort && currentSort !== DEFAULT_SORT_OPTION.value) ||
      currentFeatured
    );
  }, [currentPath, currentLevel, currentSort, currentFeatured]);

  return (
    <div className="flex items-center gap-3 w-full lg:w-auto min-w-0">
      <div className="flex-1 lg:flex-none min-w-0">
        <CoursesFiltersSlider>
          <PathFilter
            paths={paths}
            selectedPath={currentPath}
            onValueChange={(v) => updateFilter('path', v)}
          />
          <LevelFilter
            selectedLevel={currentLevel}
            onValueChange={(v) => updateFilter('level', v)}
          />
          <SortFilter
            selectedSort={currentSort}
            onValueChange={(v) => updateFilter('sort', v)}
          />
        </CoursesFiltersSlider>
      </div>

      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={clearFilters}
          className="h-10 lg:h-11.5 px-4 rounded-[100px] text-muted-foreground hover:text-foreground flex items-center gap-2"
          disabled={isPending}
        >
          <X size={16} />
          <span className="hidden sm:inline">مسح الكل</span>
        </Button>
      )}
    </div>
  );
}
