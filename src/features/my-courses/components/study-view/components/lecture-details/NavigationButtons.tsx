'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface NavigationButtonsProps {
  prevId?: string | null;
  prevTitle?: string | null;
  prevPosition?: number | null;
  nextId?: string | null;
  nextTitle?: string | null;
  nextPosition?: number | null;
  slug: string;
}

export const NavigationButtons = ({
  prevId,
  prevTitle,
  prevPosition,
  nextId,
  nextTitle,
  nextPosition,
  slug,
}: NavigationButtonsProps) => {
  const router = useRouter();

  return (
    <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 flex justify-between items-center px-1 pointer-events-none z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
      <div className="relative flex items-center group/nav">
        <Button
          disabled={!prevId}
          variant="default"
          size="icon"
          onClick={() =>
            router.push(`/my-courses/${slug}/lecture/${prevId}`)
          }
          className="pointer-events-auto h-11 w-11 shadow-2xl disabled:opacity-0 transition-all duration-300"
        >
          <ChevronRight className="w-6 h-6" />
        </Button>
        {prevId && (
          <div className="absolute right-full mr-3 px-3 py-2 bg-popover/95 backdrop-blur-sm text-popover-foreground text-[13px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-all duration-300 translate-x-2 group-hover/nav:translate-x-0 pointer-events-none border border-border shadow-2xl">
            {prevTitle} {prevPosition && `.${prevPosition}`}
          </div>
        )}
      </div>

      <div className="relative flex items-center group/nav">
        <Button
          disabled={!nextId}
          variant="default"
          size="icon"
          onClick={() =>
            router.push(`/my-courses/${slug}/lecture/${nextId}`)
          }
          className="pointer-events-auto h-11 w-11 shadow-2xl disabled:opacity-0 transition-all duration-300"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>
        {nextId && (
          <div className="absolute left-full ml-3 px-3 py-2 bg-popover/95 backdrop-blur-sm text-popover-foreground text-[13px] font-medium rounded-lg whitespace-nowrap opacity-0 group-hover/nav:opacity-100 transition-all duration-300 -translate-x-2 group-hover/nav:translate-x-0 pointer-events-none border border-border shadow-2xl">
            {nextTitle} {nextPosition && `.${nextPosition}`}
          </div>
        )}
      </div>
    </div>
  );
};
