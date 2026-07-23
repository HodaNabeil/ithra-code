'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import 'paymob-pixel';
import { APP_ROUTES } from '@/constants/enums';
import { cn } from '@/lib/utils';

const PIXEL_CONTAINER_ID = 'paymob-checkout-embed';

/** Matches the grouped card-input border style in the checkout mock. */
const PAYMOB_CHECKOUT_STYLE = {
  HideCardLabel: true,
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
    payBtn: 'Pay EGP',
  },
  Color_Container: 'transparent',
  Color_Input_Fields: 'transparent',
  Color_Border_Input_Fields: 'rgba(255, 255, 255, 0.12)',
  Radius_Border: '10',
  Text_Color_For_Input_Fields: '#ffffff',
  Color_For_Text_Placeholder: 'rgba(255, 255, 255, 0.45)',
  Color_Primary: '#d4d4d4',
  Text_Color_For_Payment_Button: '#0f0f0f',
  Color_Border_Payment_Button: 'transparent',
  Width_of_Container: '100%',
  Vertical_Padding: '0',
  Container_Padding: '0',
  Vertical_Spacing_between_components: '0',
} as const;

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
  const mountedRef = useRef(false);
  const onReadyRef = useRef(onReady);

  useEffect(() => {
    onReadyRef.current = onReady;
  }, [onReady]);

  useEffect(() => {
    if (mountedRef.current || typeof window.Pixel !== 'function') {
      return;
    }

    mountedRef.current = true;

    const container = document.getElementById(PIXEL_CONTAINER_ID);
    if (!container) {
      return;
    }

    const observer = new MutationObserver(() => {
      const hasPaymobContent = container.querySelector('iframe, form, input');
      if (hasPaymobContent) {
        observer.disconnect();
        onReadyRef.current?.();
      }
    });

    observer.observe(container, { childList: true, subtree: true });

    new window.Pixel({
      publicKey: session.publicKey,
      clientSecret: session.clientSecret,
      paymentMethods: ['card'],
      elementId: PIXEL_CONTAINER_ID,
      customStyle: PAYMOB_CHECKOUT_STYLE,
      afterPaymentComplete: async () => {
        const params = new URLSearchParams({ orderId: session.orderId });
        router.push(`${APP_ROUTES.PAYMENT_SUCCESS}?${params.toString()}`);
      },
    });

    return () => observer.disconnect();
  }, [router, session.clientSecret, session.orderId, session.publicKey]);

  return (
    <div className={cn('flex flex-col gap-3', className)} dir="rtl">
      <div
        id={PIXEL_CONTAINER_ID}
        className="min-h-55 w-full"
        aria-label="نموذج الدفع من Paymob"
      />
    </div>
  );
}
