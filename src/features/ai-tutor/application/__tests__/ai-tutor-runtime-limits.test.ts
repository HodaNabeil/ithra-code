import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { AITutorConfig } from '@/features/ai-tutor/infrastructure/config/ai-tutor.config';
import { AI_TUTOR_CONSTANTS } from '@/features/ai-tutor/shared';

describe('AI Tutor runtime limits', () => {
  it('exposes the configured rate limits', () => {
    assert.deepEqual(AITutorConfig.getRateLimitConfig(), {
      messagesPerMinute: 30,
      messagesPerHour: 300,
      messagesPerDay: 1000,
    });
  });

  it('exposes the configured stream and token limits', () => {
    assert.deepEqual(AITutorConfig.getStreamConfig(), {
      maxConcurrentStreamsPerUser: 2,
      requestTimeoutMs: 60_000,
    });

    assert.deepEqual(AITutorConfig.getTokenLimits(), {
      maxPromptTokens: 8000,
      maxCompletionTokens: 1500,
    });
  });

  it('keeps shared constants aligned with config accessors', () => {
    const rateLimits = AITutorConfig.getRateLimitConfig();
    const streamConfig = AITutorConfig.getStreamConfig();
    const tokenLimits = AITutorConfig.getTokenLimits();

    assert.equal(
      AI_TUTOR_CONSTANTS.RATE_LIMIT_MESSAGES_PER_MINUTE,
      rateLimits.messagesPerMinute,
    );
    assert.equal(
      AI_TUTOR_CONSTANTS.RATE_LIMIT_MESSAGES_PER_HOUR,
      rateLimits.messagesPerHour,
    );
    assert.equal(
      AI_TUTOR_CONSTANTS.RATE_LIMIT_MESSAGES_PER_DAY,
      rateLimits.messagesPerDay,
    );
    assert.equal(
      AI_TUTOR_CONSTANTS.MAX_CONCURRENT_STREAMS_PER_USER,
      streamConfig.maxConcurrentStreamsPerUser,
    );
    assert.equal(
      AI_TUTOR_CONSTANTS.REQUEST_TIMEOUT_MS,
      streamConfig.requestTimeoutMs,
    );
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
