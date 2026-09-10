import Cookies from 'js-cookie';
import { AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY } from '@/constants/auth';

/**
 * 🍪 Cookie Manager
 * Handles cookie operations on the client side
 * Uses js-cookie library for browser cookie management
 */

/**
 * Client-side cookie manager
 */
class ClientCookieManager {
  /** 🍪 Set access token */
  setAccessToken(token: string): void {
    Cookies.set(AUTH_TOKEN_KEY, token, {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }

  /** 🍪 Get access token */
  getAccessToken(): string | undefined {
    return Cookies.get(AUTH_TOKEN_KEY);
  }

  /** 🍪 Get refresh token */
  getRefreshToken(): string | undefined {
    return Cookies.get(REFRESH_TOKEN_KEY);
  }

  /** 🍪 Remove access token */
  removeAccessToken(): void {
    Cookies.remove(AUTH_TOKEN_KEY, { path: '/' });
  }

  /** 🍪 Remove refresh token */
  removeRefreshToken(): void {
    Cookies.remove(REFRESH_TOKEN_KEY, { path: '/' });
  }

  /** 🍪 Clear all auth tokens */
  clearTokens(): void {
    this.removeAccessToken();
    this.removeRefreshToken();
  }
}

// Export singleton instance
export const cookieManager = new ClientCookieManager();

// Export class for advanced usage
export { ClientCookieManager };
