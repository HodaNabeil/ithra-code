import { AITutorConfig } from '../config/ai-tutor.config';
import { AIPlatformConfig } from '@/ai-platform/infrastructure/config/ai-platform.config';
import {
  acquireConcurrencySlot,
  assertMessageRateLimit,
} from '@/ai-platform/infrastructure/guards';
import { PlatformError } from '@/ai-platform/shared/errors';

import { mapPlatformErrorToAskTutorError } from './platform-error.mapper';

function getRateLimitConfig() {
  return AIPlatformConfig.isEnabled()
    ? AIPlatformConfig.getRateLimitConfig()
    : {
        requestsPerMinute: AITutorConfig.getRateLimitConfig().messagesPerMinute,
        requestsPerHour: AITutorConfig.getRateLimitConfig().messagesPerHour,
        requestsPerDay: AITutorConfig.getRateLimitConfig().messagesPerDay,
      };
}

function getStreamConfig() {
  return AIPlatformConfig.isEnabled()
    ? AIPlatformConfig.getStreamConfig()
    : AITutorConfig.getStreamConfig();
}

/**
 * Per-student message rate limits: minute, hour, and day windows.
 * Redis failures fail closed to prevent unbounded LLM usage.
 */
export async function checkTutorMessageRateLimit(userId: string): Promise<void> {
  try {
    await assertMessageRateLimit({
      userId,
      limits: getRateLimitConfig(),
      scope: 'tutor-messages',
    });
  } catch (error) {
    if (error instanceof PlatformError) {
      throw mapPlatformErrorToAskTutorError(error);
    }
    throw error;
  }
}

/**
 * Limits concurrent SSE streams per student.
 * Returns a release function that must be called when the stream ends.
 */
export async function acquireTutorStreamSlot(
  userId: string,
): Promise<() => Promise<void>> {
  const { maxConcurrentStreamsPerUser, requestTimeoutMs } = getStreamConfig();

  try {
    return await acquireConcurrencySlot({
      userId,
      maxConcurrent: maxConcurrentStreamsPerUser,
      timeoutMs: requestTimeoutMs,
      scope: 'tutor',
    });
  } catch (error) {
    if (error instanceof PlatformError) {
      throw mapPlatformErrorToAskTutorError(error);
    }
    throw error;
  }
}
