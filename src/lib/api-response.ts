import { NextResponse } from 'next/server';

export type ApiSuccessResponse<T> = {
  success: true;
  message: string;
  data: T;
};

export type ApiErrorResponse = {
  success: false;
  message: string;
};

export function apiSuccess<T>(
  data: T,
  message: string,
  status = 200,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ success: true, message, data }, { status });
}

export function apiError(
  message: string,
  status = 500,
): NextResponse<ApiErrorResponse> {
  return NextResponse.json({ success: false, message }, { status });
}
