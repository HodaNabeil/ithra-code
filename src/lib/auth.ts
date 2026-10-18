import NextAuth, { type NextAuthConfig, type NextAuthResult } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import GitHubProvider from 'next-auth/providers/github';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { env } from '@/config';
import { authConfig } from '@/lib/auth.config';
import { syncGuestCartUseCase } from '@/features/cart/application/use-cases/sync-guest-cart.use-case';
import { readAndClearPendingGuestCartCookie } from '@/features/cart/lib/pending-guest-cart.cookie';
import { Role } from '@prisma/client';

// Runtime validation flag - checked on first auth request in production
let _productionAuthUrlValidated = false;

function isLocalOrigin(url: string): boolean {
  try {
    const hostname = new URL(url).hostname;
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname === '::1'
    );
  } catch {
    return url.includes('localhost');
  }
}

/**
 * Ensures AUTH_URL is safe in production.
 *
 * If a stale localhost AUTH_URL is deployed, derive the runtime origin from
 * the incoming request so auth can keep working instead of failing with a
 * generic "Configuration" error.
 */
function ensureProductionAuthUrl(requestLike?: unknown): void {
  if (process.env.NODE_ENV !== 'production' || typeof window !== 'undefined') {
    return;
  }

  if (_productionAuthUrlValidated) return;

  const authUrl = process.env.AUTH_URL || env.AUTH_URL;

  if (!isLocalOrigin(authUrl)) {
    _productionAuthUrlValidated = true;
    return;
  }

  const requestUrl =
    requestLike &&
    typeof requestLike === 'object' &&
    'url' in requestLike &&
    typeof (requestLike as { url?: unknown }).url === 'string'
      ? (requestLike as { url: string }).url
      : null;

  if (requestUrl) {
    const requestOrigin = new URL(requestUrl).origin;

    if (!isLocalOrigin(requestOrigin)) {
      process.env.AUTH_URL = requestOrigin;
      process.env.NEXTAUTH_URL = requestOrigin;
      _productionAuthUrlValidated = true;
      console.warn(
        `[AUTH_URL_AUTO_RECOVERY] AUTH_URL pointed to localhost in production. Using request origin instead: ${requestOrigin}`,
      );
      return;
    }
  }

  throw new Error(
    `Invalid AUTH_URL in production: ${authUrl}. Must be your actual domain (e.g., https://yourdomain.com)`,
  );
}

export const config: NextAuthConfig = {
  ...authConfig,

  adapter: PrismaAdapter(prisma),

  providers: (() => {
    const providers: NonNullable<NextAuthConfig['providers']> = [];

    if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
      providers.push(
        GoogleProvider({
          clientId: env.AUTH_GOOGLE_ID,
          clientSecret: env.AUTH_GOOGLE_SECRET,
          allowDangerousEmailAccountLinking: true,
        }),
      );
    }

    if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
      providers.push(
        GitHubProvider({
          clientId: env.AUTH_GITHUB_ID,
          clientSecret: env.AUTH_GITHUB_SECRET,
          // Pin issuer to GitHub to prevent bad env overrides (e.g. AUTH_GITHUB_ISSUER=authjs.dev)
          issuer: 'https://github.com/login/oauth',
          allowDangerousEmailAccountLinking: true,
        }),
      );
    }

    return providers;
  })(),

  events: {
    async signIn({ user }) {
      if (!user.id) return;

      try {
        const courseIds = await readAndClearPendingGuestCartCookie();
        if (courseIds.length === 0) return;

        await syncGuestCartUseCase(user.id, courseIds);
      } catch (error) {
        console.error('[GUEST_CART_SYNC_ON_SIGNIN]', error);
      }
    },

    async createUser({ user }) {
      if (!user.id) return;

      try {
        const [firstName, ...rest] = (user.name ?? '').split(' ');
        await prisma.user.update({
          where: { id: user.id },
          data: {
            firstName: firstName || null,
            lastName: rest.join(' ') || null,
            isEmailVerified: !!(user as { emailVerified?: Date | null })
              .emailVerified,
            role: Role.STUDENT,
          },
        });
      } catch (error) {
        console.error('[AUTH_CREATE_USER_PROFILE]', error);
      }
    },
  },

  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: {
            role: true,
            image: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        });
        token.role = dbUser?.role ?? Role.STUDENT;

        const resolvedName =
          user.name ||
          dbUser?.name ||
          [dbUser?.firstName, dbUser?.lastName].filter(Boolean).join(' ') ||
          null;

        if (user.image) {
          token.picture = user.image;
        } else if (dbUser?.image) {
          token.picture = dbUser.image;
        }

        if (resolvedName) {
          token.name = resolvedName;
        }
      } else if (token.id && (!token.picture || !token.name)) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            image: true,
            name: true,
            firstName: true,
            lastName: true,
          },
        });

        if (dbUser?.image && !token.picture) {
          token.picture = dbUser.image;
        }

        if (!token.name) {
          const resolvedName =
            dbUser?.name ||
            [dbUser?.firstName, dbUser?.lastName].filter(Boolean).join(' ');

          if (resolvedName) {
            token.name = resolvedName;
          }
        }
      }

      return token;
    },
  },

  secret: env.AUTH_SECRET,
  trustHost: true,
  basePath: '/api/auth',
};

const {
  handlers: originalHandlers,
  auth: authMethod,
  signIn: authSignIn,
  signOut: authSignOut,
} = NextAuth(config);

// Wrap handlers to validate/repair AUTH_URL on first production request
const authHandlers: typeof originalHandlers = {
  GET: async (...args) => {
    ensureProductionAuthUrl(args[0]);
    return originalHandlers.GET(...args);
  },
  POST: async (...args) => {
    ensureProductionAuthUrl(args[0]);
    return originalHandlers.POST(...args);
  },
};

export const handlers = authHandlers;
export const auth: NextAuthResult['auth'] = authMethod;
export const signIn: NextAuthResult['signIn'] = authSignIn;
export const signOut: NextAuthResult['signOut'] = authSignOut;
