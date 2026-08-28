import React from 'react';
import { Megaphone } from 'lucide-react';

export function AnnouncementsPanel() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
        <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Megaphone className="size-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-bold mb-2">لا توجد إعلانات</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">
          المحاضر لم يقم بنشر أي إعلانات بخصوص هذه المحاضرة بعد.
        </p>
      </div>
    </div>
  );
}
