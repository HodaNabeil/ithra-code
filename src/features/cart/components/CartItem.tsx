'use client';

import Image from 'next/image';
import { formatPrice } from '@/lib/formatters';
import Link from 'next/link';
import { cn } from '../../../lib/utils';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { removeFromCartAction } from '../actions/cart';
import { useGuestCart } from '../hooks/useGuestCart';
import { cookieManager } from '@/lib/cookie-manager';
import { Loader2 } from 'lucide-react';

import type { CartItemType } from '@/types/cart/cart';

interface CartItemProps {
  item: CartItemType;
  isGuestCart?: boolean;
}

export function CartItem({ item, isGuestCart = false }: CartItemProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { removeGuestItem } = useGuestCart();

  const handleRemove = () => {
    const isAuthed = !!cookieManager.getAccessToken();

    if (isGuestCart || !isAuthed) {
      removeGuestItem(item.id);
      router.refresh();
      return;
    }

    startTransition(async () => {
      await removeFromCartAction(item.id);
      router.refresh();
    });
  };
  return (
    <div
      className={cn(
        'flex',
        'flex-col',
        'sm:flex-row',
        'gap-4',
        'sm:py-4!',
        'border',
        'border-border',
        'pb-4',
        'sm:pb-0',
        'sm:border-t-0',
        'sm:border-x-0',
        'sm:border-b',
        'last:border-0',
        'sm:last:border-b-0',
        'group',
        'animate-in',
        'fade-in',
        'slide-in-from-bottom-2',
        'duration-500',
      )}
      dir="rtl"
    >
      {/* Image (Visually Right in RTL) */}
      <div
        className={cn(
          'relative',
          'h-42',
          ' w-full',
          'sm:w-[120px]',
          'sm:h-[68px]',
          'overflow-hidden',
          'rounded',
        )}
      >
        {item?.thumbnailUrl && (
          <Image
            src={item?.thumbnailUrl}
            alt={item?.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className={cn('object-cover ')}
          />
        )}
      </div>
      {/* Details (Visually Middle in RTL) */}
      <div
        className={cn(
          'flex-1',
          'flex',
          'gap-2',
          'lg:justify-between',
          'flex-col',
          'px-4',
          'sm:px-0',
        )}
      >
        <div>
          <div className="space-y-1">
            <Link href={`/courses/${item?.slug}`}>
              <h3
                className={cn(
                  'font-light',
                  'sm:font-bold',
                  'text-base',
                  'sm:text-[17px]',
                  'sm:leading-tight',
                  'hover:text-primary',
                  'transition-colors',
                  'line-clamp-2',
                )}
              >
                {item?.title ||
                  'دورة في البرمجة اختبار التطبيقات - Unit, Integration, E2E'}
              </h3>
            </Link>
            {/* <p className={cn('text-sm', 'text-muted-foreground', 'font-medium')}>
                            بواسطة {item?.instructorName || 'هدي نصر'}
                        </p> */}
          </div>

          <div className={cn('flex', 'gap-x-4', 'gap-y-2', 'flex-col', 'my-4')}>
            {/* Rating */}
            {/* <div className={cn('flex', 'gap-1', "items-center")}>
                            <span className={cn('text-sm', 'font-bold', 'text-star')}>{item?.rating}</span>
                            <div className={cn('flex', 'items-center')}>
                                {[...Array(5)].map((_, i) => (
                                    <Star
                                        key={i}
                                        className={`size-3 ${i < Math.floor(item?.rating || 0)
                                            ? 'fill-star text-star'
                                            : 'text-muted-foreground/30'
                                            }`}
                                    />
                                ))}
                            </div>
                            <span className={cn('text-xs', 'text-muted-foreground')}>({item?.course?.ratingCount} من التقييمات)</span>
                        </div> */}

            <ul
              className={cn(
                'flex',
                'gap-1',
                'text-xs',
                'text-muted-foreground',
                'font-normal',
              )}
            >
              <li>• {item?.totalDurationText} في المجمل</li>
              <li>• {item?.lecturesCount} من المحاضرات</li>
            </ul>
          </div>
        </div>

        <div
          className={cn(
            'flex',
            'flex-row',
            'xl:hidden',
            'gap-4',
            'lg:items-end',
            'items-start',
            'order-2 ',
            'text-xs',
          )}
        >
          <button
            className={cn(
              'text-primary',
              'font-light',
              'hover:underline',
              'cursor-pointer',
            )}
            onClick={handleRemove}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className={cn('size-3', 'animate-spin')} />
            ) : (
              'إزالة'
            )}
          </button>

          {/* <button className={cn('text-primary', "font-light", 'hover:underline')}>
                        نقل إلى قائمة الرغبات
                    </button> */}
        </div>
      </div>

      <div
        className={cn(
          'hidden',
          'xl:flex',
          'gap-1!',
          'flex-col',

          'pb-4',
          'lg:gap-1',
          'lg:items-end',
          'items-start',
          'order-2 ',
          'text-base',
        )}
      >
        <button
          className={cn(
            'text-primary',
            'font-light',
            'hover:underline',
            'cursor-pointer',
          )}
          onClick={handleRemove}
        >
          {isPending ? (
            <Loader2 className={cn('size-3', 'animate-spin')} />
          ) : (
            'إزالة'
          )}
        </button>

        <button className={cn('text-primary', 'font-light', 'hover:underline')}>
          نقل إلى قائمة الرغبات
        </button>
      </div>

      {/* Price Area (Visually Left in RTL) */}
      <div
        className={cn(
          'px-4',
          'sm:px-0',
          'flex',
          'flex-col',
          'lg:mr-8',
          'items-start',
          'md:items-end',
          'gap-1',
          'min-w-[120px]',
          'text-right',
          'order-last',
        )}
      >
        <div
          className={cn(
            'flex',
            'items-center',
            'gap-1.5',
            'font-light',
            'sm:font-medium',
          )}
        >
          <span className="text-base">
            {formatPrice(item?.price, item?.currency)}
          </span>

          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={cn('text-primary', 'mr-1')}
          >
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"></path>
            <line x1="7" y1="7" x2="7.01" y2="7"></line>
          </svg>
        </div>
        {item?.compareAtPrice && (
          <span
            className={cn(
              'text-xs',
              'text-muted-foreground',
              'line-through',
              'font-light',
            )}
          >
            {formatPrice(item?.compareAtPrice, item?.currency)}
          </span>
        )}
      </div>
    </div>
  );
}
