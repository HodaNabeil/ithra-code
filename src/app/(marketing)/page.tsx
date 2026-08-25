import {
  FaqsSection,
  FeaturedCourses,
  HeroSection,
  InstructorSection,
  TestimonialSection,
  WhyIthraCode,
} from '@/features/home';
import {
  getFeaturedCoursesForHome,
  getHomeFaqs,
  getHomeTestimonials,
} from '@/features/home/services/server/home-page.data';
import { ErrorRetry } from '@/components/shared';

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
    <main>
      <HeroSection promoCourse={courses[0]} />
      <WhyIthraCode />
      <InstructorSection />

      {coursesResponse.success ? (
        <FeaturedCourses courses={courses} />
      ) : (
        <ErrorRetry />
      )}

      <TestimonialSection
        items={testimonialItems}
        hasError={!testimonialsResponse.success}
      />

      <FaqsSection
        faqs={faqs}
        hasError={!faqsResponse.success}
        errorMessage={faqsErrorMessage}
      />
    </main>
  );
}
