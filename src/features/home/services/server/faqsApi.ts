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
          question: 'هل IthraCode مجرد منصة لتعليم البرمجة؟',
          answer:
            'IthraCode هي منظومة تهدف إلى مساعدة الأفراد على تعلم البرمجة وتطوير مهاراتهم من خلال تجربة عملية مرتبطة باحتياجات سوق العمل. ومع تطور المنصة، نعمل على بناء بيئة تربط بين التعلم، بناء المهارات، الفرص المهنية، والتعاون مع الشركات والعملاء.',
          category: 'عام',
        },
        {
          id: '2',
          question: 'هل المنصة مناسبة للمبتدئين؟',
          answer:
            'نعم، صُممت المنصة للمبتدئين والمطورين متوسطي المستوى، بمسار تعليمي يبدأ من الأساسيات ويتقدم تدريجياً.',
          category: 'عام',
        },
        {
          id: '3',
          question: 'كيف أستفيد من التجارب الواقعية؟',
          answer:
            'نقدّم أمثلة ومشاريع مستوحاة من تجارب حقيقية في الشركات، مع شرح خطوات التنفيذ والأخطاء الشائعة، لتطبيق ما تتعلمه عملياً.',
          category: 'التعلم',
        },
        {
          id: '4',
          question: 'هل أستطيع الوصول للمحتوى بعد الشراء؟',
          answer:
            'نعم، بمجرد إتمام الشراء ستتمكن من الوصول إلى جميع محاضرات الدورة وموادها بشكل دائم ودون أي قيود زمنية.',
          category: 'الوصول',
        },
        {
          id: '5',
          question: 'ما طرق الدفع المتاحة؟',
          answer:
            'نوفر طرق دفع آمنة تشمل البطاقات الائتمانية والمحافظ الإلكترونية المحلية، مع دعم العملات المتاحة في منطقتك.',
          category: 'الدفع',
        },
        {
          id: '6',
          question: 'هل يوجد دعم فني؟',
          answer:
            'نعم، يمكنك التواصل مع فريق الدعم للحصول على مساعدة بخصوص الدورات والمحتوى التعليمي.',
          category: 'الدعم',
        },
      ],
    },
  };
}
