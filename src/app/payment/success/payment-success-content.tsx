'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/shared/link';
import { APP_ROUTES } from '@/constants/enums';
import { ORDER_ENDPOINTS } from '@/constants/order';
import type { Order } from '@/types/order/order.ui';

const POLL_INTERVAL_MS = 2000;
const MAX_POLLS = 45; // ~90s

export default function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId =
    searchParams.get('orderId') ?? searchParams.get('order') ?? null;

  const [order, setOrder] = useState<Order | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const [timedOut, setTimedOut] = useState(false);
  const [missingOrder, setMissingOrder] = useState(!orderId);
  const pollsRef = useRef(0);

  useEffect(() => {
    if (!orderId) {
      setMissingOrder(true);
      return;
    }

    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const poll = async () => {
      try {
        const res = await fetch(ORDER_ENDPOINTS.GET_ORDER(orderId));
        if (!res.ok) {
          throw new Error('Order fetch failed');
        }

        const data = (await res.json()) as Order | null;
        if (cancelled) return;

        if (!data) {
          setMissingOrder(true);
          return;
        }

        setOrder(data);

        if (data.status === 'COMPLETED') {
          setConfirmed(true);
          return;
        }

        pollsRef.current += 1;
        if (pollsRef.current >= MAX_POLLS) {
          setTimedOut(true);
          return;
        }

        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      } catch {
        if (cancelled) return;
        pollsRef.current += 1;
        if (pollsRef.current >= MAX_POLLS) {
          setTimedOut(true);
          return;
        }
        timeoutId = setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    void poll();

    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [orderId]);

  if (missingOrder) {
    return (
      <main
        className="min-h-[60vh] flex flex-col items-center justify-center px-4 text-center gap-4"
        dir="rtl"
      >
        <h1 className="text-2xl font-bold text-foreground">
          لم يتم العثور على الطلب
        </h1>
        <p className="text-sm text-muted-foreground max-w-md">
          قد يستغرق تأكيد الدفع بضع لحظات. إن كنت قد أكملت الدفع، تحقق من دوراتك
          قريباً.
        </p>
        <Button asChild size="lg" className="rounded-lg">
          <Link href={APP_ROUTES.MY_COURSES}>دوراتي</Link>
        </Button>
      </main>
    );
  }

  return (
    <main
      className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center"
      dir="rtl"
    >
      <div className="max-w-md w-full flex flex-col items-center gap-6">
        {confirmed ? (
          <CheckCircle2 className="size-14 text-primary" aria-hidden />
        ) : (
          <Loader2 className="size-14 animate-spin text-primary" aria-hidden />
        )}

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            {confirmed ? 'تم تأكيد الدفع' : 'تم استلام الدفع'}
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {confirmed
              ? 'تم تأكيد طلبك وتفعيل التسجيل في الدورات.'
              : 'بانتظار التأكيد… يتم تفعيل التسجيل بعد تأكيد بوابة الدفع عبر الـ webhook.'}
          </p>
        </div>

        {order && (
          <p className="text-xs text-muted-foreground font-mono">
            رقم الطلب: {order.orderNumber ?? order.id}
          </p>
        )}

        {timedOut && !confirmed && (
          <p className="text-sm text-muted-foreground leading-relaxed">
            التأكيد يستغرق وقتاً أطول من المعتاد. ستصلك الدورات تلقائياً عند
            اكتمال المعالجة — يمكنك متابعة التعلّم من صفحة دوراتي.
          </p>
        )}

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button asChild size="lg" className="rounded-lg">
            <Link href={APP_ROUTES.MY_COURSES}>الذهاب إلى دوراتي</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-lg">
            <Link href={APP_ROUTES.COURSES}>استكشف المزيد</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
