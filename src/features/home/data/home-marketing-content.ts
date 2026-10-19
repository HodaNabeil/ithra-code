import { PUBLIC_ROUTES } from '@/constants/routes';
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
export const HOME_FAQS: HomeFaqSeed[] = [
  {
    question: `ما هي منصة ${SEO_SITE_NAME_EN}؟`,
    answer: `${SEO_SITE_NAME_EN} منصة تعليمية عربية لتعلم البرمجة وتطوير الويب عبر دورات عملية.`,
    sortOrder: 1,
  },
  {
    question: 'هل الدورات مناسبة للمبتدئين؟',
    answer:
      'نعم، توجد دورات تبدأ من الأساسيات، ويُوضَّح مستوى كل دورة قبل الاشتراك.',
    sortOrder: 2,
  },
  {
    question: 'هل يمكن مشاهدة الدروس في أي وقت؟',
    answer:
      'نعم، بعد التسجيل يمكنك الوصول إلى المحتوى من حسابك في أي وقت.',
    sortOrder: 3,
  },
  {
    question: 'هل أحصل على شهادة عند إتمام الدورة؟',
    answer:
      'نعم، يحصل الطالب على شهادة إتمام عند استيفاء متطلبات الدورة.',
    sortOrder: 4,
  },
  {
    question: 'كيف يمكنني الدفع من داخل مصر؟ وهل يتوفر خيار التقسيط؟',
    answer:
      'نعم، المنصة تدعم وسائل الدفع المحلية والأسهل لك داخل مصر (مثل فوري Fawry، المحافظ الإلكترونية كـ Vodafone Cash، والبطاقات البنكية ميزة/Mastercard/Visa). كما نوفر خيارات التقسيط المريح عبر وسائل التقسيط الشهيرة لتسهيل الاستثمار في مستقبلك المهني.',
    sortOrder: 5,
  },
  {
    question: 'هل يمكن استرجاع المبلغ؟',
    answer: `نعم، وفق سياسة الاسترداد في الشروط والأحكام، بما في ذلك ضمان استرداد كامل خلال 30 يومًا من الشراء إذا لم يناسبك المحتوى. للتفاصيل راجع ${PUBLIC_ROUTES.TERMS}`,
    sortOrder: 6,
  },
  {
    question: 'هل يمكنني التواصل مع المدرّس؟',
    answer:
      'نعم، عبر قسم الأسئلة أو وسائل التواصل المتاحة داخل الدورة، إذا كانت الميزة مدعومة.',
    sortOrder: 7,
  },
  {
    question: 'ماذا أفعل إذا واجهت مشكلة تقنية؟',
    answer: `تواصل مع فريق الدعم من خلال صفحة «تواصل معنا» (${PUBLIC_ROUTES.CONTACT}) مع وصف المشكلة.`,
    sortOrder: 8,
  },
];

export const HOME_TESTIMONIALS = [
  {
    name: 'سارة محمود',
    content:
      'أول مرة أجد شرحًا عربيًا واضحًا لتطوير تطبيقات الويب بدون حشو. هدى تشرح سبب القرار الهندسي وكيف يرتبط بباقي أجزاء النظام، وليس مجرد كتابة الكود.',
    rating: 5,
  },

  {
    name: 'عمر عبدالله',
    content: `${SEO_SITE_NAME_EN} عملية جدًا. لا أحفظ أدوات فقط، بل أفهم لماذا نختار تقنية أو هندسة معينة وكيف تتعامل أجزاء النظام مع بعضها.`,
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
