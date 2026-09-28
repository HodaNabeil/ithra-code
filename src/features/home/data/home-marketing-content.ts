import type { TestimonialItem } from '@/features/testimonials/api/dto/testimonial.dto';
import { SEO_SITE_NAME_EN } from '@/lib/seo/config';

export type HomeFaqSeed = {
  question: string;
  answer: string;
  sortOrder: number;
};

/**
 * Home page FAQs (synced via `pnpm seed`).
 */
export const HOME_FAQS: HomeFaqSeed[] = [];

export const HOME_TESTIMONIALS = [
  {
    name: 'سارة محمود',
    content:
      'أول مرة أجد شرحًا عربيًا واضحًا لتطوير تطبيقات الويب بدون حشو. هدى تشرح سبب القرار الهندسي وكيف يرتبط بباقي أجزاء النظام، وليس مجرد كتابة الكود.',
    rating: 5,
  },

  {
    name: 'عمر عبدالله',
    content:
      `${SEO_SITE_NAME_EN} عملية جدًا. لا أحفظ أدوات فقط، بل أفهم لماذا نختار تقنية أو هندسة معينة وكيف تتعامل أجزاء النظام مع بعضها.`,
    rating: 5,
  },

  {
    name: 'ليلى حسن',
    content:
      'الأسلوب مرتب والأمثلة من الواقع تجعل المعلومة تثبت. فهمت لأول مرة كيف تعمل الواجهة والخلفية وقاعدة البيانات والبنية التحتية معًا كنظام واحد.',
    rating: 5,
  },
] as const;

export function getHomeFallbackTestimonials(): TestimonialItem[] {
  return HOME_TESTIMONIALS.map((item, index) => ({
    id: `home-testimonial-${index + 1}`,
    source: 'testimonial' as const,
    name: item.name,
    avatarUrl: null,
    content: item.content,
    rating: item.rating,
    createdAt: '2026-01-01T00:00:00.000Z',
  }));
}
