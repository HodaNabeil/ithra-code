'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

type ContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'list'; items: string[] }
  | { type: 'paragraph'; lines: string[] };

function parseFormattedText(content: string): ContentBlock[] {
  const lines = content.split('\n');
  const blocks: ContentBlock[] = [];
  let currentList: string[] = [];
  let currentParagraph: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      blocks.push({ type: 'list', items: currentList });
      currentList = [];
    }
  };

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', lines: [...currentParagraph] });
      currentParagraph = [];
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushList();
      flushParagraph();
      continue;
    }

    const headingMatch = trimmed.match(/^#{1,3}\s+(.+)$/);
    if (headingMatch?.[1]) {
      flushList();
      flushParagraph();
      blocks.push({ type: 'heading', text: headingMatch[1] });
      continue;
    }

    const bulletMatch = trimmed.match(/^[-*•]\s+(.+)$/);
    if (bulletMatch?.[1]) {
      flushParagraph();
      currentList.push(bulletMatch[1]);
      continue;
    }

    flushList();
    currentParagraph.push(trimmed);
  }

  flushList();
  flushParagraph();
  return blocks;
}

interface FormattedTextContentProps {
  content: string;
  className?: string;
}

export function FormattedTextContent({
  content,
  className,
}: FormattedTextContentProps) {
  const blocks = parseFormattedText(content);

  return (
    <div className={cn('space-y-4 text-right', className)}>
      {blocks.map((block, index) => {
        if (block.type === 'heading') {
          return (
            <div key={index} className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand/10">
                <Sparkles className="h-4 w-4 text-brand" />
              </span>
              <h4 className="text-lg font-semibold text-foreground">
                {block.text}
              </h4>
            </div>
          );
        }

        if (block.type === 'list') {
          return (
            <ul key={index} className="space-y-3">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="flex items-start gap-3">
                  <span
                    aria-hidden
                    className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-brand ring-4 ring-brand/15"
                  />
                  <span className="text-base leading-relaxed text-muted-foreground">
                    {item}
                  </span>
                </li>
              ))}
            </ul>
          );
        }

        return (
          <p
            key={index}
            className="whitespace-pre-line text-base leading-relaxed text-muted-foreground"
          >
            {block.lines.join('\n')}
          </p>
        );
      })}
    </div>
  );
}

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
          <div className="absolute bottom-0 left-0 right-0 h-28 bg-linear-to-t from-fade-background via-fade-background/70 to-transparent pointer-events-none" />
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
