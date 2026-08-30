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
import { ContinueLearningCard } from './continue-learning-card';
import {
  deriveProgressStats,
  pickContinueLearningEnrollment,
} from './dashboard-utils';
import { ProgressStatsWidget } from './progress-stats-widget';
import { StudentDashboardTabs } from './student-dashboard-tabs';

type MyCoursesDashboardProps = {
  allEnrollments: EnrollmentItem[];
  totalEnrollments: number;
  initialTab?: string;
  enrollmentsContent: React.ReactNode;
};

function resolveDashboardTab(tab: string | null | undefined): DashboardTab {
  return DASHBOARD_TABS.includes(tab as DashboardTab)
    ? (tab as DashboardTab)
    : 'overview';
}

export function MyCoursesDashboard({
  allEnrollments,
  totalEnrollments,
  initialTab,
  enrollmentsContent,
}: MyCoursesDashboardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const activeTab = resolveDashboardTab(
    searchParams.get(SEARCH_PARAMS_KEYS.TAB) ?? initialTab ?? null,
  );

  const handleTabChange = useCallback(
    (tab: DashboardTab) => {
      const params = new URLSearchParams(searchParams.toString());

      if (tab === 'overview') {
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

  const continueLearningEnrollment = useMemo(
    () => pickContinueLearningEnrollment(allEnrollments),
    [allEnrollments],
  );
  const progressStats = useMemo(
    () => deriveProgressStats(allEnrollments),
    [allEnrollments],
  );

  return (
    <div className="container py-6 lg:py-8">
      <Tabs
        value={activeTab}
        onValueChange={(value) =>
          handleTabChange(resolveDashboardTab(value))
        }
        className="w-full"
      >
        <StudentDashboardTabs />

        <TabsContent value="overview" className="pt-6 lg:pt-8">
          <div className="rounded-[9px] p-5 shadow-[0px_0px_5px_#0000003d]">
            <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
              <section className="min-w-0 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-xl font-bold text-foreground">
                    تابع التعلم
                  </h2>
                  <button
                    type="button"
                    onClick={() => handleTabChange('enrollments')}
                    className="text-sm font-semibold text-progress-indicator"
                    disabled={isPending}
                  >
                    جميع التسجيلات ({totalEnrollments})
                  </button>
                </div>

                {continueLearningEnrollment ? (
                  <ContinueLearningCard enrollment={continueLearningEnrollment} />
                ) : (
                  <div className="rounded-xl border border-dashed border-border bg-muted/20 p-10 text-center text-muted-foreground">
                    لا توجد دورات للمتابعة حالياً
                  </div>
                )}
              </section>

              <ProgressStatsWidget stats={progressStats} />
            </div>
          </div>
        </TabsContent>

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
