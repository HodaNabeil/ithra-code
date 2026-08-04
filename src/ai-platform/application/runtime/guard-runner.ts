import type { AgentDefinition } from '../../agents/base/agent-definition';
import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import {
  assertGlobalDailyCostCap,
  assertMessageRateLimit,
  acquireConcurrencySlot,
} from '../../infrastructure/guards';
import { PlatformError, PlatformErrorCodes } from '../../shared/errors';

export type GuardChainResult = {
  releaseConcurrencySlot?: () => Promise<void>;
};

async function runBaseGuards(agent: AgentDefinition, userId: string): Promise<void> {
  const rateLimits = AIPlatformConfig.getRateLimitConfig();
  const dailyCap = agent.guards.dailyCostCap ?? AIPlatformConfig.getDailyCostCap();

  await assertMessageRateLimit({
    userId,
    limits: rateLimits,
    scope: `agent:${agent.id}`,
  });
  await assertGlobalDailyCostCap(dailyCap);
}

export async function runGuards(
  agent: AgentDefinition,
  userId: string,
): Promise<GuardChainResult> {
  try {
    await runBaseGuards(agent, userId);
    return {};
  } catch (error) {
    if (error instanceof PlatformError) {
      throw error;
    }
    throw new PlatformError(
      PlatformErrorCodes.RUNTIME_ERROR,
      'Guard chain failed',
      false,
    );
  }
}

export async function runStreamGuards(
  agent: AgentDefinition,
  userId: string,
): Promise<GuardChainResult> {
  try {
    await runBaseGuards(agent, userId);

    const streamConfig = AIPlatformConfig.getStreamConfig();
    const releaseConcurrencySlot = await acquireConcurrencySlot({
      userId,
      maxConcurrent:
        agent.guards.maxConcurrentStreams ??
        streamConfig.maxConcurrentStreamsPerUser,
      timeoutMs: streamConfig.requestTimeoutMs,
      scope: `agent:${agent.id}`,
    });

    return { releaseConcurrencySlot };
  } catch (error) {
    if (error instanceof PlatformError) {
      throw error;
    }
    throw new PlatformError(
      PlatformErrorCodes.RUNTIME_ERROR,
      'Guard chain failed',
      false,
    );
  }
}
