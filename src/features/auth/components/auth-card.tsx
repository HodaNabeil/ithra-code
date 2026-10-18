'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';
import { SocialButtons } from './social-buttons';
import Link from 'next/link';
import { APP_ROUTES } from '@/constants/enums';
import { AUTH_ROUTES } from '@/constants/auth';
import { cn } from '../../../lib/utils';
import {
  getAuthErrorContent,
  type AuthErrorContent,
} from '@/features/auth/lib/auth-error-messages';
import type { SocialAuthProvider } from '@/features/auth/lib/auth-providers';

type AuthCardProps = {
  providers: SocialAuthProvider[];
};

export function AuthCard({ providers }: AuthCardProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || APP_ROUTES.MY_COURSES;
  const [error, setError] = useState<AuthErrorContent | null>(() =>
    getAuthErrorContent(searchParams.get('error')),
  );
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const retryHref =
    callbackUrl !== APP_ROUTES.MY_COURSES
      ? `${AUTH_ROUTES.SIGN_IN}?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : AUTH_ROUTES.SIGN_IN;

  return (
    <Card
      className={cn(
        'rounded-xl',
        'border',
        'text-card-foreground',
        'shadow',
        'w-full',
        'max-w-md',
        'py-6',
        'gap-0',
      )}
    >
      <CardContent className={cn('flex', 'flex-col', 'gap-6', 'p-6')}>
        {error && (
          <Alert
            variant="destructive"
            className={cn(
              'animate-in',
              'slide-in-from-top-2',
              'duration-300',
              'border-destructive/30',
              'bg-destructive/5',
            )}
          >
            <AlertCircle className={cn('h-4', 'w-4')} />
            <AlertTitle className={cn('text-destructive')}>
              {error.title}
            </AlertTitle>
            {error.description ? (
              <AlertDescription className={cn('text-destructive/90')}>
                {error.description}
              </AlertDescription>
            ) : null}
            <div className={cn('col-start-2', 'mt-2')}>
              <Button
                variant="outline"
                size="sm"
                className={cn('h-8', 'border-destructive/40', 'bg-background')}
                asChild
              >
                <Link href={retryHref}>حاول مرة أخرى</Link>
              </Button>
            </div>
          </Alert>
        )}

        {providers.length > 0 ? (
          <SocialButtons
            providers={providers}
            isLoading={!!isLoading}
            callbackUrl={callbackUrl}
            onError={(message) =>
              setError({ title: message, description: undefined })
            }
            onLoadingChange={setIsLoading}
          />
        ) : (
          <Alert variant="destructive" className={cn('border-destructive/30')}>
            <AlertCircle className={cn('h-4', 'w-4')} />
            <AlertTitle className={cn('text-destructive')}>
              لا يوجد مزود تسجيل دخول متاح
            </AlertTitle>
            <AlertDescription className={cn('text-destructive/90')}>
              يرجى ضبط إعدادات تسجيل الدخول في الخادم (Google أو GitHub) ثم
              إعادة المحاولة.
            </AlertDescription>
          </Alert>
        )}

        <div
          className={cn(
            'text-center',
            'text-sm',
            'text-gray-400',
            'leading-relaxed',
            'max-w-[320px]',
            'mx-auto',
          )}
        >
          من خلال إنشاء حساب، فإنك توافق على{' '}
          <Link
            href="/terms"
            className={cn(
              'text-primary',
              'hover:underline',
              'transition-colors',
            )}
          >
            شروط الخدمة
          </Link>{' '}
          و{' '}
          <Link
            href="/privacy"
            className={cn(
              'text-primary',
              'hover:underline',
              'transition-colors',
            )}
          >
            سياسة الخصوصية
          </Link>{' '}
          الخاصة بنا.
        </div>
      </CardContent>
    </Card>
  );
}
