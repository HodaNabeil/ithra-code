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

  const handleSocialSignIn = async (provider: SocialAuthProvider) => {
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
      const providerLabel = provider === 'github' ? 'GitHub' : 'Google';
      onError?.(`فشل تسجيل الدخول بـ ${providerLabel}`);
      setSocialLoading(null);
      onLoadingChange?.(null);
    }
  };

  const renderProviderIcon = (provider: SocialAuthProvider) => {
    if (provider === 'github') {
      return (
        <svg
          viewBox="0 0 24 24"
          className={cn('h-6', 'w-6', 'shrink-0', 'text-foreground')}
          aria-hidden="true"
        >
          <path
            fill="currentColor"
            d="M12 .5A11.5 11.5 0 0 0 .5 12.15a11.5 11.5 0 0 0 7.87 10.92c.58.11.79-.25.79-.56 0-.28-.01-1.19-.01-2.15-3.2.71-3.88-1.39-3.88-1.39-.52-1.36-1.28-1.72-1.28-1.72-1.05-.73.08-.72.08-.72 1.16.08 1.77 1.22 1.77 1.22 1.03 1.8 2.71 1.28 3.37.98.1-.77.4-1.29.73-1.58-2.56-.3-5.26-1.31-5.26-5.84 0-1.29.46-2.34 1.2-3.16-.12-.3-.52-1.5.12-3.13 0 0 .98-.32 3.2 1.21a10.9 10.9 0 0 1 5.82 0c2.22-1.53 3.2-1.21 3.2-1.21.64 1.63.24 2.83.12 3.13.75.82 1.2 1.87 1.2 3.16 0 4.54-2.7 5.54-5.28 5.83.41.36.78 1.07.78 2.17 0 1.56-.01 2.82-.01 3.21 0 .31.21.68.8.56a11.5 11.5 0 0 0 7.86-10.92A11.5 11.5 0 0 0 12 .5Z"
          />
        </svg>
      );
    }

    return (
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
    );
  };

  const getProviderLabel = (provider: SocialAuthProvider) =>
    provider === 'github' ? 'GitHub' : 'Google';

  return (
    <div className={cn('flex', 'flex-col', 'gap-4', 'w-full')}>
      {providers.map((provider) => (
        <Button
          key={provider}
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
          onClick={() => handleSocialSignIn(provider)}
        >
          {socialLoading === provider ? (
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
              {renderProviderIcon(provider)}
              <span className={cn('text-sm', 'font-medium', 'text-foreground')}>
                تسجيل بواسطة {getProviderLabel(provider)}
              </span>
            </>
          )}
        </Button>
      ))}
    </div>
  );
}
