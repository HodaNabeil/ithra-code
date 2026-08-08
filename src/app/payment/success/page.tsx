import { Suspense } from 'react';
import { Loader2 } from 'lucide-react';
import PaymentSuccessContent from './payment-success-content';

function SuccessFallback() {
  return (
    <div
      className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-muted-foreground"
      dir="rtl"
    >
      <Loader2 className="size-10 animate-spin text-primary" aria-hidden />
      <p className="text-sm font-medium">جاري تحميل حالة الدفع…</p>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<SuccessFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
