import { CourseCardSkeleton } from './CourseCardSkeleton';

export function CoursesListSkeleton() {
  return (
    <ul className="mx-auto flex flex-col items-center gap-4 pt-4 sm:pt-0 sm:grid sm:max-w-[calc(350px*4)] sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-8">
      {Array.from({ length: 8 }).map((_, i) => (
        <CourseCardSkeleton key={i} />
      ))}
    </ul>
  );
}

export function StudentFilterSkeleton() {
  return (
    <div className="flex container flex-row items-center justify-between gap-4 animate-pulse">
      <div className="flex items-center gap-3 w-full md:w-auto">
        <div className="hidden md:flex items-center gap-3">
          <div className="h-10 w-32 bg-muted rounded-full" />
          <div className="h-10 w-32 bg-muted rounded-full" />
          <div className="h-10 w-32 bg-muted rounded-full" />
        </div>
        <div className="md:hidden h-10 w-24 bg-muted rounded-full" />
      </div>

      <div className="flex items-center gap-2 w-full max-w-[320px] justify-end">
        <div className="flex-1 h-10 bg-muted rounded-lg hidden sm:block" />
        <div className="h-10 w-10 bg-muted rounded-lg shrink-0" />
      </div>
    </div>
  );
}

function SortRowSkeleton() {
  return (
    <div className="flex container flex-row items-center justify-between mb-2 animate-pulse">
      <div className="h-5 w-32 bg-muted rounded-md" />
      <div className="h-10 w-36 bg-muted rounded-lg" />
    </div>
  );
}

export function FullPageSkeleton() {
  return (
    <div className="animate-in fade-in duration-500">
      <section className="py-6 lg:py-12">
        <div className="container">
          <div className="h-10 w-48 bg-muted rounded-lg animate-pulse" />
        </div>
      </section>

      <StudentFilterSkeleton />

      <section className="section-gap pb-20">
        <SortRowSkeleton />
        <div className="container">
          <CoursesListSkeleton />
        </div>
      </section>
    </div>
  );
}
