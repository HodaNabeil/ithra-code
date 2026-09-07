'use client';

import React, { useCallback, useRef } from 'react';

import { cn } from '@/lib/utils';

interface SidebarScrollAreaProps {
  children: React.ReactNode;
  className?: string;
}

export function SidebarScrollArea({
  children,
  className,
}: SidebarScrollAreaProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const handleScroll = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    element.dataset.scrolling = 'true';
    clearTimeout(scrollTimeoutRef.current);
    scrollTimeoutRef.current = setTimeout(() => {
      delete element.dataset.scrolling;
    }, 900);
  }, []);

  return (
    <div
      ref={scrollRef}
      onScroll={handleScroll}
      className={cn('sidebar-scroll min-h-0 flex-1', className)}
    >
      {children}
    </div>
  );
}
