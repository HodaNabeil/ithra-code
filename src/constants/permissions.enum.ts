/**
 * Enhanced Role-Based Access Control (RBAC) Permissions
 * Granular permission system for fine-grained access control
 */

export enum Permission {
  // Course Management Permissions
  COURSE_CREATE = 'course:create',
  /** Not used on route guards; read access uses JWT + content-visibility filters. */
  COURSE_READ = 'course:read',
  COURSE_UPDATE = 'course:update',
  COURSE_DELETE = 'course:delete',
  COURSE_PUBLISH = 'course:publish',
  COURSE_UNPUBLISH = 'course:unpublish',
  COURSE_ARCHIVE = 'course:archive',
  COURSE_RESTORE = 'course:restore',
  COURSE_ENROLL = 'course:enroll',
  COURSE_MANAGE_ENROLLMENTS = 'course:manage-enrollments',
  COURSE_VIEW_ANALYTICS = 'course:view-analytics',
  COURSE_EXPORT_DATA = 'course:export-data',

  // Section Management Permissions (publish via SECTION_UPDATE isPublished)
  SECTION_CREATE = 'section:create',
  /** Not used on route guards; read access uses enrollment + content-visibility. */
  SECTION_READ = 'section:read',
  SECTION_UPDATE = 'section:update',
  SECTION_DELETE = 'section:delete',
  SECTION_REORDER = 'section:reorder',

  // Lecture Management Permissions (publish via LECTURE_UPDATE isPublished)
  LECTURE_CREATE = 'lecture:create',
  /** Not used on route guards; read access uses enrollment + content-visibility. */
  LECTURE_READ = 'lecture:read',
  LECTURE_UPDATE = 'lecture:update',
  LECTURE_DELETE = 'lecture:delete',
  LECTURE_REORDER = 'lecture:reorder',
  LECTURE_UPLOAD_VIDEO = 'lecture:upload-video',
  LECTURE_MANAGE_ATTACHMENTS = 'lecture:manage-attachments',

  // Learning Path Permissions
  PATH_CREATE = 'path:create',
  /** Not used on route guards; public catalog uses content-visibility filters. */
  PATH_READ = 'path:read',
  PATH_UPDATE = 'path:update',
  PATH_DELETE = 'path:delete',
  /** Used by POST /paths/:idOrSlug/publish|unpublish (admin). PATCH isPublished also allowed via PATH_UPDATE. */
  PATH_PUBLISH = 'path:publish',
  PATH_UNPUBLISH = 'path:unpublish',
  PATH_MANAGE_COURSES = 'path:manage-courses',

  // Track Permissions
  TRACK_CREATE = 'track:create',
  /** Not used on route guards; public catalog uses content-visibility filters. */
  TRACK_READ = 'track:read',
  TRACK_UPDATE = 'track:update',
  TRACK_DELETE = 'track:delete',
  /** Used by POST /tracks/:idOrSlug/publish|unpublish (admin). PATCH isPublished also allowed via TRACK_UPDATE. */
  TRACK_PUBLISH = 'track:publish',
  TRACK_UNPUBLISH = 'track:unpublish',

  // User Management Permissions
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_MANAGE = 'user:manage',
  USER_VIEW_PROFILE = 'user:view-profile',
  USER_UPDATE_PROFILE = 'user:update-profile',
  USER_CHANGE_PASSWORD = 'user:change-password',
  USER_RESET_PASSWORD = 'user:reset-password',
  USER_MANAGE_ROLES = 'user:manage-roles',
  USER_MANAGE_PERMISSIONS = 'user:manage-permissions',
  USER_SUSPEND = 'user:suspend',
  USER_UNSUSPEND = 'user:unsuspend',
  USER_EXPORT_DATA = 'user:export-data',

  // Enrollment Management Permissions
  ENROLLMENT_CREATE = 'enrollment:create',
  ENROLLMENT_READ = 'enrollment:read',
  ENROLLMENT_UPDATE = 'enrollment:update',
  ENROLLMENT_DELETE = 'enrollment:delete',
  ENROLLMENT_MANAGE = 'enrollment:manage',
  ENROLLMENT_APPROVE = 'enrollment:approve',
  ENROLLMENT_REJECT = 'enrollment:reject',
  ENROLLMENT_EXPORT_DATA = 'enrollment:export-data',

