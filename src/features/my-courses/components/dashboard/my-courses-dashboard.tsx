'use client';

import { useCallback, useMemo, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  DASHBOARD_TABS,
  SEARCH_PARAMS_KEYS,
  type DashboardTab,
} from '@/constants/my-courses';
import type { EnrollmentItem } from '@/types/course/course.types';
import { CertificatesPlaceholder } from './certificates-placeholder';
import { deriveProgressStats } from '@/features/my-courses/lib/dashboard-stats';
import { ProgressStatsWidget } from './progress-stats-widget';
import { StudentDashboardTabs } from './student-dashboard-tabs';

type MyCoursesDashboardProps = {
  allEnrollments: EnrollmentItem[];
  totalEnrollments?: number;
  initialTab?: string;
  enrollmentsContent: React.ReactNode;
};

function resolveDashboardTab(tab: string | null | undefined): DashboardTab {
  return DASHBOARD_TABS.includes(tab as DashboardTab)
    ? (tab as DashboardTab)
    : 'enrollments';
}

export function MyCoursesDashboard({
  allEnrollments,
  totalEnrollments: _totalEnrollments,
  initialTab,
  enrollmentsContent,
}: MyCoursesDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const activeTab = resolveDashboardTab(
    searchParams.get(SEARCH_PARAMS_KEYS.TAB) ?? initialTab ?? null,
  );

  const handleTabChange = useCallback(
    (tab: DashboardTab) => {
      const params = new URLSearchParams(searchParams.toString());

      if (tab === 'enrollments') {
        params.delete(SEARCH_PARAMS_KEYS.TAB);
      } else {
        params.set(SEARCH_PARAMS_KEYS.TAB, tab);
      }

      const queryString = params.toString();
      const url = queryString ? `${pathname}?${queryString}` : pathname;

      startTransition(() => {
        router.push(url);
      });
    },
    [pathname, router, searchParams],
  );

  const progressStats = useMemo(
    () => deriveProgressStats(allEnrollments),
    [allEnrollments],
  );

  return (
    <div className="container py-6 lg:py-8">
      <div className="mb-6 lg:mb-8">
        <ProgressStatsWidget stats={progressStats} />
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          handleTabChange(resolveDashboardTab(value))
        }
        className="w-full"
      >
        <StudentDashboardTabs />

        <TabsContent
          value="enrollments"
          forceMount
          className="pt-6 lg:pt-8 data-[state=inactive]:hidden"
        >
          {enrollmentsContent}
        </TabsContent>

        <TabsContent value="certificates" className="pt-6 lg:pt-8">
          <CertificatesPlaceholder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
