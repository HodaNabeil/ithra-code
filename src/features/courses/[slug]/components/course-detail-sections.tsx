import { auth } from '@/lib/auth';
import type { CourseDetailDTO } from '@/types/course/course.dto';
import type { AddToCartCourse } from '@/features/courses/components/add-to-cart-button';
import {
  buildAddToCartCourse,
  resolveCourseEnrollmentState,
} from '@/features/courses/lib/course-cart-context';
import { CourseStickyActions } from './course-sticky-actions';
import { CourseObjectives } from './course-objectives';
import CourseContent from './course-content';
import { CourseTargetAudience } from './course-info/course-target-audience';
import { CourseRequirements } from './course-info/course-requirements';
import { CoursePrerequisites } from './course-prerequisites';

export async function ObjectivesCourseSection({
  course,
}: {
  course: CourseDetailDTO;
}) {
  if (!course.objectives?.length) return null;
  return <CourseObjectives objectives={course.objectives} />;
}

export async function CourseContentSection({
  course,
}: {
  course: CourseDetailDTO;
}) {
  if (!course.sections?.length) return null;
  const lecturesCount = course.sections.reduce(
    (acc, section) => acc + section.lectures.length,
    0,
  );
  return (
    <CourseContent
      sections={course.sections}
      lecturesCount={lecturesCount}
      courseTitle={course.title}
      courseSlug={course.slug}
      isPurchased={!!course.isPurchased}
    />
  );
}

export async function TargetAudienceSection({
  course,
}: {
  course: CourseDetailDTO;
}) {
  if (!course.targetAudience?.length) return null;
  return <CourseTargetAudience targetAudience={course.targetAudience} />;
}

export async function RequirementsSection({
  course,
}: {
  course: CourseDetailDTO;
}) {
  if (!course.requirements?.length && !course.prerequisites?.length) {
    return null;
  }
  return (
    <>
      {course.requirements?.length ? (
        <CourseRequirements requirements={course.requirements} />
      ) : null}
      {course.prerequisites?.length ? (
        <CoursePrerequisites prerequisites={course.prerequisites} />
      ) : null}
    </>
  );
}

export async function CourseStickyActionsSection({
  course,
}: {
  course: CourseDetailDTO;
}) {
  const session = await auth();
  const enrollmentState = await resolveCourseEnrollmentState(
    course.id,
    session?.user?.id,
  );
  const courseForCart: AddToCartCourse = buildAddToCartCourse(
    course,
    enrollmentState,
  );

  return <CourseStickyActions course={courseForCart} />;
}
