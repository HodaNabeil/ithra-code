import NextAuth from 'next-auth';
import { NextResponse, type NextMiddleware } from 'next/server';
import '@/config/env';
import { authConfig } from '@/lib/auth.config';
import { AUTH_ROUTES } from '@/constants/auth';
import { APP_ROUTES, APP_USER_ROLES } from '@/constants/enums';

function getRoleHome(role: string | undefined): string {
  switch (role) {
    case APP_USER_ROLES.ADMIN:
      return APP_ROUTES.ADMIN;
    case APP_USER_ROLES.INSTRUCTOR:
      return '/instructor';
    default:
      return APP_ROUTES.MY_COURSES;
  }
}

const { auth } = NextAuth(authConfig);

const proxy = auth((req) => {
  const { nextUrl } = req;

  // Auth.js may put an error payload or `{ user: null }` on `req.auth`.
  // Only a real user id counts as signed in — otherwise /auth/signin loops
  // to /my-courses when `/api/auth/session` is failing.
  const isLoggedIn = Boolean(req.auth?.user?.id);
  const role = req.auth?.user?.role;
  const pathname = nextUrl.pathname;

  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/courses') ||
    pathname === '/cart' ||
    pathname === '/docs';

  if (isPublicRoute) return NextResponse.next();

  const isAdminRoute = pathname.startsWith('/admin');
  const isInstructorRoute = pathname.startsWith('/instructor');
  const isStudentRoute =
    pathname.startsWith('/student') || pathname.startsWith('/my-courses');

  const isProtectedRoute = isAdminRoute || isInstructorRoute || isStudentRoute;
  const isAuthRoute = pathname.startsWith(AUTH_ROUTES.SIGN_IN);

  if (!isLoggedIn && isProtectedRoute) {
    const signInUrl = new URL(AUTH_ROUTES.SIGN_IN, nextUrl);
    signInUrl.searchParams.set('callbackUrl', `${pathname}${nextUrl.search}`);
    return NextResponse.redirect(signInUrl);
  }

  if (isLoggedIn && isAuthRoute) {
    const callbackUrl = nextUrl.searchParams.get('callbackUrl');
    if (callbackUrl?.startsWith('/') && !callbackUrl.startsWith('//')) {
      return NextResponse.redirect(new URL(callbackUrl, nextUrl.origin));
    }
    return NextResponse.redirect(new URL(getRoleHome(role), nextUrl));
  }

  if (isAdminRoute && role !== APP_USER_ROLES.ADMIN) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  if (isInstructorRoute && role !== APP_USER_ROLES.INSTRUCTOR) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  if (isStudentRoute && role && role !== APP_USER_ROLES.STUDENT) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

export default proxy as unknown as NextMiddleware;

export const config = {
  matcher: ['/((?!api/auth|monitoring|_next/static|_next/image|favicon.ico).*)'],
};
