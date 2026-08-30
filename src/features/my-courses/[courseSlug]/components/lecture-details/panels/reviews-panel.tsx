import React from 'react';
import { Star } from 'lucide-react';

export function ReviewsPanel() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
        <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Star className="size-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-bold mb-2">التقييمات والمراجعات</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">
          سيتم عرض تقييمات الطلاب لهذه المحاضرة والتعليقات هنا.
        </p>
      </div>
    </div>
  );
}
