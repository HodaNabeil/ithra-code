import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AITutorConfig } from '@/features/ai-tutor/infrastructure/config/ai-tutor.config';
import { AI_TUTOR_CONSTANTS } from '@/features/ai-tutor/shared';

describe('AI Tutor runtime limits', () => {
  it('exposes the configured token limits', () => {
    assert.deepEqual(AITutorConfig.getTokenLimits(), {
      maxPromptTokens: 8000,
      maxCompletionTokens: 402,
    });
  });

  it('keeps shared constants aligned with token limit accessors', () => {
    const tokenLimits = AITutorConfig.getTokenLimits();

    assert.equal(
      AI_TUTOR_CONSTANTS.MAX_PROMPT_TOKENS,
      tokenLimits.maxPromptTokens,
    );
    assert.equal(
      AI_TUTOR_CONSTANTS.MAX_RESPONSE_TOKENS,
      tokenLimits.maxCompletionTokens,
    );
  });
});
