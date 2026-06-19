import { auth } from '@/lib/auth';
import type { CourseDetailDTO } from '@/types/course/course.dto';
import type { AddToCartCourse } from '@/features/courses/components/add-to-cart-button';
import {
  buildAddToCartCourse,
  resolveCourseEnrollmentState,
} from '@/features/courses/lib/course-cart-context';
import { CourseStickyActions } from './course-sticky-actions';
import { ObjectivesCourse } from './Objectives';
import { CourseContent } from './CourseContent';
import { TargetAudience } from './TargetAudience';
import { Requirements } from './Requirements';

export async function ObjectivesCourseSection({
  course,
}: {
  course: CourseDetailDTO;
}) {
  if (!course.objectives?.length) return null;
  return <ObjectivesCourse objectives={course.objectives} />;
}

export async function CourseContentSection({
  course,
}: {
  course: CourseDetailDTO;
}) {
  if (!course.sections?.length) return null;
  return (
    <CourseContent sections={course.sections} courseSlug={course.slug} />
  );
}

export async function TargetAudienceSection({
  course,
}: {
  course: CourseDetailDTO;
}) {
  if (!course.targetAudience?.length) return null;
  return <TargetAudience targets={course.targetAudience} />;
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
    <Requirements
      requirements={course.requirements}
      prerequisites={course.prerequisites}
    />
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
