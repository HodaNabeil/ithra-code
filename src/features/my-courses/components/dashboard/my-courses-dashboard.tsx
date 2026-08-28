'use client';

import { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import {
  DASHBOARD_TABS,
  SEARCH_PARAMS_KEYS,
  type DashboardTab,
} from '@/constants/my-courses';
import {
  readMyCoursesSearchParams,
  replaceMyCoursesUrl,
} from '@/features/my-courses/lib/my-courses-url';
import type { StudentCourseItem } from '@/types/course/course.types';
import CourseListManager from '../course-list/course-list-manager';
import { CertificatesPlaceholder } from './certificates-placeholder';
import { ContinueLearningCard } from './continue-learning-card';
import {
  deriveProgressStats,
  pickContinueLearningCourse,
} from './dashboard-utils';
import { ProgressStatsWidget } from './progress-stats-widget';
import { StudentDashboardTabs } from './student-dashboard-tabs';

type MyCoursesDashboardProps = {
  courses: StudentCourseItem[];
  totalEnrollments: number;
  currentPage: number;
  totalPages: number;
  initialTab?: string;
};

function resolveDashboardTab(tab: string | null): DashboardTab {
  return DASHBOARD_TABS.includes(tab as DashboardTab)
    ? (tab as DashboardTab)
    : 'overview';
}

function readTabFromUrl(): DashboardTab {
  const params = readMyCoursesSearchParams();
  return resolveDashboardTab(params.get(SEARCH_PARAMS_KEYS.TAB));
}

export function MyCoursesDashboard({
  courses,
  totalEnrollments,
  currentPage,
  totalPages,
  initialTab,
}: MyCoursesDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>(() =>
    resolveDashboardTab(initialTab ?? null),
  );

  const setActiveTabInUrl = useCallback((tab: DashboardTab) => {
    const params = readMyCoursesSearchParams();

    if (tab === 'overview') {
      params.delete(SEARCH_PARAMS_KEYS.TAB);
    } else {
      params.set(SEARCH_PARAMS_KEYS.TAB, tab);
    }

    replaceMyCoursesUrl(params);
  }, []);

  const handleTabChange = useCallback(
    (tab: DashboardTab) => {
      setActiveTab(tab);
      setActiveTabInUrl(tab);
    },
    [setActiveTabInUrl],
  );

  useEffect(() => {
    const syncTabFromUrl = () => {
      setActiveTab(readTabFromUrl());
    };

    window.addEventListener('popstate', syncTabFromUrl);
    return () => window.removeEventListener('popstate', syncTabFromUrl);
  }, []);

  const continueLearningCourse = useMemo(
    () => pickContinueLearningCourse(courses),
    [courses],
  );
  const progressStats = useMemo(() => deriveProgressStats(courses), [courses]);

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
          <div className="rounded-[9px]  p-5 shadow-[0px_0px_5px_#0000003d]">
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
                  >
                    جميع التسجيلات ({totalEnrollments})
                  </button>
                </div>

                {continueLearningCourse ? (
                  <ContinueLearningCard course={continueLearningCourse} />
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

        <TabsContent value="enrollments" forceMount className="pt-6 lg:pt-8 data-[state=inactive]:hidden">
          <Suspense fallback={null}>
            <CourseListManager
              initialCourses={courses}
              currentPage={currentPage}
              totalPages={totalPages}
            />
          </Suspense>
        </TabsContent>

        <TabsContent value="certificates" className="pt-6 lg:pt-8">
          <CertificatesPlaceholder />
        </TabsContent>
      </Tabs>
    </div>
  );
}
