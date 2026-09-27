import type { TestimonialItem } from '@/features/testimonials/api/dto/testimonial.dto';

export const HOME_TESTIMONIALS = [
  {
    name: 'سارة محمود',
    content:
      'أول مرة أجد شرحًا عربيًا واضحًا لتطوير الواجهات بدون حشو. هدى تشرح سبب القرار الهندسي لا مجرد كتابة الكود، وهذا ما أحدث فرقًا معي في العمل.',
    rating: 5,
  },
  {
    name: 'عمر عبدالله',
    content:
      'ithra code عملية جدًا. لا أحفظ أدوات فقط، بل أفهم قرارات Next.js والأداء كما لو كنت أعمل على منتج حقيقي.',
    rating: 5,
  },
  {
    name: 'ليلى حسن',
    content:
      'الأسلوب مرتب والأمثلة من الواقع تجعل المعلومة تثبت. أنصح بها لكل من يريد تطوير مستواه في الفرونتند.',
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
