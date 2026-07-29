import React from 'react';
export * from './LectureView';
import { TabTriggers } from './tab-triggers';
import { TabPanels } from './tab-panels';
import { Tabs } from '@/components/shared/Tabs';

interface LectureContentTabsProps {
  description?: string;
  content?: string;
  updatedAt?: string;
  aiTutorEnabled?: boolean;
  courseSlug?: string;
  lectureId?: string;
  lectureTitle?: string;
}

export function LectureContentTabs({
  description,
  updatedAt,
  aiTutorEnabled,
  courseSlug,
  lectureId,
  lectureTitle,
}: LectureContentTabsProps) {
  return (
    <Tabs className="w-full px-4 border-b border-border/40" dir="rtl">
      <TabTriggers aiTutorEnabled={aiTutorEnabled} />
      <TabPanels
        description={description || ''}
        updatedAt={updatedAt}
        aiTutorEnabled={aiTutorEnabled}
        courseSlug={courseSlug}
        lectureId={lectureId}
        lectureTitle={lectureTitle}
      />
    </Tabs>
  );
}
