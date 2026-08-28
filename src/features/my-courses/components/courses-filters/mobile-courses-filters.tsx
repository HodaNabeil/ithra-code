'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

import Select from '@/components/shared/select';
import { ListFilter } from 'lucide-react';
import {
  PROGRESS_OPTIONS,
  type Instructor,
  type StudentFilters,
} from '@/types/course/course.types';

interface MobileCoursesFiltersProps {
  categories?: Array<{ value: string; label: string }>;
  instructors?: Instructor[];
  filters: StudentFilters;
  onFilterChange: (key: keyof StudentFilters, value: string) => void;
  onReset: () => void;
}

export default function MobileCoursesFilters({
  categories = [],
  instructors = [],
  filters,
  onFilterChange,
  onReset,
}: MobileCoursesFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);

  const [tempFilters, setTempFilters] = useState<StudentFilters>(filters);

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (open) {
      setTempFilters(filters);
    }
  };

  const handleTempChange = (key: keyof StudentFilters, value: string) => {
    setTempFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleApply = () => {
    onFilterChange('category', tempFilters.category);
    onFilterChange('progress', tempFilters.progress);
    onFilterChange('instructor', tempFilters.instructor);
    setIsOpen(false);
  };
  const isDefault =
    tempFilters.category === 'all' &&
    tempFilters.progress === 'all' &&
    tempFilters.instructor === 'all';
  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className=" w-fit flex items-center justify-between px-5 h-10 rounded-xl
           border-muted-foreground/10 bg-background/50 hover:bg-muted/20 transition-all shadow-sm"
        >
          <div className="flex items-center gap-2">
            <ListFilter className="w-4 h-4 text-primary" />
            <span className="  hidden sm:flex  text-sm font-semibold">
              تصفية النتائج
            </span>
          </div>
          {Object.values(filters).filter((v) => v !== 'all').length > 0 && (
            <span
              className="bg-primary text-primary-foreground w-5 h-5 rounded-full text-[10px]
              flex items-center justify-center"
            >
              {Object.values(filters).filter((v) => v !== 'all').length}
            </span>
          )}
        </Button>
      </DialogTrigger>

      <DialogContent className="max-w-[90%] rounded-2xl border-none" dir="rtl">
        <DialogHeader className="flex flex-row items-center justify-between">
          <DialogTitle className="text-lg font-medium">
            كل عوامل التصفية
          </DialogTitle>
          <div className="w-8" />
        </DialogHeader>

        <div className="space-y-2 px-2 py-2">
          <Select
            options={[{ value: 'all', label: 'كل الفئات' }, ...categories]}
            value={tempFilters.category}
            onValueChange={(v) => handleTempChange('category', v)}
            placeholder="كل الفئات"
            className="w-full h-10 rounded-lg font-medium justify-center gap-2 text-base border-primary/20 "
          />

          <Select
            options={PROGRESS_OPTIONS}
            value={tempFilters.progress}
            onValueChange={(v) => handleTempChange('progress', v)}
            placeholder="كل الحالات"
            className="w-full h-10 rounded-lg font-medium justify-center gap-3 text-base border-primary/20 "
          />

          {instructors.length > 0 && (
            <Select
              options={[
                { value: 'all', label: 'كل المحاضرين' },
                ...instructors.map((ins) => ({
                  value: ins.id,
                  label: ins.name,
                })),
              ]}
              value={tempFilters.instructor}
              onValueChange={(v) => handleTempChange('instructor', v)}
              placeholder="كل المحاضرين"
              className="w-full h-10 rounded-lg font-medium justify-center gap-3 text-base border-primary/20 "
            />
          )}
        </div>

        <DialogFooter className="flex flex-row items-center justify-start! p-4 gap-1 border-none">
          <Button
            variant="ghost"
            onClick={() => {
              onReset();
              setIsOpen(false);
            }}
            disabled={isDefault}
            className="h-11 text-primary font-bold hover:bg-transparent hover:text-primary/80 disabled:opacity-30"
          >
            مسح عوامل التصفية
          </Button>
          <Button
            onClick={handleApply}
            className="h-11 rounded-lg font-bold   "
          >
            تطبيق عوامل التصفية
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
