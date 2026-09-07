export const queryKeys = {
  cart: {
    detail: () => ['cart', 'detail'] as const,
  },
};

export const COURSE_TAGS = {
  course: {
    all: () => ['courses'] as const,
    lists: () => ['courses', 'list'] as const,
    list: (params: Record<string, unknown>) =>
      ['courses', 'list', params] as const,
    details: () => ['courses', 'detail'] as const,
    detail: (slug: string) => ['courses', 'detail', slug] as const,
  },
};

export const PATH_TAGS = {
  path: {
    all: () => ['paths'] as const,
    lists: () => ['paths', 'list'] as const,
    list: (params: Record<string, unknown>) =>
      ['paths', 'list', params] as const,
    details: () => ['paths', 'detail'] as const,
    detail: (slug: string) => ['paths', 'detail', slug] as const,
  },
};

export const MY_COURSES_TAGS = {
  all: ['my-courses'] as const,
  sections: (courseSlug: string) =>
    [...MY_COURSES_TAGS.all, 'sections', courseSlug] as const,
  lecture: (lectureId: string, courseSlug: string) =>
    [...MY_COURSES_TAGS.all, 'lecture', lectureId, { courseSlug }] as const,
  navigation: (lectureId: string, courseSlug: string) =>
    [...MY_COURSES_TAGS.all, 'navigation', lectureId, { courseSlug }] as const,
};

export const LECTURE_DETAIL_TAGS = {
  detail: (lectureId: string) =>
    ['lectures', 'detail', lectureId] as const,
};

export const COURSE_PROGRESS_TAGS = {
  detail: (courseSlug: string) =>
    ['courses', 'progress', courseSlug] as const,
};
