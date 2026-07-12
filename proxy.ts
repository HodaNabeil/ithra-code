import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth } from '@/lib/auth';
import { AUTH_ROUTES } from '@/constant/auth';
import { Role } from '@prisma/client';

export default async function proxy(req: NextRequest) {
  const session = await auth();
  const { nextUrl } = req;

  const isLoggedIn = !!session;
  const role = session?.user?.role || Role.STUDENT;
  const pathname = nextUrl.pathname;

  const isPublicRoute =
    pathname === '/' ||
    pathname.startsWith('/courses') ||
    pathname === '/cart' ||
    pathname === '/docs';

  if (isPublicRoute) return NextResponse.next();

  const isAdminRoute = pathname.startsWith('/admin');
  const isInstructorRoute = pathname.startsWith('/instructor');
  const isStudentRoute = pathname.startsWith('/student');

  const isProtectedRoute = isAdminRoute || isInstructorRoute || isStudentRoute;
  const isAuthRoute = pathname.startsWith(AUTH_ROUTES.SIGN_IN);

  if (!isLoggedIn && isProtectedRoute) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.SIGN_IN, nextUrl));
  }
  if (isLoggedIn && isAuthRoute) {
    const callbackUrl = nextUrl.searchParams.get('callbackUrl');
    if (callbackUrl) {
      return NextResponse.redirect(new URL(callbackUrl, nextUrl.origin));
    }
    return NextResponse.redirect(new URL(`/${role.toLowerCase()}`, nextUrl));
  }
  if (isAdminRoute && role !== Role.ADMIN)
    return NextResponse.redirect(new URL('/', nextUrl));

  if (isInstructorRoute && role !== Role.INSTRUCTOR)
    return NextResponse.redirect(new URL('/', nextUrl));

  if (isStudentRoute && role !== Role.STUDENT)
    return NextResponse.redirect(new URL('/', nextUrl));

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api/auth|_next/static|_next/image|favicon.ico).*)'],
};
