import { STUDENT_ROUTES } from '@/constants/routes';

type LearnHrefCourse = {
  slug: string;
  firstLectureId?: string | null;
  lastLectureId?: string | null;
  sections?: Array<{ lectures?: Array<{ id: string }> }>;
};

/** First lecture in curriculum order, whether it has a video or not. */
export function getFirstLectureId(
  sections?: Array<{ lectures?: Array<{ id: string }> }>,
): string | undefined {
  for (const section of sections ?? []) {
    const lectureId = section.lectures?.[0]?.id;
    if (lectureId) {
      return lectureId;
    }
  }

  return undefined;
}

export function buildLearnHref(course: LearnHrefCourse): string {
  const lectureId =
    course.lastLectureId ||
    course.firstLectureId ||
    getFirstLectureId(course.sections);

  if (lectureId) {
    return STUDENT_ROUTES.LEARN.replace(':courseSlug', course.slug).replace(
      ':lectureId',
      lectureId,
    );
  }

  return STUDENT_ROUTES.LEARN_ENTRY.replace(':courseSlug', course.slug);
}
