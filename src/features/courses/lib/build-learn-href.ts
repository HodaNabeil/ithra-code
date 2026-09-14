import { APP_ROUTES } from '@/constants/enums';
import { STUDENT_ROUTES } from '@/constants/routes';

type LearnHrefCourse = {
  slug: string;
  firstLectureId?: string | null;
  sections?: Array<{ lectures?: Array<{ id: string }> }>;
};

export function buildLearnHref(course: LearnHrefCourse): string {
  const lectureId =
    course.firstLectureId || course.sections?.[0]?.lectures?.[0]?.id;

  if (lectureId) {
    return STUDENT_ROUTES.LEARN.replace(':courseSlug', course.slug).replace(
      ':lectureId',
      lectureId,
    );
  }

  return `${APP_ROUTES.MY_COURSES}/${course.slug}`;
}
