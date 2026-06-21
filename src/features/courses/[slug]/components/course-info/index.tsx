import CourseHeader from './course-header';
import CourseHero from './course-hero';
import { CourseObjectives } from '@/features/courses/[slug]/components/course-objectives';
import CourseContent from '@/features/courses/[slug]/components/course-content';
import { CourseRequirements } from './course-requirements';
import { CourseDescription } from './course-description';
import { CourseTargetAudience } from './course-target-audience';
import { ExpandableContent } from '@/components/shared/expandable-content';
import { CoursePreviewDialog } from '@/features/courses/[slug]/components/course-preview-dialog';
import { CoursePrerequisites } from '@/features/courses/[slug]/components/course-prerequisites';
import type { Course, CourseOverview } from '@/types/course/course.types';
import { CoursePricingCard } from '../course-pricing-card';

interface CourseInfoProps {
  course: Course;
  overview: CourseOverview;
}

export default function CourseInfo({ course, overview }: CourseInfoProps) {
  return (
    <div className="flex-1 pt-6 lg:pt-12 space-y-6">
      <CourseHeader
        title={course.title}
        rating={overview.rating}
        ratingsCount={overview.ratingsCount}
        totalStudents={overview.totalStudents}
      />
      <CourseHero
        title={course.title}
        slug={course.slug}
        rating={overview.rating}
        ratingsCount={overview.ratingsCount}
        totalStudents={overview.totalStudents}
        lastUpdated={overview.lastUpdated}
        shortDescription={course.shortDescription}
      />

      {/* Mobile Pricing Card - after Hero items */}
      <div className="block lg:hidden">
        <CoursePricingCard
          course={course}
          overview={{
            totalHours: overview.totalHours,
            lecturesCount: overview.lecturesCount,
          }}
        />
      </div>
      <CourseObjectives objectives={course.objectives} />
      <CourseContent
        sections={course.sections}
        lecturesCount={overview.lecturesCount}
        courseTitle={course.title}
        courseSlug={course.slug}
        isPurchased={!!course.isPurchased}
      />
      <CourseRequirements requirements={course.requirements} />
      <ExpandableContent
        initialHeight={200}
        expandLabel="عرض المزيد"
        collapseLabel="عرض أقل"
      >
        <CourseDescription description={course.description} />
        <CourseTargetAudience targetAudience={course.targetAudience} />
      </ExpandableContent>
      <CoursePrerequisites prerequisites={course.prerequisites || []} />

      {/* Course preview dialog — controlled via useCoursePreviewStore */}
      <CoursePreviewDialog />
    </div>
  );
}
