import { env } from '@/config/env';

export type SocialAuthProvider = 'google' | 'github';

export function getConfiguredSocialAuthProviders(): SocialAuthProvider[] {
  const providers: SocialAuthProvider[] = [];

  if (env.AUTH_GOOGLE_ID && env.AUTH_GOOGLE_SECRET) {
    providers.push('google');
  }

  if (env.AUTH_GITHUB_ID && env.AUTH_GITHUB_SECRET) {
    providers.push('github');
  }

  return providers;
}
