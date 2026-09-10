import type { NextAuthConfig } from 'next-auth';
import { AUTH_ROUTES } from '@/constants/auth';

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
    redirect({ url, baseUrl }) {
      const origin = baseUrl.replace(/\/api\/auth\/?$/, '');

      if (url.startsWith('/')) {
        return `${origin}${url}`;
      }

      if (new URL(url).origin === origin) {
        return url;
      }

      return origin;
    },

    jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      if (user?.image) {
        token.picture = user.image;
      }

      if (user?.name) {
        token.name = user.name;
      }

      return token;
    },

    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image =
          (token.picture as string | undefined) ?? session.user.image;
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
