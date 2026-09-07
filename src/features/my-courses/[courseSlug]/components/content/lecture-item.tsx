'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { PlayCircle, FileText, ChevronDown } from 'lucide-react';
import { useLectureItem } from '@/features/my-courses/hooks/use-lecture-item';

interface LectureItemProps {
  id: string;
  title: string;
  duration?: number;
  isCompleted: boolean;
  attachmentsCount: number;
  courseSlug: string;
}

export const LectureItem: React.FC<LectureItemProps> = ({
  id,
  title,
  duration,
  isCompleted,
  attachmentsCount,
  courseSlug,
}) => {
  const {
    isActive,
    isPending,
    handleSelect,
    handleToggleComplete,
    formatDuration,
  } = useLectureItem(id, courseSlug);

  return (
    <div
      dir="rtl"
      className={cn(
        'group flex flex-col gap-2 p-3 px-4 transition-all duration-200 cursor-pointer',
        isActive
          ? 'bg-brand/10 ring-1 ring-inset ring-brand/15'
          : 'hover:bg-muted/25',
      )}
      onClick={handleSelect}
    >
      <div className="flex items-start gap-3">
        <div className="pt-1" onClick={(e) => e.stopPropagation()}>
          <Checkbox
            id={`lecture-${id}`}
            checked={isCompleted}
            onCheckedChange={handleToggleComplete}
            disabled={isPending}
            className="size-5 rounded-md border-muted-foreground/30 data-[state=checked]:bg-success data-[state=checked]:border-success"
          />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4
              className={cn(
                'text-sm font-medium leading-snug transition-colors text-start',
                isActive
                  ? 'text-brand'
                  : 'text-foreground/80 group-hover:text-foreground',
              )}
            >
              {title}
            </h4>
          </div>

          <div className="mt-1.5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <PlayCircle className="size-3.5" />
              <span>{formatDuration(duration)}</span>
            </div>

            {attachmentsCount > 0 && (
              <div className="flex items-center gap-1.5">
                <FileText className="size-3.5" />
                <span>{attachmentsCount} موارد</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {attachmentsCount > 0 && (
        <div className="mt-1 mr-8" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="group h-8 gap-2 rounded-lg border-primary/20 bg-primary/5 px-3 text-xs font-medium text-primary hover:bg-primary/10 hover:text-primary"
              >
                <FileText className="size-3.5" />
                الموارد
                <ChevronDown className="size-3.5 transition-transform duration-500 ease-in-out group-data-[state=open]:rotate-180" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              className="w-56 rounded-xl border-border/50 shadow-xl"
            >
              <DropdownMenuItem className="gap-2.5 rounded-lg py-2.5 cursor-pointer">
                <FileText className="size-4 text-primary" />
                <span>مرفق المحاضرة.pdf</span>
              </DropdownMenuItem>
              {/* Add more attachments here */}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
    </div>
  );
};
