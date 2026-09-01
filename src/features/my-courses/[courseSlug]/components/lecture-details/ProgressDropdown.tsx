'use client';

import React from 'react';
import { Trophy, ChevronDown } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { progressPercentage } from '@/features/my-courses/lib/course-progress-metrics';

interface ProgressDropdownProps {
  completedCount: number;
  totalCount: number;
}

export function ProgressDropdown({
  completedCount,
  totalCount,
}: ProgressDropdownProps) {
  const percentage = progressPercentage(completedCount, totalCount);

  return (
    <DropdownMenu dir="rtl">
      <DropdownMenuTrigger asChild>
        <button className="group flex items-center gap-3 px-3 py-1.5 hover:bg-accent rounded transition-colors outline-none cursor-pointer">
          <div className="relative size-9 flex items-center justify-center">
            {/* Progress Circle SVG */}
            <svg className="absolute inset-0 size-full -rotate-90">
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="transparent"
                stroke="var(--border)"
                strokeWidth="2"
              />
              <circle
                cx="18"
                cy="18"
                r="16"
                fill="transparent"
                stroke="var(--primary)"
                strokeWidth="2"
                strokeDasharray={100}
                strokeDashoffset={100 - percentage}
                className="transition-all duration-500"
              />
            </svg>
            <Trophy className="size-4 text-primary group-hover:text-primary transition-colors" />
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-bold text-primary">تقدمك</span>
            <ChevronDown className="size-4 text-primary/70 group-data-[state=open]:rotate-180 transition-transform" />
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="center"
        className="w-64 p-4 bg-popover text-popover-foreground shadow-2xl rounded-sm border-none mt-1"
      >
        <div className="space-y-4 text-center">
          <p className="text-sm text-muted-foreground">
            تم إكمال {completedCount} من أصل {totalCount}.
          </p>
          <p className="text-sm text-muted-foreground">
            إتمام الدورة للحصول على شهادتك
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
