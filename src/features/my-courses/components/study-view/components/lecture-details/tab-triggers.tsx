import React from 'react';
import { TabsList, TabsTrigger } from '@/components/shared/Tabs';

type TabTriggersProps = {
  aiTutorEnabled?: boolean;
};

export function TabTriggers({ aiTutorEnabled = false }: TabTriggersProps) {
  const tabs = [
    { value: 'overview', label: 'نظرة عامة' },
    { value: 'qna', label: aiTutorEnabled ? 'المدرس الذكي' : 'الأسئلة والأجوبة', soon: !aiTutorEnabled },
    { value: 'notes', label: 'الملاحظات', soon: true },
    { value: 'reviews', label: 'المراجعات', soon: true },
  ];

  return (
    <div className="flex items-center  flex-col  lg:flex-row border-b border-border/40 w-full overflow-x-auto overflow-y-hidden no-scrollbar">
      <TabsList
        variant="line"
        className="h-auto   bg-transparent p-0 gap-8 justify-start rounded-none"
      >
        {tabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            disabled={tab.soon}
            className="px-0 pb-4 pt-2 flex items-center gap-2 bg-transparent 
            hover:bg-transparent data-active:bg-transparent data-active:shadow-none
             dark:data-active:bg-transparent rounded-none transition-all
              font-semibold text-foreground/50 data-active:text-primary
               text-base whitespace-nowrap group disabled:opacity-80"
          >
            {tab.label}
            {tab.soon && (
              <span className="px-1 py-0.5 bg-primary/15 text-primary text-[10px] font-bold rounded-md border border-primary/20 transition-colors">
                قريباً
              </span>
            )}
          </TabsTrigger>
        ))}
      </TabsList>
    </div>
  );
}
