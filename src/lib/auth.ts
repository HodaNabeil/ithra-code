import NextAuth, { type NextAuthConfig, type NextAuthResult } from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { env } from '@/config';
import { authConfig } from '@/lib/auth.config';
import { syncGuestCartUseCase } from '@/features/cart/application/use-cases/sync-guest-cart.use-case';
import { readAndClearPendingGuestCartCookie } from '@/features/cart/lib/pending-guest-cart.cookie';
import { Role } from '@prisma/client';

// Runtime validation flag - checked on first auth request in production
let _productionAuthUrlValidated = false;

/**
 * Validates AUTH_URL for production deployments.
 * Called lazily on first auth request to avoid build failures
 * when using localhost in .env for local development.
 */
function validateProductionAuthUrl(): void {
  // Only validate in production to allow local dev with localhost
  // Skip during build (next build sets NODE_ENV=production but we're not "running" yet)
  if (
    process.env.NODE_ENV !== 'production' ||
    typeof window !== 'undefined'
  ) {
    return;
  }

  // Only validate once per server instance
  if (_productionAuthUrlValidated) return;

  const authUrl = process.env.AUTH_URL || env.AUTH_URL;

  // Check for localhost in production (security risk for redirects)
  if (authUrl?.includes('localhost')) {
    throw new Error(
      `Invalid AUTH_URL in production: ${authUrl}. Must be your actual domain (e.g., https://yourdomain.com)`,
    );
  }

  _productionAuthUrlValidated = true;
}

export const config: NextAuthConfig = {
  ...authConfig,

  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

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
      } else if (
        token.id &&
        (!token.picture || !token.name)
      ) {
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

// Wrap handlers to validate AUTH_URL on first production request
const authHandlers: typeof originalHandlers = {
  GET: async (...args) => {
    validateProductionAuthUrl();
    return originalHandlers.GET(...args);
  },
  POST: async (...args) => {
    validateProductionAuthUrl();
    return originalHandlers.POST(...args);
  },
};

export const handlers = authHandlers;
export const auth: NextAuthResult['auth'] = authMethod;
export const signIn: NextAuthResult['signIn'] = authSignIn;
export const signOut: NextAuthResult['signOut'] = authSignOut;
