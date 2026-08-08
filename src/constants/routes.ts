/**
 * Application route paths
 * Organized by access level and functionality
 */

// ============================================
// PUBLIC ROUTES (No authentication required)
// ============================================

export const PUBLIC_ROUTES = {
  HOME: '/',
  ABOUT: '/about',
  CONTACT: '/contact',
  PRIVACY: '/privacy',
  TERMS: '/terms',
  FAQ: '/faq',
  COURSES: '/courses',
  COURSE_DETAILS: '/courses/:courseSlug',
  LIFETIME_ACCESS: '/lifetime-access',
  LEARNING_PATHS: '/learning-paths',
  LEARNING_PATHS_WEB_FRONTEND: '/learning-paths/web-frontend',
  LEARNING_PATHS_BACKEND: '/learning-paths/backend',
  LEARNING_PATHS_MOBILE_REACT_NATIVE: '/learning-paths/mobile-react-native',
  LEARNING_PATHS_FLUTTER: '/learning-paths/flutter',
  LEARNING_PATHS_PYTHON: '/learning-paths/python',
  LEARNING_PATHS_CPP: '/learning-paths/cpp',
  CART: '/cart',
  WISHLIST: '/wishlist',
  MESSAGES: '/messages',
} as const;

// ============================================
// AUTHENTICATION ROUTES
// ============================================

export const AUTH_ROUTES = {
  LOGIN: '/auth/login',
  REGISTER: '/auth/register',
  FORGOT_PASSWORD: '/auth/forgot-password',
  RESET_PASSWORD: '/auth/reset-password',
  VERIFY_EMAIL: '/auth/verify-email',
} as const;

// ============================================
// ONBOARDING (public while authenticated — OAuth password setup)
// ============================================

export const ONBOARDING_ROUTES = {
  SET_PASSWORD: '/onboarding/set-password',
} as const;

// ============================================
// PROTECTED ROUTES (Authentication required)
// ============================================

// General protected routes
export const PROTECTED_ROUTES = {
  DASHBOARD: '/dashboard',
  SETTINGS: '/settings',
  CHECKOUT: '/payment/checkout',
  CHECKOUT_SUCCESS: '/payment/success',
  CHECKOUT_CANCEL: '/payment/cancel',
  ORDERS: '/orders',
} as const;

// Profile routes
export const PROFILE_ROUTES = {
  GENERAL: '/profile',
  EDIT: '/profile/edit',
  PHOTO: '/profile/photo',
  NOTIFICATIONS: '/profile/notifications',
  SECURITY: '/profile/security',
  CHANGE_EMAIL: '/profile/security/change-email',
  CHANGE_PASSWORD: '/profile/security/change-password',
  VERIFY_EMAIL_CHANGE: '/profile/verify-email-change',
  PAYMENT_METHODS: '/profile/payment-methods',
  SUBSCRIPTIONS: '/profile/subscriptions',
  CREDITS: '/profile/credits',
  PURCHASE_HISTORY: '/profile/purchase-history',
} as const;

// ============================================
// ROLE-BASED ROUTES
// ============================================

// Order routes
export const ORDER_ROUTES = {
  LIST: '/orders',
  DETAIL: '/orders/:id',
  SUCCESS: '/payment/success',
  CANCEL: '/payment/cancel',
} as const;

// Student routes
export const STUDENT_ROUTES = {
  DASHBOARD: '/student/dashboard',
  MY_COURSES: '/my-courses',
  COURSE_DETAILS: '/my-courses/:courseSlug',
  LEARN: '/my-courses/:courseSlug/lecture/:lectureId',
  CERTIFICATES: '/student/certificates',
  PROGRESS: '/student/progress',
  PROFILE: '/profile',
  CONSULTATIONS: '/consultations',
  CONSULTATIONS_BOOKINGS: '/consultations/bookings',
  PURCHASE_HISTORY: '/purchase-history',
} as const;

// Instructor routes
export const INSTRUCTOR_ROUTES = {
  DASHBOARD: '/instructor/dashboard',
  COURSES: '/instructor/courses',
  STUDENTS: '/instructor/students',
  ANALYTICS: '/instructor/analytics',
} as const;

// Admin routes
export const ADMIN_ROUTES = {
  DASHBOARD: '/admin',
  USERS: '/admin/users',
  COURSES: '/admin/courses',
  ANALYTICS: '/admin/analytics',
  SETTINGS: '/admin/settings',
} as const;
