import NextAuth, { type NextAuthConfig, type NextAuthResult } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { env } from '@/config';
import { authConfig } from '@/lib/auth.config';
import { syncGuestCartUseCase } from '@/features/cart/application/use-cases/sync-guest-cart.use-case';
import { readAndClearPendingGuestCartCookie } from '@/features/cart/lib/pending-guest-cart.cookie';
import { Role } from '@prisma/client';

export const config: NextAuthConfig = {
  ...authConfig,

  adapter: PrismaAdapter(prisma),

  providers: [
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    GithubProvider({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  events: {
    async signIn({ user }) {
      if (!user.id) return;

      const courseIds = await readAndClearPendingGuestCartCookie();
      if (courseIds.length === 0) return;

      try {
        await syncGuestCartUseCase(user.id, courseIds);
      } catch (error) {
        console.error('[GUEST_CART_SYNC_ON_SIGNIN]', error);
      }
    },

    async createUser({ user }) {
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
    },
  },

  callbacks: {
    ...authConfig.callbacks,

    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;

        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { role: true },
        });
        token.role = dbUser?.role ?? Role.STUDENT;
      }

      return token;
    },
  },

  secret: env.AUTH_SECRET,
};

const {
  handlers: authHandlers,
  auth: authMethod,
  signIn: authSignIn,
  signOut: authSignOut,
} = NextAuth(config);

export const handlers = authHandlers;
export const auth: NextAuthResult['auth'] = authMethod;
export const signIn: NextAuthResult['signIn'] = authSignIn;
export const signOut: NextAuthResult['signOut'] = authSignOut;
