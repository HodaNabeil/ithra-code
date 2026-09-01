import React from 'react';
import { StickyNote, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function NotesPanel() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-lg">ملاحظاتك الشخصية</h3>
        <Button
          variant="outline"
          className="rounded-xl gap-2 border-primary/20 text-primary hover:bg-primary/5"
        >
          <Plus className="size-4" />
          إضافة ملاحظة عند (0:45)
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
        <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <StickyNote className="size-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-bold mb-2">احتفظ بملاحظاتك هنا</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">
          يمكنك إضافة ملاحظات في أي وقت أثناء مشاهدة المحاضرة لتذكر النقاط
          المهمة لاحقاً.
        </p>
      </div>
    </div>
  );
}
