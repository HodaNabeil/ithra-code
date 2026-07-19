export const COURSE_ORDER_BY = {
  newest: { createdAt: 'desc' },
  oldest: { createdAt: 'asc' },
  price_asc: { price: 'asc' },
  price_desc: { price: 'desc' },
} as const;

export const STUDENT_SORT_OPTIONS = [
  { label: 'تم الوصول إليه مؤخرًا', value: 'recent_access' },
  { label: 'تم التسجيل حديثًا', value: 'recent_enroll' },
  { label: 'العنوان: من الألف إلى الياء', value: 'title_asc' },
  { label: 'العنوان: من الياء إلى الألف', value: 'title_desc' },
] as const;
