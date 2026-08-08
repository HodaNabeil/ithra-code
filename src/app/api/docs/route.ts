import { NextResponse } from 'next/server';

/** Legacy URL — API docs UI lives at /docs (pages cannot reliably live under /api). */
export function GET(request: Request) {
  return NextResponse.redirect(new URL('/docs', request.url));
}
