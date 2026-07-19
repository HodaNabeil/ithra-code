'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AUTH_ENDPOINTS } from '@/constants/auth';
import { APP_ROUTES } from '@/constants/enums';
import { isAuthenticatedStatus } from '@/constants/states';
import { stageGuestCartForLoginAction } from '@/features/cart/actions/cart';
import { useGuestCart } from '@/features/cart/hooks/useGuestCart';

export function CheckoutButton() {
  const router = useRouter();
  const { status } = useSession();
  const isAuthed = isAuthenticatedStatus(status);
  const { guestIds } = useGuestCart();
  const [isPending, startTransition] = useTransition();
  const [isStaging, setIsStaging] = useState(false);

  const handleGuestCheckout = () => {
    setIsStaging(true);

    startTransition(async () => {
      try {
        if (guestIds.length > 0) {
          await stageGuestCartForLoginAction(guestIds);
        }

        router.push(
          `${AUTH_ENDPOINTS.LOGIN}?callbackUrl=${encodeURIComponent(APP_ROUTES.CART)}`,
        );
      } finally {
        setIsStaging(false);
      }
    });
  };

  if (!isAuthed) {
    const loading = isStaging || isPending;

    return (
      <Button
        type="button"
        size="lg"
        className="w-full h-12 text-base font-semibold rounded-lg"
        disabled={loading}
        onClick={handleGuestCheckout}
      >
        {loading ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <>
            تسجيل الدخول للمتابعة
            <ArrowLeft className="size-4" />
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      asChild
      size="lg"
      className="w-full h-12 text-base font-bold rounded-lg"
    >
      <Link href={APP_ROUTES.CHECKOUT}>
        الانتقال إلى الدفع
        <ArrowLeft className="size-4" />
      </Link>
    </Button>
  );
}
