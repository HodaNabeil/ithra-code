'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface ExpandableContentProps {
  children: React.ReactNode;
  initialHeight?: number;
  className?: string;
  expandLabel?: string;
  collapseLabel?: string;
}

export function ExpandableContent({
  children,
  initialHeight = 200,
  className,
  expandLabel = 'عرض المزيد',
  collapseLabel = 'عرض أقل',
}: ExpandableContentProps) {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  const [shouldShowButton, setShouldShowButton] = React.useState(false);
  const [contentHeight, setContentHeight] = React.useState<number>(0);

  React.useEffect(() => {
    const updateHeight = () => {
      if (contentRef.current) {
        const height = contentRef.current.scrollHeight;
        setContentHeight(height);
        setShouldShowButton(height > initialHeight);
      }
    };

    updateHeight();
    // Use ResizeObserver for more robust size change detection
    const resizeObserver = new ResizeObserver(updateHeight);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }

    window.addEventListener('resize', updateHeight);

    return () => {
      window.removeEventListener('resize', updateHeight);
      resizeObserver.disconnect();
    };
  }, [children, initialHeight]);

  return (
    <div className={cn('relative', className)}>
      <div
        ref={contentRef}
        className="relative overflow-hidden transition-all duration-500 ease-in-out"
        style={{
          maxHeight: isExpanded ? `${contentHeight}px` : `${initialHeight}px`,
        }}
      >
        {children}
        {shouldShowButton && !isExpanded && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-t from-background to-transparent pointer-events-none" />
        )}
      </div>

      {shouldShowButton && (
        <div className="mt-4 text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? collapseLabel : expandLabel}
            {isExpanded ? (
              <ChevronUp className="ml-1 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-1 h-4 w-4" />
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
