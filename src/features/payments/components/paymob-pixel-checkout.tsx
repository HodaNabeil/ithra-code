'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTheme } from 'next-themes';
import { Spinner } from '@/components/ui/spinner';
import { APP_ROUTES } from '@/constants/enums';
import { cn } from '@/lib/utils';

/**
 * Paymob's `Vertical_Padding` is misnamed — the SDK uses it as the
 * **input field height in px** (default 40). Setting it to 0 collapses the form.
 *
 * Colors mirror the checkout reference: neutral surfaces, silver CTA in dark mode.
 * Input backgrounds must be opaque hex — `transparent` lets PCI iframes fall back to white.
 */
function buildPaymobStyle(isDark: boolean): Record<string, unknown> {
  return {
    HideCardLabel: false,
    HideCardIcons: false,
    Direction: 'rtl',
    Label_Text: {
      cardLabel: 'بيانات البطاقة',
      savedCardsLabel: 'البطاقات المحفوظة',
      saveCardConsentLabel: 'حفظ البطاقة',
      cardEndingLabel: 'تنتهي بـ',
    },
    Placeholder_Text: {
      holderName: 'الاسم على البطاقة',
      cardNumber: 'رقم البطاقة',
      expiryDate: 'سنة / شهر',
      securityCode: 'الرمز الأمني (CVV)',
    },
    Error_Text: {
      cardNumber: {
        required: 'مطلوب رقم البطاقة',
        invalid: 'رقم البطاقة غير صحيح',
      },
      expiryDate: {
        required: 'مطلوب تاريخ انتهاء الصلاحية',
        invalid: 'تاريخ انتهاء الصلاحية غير صحيح',
      },
      securityCode: 'مطلوب الرمز الأمني (CVV)',
      holderName: 'مطلوب اسم حامل البطاقة',
    },
    Button_Text: {
      payBtn: 'ادفع',
    },
    Font_Size_Label: '15',
    Font_Size_Input_Fields: '15',
    Font_Size_Payment_Button: '16',
    Font_Weight_Label: 600,
    Font_Weight_Input_Fields: 400,
    Font_Weight_Payment_Button: 600,
    Text_Color_For_Label: isDark ? '#fafafa' : '#0f0f10',
    Color_Container: 'transparent',
    Color_Input_Fields: isDark ? '#161617' : '#ffffff',
    Color_Border_Input_Fields: isDark
      ? 'rgba(255, 255, 255, 0.14)'
      : 'rgba(0, 0, 0, 0.12)',
    Radius_Border: '12',
    Text_Color_For_Input_Fields: isDark ? '#fafafa' : '#0f0f10',
    Color_For_Text_Placeholder: isDark
      ? 'rgba(255, 255, 255, 0.42)'
      : 'rgba(0, 0, 0, 0.42)',
    // Reference: light silver CTA in dark; solid near-black in light.
    Color_Primary: isDark ? '#e4e4e7' : '#18181b',
    Text_Color_For_Payment_Button: isDark ? '#18181b' : '#fafafa',
    Color_Border_Payment_Button: 'transparent',
    Color_Error: isDark ? '#f87171' : '#dc2626',
    // Keep dark text readable on the muted disabled fill.
    Color_Disabled: isDark ? '#a1a1aa' : '#d4d4d8',
    Width_of_Container: '100%',
    Vertical_Padding: '48',
    Container_Padding: '0',
    Vertical_Spacing_between_components: '20',
  };
}

export type PaymobEmbedSession = {
  clientSecret: string;
  publicKey: string;
  orderId: string;
};

type PaymobPixelCheckoutProps = {
  session: PaymobEmbedSession;
  className?: string;
  onReady?: () => void;
};

function waitForLayout(): Promise<void> {
  return new Promise((resolve) => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

async function waitForContainerWidth(container: HTMLElement): Promise<void> {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (container.offsetWidth > 0) {
      return;
    }

    await new Promise<void>((resolve) => {
      requestAnimationFrame(() => resolve());
    });
  }
}

/**
 * Renders Paymob's Pixel SDK inside the checkout page.
 * Card data is collected inside Paymob-hosted iframes (PCI SAQ-A).
 */
export function PaymobPixelCheckout({
  session,
  className,
  onReady,
}: PaymobPixelCheckoutProps) {
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const reactId = useId().replace(/:/g, '');
  const containerId = `paymob-checkout-embed-${reactId}`;
  const containerRef = useRef<HTMLDivElement>(null);
  const onReadyRef = useRef(onReady);
  const [isThemeReady, setIsThemeReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const isDark = resolvedTheme === 'dark';

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (resolvedTheme != null) {
      setIsThemeReady(true);
    }
  }, [resolvedTheme]);

  useEffect(() => {
    if (!isThemeReady) {
      return;
    }

    let cancelled = false;
    let readyTimeout: ReturnType<typeof setTimeout> | undefined;

    const markReady = () => {
      if (cancelled) {
        return;
      }

      setIsLoading(false);
      onReadyRef.current?.();
    };

    const container = containerRef.current;

    async function initPixel() {
      setIsLoading(true);
      await import('paymob-pixel');

      if (cancelled || typeof window.Pixel !== 'function' || !container) {
        return;
      }

      container.replaceChildren();

      await waitForContainerWidth(container);
      await waitForLayout();

      if (cancelled) {
        return;
      }

      new window.Pixel({
        publicKey: session.publicKey,
        clientSecret: session.clientSecret,
        paymentMethods: ['card'],
        elementId: containerId,
        customStyle: buildPaymobStyle(isDark),
        afterPaymentComplete: async () => {
          const params = new URLSearchParams({ orderId: session.orderId });
          router.push(`${APP_ROUTES.PAYMENT_SUCCESS}?${params.toString()}`);
        },
      });

      // Give the SDK a beat to finish Shadow DOM paint before revealing.
      readyTimeout = setTimeout(markReady, 250);
    }

    void initPixel();

    return () => {
      cancelled = true;
      if (readyTimeout) {
        clearTimeout(readyTimeout);
      }
      container?.replaceChildren();
    };
  }, [
    containerId,
    isDark,
    isThemeReady,
    router,
    session.clientSecret,
    session.orderId,
    session.publicKey,
  ]);

  return (
    <div className={cn('relative w-full', className)} dir="rtl">
      <div
        ref={containerRef}
        id={containerId}
        className="min-h-88 w-full"
        aria-label="نموذج الدفع من Paymob"
        aria-busy={isLoading}
      />

      {isLoading ? (
        <div
          className="absolute inset-0 z-10 flex min-h-88 items-center justify-center rounded-xl bg-background/80 backdrop-blur-[1px]"
          aria-live="polite"
        >
          <Spinner className="size-6" />
          <span className="sr-only">جاري تحميل نموذج الدفع…</span>
        </div>
      ) : null}
    </div>
  );
}
