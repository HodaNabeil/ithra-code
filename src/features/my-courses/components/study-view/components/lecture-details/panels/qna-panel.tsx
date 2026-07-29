'use client';

import React from 'react';
import { MessageSquare, Search } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AITutorChat } from '@/features/ai-tutor/presentation/components/AITutorChat';

type QnAPanelProps = {
  aiTutorEnabled?: boolean;
  courseSlug?: string;
  lectureId?: string;
  lectureTitle?: string;
  courseTitle?: string;
};

export function QnAPanel({
  aiTutorEnabled = false,
  courseSlug,
  lectureId,
  lectureTitle,
  courseTitle,
}: QnAPanelProps) {
  if (aiTutorEnabled && courseSlug) {
    return (
      <AITutorChat
        courseSlug={courseSlug}
        lectureId={lectureId}
        lectureTitle={lectureTitle}
        courseTitle={courseTitle}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="البحث في كل أسئلة المحاضرة..."
            className="pr-10 rounded-xl bg-muted/30 border-border/50 focus-visible:ring-primary/20"
          />
        </div>
        <Button className="rounded-xl px-6 gap-2 w-full md:w-auto">
          <MessageSquare className="size-4" />
          طرح سؤال جديد
        </Button>
      </div>

      <div className="rounded-2xl border border-dashed border-border/60 p-16 text-center">
        <div className="size-16 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-4">
          <MessageSquare className="size-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-bold mb-2">لا توجد أسئلة بعد</h3>
        <p className="text-muted-foreground max-w-xs mx-auto">
          كن أول من يطرح سؤالاً في هذه المحاضرة. المحاضر والطلاب الآخرون موجودون
          هنا للمساعدة.
        </p>
      </div>
    </div>
  );
}
