'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CartCouponSectionProps {
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function CartCouponSection({
  isOpen: controlledOpen,
  onOpenChange,
}: CartCouponSectionProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [couponCode, setCouponCode] = useState('');

  const isOpen = controlledOpen ?? internalOpen;

  const setOpen = (open: boolean) => {
    onOpenChange?.(open);
    if (controlledOpen === undefined) {
      setInternalOpen(open);
    }
  };

  const handleApply = (event: React.FormEvent) => {
    event.preventDefault();

    const code = couponCode.trim();
    if (!code) return;

    // TODO: wire up coupon apply API when available
  };

  if (!isOpen) {
    return (
      <div className="pt-6 border-t border-border">
        <Button
          type="button"
          variant="outline"
          className="w-full h-12 rounded-lg border-primary text-primary hover:bg-primary/5 hover:text-primary hover:border-primary"
          onClick={() => setOpen(true)}
        >
          تطبيق القسيمة
        </Button>
      </div>
    );
  }

  return (
    <div className="pt-6 border-t border-border flex flex-col gap-4">
      <h3 className="text-base font-bold text-foreground">عروض ترويجية</h3>

      <form onSubmit={handleApply} className="flex gap-2">
        <Input
          type="text"
          dir="rtl"
          placeholder="إدخال القسيمة"
          value={couponCode}
          onChange={(event) => setCouponCode(event.target.value)}
          className="flex-1 h-12 rounded-lg"
        />
        <Button
          type="submit"
          className="h-12 px-6 rounded-lg font-semibold shrink-0"
          disabled={!couponCode.trim()}
        >
          قدم
        </Button>
      </form>
    </div>
  );
}
