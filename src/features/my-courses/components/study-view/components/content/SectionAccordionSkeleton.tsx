import { Skeleton } from '@/components/ui/skeleton';

export function SectionAccordionSkeleton() {
  return (
    <div className="space-y-0 divide-y divide-border/10" dir="rtl">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="px-4 py-5 space-y-3">
          <div className="flex flex-col items-start gap-1.5">
            {/* Section Title Skeleton */}
            <div className="flex items-center gap-2 w-full">
              <Skeleton className="h-4 w-12 bg-primary/10" />
              <Skeleton className="h-4 w-[60%] max-w-[180px]" />
            </div>

            {/* Metadata Skeleton */}
            <div className="flex items-center gap-2" dir="ltr">
              <Skeleton className="h-3 w-16" />
              <div className="size-1 rounded-full bg-border" />
              <Skeleton className="h-3 w-8" />
            </div>
          </div>

          {/* First item expanded effect */}
          {i === 1 && (
            <div className="mt-4 space-y-4 pr-1">
              {[1, 2, 3].map((j) => (
                <div key={j} className="flex items-center gap-3 px-2 py-1">
                  <Skeleton className="size-5 rounded-md shrink-0 bg-muted/60" />
                  <div className="space-y-1.5 flex-1">
                    <Skeleton className="h-3.5 w-[85%]" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                  <Skeleton className="size-4 rounded-full shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
