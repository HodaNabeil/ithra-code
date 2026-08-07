import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

import { PlatformError, PlatformErrorCodes } from '../../shared/errors';

const MICRO_USD_FACTOR = 1_000_000;
const BUDGET_TTL_SECONDS = 86_400;

export function usdToMicro(usd: number): number {
  return Math.round(usd * MICRO_USD_FACTOR);
}

export function isOverBudget(spentMicro: number, capUsd: number): boolean {
  if (!capUsd || capUsd <= 0) {
    return false;
  }
  return spentMicro >= usdToMicro(capUsd);
}

function getDateKeySuffix(): string {
  return new Date().toISOString().slice(0, 10);
}

function getUserBudgetKey(userId: string): string {
  return `ai:budget:usd:user:${userId}:${getDateKeySuffix()}`;
}

function getGlobalBudgetKey(): string {
  return `ai:budget:usd:global:${getDateKeySuffix()}`;
}

async function readSpentMicro(key: string): Promise<number> {
  const value = await redis.get(key);
  return Number(value ?? 0);
}

async function incrementSpentMicro(key: string, microUsd: number): Promise<void> {
  const next = await redis.incrby(key, microUsd);
  if (next === microUsd) {
    await redis.expire(key, BUDGET_TTL_SECONDS);
  }
}

function handleRedisFailure(error: unknown): never {
  if (error instanceof PlatformError) {
    throw error;
  }

  logger.error({ error }, '[AI_BUDGET_REDIS_FAILURE]');
  throw new PlatformError(
    PlatformErrorCodes.PROVIDER_UNAVAILABLE,
    'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً. حاول مرة أخرى بعد قليل.',
    true,
  );
}

export async function assertUserDailyBudgetUsd(
  userId: string,
  capUsd: number,
): Promise<void> {
  if (!capUsd || capUsd <= 0) {
    return;
  }

  try {
    const spentMicro = await readSpentMicro(getUserBudgetKey(userId));
    if (isOverBudget(spentMicro, capUsd)) {
      throw new PlatformError(
        PlatformErrorCodes.COST_CAP_EXCEEDED,
        'تم تجاوز الحد اليومي لاستخدام الذكاء الاصطناعي. حاول مرة أخرى غداً.',
      );
    }
  } catch (error) {
    handleRedisFailure(error);
  }
}

export async function assertGlobalDailyBudgetUsd(capUsd: number): Promise<void> {
  if (!capUsd || capUsd <= 0) {
    return;
  }

  try {
    const spentMicro = await readSpentMicro(getGlobalBudgetKey());
    if (isOverBudget(spentMicro, capUsd)) {
      throw new PlatformError(
        PlatformErrorCodes.COST_CAP_EXCEEDED,
        'تم تجاوز الحد اليومي لاستخدام الذكاء الاصطناعي. حاول مرة أخرى غداً.',
      );
    }
  } catch (error) {
    handleRedisFailure(error);
  }
}

export async function recordDailySpendUsd(params: {
  userId: string;
  usd: number;
}): Promise<void> {
  const microUsd = usdToMicro(params.usd);
  if (microUsd <= 0) {
    return;
  }

  try {
    await incrementSpentMicro(getUserBudgetKey(params.userId), microUsd);
    await incrementSpentMicro(getGlobalBudgetKey(), microUsd);
  } catch (error) {
    logger.warn({ error, userId: params.userId }, '[AI_BUDGET_RECORD_FAILURE]');
  }
}
