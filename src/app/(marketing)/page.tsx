import {
  FaqsSection,
  FeaturedCourses,
  HeroSection,
  InstructorSection,
  TestimonialSection,
  WhyIthraCode,
} from '@/features/home';
import { buildHomePageMetadata } from '@/features/home/lib/seo/home-page-metadata';
import { buildHomePageJsonLd } from '@/features/home/lib/seo/home-page-schema.adapter';
import {
  getFeaturedCoursesForHome,
  getHomeFaqs,
  getHomeTestimonials,
} from '@/features/home/services/server/home-page.data';
import { JsonLd } from '@/lib/seo/json-ld/json-ld';

export const generateMetadata = buildHomePageMetadata;

export default async function Home() {
  const [coursesResponse, testimonialsResponse, faqsResponse] =
    await Promise.all([
      getFeaturedCoursesForHome(),
      getHomeTestimonials(),
      getHomeFaqs(),
    ]);

  const courses = coursesResponse.success
    ? (coursesResponse.data.courses ?? [])
    : [];
  const testimonialItems = testimonialsResponse.success
    ? (testimonialsResponse.data.items ?? [])
    : [];
  const faqs = faqsResponse.success ? (faqsResponse.data.items ?? []) : [];
  const faqsErrorMessage = faqsResponse.success
    ? undefined
    : faqsResponse.error;

  return (
    <>
      <JsonLd id="home-jsonld" data={buildHomePageJsonLd(faqs)} />
      <HeroSection promoCourse={courses[0]} />
      <WhyIthraCode />
      <InstructorSection />

      <FeaturedCourses
        courses={courses}
        hasError={!coursesResponse.success}
        errorMessage={
          coursesResponse.success ? undefined : coursesResponse.error
        }
      />

      <TestimonialSection
        items={testimonialItems}
        hasError={!testimonialsResponse.success}
        errorMessage={
          testimonialsResponse.success
            ? undefined
            : testimonialsResponse.error
        }
      />

      <FaqsSection
        faqs={faqs}
        hasError={!faqsResponse.success}
        errorMessage={faqsErrorMessage}
      />
    </>
  );
}
