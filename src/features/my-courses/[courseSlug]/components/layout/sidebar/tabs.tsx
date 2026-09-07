'use client';

import React, { useState } from 'react';
import { CourseSidebarHeader } from './header';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AITutorChat } from '@/features/ai-tutor/presentation/components/AITutorChat';
import { CourseSidebarAssistant } from './assistant';
import { SectionAccordion } from '@/features/my-courses/[courseSlug]/components/content/section-accordion';
import { SidebarScrollArea } from './scroll-area';
import { useCourseLayoutStore } from '@/features/my-courses/[courseSlug]/stores/use-course-layout-store';

interface CourseSidebarTabsProps {
  isAiTutorEnabled?: boolean;
}

export const CourseSidebarTabs: React.FC<CourseSidebarTabsProps> = ({
  isAiTutorEnabled = false,
}) => {
  const [activeTab, setActiveTab] = useState('content');
  const activeCourseSlug = useCourseLayoutStore((s) => s.activeCourseSlug);
  const activeLecture = useCourseLayoutStore((s) => s.activeLecture);

  if (!activeCourseSlug) {
    return null;
  }

  return (
    <Tabs
      dir="rtl"
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex h-full flex-col gap-0 overflow-hidden border-s border-border/50 bg-sidebar"
    >
      <CourseSidebarHeader isAiTutorEnabled={isAiTutorEnabled} />

      <TabsContent
        value="content"
        className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
      >
        <SidebarScrollArea>
          <SectionAccordion courseSlug={activeCourseSlug} />
        </SidebarScrollArea>
      </TabsContent>

      {isAiTutorEnabled && (
        <TabsContent
          value="assistant"
          className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          {activeLecture ? (
            <AITutorChat
              variant="sidebar"
              courseSlug={activeCourseSlug}
              lectureId={activeLecture.lectureId}
              lectureTitle={activeLecture.lectureTitle}
              courseTitle={activeLecture.courseTitle}
            />
          ) : (
            <CourseSidebarAssistant />
          )}
        </TabsContent>
      )}
    </Tabs>
  );
};
