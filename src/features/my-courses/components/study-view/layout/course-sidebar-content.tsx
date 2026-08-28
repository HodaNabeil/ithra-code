'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AITutorChat } from '@/features/ai-tutor/presentation/components/AITutorChat';
import { useCourseLearningLayoutStore } from '@/features/my-courses/stores/use-course-learning-layout-store';
import { SectionAccordion } from '../content/SectionAccordion';
import { CourseSidebarHeader } from './course-sidebar-header';
import { CourseSidebarAssistant } from './course-sidebar-assistant';

interface CourseSidebarContentProps {
  courseSlug: string;
  aiTutorEnabled?: boolean;
  onClose?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
}

export const CourseSidebarContent: React.FC<CourseSidebarContentProps> = ({
  courseSlug,
  aiTutorEnabled = false,
  onClose,
  onMaximize,
  isMaximized,
}) => {
  const [activeTab, setActiveTab] = useState('content');
  const currentLecture = useCourseLearningLayoutStore((s) => s.currentLecture);

  return (
    <Tabs
      value={activeTab}
      onValueChange={setActiveTab}
      className="flex h-full flex-col gap-0 bg-sidebar border-l border-border/50"
    >
      <CourseSidebarHeader
        onClose={onClose}
        onMaximize={onMaximize}
        isMaximized={isMaximized}
      />

      <TabsContent
        value="content"
        className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
      >
        <ScrollArea className="min-h-0 flex-1">
          <SectionAccordion courseSlug={courseSlug} />
        </ScrollArea>
      </TabsContent>

      <TabsContent
        value="assistant"
        className="m-0 flex min-h-0 flex-1 flex-col overflow-hidden data-[state=inactive]:hidden"
      >
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
    </Tabs>
  );
};
