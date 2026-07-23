'use client';

import Image from 'next/image';
import Link from 'next/link';
import { formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import type { CartItemType } from '@/types/cart/cart';

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
    <ul className={cn('flex flex-col', className)} dir="rtl">
      {items.map((item) => {
        const hasCompare =
          item.compareAtPrice != null && item.compareAtPrice > item.price;

        return (
          <li
            key={item.id}
            className="flex items-start gap-3 border-b-2 border-border py-4 first:pt-0 sm:gap-3.5"
          >
            <Link
              href={`/courses/${item.slug}`}
              className="relative block h-14 w-24 shrink-0 overflow-hidden rounded-md bg-muted sm:h-16 sm:w-28"
            >
              {item.thumbnailUrl ? (
                <Image
                  src={item.thumbnailUrl}
                  alt={item.title}
                  fill
                  sizes="108px"
                  className="object-cover"
                />
              ) : (
                <div className="size-full bg-muted" aria-hidden />
              )}
            </Link>

            <div className="flex min-w-0 flex-1 items-start justify-between gap-3 sm:gap-4">
              <Link
                href={`/courses/${item.slug}`}
                className="line-clamp-2 min-w-0 flex-1 text-right text-sm font-medium leading-snug text-foreground transition-colors hover:opacity-80"
              >
                {item.title}
              </Link>

              <div className="flex shrink-0 flex-col items-start gap-0.5 text-left tabular-nums">
                <span className="text-sm font-semibold text-foreground">
                  {formatPrice(item.price, currency)}
                </span>
                {hasCompare ? (
                  <span className="text-xs text-muted-foreground line-through">
                    {formatPrice(item.compareAtPrice!, currency)}
                  </span>
                ) : null}
              </div>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
