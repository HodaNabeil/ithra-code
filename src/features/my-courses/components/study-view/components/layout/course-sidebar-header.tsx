'use client';

import React from 'react';
import { TabsList, TabsTrigger } from '@/components/shared/Tabs';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Maximize2, Minimize2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CourseSidebarHeaderProps {
  onClose?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
}

export const CourseSidebarHeader: React.FC<CourseSidebarHeaderProps> = ({
  onClose,
  onMaximize,
  isMaximized,
}) => {
  return (
    <div className="relative z-10 flex min-w-0 shrink-0 items-center justify-between border-b border-border/50 bg-sidebar/50 px-2 pt-2">
      <TabsList
        variant="line"
        className="h-11 min-w-0 flex-1 gap-0.5 bg-transparent"
      >
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
        <TabsTrigger
          value="assistant"
          className={cn(
            'min-w-0 gap-1.5 rounded-none px-3 py-2.5 text-sm font-medium',
            'text-muted-foreground hover:text-foreground',
            'data-[state=active]:text-foreground data-[state=active]:font-semibold',
          )}
        >
          <Sparkles
            className="size-3.5 shrink-0 text-sidebar-primary"
            aria-hidden
          />
          <span className="truncate">المدرس الذكي</span>
        </TabsTrigger>
      </TabsList>

      <div className="flex items-center gap-0.5 pe-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          onClick={onMaximize}
          aria-label={isMaximized ? 'تصغير' : 'تكبير'}
        >
          {isMaximized ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground hover:bg-muted/50 hover:text-foreground"
          onClick={onClose}
          aria-label="إغلاق"
        >
          <X className="size-4" />
        </Button>
      </div>
    </div>
  );
};
