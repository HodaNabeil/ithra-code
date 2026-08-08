import { APP_USER_ROLES } from '@/constants/enums';

export const AUTH_SESSION_STATUS = {
  LOADING: 'loading',
  AUTHENTICATED: 'authenticated',
  UNAUTHENTICATED: 'unauthenticated',
} as const;

export type AuthSessionStatus =
  (typeof AUTH_SESSION_STATUS)[keyof typeof AUTH_SESSION_STATUS];

export { APP_USER_ROLES as AUTH_ROLES };
export type AuthRole = (typeof APP_USER_ROLES)[keyof typeof APP_USER_ROLES];

export function isAuthSessionLoading(status: string): boolean {
  return status === AUTH_SESSION_STATUS.LOADING;
}

export function isAuthenticatedStatus(status: string): boolean {
  return status === AUTH_SESSION_STATUS.AUTHENTICATED;
}

export function isUnauthenticatedStatus(status: string): boolean {
  return status === AUTH_SESSION_STATUS.UNAUTHENTICATED;
}
