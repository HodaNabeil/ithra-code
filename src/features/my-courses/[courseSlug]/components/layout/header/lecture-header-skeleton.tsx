import { Skeleton } from '@/components/ui/skeleton';

export function LectureHeaderSkeleton() {
  return (
    <header className="site-header sticky top-0 z-50 w-full bg-card">
      <Skeleton className="h-20 w-full rounded-none bg-card" />
    </header>
  );
}
