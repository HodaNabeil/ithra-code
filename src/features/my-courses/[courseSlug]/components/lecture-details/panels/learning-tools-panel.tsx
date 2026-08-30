import React from 'react';
import { Wrench } from 'lucide-react';

export function LearningToolsPanel() {
  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
        <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <Wrench className="size-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-bold mb-2">أدوات التعلم</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">
          تحقق من الأدوات المساعدة والمصادر الإضافية التي قد تساعدك في فهم هذه
          المحاضرة بشكل أفضل.
        </p>
      </div>
    </div>
  );
}
