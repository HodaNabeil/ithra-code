'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { buildLearnHref } from '@/features/courses/lib/build-learn-href';
import type { AddToCartCourse } from './add-to-cart-button';

interface LearnCourseButtonProps {
  course: AddToCartCourse;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xl';
  label?: string;
}

export function LearnCourseButton({
  course,
  className,
  size,
  label = 'ابدأ التعلم',
}: LearnCourseButtonProps) {
  return (
    <Button
      asChild
      variant="course"
      className={className}
      size={size}
    >
      <Link href={buildLearnHref(course)}>{label}</Link>
    </Button>
  );
}
