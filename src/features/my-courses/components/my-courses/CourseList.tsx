'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { CourseCardStudent } from './CourseCard';
import { EMPTY_STATES, DEFAULT_VALUES } from '@/constant/my-courses';
import { StudentCourseItem } from '@/types/course/course.types';
import Select from '@/components/shared/select';
import { STUDENT_SORT_OPTIONS } from '@/constant/course';

interface CourseListProps {
  courses: StudentCourseItem[];
  filteredCourses: StudentCourseItem[];
  sortBy: string;
  onSortChange: (value: string) => void;
}

export default function CourseList({
  courses,
  filteredCourses,
  sortBy,
  onSortChange,
}: CourseListProps) {
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 640);
    };

    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  if (courses.length === 0) {
    return (
      <div
        className={cn(
          'flex flex-col items-center justify-center py-20 space-y-6 text-center',
        )}
      >
        <div className={cn('p-6 bg-muted rounded-full')}>
          <BookOpen className={cn('size-12 text-muted-foreground')} />
        </div>
        <div className="space-y-2">
          <h2 className={cn('text-2xl font-bold')}>
            {EMPTY_STATES.NO_ENROLLMENTS.title}
          </h2>
          <p className={cn('text-muted-foreground max-w-xs mx-auto')}>
            {EMPTY_STATES.NO_ENROLLMENTS.description}
          </p>
        </div>
        <Button asChild className={cn('rounded-full px-8 h-12 font-bold')}>
          <Link href={EMPTY_STATES.NO_ENROLLMENTS.buttonHref}>
            {EMPTY_STATES.NO_ENROLLMENTS.buttonText}
          </Link>
        </Button>
      </div>
    );
  }

  if (filteredCourses.length > 0) {
    return (
      <div className="container">
        <div className="flex  flex-row sm:items-center justify-between mb-2">
          <p className="text-base font-bold text-muted-foreground">
            عدد الكورسات:{' '}
            <span className="text-foreground">{filteredCourses.length}</span>
          </p>
          <div className="flex items-center gap-3">
            <Select
              options={STUDENT_SORT_OPTIONS.map((opt) => opt)}
              value={sortBy}
              onValueChange={onSortChange}
              placeholder="رتب حسب"
              className="rounded-lg h-10"
            />
          </div>
        </div>
        <ul
          className={cn(
            isMobile
              ? ' flex  flex-col  justify-center! items-center gap-4 pt-4 '
              : 'mx-auto grid max-w-[calc(350px*4)] grid-rows-auto grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
          )}
        >
          {filteredCourses.map((course) => (
            <CourseCardStudent
              key={course.id}
              id={course.id}
              title={course.title}
              slug={course.slug}
              instructor={
                `${course.instructor?.firstName || ''} ${course.instructor?.lastName || ''}`.trim() ||
                DEFAULT_VALUES.INSTRUCTOR_NAME
              }
              progress={course.progressPercentage}
              thumbnail={course.thumbnailUrl}
              lastLectureId={course.lastLectureId}
              rating={5}
            />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-6 text-center animate-in fade-in zoom-in duration-300">
      <div className="p-6 bg-primary/10 rounded-full">
        <BookOpen className="size-12 text-primary" />
      </div>
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">
          {EMPTY_STATES.NO_SEARCH_RESULTS.title}
        </h2>
        <p className="text-muted-foreground max-w-xs mx-auto">
          {EMPTY_STATES.NO_SEARCH_RESULTS.description}
        </p>
      </div>
      <Button
        asChild
        variant="outline"
        className="rounded-full px-8 hover:bg-primary hover:text-white transition-all cursor-pointer"
      >
        <Link href={EMPTY_STATES.NO_SEARCH_RESULTS.buttonHref}>
          {EMPTY_STATES.NO_SEARCH_RESULTS.buttonText}
        </Link>
      </Button>
    </div>
  );
}
