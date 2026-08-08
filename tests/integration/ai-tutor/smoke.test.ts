import { describe, expect, it } from 'vitest';

describe('integration placeholder', () => {
  it('runs when DATABASE_URL is configured in CI', () => {
    expect(process.env.SKIP_ENV_VALIDATION).toBe('true');
  });
});
