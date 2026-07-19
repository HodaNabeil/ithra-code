import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from 'axios';
import { cookieManager } from '@/lib/cookie-manager';
import { AUTH_ENDPOINTS } from '@/constants/auth';
import { env } from '@/config/env';

/**
 * 🔗 Type Definitions
 */
interface RefreshTokenResponse {
  data: {
    accessToken: string;
  };
}

/**
 * 🔗 Unified HTTP Client
 * Works on both client and server (Server Components, Server Actions, React Query)
 * Tokens are managed via httpOnly cookies with withCredentials: true
 */

const API_URL = env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

// Module-level state for refresh queue
let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

/**
 * Check if URL is an auth endpoint that shouldn't trigger token refresh
 */
function isAuthEndpoint(url: string = ''): boolean {
  return Object.values(AUTH_ENDPOINTS).some((endpoint) =>
    url.includes(endpoint),
  );
}

/**
 * Create axios instance with interceptors
 */
function createAxiosInstance(): AxiosInstance {
  const instance = axios.create({
    baseURL: API_URL,
    timeout: 10_000,
    headers: { 'Content-Type': 'application/json' },
    withCredentials: true, // 🍪 Cookies sent automatically
  });

  // Request interceptor - logging
  instance.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      // Inject access token from cookies
      const token = cookieManager.getAccessToken();
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    },
    (error) => {
      console.error('[HTTP] Request error:', error);
      return Promise.reject(error);
    },
  );

  // Response interceptor - handle 401 with token refresh
  instance.interceptors.response.use(
    async (response) => {
      return response;
    },
    async (error) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & {
        _retry?: boolean;
      };

      // Handle 401 with token refresh (except for auth endpoints)
      if (
        error.response?.status === 401 &&
        !isAuthEndpoint(originalRequest?.url) &&
        !originalRequest._retry
      ) {
        if (isRefreshing) {
          // Queue the request while refresh is in progress
          return new Promise((resolve, reject) => {
            refreshQueue.push({ resolve, reject });
          })
            .then(() => instance(originalRequest))
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          // Refresh token - cookies sent automatically
          const refreshResponse = await axios.post<RefreshTokenResponse>(
            `${API_URL}${AUTH_ENDPOINTS.REFRESH}`,
            {},
            { withCredentials: true },
          );

          // Update cookies with new tokens
          if (refreshResponse.data?.data) {
            const { accessToken } = refreshResponse.data.data;

            if (accessToken) {
              cookieManager.setAccessToken(accessToken);
            }
            // refreshToken is automatically extracted from set-cookie header by response interceptor
          }

          // Process queued requests
          refreshQueue.forEach(({ resolve }) => resolve(''));
          refreshQueue = [];

          // Retry original request
          return instance(originalRequest);
        } catch (refreshError) {
          console.error('❌ Token refresh failed:', refreshError);

          // Clear tokens on refresh failure
          cookieManager.clearTokens();

          refreshQueue.forEach(({ reject }) => reject(refreshError));
          refreshQueue = [];
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      console.error('[HTTP] Error:', error.message);
      return Promise.reject(error);
    },
  );

  return instance;
}

// Create singleton instance
const axiosInstance = createAxiosInstance();

/**
 * HTTP Client with convenience methods
 */
export const http = {
  get: async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await axiosInstance.get<T>(url, config);
    return response.data;
  },

  post: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await axiosInstance.post<T>(url, data, config);
    return response.data;
  },

  put: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await axiosInstance.put<T>(url, data, config);
    return response.data;
  },

  patch: async <T = unknown>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await axiosInstance.patch<T>(url, data, config);
    return response.data;
  },

  delete: async <T = unknown>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<T> => {
    const response = await axiosInstance.delete<T>(url, config);
    return response.data;
  },

  /** Raw axios instance for advanced use */
  instance: axiosInstance,
};
