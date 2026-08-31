'use client';

import { useState } from 'react';
import { BookOpen, Clock, FileText, Wrench } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Select from '@/components/shared/select';
import type { ProgressStats } from '@/features/my-courses/lib/dashboard-stats';

const PERIOD_OPTIONS = [
  { label: '٣٠ يوماً', value: '30d' },
  { label: '٧ أيام', value: '7d' },
  { label: '٩٠ يوماً', value: '90d' },
  { label: 'الكل', value: 'all' },
];

type StatKey = keyof ProgressStats;

type StatItem = {
  key: StatKey;
  label: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
};

const STAT_ITEMS: StatItem[] = [
  {
    key: 'learningHours',
    label: 'ساعات التعلم',
    icon: Clock,
    iconBg: 'bg-chart-primary-stroke/10',
    iconColor: 'text-chart-primary-stroke',
  },
  {
    key: 'completedConcepts',
    label: 'المفاهيم المكتملة',
    icon: FileText,
    iconBg: 'bg-success/10',
    iconColor: 'text-success',
  },
  {
    key: 'completedLessons',
    label: 'الدروس المكتملة',
    icon: BookOpen,
    iconBg: 'bg-brand/10',
    iconColor: 'text-brand',
  },
  {
    key: 'completedProjects',
    label: 'المشاريع المكتملة',
    icon: Wrench,
    iconBg: 'bg-collection-purple-900/10',
    iconColor: 'text-collection-purple-900',
  },
];

function formatStatValue(key: StatKey, value: number) {
  if (key === 'learningHours') {
    return Number.isInteger(value) ? value : value.toFixed(1);
  }

  return value;
}

type ProgressStatsWidgetProps = {
  stats: ProgressStats;
};

export function ProgressStatsWidget({ stats }: ProgressStatsWidgetProps) {
  const [period, setPeriod] = useState('30d');

  return (
    <section className="h-fit rounded-2xl border border-border bg-content-surface p-5 shadow-sm ring-0">
      <div className="mb-5 flex items-center justify-between gap-3">
        <h2 className="text-base font-bold text-foreground">تقدمك</h2>
        <Select
          options={PERIOD_OPTIONS}
          value={period}
          onValueChange={setPeriod}
          className="h-9 min-w-28 rounded-lg border-border bg-card text-xs font-medium shadow-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        {STAT_ITEMS.map(({ key, label, icon: Icon, iconBg, iconColor }) => (
          <div
            key={key}
            className="flex flex-col gap-3 rounded-xl bg-card p-4 ring-1 ring-foreground/5"
          >
            <div
              className={`element-center size-10 shrink-0 rounded-full ${iconBg}`}
            >
              <Icon
                className={`size-5 stroke-[2.5px] ${iconColor}`}
                aria-hidden
              />
            </div>
            <span className="text-2xl font-bold leading-none tabular-nums text-foreground">
              {formatStatValue(key, stats[key])}
            </span>
            <span className="text-sm leading-snug text-muted-foreground">
              {label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
