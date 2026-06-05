import NextAuth, { type NextAuthConfig, type NextAuthResult } from 'next-auth';
import GithubProvider from 'next-auth/providers/github';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';
import { env } from '@/config';
import { AUTH_ROUTES } from '@/constant/auth';
import { mergeCart } from '@/features/cart/actions/cart';
import { Role } from '@prisma/client';

export const config: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),

  providers: [
    // ── Google ───────────────────────────────────────
    GoogleProvider({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),

    // ── GitHub ───────────────────────────────────────
    GithubProvider({
      clientId: env.AUTH_GITHUB_ID,
      clientSecret: env.AUTH_GITHUB_SECRET,
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    // ── JWT Callback

    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role || Role.STUDENT;
      }
      return token;
    },

    // ── Session Callback
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.image = token.picture as string;
      }
      return session;
    },

    async signIn({ user, account }) {
      if (account?.provider === 'google' || account?.provider === 'github') {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email as string },
        });

        if (!existingUser) {
          await prisma.user.create({
            data: {
              firstName: user.name?.split(' ')[0] || '',
              lastName: user.name?.split(' ')[1] || '',
              email: user.email as string,
              profilePicture: user.image,
              role: Role.STUDENT,
            },
          });
        }
      }
      return true;
    },
  },

  pages: {
    signIn: AUTH_ROUTES.SIGN_IN,
    error: AUTH_ROUTES.SIGN_IN,
  },

  secret: env.AUTH_SECRET,
  trustHost: true,

  events: {
    async signIn({ user }) {
      if (user?.id) {
        await mergeCart(user.id);
      }
    },
  },
} satisfies NextAuthConfig;

// ── Export simplified handlers for NextAuth v5
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
