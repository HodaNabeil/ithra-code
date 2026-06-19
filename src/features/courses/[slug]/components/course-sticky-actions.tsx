'use client';

import { formatPrice } from '@/lib/formatters';
import {
  AddToCartButton,
  type AddToCartCourse,
} from '@/features/courses/components/add-to-cart-button';

interface CourseStickyActionsProps {
  course: AddToCartCourse;
}

export function CourseStickyActions({ course }: CourseStickyActionsProps) {
  const { price, compareAtPrice, currency } = course;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border py-3 block lg:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.05)]">
      <div className="container flex items-center justify-between gap-6">
        <div className="flex flex-col shrink-0">
          <span className="text-xl font-bold text-foreground leading-none">
            {formatPrice(price, currency)}
          </span>
          {compareAtPrice && compareAtPrice > price && (
            <span className="text-sm text-muted-foreground line-through mt-1 leading-none">
              {formatPrice(compareAtPrice, currency)}
            </span>
          )}
        </div>
        <div className="flex-1">
          <AddToCartButton
            course={course}
            className="w-full font-medium text-base rounded-lg"
            size="xl"
          />
        </div>
      </div>
    </div>
  );
}
