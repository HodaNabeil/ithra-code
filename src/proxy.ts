import NextAuth from 'next-auth';
import { NextResponse, type NextMiddleware } from 'next/server';
import { authConfig } from '@/lib/auth.config';
import { AUTH_ROUTES } from '@/constants/auth';
import { APP_ROUTES } from '@/constants/enums';
import { Role } from '@prisma/client';

function getRoleHome(role: Role): string {
  switch (role) {
    case Role.ADMIN:
      return APP_ROUTES.ADMIN;
    case Role.INSTRUCTOR:
      return '/instructor';
    case Role.STUDENT:
    default:
      return APP_ROUTES.MY_COURSES;
  }
}

const { auth } = NextAuth(authConfig);

const proxy = auth((req) => {
  const { nextUrl } = req;

  const isLoggedIn = !!req.auth;
  const role = (req.auth?.user?.role ?? Role.STUDENT) as Role;
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
    signInUrl.searchParams.set(
      'callbackUrl',
      `${pathname}${nextUrl.search}`,
    );
    return NextResponse.redirect(signInUrl);
  }

  if (isLoggedIn && isAuthRoute) {
    const callbackUrl = nextUrl.searchParams.get('callbackUrl');
    if (callbackUrl) {
      return NextResponse.redirect(new URL(callbackUrl, nextUrl.origin));
    }
    return NextResponse.redirect(new URL(getRoleHome(role), nextUrl));
  }

  if (isAdminRoute && role !== Role.ADMIN) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  if (isInstructorRoute && role !== Role.INSTRUCTOR) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  if (isStudentRoute && role !== Role.STUDENT) {
    return NextResponse.redirect(new URL('/', nextUrl));
  }

  return NextResponse.next();
});

export default proxy as unknown as NextMiddleware;

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
