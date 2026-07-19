export const APP_ROUTES = {
  ROOT: '/',
  COURSES: '/courses',
  CONTACT: '/contact',
  SUCCESS: '/success',
  MY_COURSES: '/my-courses',
  ADMIN: '/admin',
  CART: '/cart',
  CHECKOUT: '/checkout',
  AUTH: '/auth',
  NOT_FOUND: '/404',
  CREATE_COURSES: '/create-courses',
  GOALS: '/goals',
  BASICS: '/basics',
  PRICING: '/pricing',
  CURRICULUM: '/curriculum',
  LESSONS: '/lessons',
  LEARNING_PATHS: '/learning-paths',
  LEARN: '/learn',
  LECTURE: '/lecture',
} as const;

// Keep in sync with prisma/schema.prisma enum Role
export const APP_USER_ROLES = {
  ADMIN: 'ADMIN',
  INSTRUCTOR: 'INSTRUCTOR',
  STUDENT: 'STUDENT',
} as const;

export const APP_LINK_ROLES = {
  ALL: 'ALL',
  ADMIN: APP_USER_ROLES.ADMIN,
  INSTRUCTOR: APP_USER_ROLES.INSTRUCTOR,
  STUDENT: APP_USER_ROLES.STUDENT,
} as const;
export enum InputTypes {
  TEXT = 'text',
  EMAIL = 'email',
  PASSWORD = 'password',
  NUMBER = 'number',
  DATE = 'date',
  TIME = 'time',
  DATE_TIME_LOCAL = 'datetime-local',
  CHECKBOX = 'checkbox',
  RADIO = 'radio',
  SELECT = 'select',
  PHONE = 'phone',
  TEXTAREA = 'textarea',
  FILE = 'file',
  IMAGE = 'image',
  COLOR = 'color',
  RANGE = 'range',
  TEL = 'tel',
  URL = 'url',
  SEARCH = 'search',
  MONTH = 'month',
  WEEK = 'week',
  HIDDEN = 'hidden',
  MULTI_SELECT = 'multi select',
  RATING = 'rating',
}

export enum Environments {
  PROD = 'production',
  DEV = 'development',
}
export enum UserType {
  USER = 'STUDENT',
  ADMIN = 'ADMIN',
  INSTRUCTOR = 'INSTRUCTOR',
}

export enum StatusLesson {
  LOCKED = 'locked',
  UNLOCKED = 'unlocked',
  PREVIEW = 'preview',
}

export enum Level {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  ADVANCED = 'ADVANCED',
  ALL_LEVELS = 'ALL_LEVELS',
}
