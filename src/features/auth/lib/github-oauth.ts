const INVALID_GITHUB_CLIENT_ID_PATTERNS: RegExp[] = [
  /^local-dev/i,
  /REPLACE_WITH/i,
  /^test$/i,
];

/**
 * True when AUTH_GITHUB_ID looks like a real GitHub OAuth App client id (not a placeholder).
 */
export function isValidGitHubOAuthClientId(
  clientId: string,
  nodeEnv: string = process.env.NODE_ENV ?? 'development',
): boolean {
  const id = clientId.trim();
  if (!id) return false;
  if (nodeEnv === 'test') return true;
  return !INVALID_GITHUB_CLIENT_ID_PATTERNS.some((pattern) => pattern.test(id));
}
