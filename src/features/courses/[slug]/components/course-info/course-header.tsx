'use client';

import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course, CourseOverview } from '@/types/course.types';

interface CourseHeaderProps {
  title: Course['title'];
  rating: CourseOverview['rating'];
  ratingsCount: CourseOverview['ratingsCount'];
  totalStudents: CourseOverview['totalStudents'];
}

export default function CourseHeader({
  title,
  rating,
  ratingsCount,
  totalStudents,
}: CourseHeaderProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const safeRating = rating ?? 0;
  const safeRatingsCount = ratingsCount ?? 0;
  const safeTotalStudents = totalStudents ?? 0;

  return (
    <div
      className={cn(
        'hidden fixed top-0 h-[69px] lg:flex left-0 right-0 z-50 bg-sidebar-background border-b border-sidebar-border shadow-md transition-all duration-300 transform',
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0',
      )}
    >
      <div className="container mx-auto flex items-center justify-between gap-4">
        <div className="flex flex-col gap-0.5">
          <h2 className="text-base md:text-lg font-bold text-foreground line-clamp-1">
            {title}
          </h2>
          {safeRating > 0 && (
            <div className="flex items-center gap-2 text-xs md:text-sm">
              <span className="font-bold text-star">
                {safeRating.toFixed(1)}
              </span>
              <div className="flex items-center gap-1">
                {[1].map((star) => {
                  const filled = star <= Math.round(safeRating);
                  return (
                    <Star
                      key={star}
                      size={12}
                      className={cn(
                        filled ? 'fill-star text-star' : 'text-star/30',
                      )}
                    />
                  );
                })}
              </div>
              {safeRatingsCount > 0 && (
                <button
                  onClick={() =>
                    document
                      .getElementById('course-reviews')
                      ?.scrollIntoView({ behavior: 'smooth' })
                  }
                  className="text-foreground underline cursor-pointer"
                >
                  ({safeRatingsCount.toLocaleString('en-EG')} التقييمات)
                </button>
              )}
              {safeTotalStudents > 0 && (
                <span className="text-muted-foreground">
                  {safeTotalStudents.toLocaleString('en-EG')} من الطلاب
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
