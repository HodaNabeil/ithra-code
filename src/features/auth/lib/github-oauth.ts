const INVALID_GITHUB_CLIENT_ID_PATTERNS: RegExp[] = [
  /^local-dev/i,
  /REPLACE_WITH/i,
  /^test$/i,
];

/**
 * True when AUTH_GITHUB_ID looks like a real GitHub OAuth App client id (not a placeholder).
 * 
 * **Production behavior**: GitHub OAuth is disabled in production by default.
 * Set ENABLE_GITHUB_AUTH=true in production environment to re-enable it.
 */
export function isValidGitHubOAuthClientId(
  clientId: string,
  nodeEnv: string = process.env.NODE_ENV ?? 'development',
): boolean {
  const id = clientId.trim();
  if (!id) return false;
  if (nodeEnv === 'test') return true;
  
  // Disable GitHub OAuth in production unless explicitly enabled
  if (nodeEnv === 'production') {
    const enableGithubAuth = process.env.ENABLE_GITHUB_AUTH === 'true';
    if (!enableGithubAuth) {
      return false;
    }
  }
  
  return !INVALID_GITHUB_CLIENT_ID_PATTERNS.some((pattern) => pattern.test(id));
}
