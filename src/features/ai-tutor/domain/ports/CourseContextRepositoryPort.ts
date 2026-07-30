export type EnrolledCourseWithProgressDTO = {
  id: string;
  slug: string;
  title: string;
  description: string;
  shortDescription: string | null;
  level: string;
  objectives: string[];
  requirements: string[];
  sections: Array<{
    id: string;
    title: string;
    position: number;
    lectures: Array<{
      id: string;
      title: string;
      description: string | null;
      type: string;
      position: number;
    }>;
  }>;
  enrollments: Array<{
    status: string;
    student: {
      name: string | null;
      firstName: string | null;
      lastName: string | null;
    };
    progress: Array<{
      lectureId: string;
      isCompleted: boolean;
      timeSpent: number;
      lastAccessedAt: Date;
    }>;
  }>;
};

export interface CourseContextRepositoryPort {
  findEnrolledCourseWithProgress(params: {
    courseSlug: string;
    userId: string;
  }): Promise<EnrolledCourseWithProgressDTO | null>;
}
