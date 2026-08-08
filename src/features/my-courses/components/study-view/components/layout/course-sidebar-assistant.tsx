'use client';

import React from 'react';
import { Sparkles } from 'lucide-react';

interface CourseSidebarAssistantProps {
  aiTutorEnabled?: boolean;
  hasLectureContext?: boolean;
}

export const CourseSidebarAssistant: React.FC<CourseSidebarAssistantProps> = ({
  aiTutorEnabled = false,
  hasLectureContext = false,
}) => {
  const message = !aiTutorEnabled
    ? 'ميزة المدرس الذكي غير مفعّلة حالياً.'
    : !hasLectureContext
      ? 'افتح محاضرة من قائمة المحتوى لبدء المحادثة مع المدرس الذكي.'
      : 'اسأل أي سؤال حول محتوى الدورة وسأساعدك في الفهم الفوري والتعلم العميق.';

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-6 gap-6">
      <div className="relative">
        <div className="absolute -inset-4 bg-primary/10 rounded-full blur-2xl animate-pulse" />
        <div className="relative size-20 rounded-3xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-inner">
          <Sparkles className="size-10 text-primary" />
        </div>
      </div>
      <div className="space-y-2 max-w-60">
        <h3 className="text-xl font-bold tracking-tight">المدرس الذكي</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {message}
        </p>
      </div>
    </div>
  );
};
