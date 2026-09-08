'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { SocialButtons } from './SocialButtons';
import Link from 'next/link';
import { APP_ROUTES } from '@/constants/enums';
import { cn } from '../../../lib/utils';

export function AuthCard() {
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState<string | null>(null);

  const searchParams = useSearchParams();
  const callbackUrl =
    searchParams.get('callbackUrl') || APP_ROUTES.MY_COURSES;

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
      <CardHeader
        className={cn('flex', 'flex-col', 'p-6', 'space-y-1', 'mb-4')}
      >
        <CardTitle className={cn('font-semibold', 'tracking-tight', 'text-lg')}>
          تسجيل الدخول
        </CardTitle>
        <CardDescription className={cn('text-sm')}>
          للاستمرار التسجيل للمنصة
        </CardDescription>
      </CardHeader>

      <CardContent className={cn('p-6', 'pt-0')}>
        {error && (
          <Alert
            variant="destructive"
            className={cn('animate-in', 'slide-in-from-top-2', 'duration-300')}
          >
            <AlertCircle className={cn('h-4', 'w-4')} />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <SocialButtons
          isLoading={!!isLoading}
          callbackUrl={callbackUrl}
          onError={setError}
          onLoadingChange={setIsLoading}
        />

        <div
          className={cn(
            'text-center',
            'text-sm',
            'text-gray-400',
            'leading-relaxed',
            'max-w-[320px]',
            'mx-auto',
            'pt-4',
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