  // Progress Tracking Permissions
  PROGRESS_READ = 'progress:read',
  PROGRESS_UPDATE = 'progress:update',
  PROGRESS_DELETE = 'progress:delete',
  PROGRESS_VIEW_ANALYTICS = 'progress:view-analytics',
  PROGRESS_EXPORT_DATA = 'progress:export-data',

  // Media Management Permissions
  MEDIA_UPLOAD = 'media:upload',
  MEDIA_READ = 'media:read',
  MEDIA_UPDATE = 'media:update',
  MEDIA_DELETE = 'media:delete',
  MEDIA_MANAGE_LIBRARY = 'media:manage-library',
  MEDIA_VIEW_ANALYTICS = 'media:view-analytics',

  // System Administration Permissions
  SYSTEM_VIEW_DASHBOARD = 'system:view-dashboard',
  SYSTEM_VIEW_ANALYTICS = 'system:view-analytics',
  SYSTEM_MANAGE_SETTINGS = 'system:manage-settings',
  SYSTEM_MANAGE_BACKUPS = 'system:manage-backups',
  SYSTEM_VIEW_LOGS = 'system:view-logs',
  SYSTEM_MANAGE_MAINTENANCE = 'system:manage-maintenance',
  SYSTEM_ACCESS_API_DOCS = 'system:access-api-docs',

  // Security Permissions
  SECURITY_MANAGE_TOKENS = 'security:manage-tokens',
  SECURITY_VIEW_AUDIT_LOGS = 'security:view-audit-logs',
  SECURITY_MANAGE_RATE_LIMITS = 'security:manage-rate-limits',
  SECURITY_MANAGE_IP_WHITELIST = 'security:manage-ip-whitelist',
  SECURITY_MANAGE_FIREWALL = 'security:manage-firewall',

  // Communication Permissions
  COMMUNICATION_SEND_EMAIL = 'communication:send-email',
  COMMUNICATION_SEND_BULK_EMAIL = 'communication:send-bulk-email',
  COMMUNICATION_MANAGE_TEMPLATES = 'communication:manage-templates',
  COMMUNICATION_VIEW_ANALYTICS = 'communication:view-analytics',

  // Content Moderation Permissions
  CONTENT_MODERATE = 'content:moderate',
  CONTENT_FLAG = 'content:flag',
  CONTENT_REVIEW = 'content:review',
  CONTENT_APPROVE = 'content:approve',
  CONTENT_REJECT = 'content:reject',

  // Reporting Permissions
  REPORT_CREATE = 'report:create',
  REPORT_READ = 'report:read',
  REPORT_UPDATE = 'report:update',
  REPORT_DELETE = 'report:delete',
  REPORT_EXPORT = 'report:export',
  REPORT_SCHEDULE = 'report:schedule',

  // Integration Permissions
  INTEGRATION_MANAGE = 'integration:manage',
  INTEGRATION_CONFIGURE = 'integration:configure',
  INTEGRATION_VIEW_LOGS = 'integration:view-logs',

  // Mobile App Permissions
  MOBILE_ACCESS = 'mobile:access',
  MOBILE_MANAGE_DEVICES = 'mobile:manage-devices',
  MOBILE_SEND_NOTIFICATIONS = 'mobile:send-notifications',

  // Review Permissions
  REVIEW_CREATE = 'review:create',
  REVIEW_READ = 'review:read',
  REVIEW_UPDATE = 'review:update',
  REVIEW_DELETE = 'review:delete',

  // Coupon Management Permissions
  COUPON_CREATE = 'coupon:create', // Create coupons for own courses (ownership-based)
  COUPON_READ = 'coupon:read',
  COUPON_UPDATE = 'coupon:update', // Update own coupons (ownership-based)
  COUPON_DELETE = 'coupon:delete', // Delete own coupons (ownership-based)
  COUPON_APPLY = 'coupon:apply',
  COUPON_VALIDATE = 'coupon:validate',
  COUPON_REMOVE = 'coupon:remove',

  // Shopping Cart Permissions
  CART_READ = 'cart:read',
  CART_ADD_ITEM = 'cart:add-item',
  CART_REMOVE_ITEM = 'cart:remove-item',
  CART_CLEAR = 'cart:clear',
  CART_MANAGE = 'cart:manage',

  // Checkout Permissions
  CHECKOUT_INITIATE = 'checkout:initiate',
  CHECKOUT_CONFIRM = 'checkout:confirm',

