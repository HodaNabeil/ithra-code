'use client';

import { TabsList, TabsTrigger } from '@/components/ui/tabs';

const DASHBOARD_TAB_ITEMS = [
  { value: 'enrollments', label: 'دوراتي' },
  { value: 'certificates', label: 'الشهادات' },
] as const;

export function StudentDashboardTabs() {
  return (
    <TabsList>
      {DASHBOARD_TAB_ITEMS.map((tab) => (
        <TabsTrigger key={tab.value} value={tab.value}>
          {tab.label}
        </TabsTrigger>
      ))}
    </TabsList>
  );
}
