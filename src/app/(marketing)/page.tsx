import { InstructorSection } from '@/features/home';
import { FaqsSection } from '@/features/home';
import { TestimonialSection } from '@/features/home';
import { WhyIthraCode } from '@/features/home';
import { HeroSection } from '@/features/home';
import { getTestimonialsAction } from '@/features/testimonials/actions/testimonials.actions';
import { getFaqsAction } from '@/features/faqs';

export default async function Home() {
  // Mock promo course data
  const promoCourse = {
    id: '1',
    title: 'دورة تطوير الويب الشاملة',
    slug: 'web-development-course',
    price: 299,
    instructor: {
      name: 'هدى نبيل',
    },
  };

  // Fetch real testimonials from API
  const testimonialsResult = await getTestimonialsAction({ limit: 6 });
  const testimonials = testimonialsResult.success
    ? testimonialsResult.items
    : [];

  // Fetch real FAQs from API
  const faqsResult = await getFaqsAction({ limit: 6 });
  const faqs = faqsResult.success ? faqsResult.items : [];

  return (
    <main>
      <HeroSection promoCourse={promoCourse} />
      <WhyIthraCode />
      <InstructorSection />

      <TestimonialSection
        items={testimonials}
        hasError={!testimonialsResult.success}
      />
      <FaqsSection 
        faqs={faqs} 
        hasError={!faqsResult.success} 
      />
    </main>
  );
}
