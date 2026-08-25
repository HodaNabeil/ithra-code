/**
 * Courses API Service
 */

interface Course {
  id: string;
  title: string;
  slug: string;
  description?: string;
  price?: number;
  thumbnailUrl?: string;
  isFeatured?: boolean;
  instructor?: {
    id: string;
    name: string;
  };
}

interface CoursesResponse {
  success: boolean;
  data: {
    courses: Course[];
    total?: number;
    page?: number;
    limit?: number;
  };
}

interface GetCoursesParams {
  page?: number;
  limit?: number;
  isFeatured?: boolean;
}

export async function getPublicCourses(
  params: GetCoursesParams,
): Promise<CoursesResponse> {
  // TODO: Implement actual API call
  // For now, return sample data
  return {
    success: true,
    data: {
      courses: [
        {
          id: '1',
          title: 'تطوير مواقع الويب الحديثة مع React',
          slug: 'react-web-development',
          description:
            'تعلم تطوير تطبيقات الويب الحديثة باستخدام React وNext.js',
          price: 299,
          thumbnailUrl: '/assets/images/courses/react-course.jpg',
          isFeatured: true,
          instructor: {
            id: '1',
            name: 'هدى نبيل أبو هاشم',
          },
        },
        {
          id: '2',
          title: 'أساسيات JavaScript للمبتدئين',
          slug: 'javascript-basics',
          description: 'ابدأ رحلتك في عالم البرمجة مع JavaScript',
          price: 199,
          thumbnailUrl: '/assets/images/courses/javascript-course.jpg',
          isFeatured: true,
          instructor: {
            id: '1',
            name: 'هدى نبيل أبو هاشم',
          },
        },
      ],
      total: 2,
      page: params.page || 1,
      limit: params.limit || 6,
    },
  };
}
