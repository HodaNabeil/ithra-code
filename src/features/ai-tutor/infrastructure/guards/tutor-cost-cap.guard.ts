import { AITutorConfig } from '../config/ai-tutor.config';
import { AIPlatformConfig } from '@/ai-platform/infrastructure/config/ai-platform.config';
import { assertGlobalDailyCostCap } from '@/ai-platform/infrastructure/guards';
import {
  AskTutorError,
  AskTutorErrorCodes,
} from '../../application/errors/ask-tutor.errors';
import { PlatformError } from '@/ai-platform/shared/errors';

function getDailyCostCap(): number {
  return AIPlatformConfig.isEnabled()
    ? AIPlatformConfig.getDailyCostCap()
    : AITutorConfig.getDailyCostCap();
}

/**
 * Increments a coarse daily request counter used as a spend guard.
 * Fails closed when Redis is unavailable.
 */
export async function checkTutorDailyCostCap(): Promise<void> {
  try {
    await assertGlobalDailyCostCap(getDailyCostCap());
  } catch (error) {
    if (error instanceof PlatformError) {
      throw new AskTutorError(503, error.message, AskTutorErrorCodes.SERVICE_UNAVAILABLE);
    }
    throw error;
  }
}