  // Order Permissions
  ORDER_CREATE = 'order:create',
  ORDER_READ = 'order:read',
  ORDER_READ_OWN = 'order:read-own',
  ORDER_UPDATE = 'order:update',
  ORDER_CANCEL = 'order:cancel',
  ORDER_REFUND = 'order:refund',
  ORDER_MANAGE = 'order:manage',
  ORDER_VIEW_ANALYTICS = 'order:view-analytics',
  ORDER_EXPORT = 'order:export',

  // Payment Permissions
  PAYMENT_READ = 'payment:read',
  PAYMENT_PROCESS = 'payment:process',
  PAYMENT_REFUND = 'payment:refund',
  PAYMENT_VOID = 'payment:void',
  PAYMENT_MANAGE = 'payment:manage',
  PAYMENT_VIEW_ANALYTICS = 'payment:view-analytics',

  // Advanced Features
  ADVANCED_SEARCH = 'advanced:search',
  /** Gates unrestricted course list filters (status, visibility) in applyCourseListVisibilityFilters. */
  ADVANCED_FILTERING = 'advanced:filtering',
  ADVANCED_EXPORT = 'advanced:export',
  ADVANCED_IMPORT = 'advanced:import',
  ADVANCED_ANALYTICS = 'advanced:analytics',
  ADVANCED_CUSTOMIZATION = 'advanced:customization',

  // Consultation Permissions
  CONSULTATION_AVAILABILITY_MANAGE = 'consultation:availability-manage',
  CONSULTATION_AVAILABILITY_READ = 'consultation:availability-read',
  CONSULTATION_BOOKING_CREATE = 'consultation:booking-create',
  CONSULTATION_BOOKING_READ = 'consultation:booking-read',
  CONSULTATION_BOOKING_MANAGE = 'consultation:booking-manage',
  CONSULTATION_BOOKING_CANCEL = 'consultation:booking-cancel',

  // Testimonial Management Permissions
  TESTIMONIAL_CREATE = 'testimonial:create',
  TESTIMONIAL_UPDATE = 'testimonial:update',
  TESTIMONIAL_DELETE = 'testimonial:delete',

  // FAQ Management Permissions
  FAQ_CREATE = 'faq:create',
  FAQ_UPDATE = 'faq:update',
  FAQ_DELETE = 'faq:delete',
}

/**
 * Permission Categories for easier management
 */
