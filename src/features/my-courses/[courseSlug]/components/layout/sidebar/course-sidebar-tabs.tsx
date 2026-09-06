'use client';

import React, { useState } from 'react';
import { CourseSidebarHeader } from '@/features/my-courses/[courseSlug]/components/layout/sidebar/course-sidebar-header';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { AITutorChat } from '@/features/ai-tutor/presentation/components/AITutorChat';
import { CourseSidebarAssistant } from '@/features/my-courses/[courseSlug]/components/layout/sidebar/course-sidebar-assistant';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SectionAccordion } from '@/features/my-courses/[courseSlug]/components/content/SectionAccordion';
import { useCourseLayoutStore } from '@/features/my-courses/[courseSlug]/stores/use-course-layout-store';

interface CourseSidebarTabsProps {
  isAiTutorEnabled?: boolean;
}

export const CourseSidebarTabs: React.FC<CourseSidebarTabsProps> = ({
  isAiTutorEnabled = false,
}) => {
  const [activeTab, setActiveTab] = useState('content');
  const activeCourseSlug = useCourseLayoutStore((s) => s.activeCourseSlug);
  const currentLecture = useCourseLayoutStore((s) => s.currentLecture);

  if (!activeCourseSlug) {
    return null;
  }

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex h-full flex-col gap-0 bg-sidebar border-l border-border/50"
    >
      <CourseSidebarHeader isAiTutorEnabled={isAiTutorEnabled} />

      <TabsContent
        value="content"
        className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
      >
        <ScrollArea className="min-h-0 flex-1">
          <SectionAccordion courseSlug={activeCourseSlug} />
        </ScrollArea>
      </TabsContent>

      {isAiTutorEnabled && (
        <TabsContent
          value="assistant"
          className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
        >
          {currentLecture ? (
            <AITutorChat
              variant="sidebar"
              courseSlug={activeCourseSlug}
              lectureId={currentLecture.lectureId}
              lectureTitle={currentLecture.lectureTitle}
              courseTitle={currentLecture.courseTitle}
            />
          ) : (
            <CourseSidebarAssistant />
          )}
        </TabsContent>
      )}
    </Tabs>
  );
};
