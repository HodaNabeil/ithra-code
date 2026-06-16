import { AxiosError } from 'axios';
import { HttpError } from '@/lib/http-error';

/**
 * Extract error message from Axios errors and other error types
 */
export function extractErrorMessage(
  error: unknown,
  defaultMessage: string = 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.',
): string {
  if (error instanceof HttpError) {
    if (
      error.data &&
      typeof error.data === 'object' &&
      'error' in error.data &&
      typeof (error.data as { error: unknown }).error === 'string'
    ) {
      return (error.data as { error: string }).error;
    }
    if (
      error.data &&
      typeof error.data === 'object' &&
      'message' in error.data &&
      typeof (error.data as { message: unknown }).message === 'string'
    ) {
      return (error.data as { message: string }).message;
    }
    return error.message || defaultMessage;
  }

  // Handle AxiosError specifically
  if (error instanceof AxiosError) {
    // Try to extract message from response data
    const responseData = error.response?.data;

    if (responseData?.message) {
      return responseData.message;
    }

    if (responseData?.error) {
      return responseData.error;
    }

    // Fall back to axios error message
    if (error.message) {
      return error.message;
    }
  }

  // Handle regular Error objects
  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error;
  }

  // Return default message for any other error type
  return defaultMessage;
}