export const PermissionCategories = {
  COURSE_MANAGEMENT: [
    Permission.COURSE_CREATE,
    Permission.COURSE_READ,
    Permission.COURSE_UPDATE,
    Permission.COURSE_DELETE,
    Permission.COURSE_PUBLISH,
    Permission.COURSE_UNPUBLISH,
    Permission.COURSE_ARCHIVE,
    Permission.COURSE_RESTORE,
    Permission.COURSE_ENROLL,
    Permission.COURSE_MANAGE_ENROLLMENTS,
    Permission.COURSE_VIEW_ANALYTICS,
    Permission.COURSE_EXPORT_DATA,
  ],

  CONTENT_MANAGEMENT: [
    Permission.SECTION_CREATE,
    Permission.SECTION_READ,
    Permission.SECTION_UPDATE,
    Permission.SECTION_DELETE,
    Permission.SECTION_REORDER,
    Permission.LECTURE_CREATE,
    Permission.LECTURE_READ,
    Permission.LECTURE_UPDATE,
    Permission.LECTURE_DELETE,
    Permission.LECTURE_REORDER,
    Permission.LECTURE_UPLOAD_VIDEO,
    Permission.LECTURE_MANAGE_ATTACHMENTS,
    Permission.PATH_CREATE,
    Permission.PATH_READ,
    Permission.PATH_UPDATE,
    Permission.PATH_DELETE,
    Permission.PATH_PUBLISH,
    Permission.PATH_UNPUBLISH,
    Permission.PATH_MANAGE_COURSES,
    Permission.TRACK_CREATE,
    Permission.TRACK_READ,
    Permission.TRACK_UPDATE,
    Permission.TRACK_DELETE,
    Permission.TRACK_PUBLISH,
    Permission.TRACK_UNPUBLISH,
  ],

  USER_MANAGEMENT: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.USER_MANAGE,
    Permission.USER_VIEW_PROFILE,
    Permission.USER_UPDATE_PROFILE,
    Permission.USER_CHANGE_PASSWORD,
    Permission.USER_RESET_PASSWORD,
    Permission.USER_MANAGE_ROLES,
    Permission.USER_MANAGE_PERMISSIONS,
    Permission.USER_SUSPEND,
    Permission.USER_UNSUSPEND,
    Permission.USER_EXPORT_DATA,
  ],

  SYSTEM_ADMINISTRATION: [
    Permission.SYSTEM_VIEW_DASHBOARD,
    Permission.SYSTEM_VIEW_ANALYTICS,
    Permission.SYSTEM_MANAGE_SETTINGS,
    Permission.SYSTEM_MANAGE_BACKUPS,
    Permission.SYSTEM_VIEW_LOGS,
    Permission.SYSTEM_MANAGE_MAINTENANCE,
    Permission.SYSTEM_ACCESS_API_DOCS,
    Permission.SECURITY_MANAGE_TOKENS,
    Permission.SECURITY_VIEW_AUDIT_LOGS,
    Permission.SECURITY_MANAGE_RATE_LIMITS,
    Permission.SECURITY_MANAGE_IP_WHITELIST,
    Permission.SECURITY_MANAGE_FIREWALL,
  ],

  ENROLLMENT_MANAGEMENT: [
    Permission.ENROLLMENT_CREATE,
    Permission.ENROLLMENT_READ,
    Permission.ENROLLMENT_UPDATE,
    Permission.ENROLLMENT_DELETE,
    Permission.ENROLLMENT_MANAGE,
    Permission.ENROLLMENT_APPROVE,
    Permission.ENROLLMENT_REJECT,
    Permission.ENROLLMENT_EXPORT_DATA,
  ],

  MEDIA_MANAGEMENT: [
    Permission.MEDIA_UPLOAD,
    Permission.MEDIA_READ,
    Permission.MEDIA_UPDATE,
    Permission.MEDIA_DELETE,
    Permission.MEDIA_MANAGE_LIBRARY,
    Permission.MEDIA_VIEW_ANALYTICS,
  ],

  COUPON_MANAGEMENT: [
    Permission.COUPON_CREATE,
    Permission.COUPON_READ,
    Permission.COUPON_UPDATE,
    Permission.COUPON_DELETE,
    Permission.COUPON_APPLY,
    Permission.COUPON_VALIDATE,
    Permission.COUPON_REMOVE,
  ],

  CONSULTATION_MANAGEMENT: [
    Permission.CONSULTATION_AVAILABILITY_MANAGE,
    Permission.CONSULTATION_AVAILABILITY_READ,
    Permission.CONSULTATION_BOOKING_CREATE,
    Permission.CONSULTATION_BOOKING_READ,
    Permission.CONSULTATION_BOOKING_MANAGE,
    Permission.CONSULTATION_BOOKING_CANCEL,
  ],
} as const;

/**
 * Student permissions - base level
 */
const STUDENT_PERMISSIONS: Permission[] = [
  Permission.COURSE_READ,
  Permission.COURSE_ENROLL,
  Permission.SECTION_READ,
  Permission.LECTURE_READ,
  Permission.USER_VIEW_PROFILE,
  Permission.USER_UPDATE_PROFILE,
  Permission.USER_CHANGE_PASSWORD,
  Permission.ENROLLMENT_CREATE,
  Permission.ENROLLMENT_READ,
  Permission.PROGRESS_READ,
  Permission.PROGRESS_UPDATE,
  Permission.MOBILE_ACCESS,
  Permission.ADVANCED_SEARCH,
  // Coupon permissions for students
  Permission.COUPON_APPLY,
  Permission.COUPON_VALIDATE,
  Permission.COUPON_REMOVE,
  Permission.COUPON_READ,
  // Review permissions for students
  Permission.REVIEW_CREATE,
  Permission.REVIEW_READ,
  Permission.REVIEW_UPDATE,
  Permission.REVIEW_DELETE,
  // Cart permissions for students
  Permission.CART_READ,
  Permission.CART_ADD_ITEM,
  Permission.CART_REMOVE_ITEM,
  Permission.CART_CLEAR,
  Permission.CART_MANAGE,
  // Checkout & Order permissions for students
  Permission.CHECKOUT_INITIATE,
  Permission.CHECKOUT_CONFIRM,
  Permission.ORDER_READ_OWN,
  Permission.ORDER_REFUND, // Request refund for own orders
  // Consultation permissions for students
  Permission.CONSULTATION_AVAILABILITY_READ,
  Permission.CONSULTATION_BOOKING_CREATE,
  Permission.CONSULTATION_BOOKING_READ,
  Permission.CONSULTATION_BOOKING_CANCEL,
];

