import { Button } from '@/components/ui/button';
import { Link } from '@/components/shared/link';
import { APP_ROUTES } from '@/constants/enums';
import { XCircle } from 'lucide-react';

export default function PaymentCancelPage() {
  return (
    <main
      className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-16 text-center"
      dir="rtl"
    >
      <div className="max-w-md w-full flex flex-col items-center gap-6">
        <XCircle className="size-14 text-muted-foreground" aria-hidden />

        <div className="flex flex-col gap-2">
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
            تم إلغاء الدفع
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            لم يتم خصم أي مبلغ. يمكنك العودة لإتمام الشراء في أي وقت، أو متابعة
            التسوّق من السلة.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Button asChild size="lg" className="rounded-lg">
            <Link href={APP_ROUTES.CHECKOUT}>إعادة المحاولة</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="rounded-lg">
            <Link href={APP_ROUTES.CART}>العودة إلى السلة</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
