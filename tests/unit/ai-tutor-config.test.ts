import { afterEach, describe, expect, it, vi } from 'vitest';

describe('validateAITutorConfig', () => {
  const originalTutorEnabled = process.env.AI_TUTOR_ENABLED;
  const originalPlatformEnabled = process.env.AI_PLATFORM_ENABLED;

  afterEach(() => {
    vi.restoreAllMocks();

    if (originalTutorEnabled === undefined) {
      delete process.env.AI_TUTOR_ENABLED;
    } else {
      process.env.AI_TUTOR_ENABLED = originalTutorEnabled;
    }

    if (originalPlatformEnabled === undefined) {
      delete process.env.AI_PLATFORM_ENABLED;
    } else {
      process.env.AI_PLATFORM_ENABLED = originalPlatformEnabled;
    }
  });

  it('throws when tutor is enabled but platform is disabled', async () => {
    process.env.AI_TUTOR_ENABLED = 'true';
    process.env.AI_PLATFORM_ENABLED = 'false';

    const { validateAITutorConfig } =
      await import('@/features/ai-tutor/infrastructure/config/ai-tutor.config');

    expect(() => validateAITutorConfig()).toThrow(
      'AI Tutor requires AI Platform',
    );
  });

  it('throws when platform validation fails for missing OpenAI key', async () => {
    process.env.AI_TUTOR_ENABLED = 'true';

    const { validateAITutorConfig } =
      await import('@/features/ai-tutor/infrastructure/config/ai-tutor.config');
    const { AIPlatformConfig } =
      await import('@/ai-platform/infrastructure/config/ai-platform.config');

    vi.spyOn(AIPlatformConfig, 'isEnabled').mockReturnValue(true);
    vi.spyOn(AIPlatformConfig, 'getLlmApiKey').mockImplementation(() => {
      throw new Error('OPENAI_API_KEY environment variable is not set');
    });

    expect(() => validateAITutorConfig()).toThrow('OPENAI_API_KEY');
  });
});
