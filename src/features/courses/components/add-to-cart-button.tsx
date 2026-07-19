'use client';

import { useCallback, useEffect, useActionState, useState } from 'react';
import Image from 'next/image';
import { Check } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useQueryClient } from '@tanstack/react-query';
import { Button, buttonVariants } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import type { CourseListDTO } from '@/types/course/course.dto';
import type { SectionDTO } from '@/types/course/course.dto';
import { APP_ROUTES } from '@/constants/enums';
import { queryKeys } from '@/constants/query-keys';
import type { CartDataType as Cart } from '@/types/cart/cart';
import type { ActionResponse } from '@/types/action';
import { useGuestCart } from '@/features/cart/hooks/useGuestCart';
import { useCartStore } from '@/features/cart/stores/use-cart-store';
import { addToCartAction } from '@/features/cart/actions/cart';

import type { Course } from '@/types/course/course.types';

export type AddToCartCourse = Omit<CourseListDTO, 'duration' | 'sections'> & {
  duration?: number | null;
  isInCart?: boolean;
  sections?: SectionDTO[] | Course['sections'];
};

function toGuestCartCourse(course: AddToCartCourse): CourseListDTO {
  const duration =
    course.duration ??
    ('hours' in course && typeof course.hours === 'number'
      ? course.hours * 60
      : null);

  return { ...course, duration };
}

interface AddToCartButtonProps {
  course: AddToCartCourse;
  className?: string;
  size?: 'default' | 'sm' | 'lg' | 'icon' | 'xl';
}

function buildLearnHref(course: AddToCartCourse): string {
  const lectureId =
    course.firstLectureId || course.sections?.[0]?.lectures?.[0]?.id;

  return lectureId
    ? `${APP_ROUTES.MY_COURSES}/${course.slug}/${APP_ROUTES.LEARN}/${APP_ROUTES.LECTURE}/${lectureId}`
    : `${APP_ROUTES.MY_COURSES}/${course.slug}`;
}

export function AddToCartButton({
  course,
  className,
  size,
}: AddToCartButtonProps) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: session, status } = useSession();

  const isPurchased = !!course.isPurchased;
  const isAuthed = status === 'authenticated' && !!session?.user;

  const { addGuestItem, guestIds, guestCartHydrated } = useGuestCart();
  const incrementItemCount = useCartStore((state) => state.incrementItemCount);

  const addToCartWithId = useCallback(
    (prev: ActionResponse<Cart> | null, formData: FormData) =>
      addToCartAction(prev, course.id, formData),
    [course.id],
  );

  const [state, formAction, isPending] = useActionState<
    ActionResponse<Cart> | null,
    FormData
  >(addToCartWithId, null);

  const [isAddedLocally, setIsAddedLocally] = useState(false);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);

  const isInGuestCart = guestCartHydrated && guestIds.includes(course.id);
  const actionFailed = state?.success === false;
  const isInCart =
    !actionFailed && (!!course.isInCart || isAddedLocally || isInGuestCart);

  useEffect(() => {
    if (!state?.success) return;
    if (isAuthed) incrementItemCount();
    setTimeout(() => setShowSuccessDialog(true), 0);
    queryClient.invalidateQueries({ queryKey: queryKeys.cart.detail() });
  }, [state, queryClient, isAuthed, incrementItemCount]);

  const openSuccessDialog = () => {
    setTimeout(() => setShowSuccessDialog(true), 0);
  };

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();

    if (isPurchased) {
      e.preventDefault();
      router.push(buildLearnHref(course));
      return;
    }

    if (isInCart) {
      e.preventDefault();
      router.push(APP_ROUTES.CART);
      return;
    }

    if (!isAuthed) {
      e.preventDefault();
      addGuestItem(toGuestCartCourse(course));
      setIsAddedLocally(true);
      openSuccessDialog();
      return;
    }

    setIsAddedLocally(true);
  };

  return (
    <>
      <form action={formAction} className="contents">
        <Button
          type="submit"
          variant={isPurchased || isInCart ? 'default' : 'outline'}
          onClick={handleClick}
          disabled={isPending}
          className={className}
          size={size}
        >
          {isPending
            ? 'جاري الإضافة...'
            : isPurchased
              ? 'شاهد الآن'
              : isInCart
                ? 'انتقل إلى السلة'
                : 'إضافة إلى العربة'}
        </Button>
      </form>

      <Dialog
        open={showSuccessDialog}
        onOpenChange={(open) => {
          setShowSuccessDialog(open);
          if (!open) router.refresh();
        }}
      >
        <DialogContent className="w-full max-w-2xl! rounded-2xl p-4 px-6 md:p-6 md:px-8 rtl">
          <DialogTitle className="sr-only">تمت الإضافة إلى العربة</DialogTitle>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 md:gap-8 w-full pt-4 md:pt-6">
            <div className="flex flex-1 gap-4 items-center">
              <div className="flex items-center gap-3 md:gap-4 shrink-0">
                <div className="size-7 md:size-8 rounded-full bg-success/10 element-center shrink-0">
                  <Check className="size-3.5 md:size-4 text-success stroke-[3.5px]" />
                </div>
                <div className="relative size-16 md:size-24 rounded-lg overflow-hidden border border-border shadow-sm">
                  <Image
                    src={course.thumbnailUrl || ''}
                    alt={course.title}
                    fill
                    className="object-cover"
                  />
                </div>
              </div>
              <h4 className="font-semibold text-sm md:text-base leading-tight text-foreground line-clamp-2">
                {course.title}
              </h4>
            </div>

            <Link
              href={APP_ROUTES.CART}
              className={buttonVariants({
                variant: 'default',
                size: 'lg',
                className: 'w-full md:w-auto',
              })}
              onClick={() => setShowSuccessDialog(false)}
            >
              انتقل إلى السلة
            </Link>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
