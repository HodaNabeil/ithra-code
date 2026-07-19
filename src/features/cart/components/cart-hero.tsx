interface CartHeroProps {
  itemCount?: number;
}

export function CartHero({ itemCount }: CartHeroProps) {
  return (
    <div className="container mt-8 text-foreground   px-4">
      <h1 className="lg:text-5xl md:text-4xl text-3xl font-bold text-foreground mb-2">
        عربة التسوق
      </h1>
      {itemCount != null && itemCount > 0 && (
        <p className="text-muted-foreground text-lg mb-2">
          يوجد {itemCount} من الدورات في السلة
        </p>
      )}
    </div>
  );
}
