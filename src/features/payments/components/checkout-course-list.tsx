'use client';

import { formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { CartItemType } from '@/types/cart/cart';
import Image from 'next/image';
import Link from 'next/link';

type CheckoutCourseListProps = {
  items: CartItemType[];
  currency: string;
  className?: string;
};

export function CheckoutCourseList({
  items,
  currency,
  className,
}: CheckoutCourseListProps) {
  return (
    <ul className={cn('flex flex-col gap-4', className)} dir="rtl">
      {items.map((item) => {
        const hasCompare =
          item.compareAtPrice != null && item.compareAtPrice > item.price;

        return (
          <li
            key={item.id}
            className="flex items-start gap-3 sm:gap-4"
          >
            <Link
              href={`/courses/${item.slug}`}
              className="relative block h-12 w-21 shrink-0 overflow-hidden rounded sm:h-13.5 sm:w-24"
            >
              {item.thumbnailUrl ? (
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              ) : (
                <div className="size-full bg-muted" aria-hidden />
              )}
            </Link>

            <div className="flex min-w-0 flex-1 items-start justify-between gap-4">
              <Link
                href={`/courses/${item.slug}`}
                className="min-w-0 flex-1 text-right text-sm font-medium leading-snug text-foreground transition-colors hover:text-primary line-clamp-2"
              >
                {item.title}
              </Link>

              <div className="flex shrink-0 flex-col items-start gap-0.5 text-left tabular-nums">
                <span className="text-sm font-bold text-foreground">
                  {formatPrice(item.price, currency)}
                </span>
                {hasCompare && (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(item.compareAtPrice!, currency)}
                  </span>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
