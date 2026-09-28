import { env } from '@/config';
import { isValidGitHubOAuthClientId } from '@/features/auth/lib/github-oauth';

export type SocialAuthProvider = 'google' | 'github';

export function getConfiguredSocialAuthProviders(): SocialAuthProvider[] {
  const providers: SocialAuthProvider[] = ['google'];

  if (isValidGitHubOAuthClientId(env.AUTH_GITHUB_ID)) {
    providers.push('github');
  }

  return providers;
}
