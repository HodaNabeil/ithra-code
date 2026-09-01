import CourseInfo from '@/features/courses/[slug]/components/course-info';

import { CoursePricingCard } from '@/features/courses/[slug]/components/course-pricing-card';
import { CourseVideoPreview } from '@/features/courses/[slug]/components/course-video-preview';
import CourseBreadCrumbs from '@/features/courses/components/course-bread-crumbs';
import { getCourseDetail } from '@/features/courses/course-detail/use-cases/get-course-detail.use-case';
import { getCourseOverview } from '@/features/courses/course-overview/use-cases/get-course-overview.use-case';
import type { Course, CourseOverview } from '@/types/course/course.types';

type CourseSlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function CourseDetailsPage({
  params,
}: CourseSlugPageProps) {
  const { slug } = await params;
  const course: Course = await getCourseDetail({ idOrSlug: slug });
  const { overview }: { overview: CourseOverview } = await getCourseOverview({
    idOrSlug: slug,
  });
  return (
    <>
      <main>
        <div className="container flex flex-col lg:flex-row gap-2 lg:gap-12 xl:gap-20 pb-10">
          {/* On mobile, breadcrumbs come first */}
          <div className="lg:hidden mt-6 px-4">
            <CourseBreadCrumbs
              courseTitle={course.title}
              courseSlug={course.slug}
            />
          </div>

          {/* On mobile, video preview comes second */}
          <div className="block lg:hidden mt-4">
            <CourseVideoPreview
              title={course.title}
              thumbnailUrl={course.thumbnailUrl}
              sections={course.sections}
              previewVideoUrl={course.previewVideo}
            />
          </div>
          <CourseInfo course={course} overview={overview} />

          {/* On desktop, pricing card is a sticky sidebar */}
          <div className="hidden lg:block w-90 xl:w-100 shrink-0">
            <CoursePricingCard
              course={course}
              overview={{
                totalHours: overview.totalHours,
                lecturesCount: overview.lecturesCount,
              }}
            />
          </div>
        </div>
      </main>
    </>
  );
}