/**
 * Instructor permissions - includes student permissions
 */
const INSTRUCTOR_PERMISSIONS: Permission[] = [
  // Student permissions
  ...STUDENT_PERMISSIONS,
  // Course management
  Permission.COURSE_CREATE,
  Permission.COURSE_UPDATE,
  Permission.COURSE_DELETE,
  Permission.COURSE_PUBLISH,
  Permission.COURSE_UNPUBLISH,
  Permission.COURSE_ARCHIVE,
  Permission.COURSE_RESTORE,
  Permission.COURSE_VIEW_ANALYTICS,
  Permission.COURSE_EXPORT_DATA,
  // Content management
  Permission.SECTION_CREATE,
  Permission.SECTION_READ,
  Permission.SECTION_UPDATE,
  Permission.SECTION_DELETE,
  Permission.SECTION_REORDER,
  Permission.LECTURE_CREATE,
  Permission.LECTURE_READ,
  Permission.LECTURE_UPDATE,
  Permission.LECTURE_DELETE,
  Permission.LECTURE_REORDER,
  Permission.LECTURE_UPLOAD_VIDEO,
  Permission.LECTURE_MANAGE_ATTACHMENTS,
  // Enrollment management
  Permission.ENROLLMENT_MANAGE,
  Permission.ENROLLMENT_APPROVE,
  Permission.ENROLLMENT_REJECT,
  // Media management
  Permission.MEDIA_UPLOAD,
  Permission.MEDIA_READ,
  Permission.MEDIA_UPDATE,
  Permission.MEDIA_DELETE,
  Permission.MEDIA_MANAGE_LIBRARY,
  Permission.MEDIA_VIEW_ANALYTICS,
  // Progress tracking
  Permission.PROGRESS_VIEW_ANALYTICS,
  Permission.PROGRESS_EXPORT_DATA,
  // Communication
  Permission.COMMUNICATION_SEND_EMAIL,
  Permission.COMMUNICATION_MANAGE_TEMPLATES,
  Permission.COMMUNICATION_VIEW_ANALYTICS,
  // Coupon permissions for instructors
  Permission.COUPON_CREATE,
  Permission.COUPON_READ,
  Permission.COUPON_UPDATE,
  Permission.COUPON_DELETE,
  // Order permissions for instructors (view analytics for their courses)
  Permission.ORDER_VIEW_ANALYTICS,
  // Consultation permissions for instructors
  Permission.CONSULTATION_AVAILABILITY_MANAGE,
  Permission.CONSULTATION_BOOKING_READ,
  Permission.CONSULTATION_BOOKING_MANAGE,
];

/**
 * Admin permissions - includes instructor permissions
 */
