'use client';

import { AddToCartButton, type AddToCartCourse } from './add-to-cart-button';
import { FreeEnrollButton } from './free-enroll-button';
import { LearnCourseButton } from './learn-course-button';

interface CoursePurchaseCtaProps {
  course: AddToCartCourse;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xl';
}

function isFreeCourse(price: number): boolean {
  return price === 0;
}

export function CoursePurchaseCta({
  course,
  className,
  size,
}: CoursePurchaseCtaProps) {
  if (course.isPurchased) {
    return (
      <LearnCourseButton course={course} className={className} size={size} />
    );
  }

  if (isFreeCourse(course.price)) {
    return (
      <FreeEnrollButton course={course} className={className} size={size} />
    );
  }

  return <AddToCartButton course={course} className={className} size={size} />;
}
