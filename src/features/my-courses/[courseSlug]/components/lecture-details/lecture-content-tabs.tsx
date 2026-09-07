'use client';

import React, { type ReactNode } from 'react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface LectureTab {
  value: string;
  label: string;
  className?: string;
  content?: ReactNode;
  soon?: boolean;
}

const tabs: LectureTab[] = [
  { value: 'notes', label: 'الملاحظات', soon: true },
  { value: 'reviews', label: 'المراجعات', soon: true },
];

export function LectureContentTabs() {
  return (
    <Tabs defaultValue="notes" className="w-full px-4 border-b border-border/40">
      <TabsList>
        {tabs.map((tab) => (
          <TabsTrigger key={tab.value} value={tab.value}>
            {tab.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {tabs.map((tab) => (
        <TabsContent
          key={tab.value}
          value={tab.value}
          className={cn('mt-2 md:mt-6', tab.className)}
        >
          {tab.content ?? (
            <div className="py-6 text-center text-muted-foreground">
              {tab.soon
                ? `محتوى ${tab.label} قريباً...`
                : null}
            </div>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
