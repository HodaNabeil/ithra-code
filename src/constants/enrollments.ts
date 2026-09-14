export const ENROLLMENT_ENDPOINTS = {
  ENROLL: (courseIdOrSlug: string) => `/courses/${courseIdOrSlug}/enroll`,
} as const;

export const FREE_ENROLL_QUERY = 'enroll' as const;
