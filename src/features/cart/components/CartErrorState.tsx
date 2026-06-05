import Link from 'next/link';
import { RefreshCw, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function CartErrorState() {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-20 space-y-6 text-center',
      )}
    >
      <div className={cn('p-6 bg-destructive/10 rounded-full')}>
        <ShoppingBag className={cn('size-12 text-destructive')} />
      </div>
      <div className="space-y-2">
        <h2 className={cn('text-2xl font-bold')}>عذراً، حدث خطأ في الاتصال</h2>
        <p className={cn('text-muted-foreground max-w-xs mx-auto')}>
          لا يمكننا الوصول . يرجى المحاولة مرة أخرى لاحقاً.
        </p>
      </div>
      <Button variant="outline" className="rounded-full gap-2" asChild>
        <Link href="/cart">
          <RefreshCw className="size-4" />
          إعادة المحاولة
        </Link>
      </Button>
    </div>
  );
}
