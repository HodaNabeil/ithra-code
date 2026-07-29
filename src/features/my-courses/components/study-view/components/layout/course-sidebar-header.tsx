'use client';

import React from 'react';
import { TabsList, TabsTrigger } from '@/components/shared/Tabs';
import { Button } from '@/components/ui/button';
import { Sparkles, X, Maximize2, Minimize2 } from 'lucide-react';

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
    <div className="flex min-w-0 items-center justify-between border-b border-border/40 px-2 pt-2">
      <TabsList variant="line" className="h-11 min-w-0 flex-1 bg-transparent">
        <TabsTrigger
          value="content"
          className="min-w-0 px-3 py-2.5 text-sm data-active:text-primary"
        >
          <span className="truncate">محتوى الدورة</span>
        </TabsTrigger>
        <TabsTrigger
          value="assistant"
          className="min-w-0 px-3 py-2.5 text-sm data-active:text-primary"
        >
          <Sparkles className="size-3.5 shrink-0 text-primary" />
          <span className="truncate">المدرس الذكي</span>
        </TabsTrigger>
      </TabsList>

      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={onClose}
        >
          <X className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
          onClick={onMaximize}
        >
          {isMaximized ? (
            <Minimize2 className="size-4" />
          ) : (
            <Maximize2 className="size-4" />
          )}
        </Button>
      </div>
    </div>
  );
};
