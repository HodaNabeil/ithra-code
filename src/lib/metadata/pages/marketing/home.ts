import { Metadata } from 'next';

export function generateHomePageMetadata(): Metadata {
  return {
    title: 'IthraCode - تعلم البرمجة من الواقع',
    description:
      'منصة تعليمية عربية لتعلم البرمجة من خلال تجارب وخبرات واقعية من الشركات. مصممة للمبتدئين والمطورين المتوسطين مع هدى نبيل ابوهشيمة.',
    keywords: [
      'تعلم البرمجة',
      'برمجة',
      'React',
      'JavaScript',
      'تطوير الويب',
      'IthraCode',
    ],
    authors: [{ name: 'هدى نبيل ابوهشيمة' }],
    creator: 'IthraCode',
    publisher: 'IthraCode',
    openGraph: {
      title: 'IthraCode - تعلم البرمجة من الواقع',
      description:
        'منصة تعليمية عربية لتعلم البرمجة من خلال تجارب وخبرات واقعية من الشركات',
      type: 'website',
      locale: 'ar_EG',
      siteName: 'IthraCode',
    },
    twitter: {
      card: 'summary_large_image',
      title: 'IthraCode - تعلم البرمجة من الواقع',
      description:
        'منصة تعليمية عربية لتعلم البرمجة من خلال تجارب وخبرات واقعية من الشركات',
    },
    alternates: {
      canonical: '/',
    },
  };
}
