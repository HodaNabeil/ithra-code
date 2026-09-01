/**
 * Testimonials API Service
 */

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  content: string;
  avatar?: string;
  rating?: number;
}

export interface TestimonialsResponse {
  success: boolean;
  data: {
    items: Testimonial[];
  };
}

export async function getTestimonials(): Promise<TestimonialsResponse> {
  // TODO: Implement actual API call
  // For now, return sample data
  return {
    success: true,
    data: {
      items: [
        {
          id: '1',
          name: 'أحمد محمد',
          role: 'مطور ويب',
          content: 'منصة ممتازة ساعدتني في تطوير مهاراتي البرمجية بشكل كبير',
          rating: 5,
        },
        {
          id: '2',
          name: 'فاطمة علي',
          role: 'مطورة تطبيقات',
          content: 'أسلوب التدريس واضح والمشاريع العملية مفيدة جداً',
          rating: 5,
        },
      ],
    },
  };
}
