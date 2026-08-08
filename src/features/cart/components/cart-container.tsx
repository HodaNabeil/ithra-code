import type { CartDataType } from '@/types/cart/cart';
import { CartContents } from './cart-contents';
import { Button } from '@/components/ui/button';
import { Link } from '@/components/shared/link';
import { APP_ROUTES } from '@/constants/enums';
import { ShoppingBag } from 'lucide-react';

type CartContainerProps = {
  cart: CartDataType;
};

export function CartContainer({ cart }: CartContainerProps) {
  if (cart.items.length === 0) {
    return (
      <div
        className="flex flex-col items-center justify-center
       py-20 px-4 text-center space-y-6"
      >
        <div className="w-24 h-24 bg-sidebar-background rounded-full flex items-center justify-center">
          <ShoppingBag className="w-12 h-12 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-2xl font-bold">عربة التسوق فارغة</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            لم تقم بإضافة أي دورات إلى عربة التسوق الخاصة بك بعد. ابدأ في
            استكشاف دوراتنا التعليمية الآن!
          </p>
        </div>
        <Button asChild size="lg" className="rounded-full px-8">
          <Link href={APP_ROUTES.COURSES}>استكشف الدورات</Link>
        </Button>
      </div>
    );
  }

  return <CartContents cart={cart} />;
}
