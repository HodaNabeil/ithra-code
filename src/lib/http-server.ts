import axios, { type AxiosRequestConfig } from 'axios';
import { cookies } from 'next/headers';
import { env } from '@/config/env';
import { AUTH_TOKEN_KEY } from '@/constants/auth';
import { HttpError } from '@/lib/http-error';

const API_URL = env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

/**
 * Build request headers for server-side HTTP calls.
 * Forwards the incoming browser cookies so NextAuth `auth()` works in API routes.
 */
async function buildServerHeaders(): Promise<Record<string, string>> {
  const cookieStore = await cookies();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  const cookieHeader = cookieStore
    .getAll()
    .map((c) => `${c.name}=${c.value}`)
    .join('; ');

  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }

  const accessToken = cookieStore.get(AUTH_TOKEN_KEY)?.value;
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  return headers;
}

async function request<T>(
  method: 'get' | 'post' | 'delete',
  url: string,
  data?: unknown,
  config?: AxiosRequestConfig,
): Promise<T> {
  const headers = await buildServerHeaders();

  try {
    const response = await axios.request<T>({
      method,
      baseURL: API_URL,
      url,
      data,
      headers: { ...headers, ...config?.headers },
      timeout: 10_000,
      ...config,
    });
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      const body = error.response.data as
        | { message?: string; error?: string }
        | undefined;
      const message =
        body?.message || body?.error || error.message || 'حدث خطأ غير متوقع';
      throw new HttpError(error.response.status, message, body);
    }
    throw error;
  }
}

/**
 * Server-only HTTP client for Server Actions and Server Components.
 * Never import this from client components — use `@/lib/http-client` instead.
 */
export const httpServer = {
  get: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    request<T>('get', url, undefined, config),

  post: <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ) => request<T>('post', url, data, config),

  delete: <T = unknown>(url: string, config?: AxiosRequestConfig) =>
    request<T>('delete', url, undefined, config),
};
