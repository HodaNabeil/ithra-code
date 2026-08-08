export {
  AUTH_SESSION_STATUS,
  AUTH_ROLES,
  isAuthenticatedStatus,
  isAuthSessionLoading,
  isUnauthenticatedStatus,
} from './states/auth.states';

export type { AuthSessionStatus, AuthRole } from './states/auth.states';

export const AUTH_ROUTES = {
  SIGN_IN: '/auth/signin',
} as const;

export const AUTH_ENDPOINTS = {
  LOGIN: '/auth/signin',
  REGISTER: '/auth/signup',
  REFRESH: '/auth/refresh',
  LOGOUT: '/auth/logout',
} as const;

// Storage keys
export const AUTH_TOKEN_KEY = 'accessToken';
export const REFRESH_TOKEN_KEY = 'refreshToken';
