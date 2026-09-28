import { describe, expect, it } from 'vitest';
import { isValidGitHubOAuthClientId } from './github-oauth';

describe('isValidGitHubOAuthClientId', () => {
  it('rejects local-dev and placeholder ids outside test', () => {
    expect(isValidGitHubOAuthClientId('local-dev-github-cli', 'development')).toBe(
      false,
    );
    expect(
      isValidGitHubOAuthClientId('REPLACE_WITH_GITHUB_CLIENT_ID', 'development'),
    ).toBe(false);
    expect(isValidGitHubOAuthClientId('test', 'development')).toBe(false);
  });

  it('allows test id in test environment', () => {
    expect(isValidGitHubOAuthClientId('test', 'test')).toBe(true);
  });

  it('allows typical oauth app client ids', () => {
    expect(isValidGitHubOAuthClientId('Ov23liAbc123xyz', 'production')).toBe(
      true,
    );
  });
});
