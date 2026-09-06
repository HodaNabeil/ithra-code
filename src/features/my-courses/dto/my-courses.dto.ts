// types/my-courses/my-courses.dto.ts

export type MyCourseLectureAttachmentDTO = {
  id: string;
  name: string;
  url: string;
};

export type MyCourseLectureDTO = {
  id: string;
  title: string;
  position: number;
  duration: number;
  isCompleted: boolean;
  attachmentsCount: number;
  attachments: MyCourseLectureAttachmentDTO[];
};

export type MyCourseSectionDTO = {
  id: string;
  title: string;
  position: number;
  lectures: MyCourseLectureDTO[];
};

export type MyCourseLecturesDTO = {
  title: string;
  sections: MyCourseSectionDTO[];
};

export type MyCourseLectureDetailsDTO = {
  lecture: {
    id: string;
    title: string;
    description: string | null;
    updatedAt: string;
  };
  nextLectureId: string | null;
  courseSlug: string;
};
