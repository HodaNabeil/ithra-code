'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { cn } from '../../../lib/utils';
import { APP_ROUTES } from '@/constants/enums';
import { stageGuestCartForLoginAction } from '@/features/cart/actions/cart';
import { useGuestCart } from '@/features/cart/hooks/useGuestCart';
import type { SocialAuthProvider } from '@/features/auth/lib/auth-providers';

interface SocialButtonsProps {
  providers: SocialAuthProvider[];
  isLoading?: boolean;
  callbackUrl?: string;
  onError?: (error: string) => void;
  onLoadingChange?: (provider: string | null) => void;
}

export function SocialButtons({
  providers,
  isLoading,
  callbackUrl,
  onError,
  onLoadingChange,
}: SocialButtonsProps) {
  const [socialLoading, setSocialLoading] = useState<string | null>(null);
  const { guestIds } = useGuestCart();

  const handleSocialSignIn = async (provider: string) => {
    setSocialLoading(provider);
    onLoadingChange?.(provider);
    try {
      if (guestIds.length > 0) {
        await stageGuestCartForLoginAction(guestIds);
      }

      await signIn(provider, {
        callbackUrl: callbackUrl || APP_ROUTES.MY_COURSES,
      });
    } catch (_err) {
      onError?.('فشل تسجيل الدخول بـ جوجل');
      setSocialLoading(null);
      onLoadingChange?.(null);
    }
  };

  const showGoogle = providers.includes('google');

  return (
    <div className={cn('flex', 'flex-col', 'gap-4', 'w-full')}>
      {showGoogle ? (
        <Button
          className={cn(
            'h-14',
            'w-full',
            'bg-secondary',
            'hover:bg-secondary/80',
            'border-border',
            'transition-all',
            'active:scale-[0.99]',
            'flex',
            'items-center',
            'justify-center',
            'gap-3',
            'rounded-xl',
            'border',
          )}
          type="button"
          disabled={isLoading}
          onClick={() => handleSocialSignIn('google')}
        >
          {socialLoading === 'google' ? (
            <Loader2
              className={cn(
                'h-5',
                'w-5',
                'animate-spin',
                'text-muted-foreground',
              )}
            />
          ) : (
            <>
              <svg
                viewBox="0 0 24 24"
                className={cn('h-6', 'w-6', 'shrink-0')}
                aria-hidden="true"
              >
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              <span className={cn('text-sm', 'font-medium', 'text-foreground')}>
                تسجيل بواسطة Google
              </span>
            </>
          )}
        </Button>
      ) : null}
    </div>
  );
}
