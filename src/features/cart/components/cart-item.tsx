'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2, Star, Tag } from 'lucide-react';
import { useTransition } from 'react';
import { formatPrice } from '@/lib/formatters';
import { cn } from '@/lib/utils';
import { isAuthenticatedStatus } from '@/constants/states';
import { formatCourseLevel } from '@/features/courses/lib/course-formatters';
import type { CourseLevel } from '@/types/course/course.types';
import type { CartItemType } from '@/types/cart/cart';
import { removeFromCartAction } from '../actions/cart';
import { useGuestCart } from '../hooks/useGuestCart';
import { useCartStore } from '../stores/use-cart-store';

interface CartItemProps {
  item: CartItemType;
  isGuestCart?: boolean;
}

export function CartItem({ item, isGuestCart = false }: CartItemProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { status } = useSession();
  const isAuthed = isAuthenticatedStatus(status);
  const { removeGuestItem } = useGuestCart();
  const decrementItemCount = useCartStore((state) => state.decrementItemCount);

  const handleRemove = () => {
    if (isGuestCart || !isAuthed) {
      removeGuestItem(item.id);
      router.refresh();
      return;
    }

    startTransition(async () => {
      const result = await removeFromCartAction(item.id);
      if (result.success) decrementItemCount();
      router.refresh();
    });
  };

  const metadataParts: string[] = [];

  if (item.hours) {
    metadataParts.push(`${item.hours} من الساعات في المجمل`);
  } else if (item.totalDurationText) {
    metadataParts.push(item.totalDurationText);
  }

  if (item.lecturesCount) {
    metadataParts.push(`${item.lecturesCount} من المحاضرات`);
  }

  if (item.level) {
    metadataParts.push(formatCourseLevel(item.level as CourseLevel));
  }

  return (
    <div
      className={cn(
        'flex flex-nowrap gap-3 sm:gap-4 py-4 sm:py-5',
        'group animate-in fade-in slide-in-from-bottom-2 duration-500',
      )}
      dir="rtl"
    >
      <Link
        href={`/courses/${item.slug}`}
        className="relative block w-[100px] sm:w-[120px] h-[56px] sm:h-[68px] shrink-0 overflow-hidden rounded"
      >
        {item.thumbnailUrl && (
          <Image
            src={item.thumbnailUrl}
            alt={item.title}
            fill
            sizes="(max-width: 640px) 100px, 120px"
            className="object-cover"
          />
        )}
      </Link>

      <div className="flex-1 min-w-0 flex flex-col gap-2">
        <Link href={`/courses/${item.slug}`}>
          <h3 className="font-bold text-sm sm:text-base leading-snug hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </h3>
        </Link>

        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-star">
            {(item.rating ?? 0).toFixed(1)}
          </span>
          <div className="flex items-center">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={cn(
                  'size-3',
                  i < Math.floor(item.rating || 0)
                    ? 'fill-star text-star'
                    : 'text-star/30',
                )}
              />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            ({item.ratingCount ?? 0} من التقييمات)
          </span>
        </div>

        {metadataParts.length > 0 && (
          <p className="text-xs text-muted-foreground">
            {metadataParts.join(' • ')}
          </p>
        )}
      </div>

      <div className="shrink-0 flex flex-col items-end gap-2 min-w-[80px] sm:min-w-[100px] self-center">
        <div className="flex items-center gap-1 font-bold text-primary">
          <Tag className="size-3.5 shrink-0" />
          <span className="text-sm sm:text-base whitespace-nowrap">
            {formatPrice(item.price, item.currency)}
          </span>
        </div>
        {item.compareAtPrice && item.compareAtPrice > item.price && (
          <span className="text-xs text-muted-foreground line-through">
            {formatPrice(item.compareAtPrice, item.currency)}
          </span>
        )}
        <button
          type="button"
          className="text-sm text-foreground hover:text-primary transition-colors cursor-pointer disabled:opacity-50"
          onClick={handleRemove}
          disabled={isPending}
        >
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'إزالة'}
        </button>
      </div>
    </div>
  );
}
