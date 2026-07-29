'use client';

import React from 'react';
import { Tabs, TabsContent } from '@/components/shared/Tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AITutorChat } from '@/features/ai-tutor/presentation/components/AITutorChat';
import { useCourseLearningLayoutStore } from '@/features/my-courses/stores/use-course-learning-layout-store';
import { SectionAccordion } from '../content/SectionAccordion';
import { CourseSidebarHeader } from './course-sidebar-header';
import { CourseSidebarAssistant } from './course-sidebar-assistant';

interface CourseSidebarContentProps {
  courseSlug: string;
  onClose?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
}

export const CourseSidebarContent: React.FC<CourseSidebarContentProps> = ({
  courseSlug,
  onClose,
  onMaximize,
  isMaximized,
}) => {
  const aiTutorEnabled = useCourseLearningLayoutStore((s) => s.aiTutorEnabled);
  const currentLecture = useCourseLearningLayoutStore((s) => s.currentLecture);

  return (
    <Tabs
      defaultValue="content"
      className="flex flex-col h-full bg-sidebar border-l border-border/50"
      dir="rtl"
    >
      <CourseSidebarHeader
        onClose={onClose}
        onMaximize={onMaximize}
        isMaximized={isMaximized}
      />

      {/* Sidebar Content Area */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
        {/* Content Tab */}
        <TabsContent value="content" className="m-0 flex h-full min-h-0 flex-col">
          <ScrollArea className="flex-1">
            <SectionAccordion courseSlug={courseSlug} />
          </ScrollArea>
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="assistant" className="m-0 flex h-full min-h-0 flex-col overflow-hidden">
          {aiTutorEnabled && currentLecture ? (
            <AITutorChat
              variant="sidebar"
              courseSlug={courseSlug}
              lectureId={currentLecture.lectureId}
              lectureTitle={currentLecture.lectureTitle}
              courseTitle={currentLecture.courseTitle}
            />
          ) : (
            <CourseSidebarAssistant
              aiTutorEnabled={aiTutorEnabled}
              hasLectureContext={Boolean(currentLecture)}
            />
          )}
        </TabsContent>
      </div>
    </Tabs>
  );
};
