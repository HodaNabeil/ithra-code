import NextAuth, { type NextAuthConfig, type NextAuthResult } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { env } from '@/config';
import { AUTH_ROUTES } from '@/constant/auth';
import { Role } from '@prisma/client';

export const config: NextAuthConfig = {
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

  session: {
    strategy: 'jwt',
  },

  events: {
    async createUser({ user }) {
      const [firstName, ...rest] = (user.name ?? '').split(' ');
      await prisma.user.update({
        where: { id: user.id },
        data: {
          firstName: firstName || null,
          lastName: rest.join(' ') || null,
          isEmailVerified: !!user.emailVerified,
          role: Role.STUDENT,
        },
      });
    },
  },

  callbacks: {
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

    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = token.picture as string;
      }
      return session;
    },
  },

  pages: {
    signIn: AUTH_ROUTES.SIGN_IN,
    error: AUTH_ROUTES.SIGN_IN,
  },

  secret: env.AUTH_SECRET,
  trustHost: true,
} satisfies NextAuthConfig;

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
