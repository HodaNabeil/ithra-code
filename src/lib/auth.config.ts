import type { NextAuthConfig } from 'next-auth';
import { AUTH_ROUTES } from '@/constant/auth';

/**
 * Edge-safe Auth.js config shared by middleware and the full server auth module.
 * Keep this free of Prisma/Node-only imports so middleware can refresh sessions
 * and clear invalid JWT cookies in the response.
 */
export const authConfig: NextAuthConfig = {
  providers: [],

  session: {
    strategy: 'jwt',
  },

  callbacks: {
    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      return token;
    },

    session({ session, token }) {
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

  secret: process.env.AUTH_SECRET,
  trustHost: true,
};
