import { PlatformError, PlatformErrorCodes } from '@/ai-platform/shared/errors';
import type { ChatStreamEvent } from '@/ai-platform/shared/types';

import {
  AskTutorError,
  AskTutorErrorCodes,
} from '../../application/errors/ask-tutor.errors';

export function mapPlatformErrorToAskTutorError(
  error: PlatformError | (ChatStreamEvent & { type: 'error' }),
): AskTutorError {
  const code = error instanceof PlatformError ? error.code : error.code;
  const message =
    error instanceof PlatformError ? error.message : error.message;

  switch (code) {
    case PlatformErrorCodes.RATE_LIMITED:
      return new AskTutorError(
        429,
        message,
        AskTutorErrorCodes.RATE_LIMIT_EXCEEDED,
      );
    case PlatformErrorCodes.CONCURRENCY_LIMIT:
      return new AskTutorError(
        429,
        message,
        AskTutorErrorCodes.CONCURRENT_STREAM_LIMIT,
      );
    case PlatformErrorCodes.PROVIDER_UNAVAILABLE:
    case PlatformErrorCodes.COST_CAP_EXCEEDED:
      return new AskTutorError(
        503,
        message,
        AskTutorErrorCodes.SERVICE_UNAVAILABLE,
      );
    case PlatformErrorCodes.AI_DISABLED:
    case PlatformErrorCodes.NOT_IMPLEMENTED:
      return new AskTutorError(
        503,
        message,
        AskTutorErrorCodes.SERVICE_UNAVAILABLE,
      );
    case PlatformErrorCodes.VALIDATION_ERROR:
      return new AskTutorError(400, message, AskTutorErrorCodes.UNKNOWN);
    default:
      return new AskTutorError(502, message, AskTutorErrorCodes.LLM_ERROR);
  }
}
