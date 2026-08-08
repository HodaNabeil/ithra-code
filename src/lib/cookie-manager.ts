import Cookies from 'js-cookie';
import { env } from '@/config/env';
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
    const options: Cookies.CookieAttributes = {
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    };

    if (env.NODE_ENV === 'production' && env.COOKIE_DOMAIN) {
      options.domain = env.COOKIE_DOMAIN;
    }

    Cookies.set(AUTH_TOKEN_KEY, token, options);
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
