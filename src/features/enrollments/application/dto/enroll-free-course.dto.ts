export type EnrollInFreeCourseInputDTO = {
  studentId: string;
  courseIdOrSlug: string;
};

export type EnrollInFreeCourseOutputDTO = {
  courseId: string;
  slug: string;
  firstLectureId: string | null;
};
