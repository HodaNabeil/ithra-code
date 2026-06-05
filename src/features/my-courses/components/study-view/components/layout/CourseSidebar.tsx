'use client';

import { Tabs, TabsContent } from '@/components/shared/Tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SectionAccordion } from '../content/SectionAccordion';
import { CourseSidebarHeader } from './course-sidebar-header';
import { CourseSidebarAssistant } from './course-sidebar-assistant';

interface CourseSidebarProps {
  courseSlug: string;
  onClose?: () => void;
  onMaximize?: () => void;
  isMaximized?: boolean;
}

export const CourseSidebar = ({
  courseSlug,
  onClose,
  onMaximize,
  isMaximized,
}: CourseSidebarProps) => {
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
      <div className="flex-1 overflow-hidden">
        {/* Content Tab */}
        <TabsContent value="content" className="m-0 h-full flex flex-col">
          <ScrollArea className="flex-1">
            <div className="">
              <SectionAccordion courseSlug={courseSlug} />
            </div>
          </ScrollArea>
        </TabsContent>

        {/* AI Assistant Tab */}
        <TabsContent value="assistant" className="m-0 h-full">
          <CourseSidebarAssistant />
        </TabsContent>
      </div>
    </Tabs>
  );
};
