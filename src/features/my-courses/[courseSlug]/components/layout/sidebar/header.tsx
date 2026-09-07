'use client';

import React from 'react';
import { TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCourseLayoutStore } from '@/features/my-courses/[courseSlug]/stores/use-course-layout-store';

interface CourseSidebarHeaderProps {
  isAiTutorEnabled?: boolean;
}

export const CourseSidebarHeader: React.FC<CourseSidebarHeaderProps> = ({
  isAiTutorEnabled = false,
}) => {
  const isSidebarExpanded = useCourseLayoutStore((s) => s.isSidebarExpanded);
  const closeSidebar = useCourseLayoutStore((s) => s.closeSidebar);
  const toggleSidebarExpanded = useCourseLayoutStore(
    (s) => s.toggleSidebarExpanded,
  );

  return (
    <div
      dir="rtl"
      className="relative z-10 flex min-w-0 shrink-0 items-center gap-2 border-b border-border/50 bg-sidebar/50 px-2 pt-2"
    >
      <TabsList className="h-11 min-w-0 flex-1 gap-0.5 border-0 bg-transparent">
        <TabsTrigger
          value="content"
          className={cn(
            'min-w-0 rounded-none px-3 py-2.5 text-sm font-medium',
            'text-muted-foreground hover:text-foreground',
            'data-[state=active]:text-foreground data-[state=active]:font-semibold',
          )}
        >
          <span className="truncate">محتوى الدورة</span>
        </TabsTrigger>
        {isAiTutorEnabled && (
          <TabsTrigger
            value="assistant"
            className={cn(
              'min-w-0 gap-1.5 rounded-none px-3 py-2.5 text-sm font-medium',
              'text-muted-foreground hover:text-foreground',
              'data-[state=active]:text-foreground data-[state=active]:font-semibold',
            )}
          >
            <Sparkles className="size-3.5 shrink-0 text-brand" aria-hidden />
            <span className="truncate">المدرس الذكي</span>
          </TabsTrigger>
        )}
      </TabsList>

      <div className="ms-auto flex shrink-0 items-center gap-0.5 pe-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          onClick={toggleSidebarExpanded}
          aria-label={isSidebarExpanded ? 'تصغير' : 'تكبير'}
        >
          {isSidebarExpanded ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          onClick={closeSidebar}
          aria-label="إغلاق"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
};
