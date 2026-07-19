'use client';

import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { AUTH_ENDPOINTS } from '@/constants/auth';
import { APP_ROUTES } from '@/constants/enums';

export function CheckoutButton() {
  const { status } = useSession();
  const isAuthed = status === 'authenticated';

  if (!isAuthed) {
    return (
      <Button
        asChild
        size="lg"
        className="w-full h-12 text-base font-semibold rounded-md"
      >
        <Link
          href={`${AUTH_ENDPOINTS.LOGIN}?callbackUrl=${encodeURIComponent(APP_ROUTES.CART)}`}
        >
          تسجيل الدخول للمتابعة
          <ArrowLeft className="size-4" />
        </Link>
      </Button>
    );
  }

  return (
    <Button
      asChild
      size="lg"
      className="w-full h-12 text-base font-bold rounded-md"
    >
      <Link href={APP_ROUTES.CHECKOUT}>
        إتمام الشراء
        <ArrowLeft className="size-4" />
      </Link>
    </Button>
  );
}
