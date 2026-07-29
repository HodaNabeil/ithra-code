import React from 'react';
import { TabsContent } from '@/components/shared/Tabs';
import { OverviewPanel } from './panels/overview-panel';
import { QnAPanel } from './panels/qna-panel';
import { NotesPanel } from './panels/notes-panel';
import { AnnouncementsPanel } from './panels/announcements-panel';
import { ReviewsPanel } from './panels/reviews-panel';
import { LearningToolsPanel } from './panels/learning-tools-panel';

interface TabPanelsProps {
  description: string;
  updatedAt?: string;
  aiTutorEnabled?: boolean;
  courseSlug?: string;
  lectureId?: string;
  lectureTitle?: string;
}

export function TabPanels({
  description,
  updatedAt,
  aiTutorEnabled,
  courseSlug,
  lectureId,
  lectureTitle,
}: TabPanelsProps) {
  return (
    <div className="py-8 focus-visible:ring-0">
      <TabsContent value="overview" className="focus-visible:ring-0 mt-0">
        <OverviewPanel description={description} updatedAt={updatedAt} />
      </TabsContent>

      <TabsContent value="qna" className="focus-visible:ring-0 mt-0">
        <QnAPanel
          aiTutorEnabled={aiTutorEnabled}
          courseSlug={courseSlug}
          lectureId={lectureId}
          lectureTitle={lectureTitle}
        />
      </TabsContent>

      <TabsContent value="notes" className="focus-visible:ring-0 mt-0">
        <NotesPanel />
      </TabsContent>

      <TabsContent value="announcements" className="focus-visible:ring-0 mt-0">
        <AnnouncementsPanel />
      </TabsContent>

      <TabsContent value="reviews" className="focus-visible:ring-0 mt-0">
        <ReviewsPanel />
      </TabsContent>

      <TabsContent value="tools" className="focus-visible:ring-0 mt-0">
        <LearningToolsPanel />
      </TabsContent>
    </div>
  );
}
