import { notFound } from 'next/navigation';
import { CourseHero } from '@/features/courses/components/CourseHero';
import {
  CourseContentSection,
  CourseStickyActionsSection,
  ObjectivesCourseSection,
  RequirementsSection,
  TargetAudienceSection,
} from '@/features/courses/[slug]/components/course-detail-sections';
import { loadCourseDetailBySlug } from '@/features/courses/course-detail';
import { buildCourseDetailJsonLd } from '@/features/courses/lib/course-detail-jsonld';
import { resolveCourseDetailMetadata } from '@/features/courses/lib/course-detail-metadata';
import { Metadata } from 'next';
import { ErrorRetry } from '@/components/shared/ErrorRetry';
import Script from 'next/script';
import CourseBreadCrumbs from '@/features/courses/components/course-bread-crumbs';

type CourseSlugPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: CourseSlugPageProps): Promise<Metadata> {
  const { slug } = await params;
  return resolveCourseDetailMetadata(slug);
}

export default async function CourseDetailsPage({
  params,
}: CourseSlugPageProps) {
  const { slug } = await params;
  const result = await loadCourseDetailBySlug(slug);

  if (result.status === 'not_found') {
    notFound();
  }

  if (result.status === 'error') {
    console.error('Course Slug Page Error:', result.error);
    return <ErrorRetry />;
  }

  const { course } = result;
  const jsonLd = buildCourseDetailJsonLd(course);

  return (
    <>
      <Script
        id="course-jsonld"
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <main>
        <div className="container flex flex-col lg:flex-row gap-2 lg:gap-12 xl:gap-20 pb-10">
          <div className="lg:hidden mt-6 px-4">
            <CourseBreadCrumbs courseTitle={course.title} courseSlug={slug} />
          </div>
          <CourseHero course={course} />
          <ObjectivesCourseSection course={course} />
          <CourseContentSection course={course} />
          <TargetAudienceSection course={course} />
          <RequirementsSection course={course} />
        </div>

        <CourseStickyActionsSection course={course} />
      </main>
    </>
  );
}
