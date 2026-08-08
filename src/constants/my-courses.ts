export const PROGRESS_FILTERS = {
  ALL: 'all',
  COMPLETED: 'completed',
  IN_PROGRESS: 'in_progress',
  NOT_STARTED: 'not_started',
} as const;

export const SEARCH_PARAMS_KEYS = {
  TRACK: 'category_filter',
  STATUS: 'progress_filter',
  SEARCH: 'search',
  INSTRUCTOR: 'instructor_filter',
} as const;

export const DEFAULT_VALUES = {
  INSTRUCTOR_NAME: 'محاضر',
} as const;

export const MY_COURSES_ROUTES = {
  COURSES: '/courses',
  MY_COURSES: '/my-courses',
} as const;

export const EMPTY_STATES = {
  NO_ENROLLMENTS: {
    title: 'لا توجد دورات مسجلة',
    description:
      'لم تقم بالاشتراك في أي دورات تدريبية بعد. ابدأ رحلة التعلم اليوم!',
    buttonText: 'تصفح الدورات',
    buttonHref: MY_COURSES_ROUTES.COURSES,
  },
  NO_SEARCH_RESULTS: {
    title: 'لا توجد نتائج تطابق بحثك',
    description: 'جرب استخدام كلمات بحث مختلفة أو قم بإزالة الفلاتر المطبقة',
    buttonText: 'إعادة تعيين كافة الفلاتر',
    buttonHref: MY_COURSES_ROUTES.MY_COURSES,
  },
} as const;
