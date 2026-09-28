'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { LogIn } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { AUTH_ENDPOINTS } from '@/constants/auth';
import { APP_ROUTES } from '@/constants/enums';

const SIGN_IN_HREF = `${AUTH_ENDPOINTS.LOGIN}?callbackUrl=${encodeURIComponent(APP_ROUTES.MY_COURSES)}`;

export function MyCoursesSignInRequired() {
  useEffect(() => {
    window.location.replace(SIGN_IN_HREF);
  }, []);

  return (
    <div className="container flex flex-col items-center justify-center space-y-6 py-20 text-center">
      <div className="rounded-full bg-primary/10 p-6">
        <LogIn className="size-12 text-primary" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">سجّل الدخول لعرض دوراتك</h1>
        <p className="mx-auto max-w-sm text-muted-foreground">
          صفحة دوراتي متاحة بعد تسجيل الدخول. جارٍ تحويلك إلى صفحة التسجيل.
        </p>
      </div>
      <Button asChild className="h-12 rounded-full px-8 font-bold">
        <Link href={SIGN_IN_HREF}>تسجيل الدخول</Link>
      </Button>
    </div>
  );
}
