'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

export const CourseSidebarAssistant: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-6">
      <div className="relative">
        <div className="absolute -inset-4 rounded-full bg-brand/10 blur-2xl animate-pulse" />
        <div className="relative flex size-20 items-center justify-center rounded-3xl border border-brand/20 bg-brand/10 shadow-inner ring-1 ring-brand/15">
          <Sparkles className="size-10 text-brand" />
        </div>
      </div>
      <div className="space-y-2 max-w-60">
        <h3 className="text-xl font-bold tracking-tight">المدرس الذكي</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          افتح محاضرة من قائمة المحتوى لبدء المحادثة مع المدرس الذكي.
        </p>
      </div>
    </div>
  );
};
