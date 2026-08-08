/**
 * Local storage and session storage keys
 */

// Authentication storage
export const STORAGE_KEYS = {
  // Auth
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
  REMEMBER_ME: 'remember_me',

  // User preferences
  THEME: 'theme_preference',
  LANGUAGE: 'language_preference',
  SIDEBAR_STATE: 'sidebar_state',
  TABLE_PREFERENCES: 'table_preferences',

  // UI state
  LAST_VISITED_ROUTE: 'last_visited_route',
  SCROLL_POSITION: 'scroll_position',
  MODAL_STATE: 'modal_state',

  // Course/Learning
  CURRENT_COURSE: 'current_course',
  VIDEO_PROGRESS: 'video_progress',
  QUIZ_ANSWERS: 'quiz_answers',
  DRAFT_CONTENT: 'draft_content',

  // Feature flags
  ONBOARDING_COMPLETED: 'onboarding_completed',
  TOUR_COMPLETED: 'tour_completed',
  BETA_FEATURES_ENABLED: 'beta_features_enabled',

  // Cache
  CACHE_TIMESTAMP: 'cache_timestamp',
  CACHED_DATA: 'cached_data',

  // Analytics
  ANALYTICS_ID: 'analytics_id',
  LAST_ACTIVITY: 'last_activity',

  // Cart
  GUEST_CART: 'guest_cart',
} as const;

// Storage types
export const STORAGE_TYPES = {
  LOCAL: 'local',
  SESSION: 'session',
  COOKIE: 'cookie',
} as const;

// Cache duration (in milliseconds)
export const CACHE_DURATION = {
  SHORT: 5 * 60 * 1000, // 5 minutes
  MEDIUM: 30 * 60 * 1000, // 30 minutes
  LONG: 2 * 60 * 60 * 1000, // 2 hours
  VERY_LONG: 24 * 60 * 60 * 1000, // 24 hours
} as const;
