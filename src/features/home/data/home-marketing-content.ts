import type { FaqItem } from '@/features/faqs';
import type { TestimonialItem } from '@/features/testimonials/api/dto/testimonial.dto';

export const HOME_ITHRACODE_FAQ = {
  question: 'ما هي IthraCode؟',
  answer:
    'IthraCode منصة تعليمية عربية لتعلّم البرمجة من خلال تجارب وخبرات واقعية من الشركات. نقدّم دورات ومسارات عملية في تطوير الويب، بقيادة المؤسسة والمدرّبة هدي ابوهشيمة (Hoda Abu Hashima)، لمساعدتك على بناء مهارات قابلة للتطبيق والوصول إلى فرص أفضل في سوق العمل — تحت شعار «تعلّم البرمجة من الواقع».',
} as const;

const HOME_FALLBACK_ITHRACODE_FAQ: FaqItem = {
  id: 'faq-ithracode',
  question: HOME_ITHRACODE_FAQ.question,
  answer: HOME_ITHRACODE_FAQ.answer,
  sortOrder: 0,
  isActive: true,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
};

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
      'IthraCode عملية جدًا. لا أحفظ أدوات فقط، بل أفهم قرارات Next.js والأداء كما لو كنت أعمل على منتج حقيقي.',
    rating: 5,
  },
  {
    name: 'ليلى حسن',
    content:
      'الأسلوب مرتب والأمثلة من الواقع تجعل المعلومة تثبت. أنصح بها لكل من يريد تطوير مستواه في الفرونتند.',
    rating: 5,
  },
] as const;

export function isIthraCodeIdentityQuestion(question: string): boolean {
  const normalized = question.replace(/\s+/g, ' ').trim();
  return /ithracode/i.test(normalized) && /ما هي|من هي/.test(normalized);
}

export function ensureIthraCodeFaq(items: FaqItem[]): FaqItem[] {
  const index = items.findIndex((faq) =>
    isIthraCodeIdentityQuestion(faq.question),
  );

  if (index === -1) {
    return [HOME_FALLBACK_ITHRACODE_FAQ, ...items];
  }

  const match = items[index]!;

  return [match, ...items.filter((_, itemIndex) => itemIndex !== index)];
}

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
