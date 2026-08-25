/**
 * FAQs API Service
 */

export interface FAQ {
  id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface FAQsResponse {
  success: boolean;
  data: {
    items: FAQ[];
  };
  error?: string;
}

export async function getFaqs(): Promise<FAQsResponse> {
  // TODO: Implement actual API call
  // For now, return sample data
  return {
    success: true,
    data: {
      items: [
        {
          id: '1',
          question: 'هل المنصة مناسبة للمبتدئين؟',
          answer:
            'نعم، تم تصميم المنصة خصيصاً للمبتدئين والمطورين المتوسطين. نبدأ من الأساسيات ونتقدم تدريجياً.',
          category: 'عام',
        },
        {
          id: '2',
          question: 'كيف يمكنني الاستفادة من التجارب الواقعية؟',
          answer:
            'نقوم بتقديم أمثلة ومشاريع مستوحاة من تجارب حقيقية في الشركات لتطبيق المهارات عملياً.',
          category: 'التعلم',
        },
        {
          id: '3',
          question: 'هل يمكنني الحصول على شهادة؟',
          answer: 'نعم، ستحصل على شهادة إتمام لكل دورة تكملها بنجاح.',
          category: 'الشهادات',
        },
      ],
    },
  };
}
