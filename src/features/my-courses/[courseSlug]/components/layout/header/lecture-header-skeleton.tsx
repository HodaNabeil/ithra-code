import { Skeleton } from '@/components/ui/skeleton';

export function LectureHeaderSkeleton() {
  return (
    <header className="site-header sticky top-0 z-50 w-full">
      <Skeleton className="h-20 w-full rounded-none" />
    </header>
  );
}
