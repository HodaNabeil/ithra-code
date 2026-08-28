'use client';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';

type TabTriggersProps = {
  aiTutorEnabled?: boolean;
};

export function TabTriggers({ aiTutorEnabled = false }: TabTriggersProps) {
  const tabs = [
    { value: 'overview', label: 'نظرة عامة' },
    {
      value: 'qna',
      label: aiTutorEnabled ? 'المدرس الذكي' : 'الأسئلة والأجوبة',
      soon: !aiTutorEnabled,
    },
    { value: 'notes', label: 'الملاحظات', soon: true },
    { value: 'reviews', label: 'المراجعات', soon: true },
  ];

  return (
    <TabsList>
      {tabs.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value} disabled={tab.soon}>
          {tab.label}
          {tab.soon && (
            <span className="px-1 py-0.5 bg-primary/15 text-primary text-[10px] font-bold rounded-md border border-primary/20">
              قريباً
            </span>
          )}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
