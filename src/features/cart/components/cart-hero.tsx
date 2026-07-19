import { cn } from '@/lib/utils';

interface CartHeroProps {
  itemCount?: number;
  className?: string;
}

export function CartHero({ itemCount, className }: CartHeroProps) {
  return (
    <div className={cn('text-foreground', className)}>
      <h1 className="lg:text-5xl md:text-4xl text-3xl font-bold text-foreground mb-2 lg:mb-1.5">
        عربة التسوق
      </h1>
      {itemCount != null && itemCount > 0 && (
        <p className="hidden lg:block text-muted-foreground text-lg">
          يوجد {itemCount} من الدورات في السلة
        </p>
      )}
    </div>
  );
}