const ADMIN_PERMISSIONS: Permission[] = [
  // All instructor permissions
  ...INSTRUCTOR_PERMISSIONS,
  // User management
  Permission.USER_CREATE,
  Permission.USER_READ,
  Permission.USER_UPDATE,
  Permission.USER_DELETE,
  Permission.USER_MANAGE,
  Permission.USER_MANAGE_ROLES,
  Permission.USER_MANAGE_PERMISSIONS,
  Permission.USER_SUSPEND,
  Permission.USER_UNSUSPEND,
  Permission.USER_RESET_PASSWORD,
  Permission.USER_EXPORT_DATA,
  // Path & Track management (admin only)
  Permission.PATH_CREATE,
  Permission.PATH_READ,
  Permission.PATH_UPDATE,
  Permission.PATH_DELETE,
  Permission.PATH_PUBLISH,
  Permission.PATH_UNPUBLISH,
  Permission.PATH_MANAGE_COURSES,
  Permission.TRACK_CREATE,
  Permission.TRACK_READ,
  Permission.TRACK_UPDATE,
  Permission.TRACK_DELETE,
  Permission.TRACK_PUBLISH,
  Permission.TRACK_UNPUBLISH,
  // Full enrollment management (admin only extras)
  Permission.ENROLLMENT_UPDATE,
  Permission.ENROLLMENT_DELETE,
  Permission.ENROLLMENT_EXPORT_DATA,
  // Progress management (admin only extras)
  Permission.PROGRESS_DELETE,
  // System administration
  Permission.SYSTEM_VIEW_DASHBOARD,
  Permission.SYSTEM_VIEW_ANALYTICS,
  Permission.SYSTEM_MANAGE_SETTINGS,
  Permission.SYSTEM_MANAGE_BACKUPS,
  Permission.SYSTEM_VIEW_LOGS,
  Permission.SYSTEM_MANAGE_MAINTENANCE,
  Permission.SYSTEM_ACCESS_API_DOCS,
  // Security
  Permission.SECURITY_MANAGE_TOKENS,
  Permission.SECURITY_VIEW_AUDIT_LOGS,
  Permission.SECURITY_MANAGE_RATE_LIMITS,
  Permission.SECURITY_MANAGE_IP_WHITELIST,
  Permission.SECURITY_MANAGE_FIREWALL,
  // Communication (admin extras)
  Permission.COMMUNICATION_SEND_BULK_EMAIL,
  // Content moderation
  Permission.CONTENT_MODERATE,
  Permission.CONTENT_FLAG,
  Permission.CONTENT_REVIEW,
  Permission.CONTENT_APPROVE,
  Permission.CONTENT_REJECT,
  // Review management (admin only)
  Permission.REVIEW_UPDATE,
  // Reporting
  Permission.REPORT_CREATE,
  Permission.REPORT_READ,
  Permission.REPORT_UPDATE,
  Permission.REPORT_DELETE,
  Permission.REPORT_EXPORT,
  Permission.REPORT_SCHEDULE,
  // Integration
  Permission.INTEGRATION_MANAGE,
  Permission.INTEGRATION_CONFIGURE,
  Permission.INTEGRATION_VIEW_LOGS,
  // Mobile management
  Permission.MOBILE_MANAGE_DEVICES,
  Permission.MOBILE_SEND_NOTIFICATIONS,
  // Order & Payment management
  Permission.ORDER_CREATE,
  Permission.ORDER_READ,
  Permission.ORDER_UPDATE,
  Permission.ORDER_CANCEL,
  Permission.ORDER_MANAGE,
  Permission.ORDER_EXPORT,
  Permission.PAYMENT_READ,
  Permission.PAYMENT_PROCESS,
  Permission.PAYMENT_REFUND,
  Permission.PAYMENT_VOID,
  Permission.PAYMENT_MANAGE,
  Permission.PAYMENT_VIEW_ANALYTICS,
  // Advanced features
  Permission.ADVANCED_FILTERING,
  Permission.ADVANCED_EXPORT,
  Permission.ADVANCED_IMPORT,
  Permission.ADVANCED_ANALYTICS,
  Permission.ADVANCED_CUSTOMIZATION,
  // Consultation – no extra entries needed; all 6 already inherited:
  // AVAILABILITY_MANAGE & BOOKING_READ/MANAGE ← from INSTRUCTOR_PERMISSIONS
  // AVAILABILITY_READ & BOOKING_CREATE/READ/CANCEL ← from STUDENT_PERMISSIONS
  // Testimonial management (admin only)
  Permission.TESTIMONIAL_CREATE,
  Permission.TESTIMONIAL_UPDATE,
  Permission.TESTIMONIAL_DELETE,
  // FAQ management (admin only)
  Permission.FAQ_CREATE,
  Permission.FAQ_UPDATE,
  Permission.FAQ_DELETE,
];

/**
 * Role-based permission mappings
 * Defines which permissions each role should have by default
 */
export const RolePermissions = {
  STUDENT: STUDENT_PERMISSIONS,
  INSTRUCTOR: INSTRUCTOR_PERMISSIONS,
  ADMIN: ADMIN_PERMISSIONS,
} as const;

/**
 * Helper function to check if a permission exists
 */
export function isValidPermission(
  permission: string,
): permission is Permission {
  return Object.values(Permission).includes(permission as Permission);
}

/**
 * Helper function to get permissions for a specific role
 */
export function getPermissionsForRole(
  role: keyof typeof RolePermissions,
): Permission[] {
  return RolePermissions[role] || [];
}

/**
 * Helper function to check if a role has a specific permission
 */
export function hasPermission(
  role: keyof typeof RolePermissions,
  permission: Permission,
): boolean {
  return RolePermissions[role]?.includes(permission) || false;
}

/**
 * Helper function to get all permissions as an array
 */
export function getAllPermissions(): Permission[] {
  return Object.values(Permission);
}

/**
 * Helper function to get permission categories
 */
export function getPermissionCategories() {
  return PermissionCategories;
}
