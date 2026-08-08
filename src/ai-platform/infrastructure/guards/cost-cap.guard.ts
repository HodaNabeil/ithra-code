import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

import { PlatformError, PlatformErrorCodes } from '../../shared/errors';
import { platformMetrics } from '../../observability/metrics/platform-metrics';

const MICRO_USD_FACTOR = 1_000_000;
const BUDGET_TTL_SECONDS = 86_400;

export type BudgetReservation = {
  userId: string;
  reservedMicroUsd: number;
};

const RESERVE_BUDGET_LUA = `
local userKey = KEYS[1]
local globalKey = KEYS[2]
local reserveMicro = tonumber(ARGV[1])
local userCapMicro = tonumber(ARGV[2])
local globalCapMicro = tonumber(ARGV[3])
local ttl = tonumber(ARGV[4])

local userSpent = tonumber(redis.call('GET', userKey) or '0')
local globalSpent = tonumber(redis.call('GET', globalKey) or '0')

if userCapMicro > 0 and (userSpent + reserveMicro) > userCapMicro then
  return 0
end
if globalCapMicro > 0 and (globalSpent + reserveMicro) > globalCapMicro then
  return 0
end

local newUser = redis.call('INCRBY', userKey, reserveMicro)
if newUser == reserveMicro then
  redis.call('EXPIRE', userKey, ttl)
end
local newGlobal = redis.call('INCRBY', globalKey, reserveMicro)
if newGlobal == reserveMicro then
  redis.call('EXPIRE', globalKey, ttl)
end
return 1
`;

const ADJUST_BUDGET_LUA = `
local userKey = KEYS[1]
local globalKey = KEYS[2]
local deltaMicro = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

if deltaMicro == 0 then
  return 1
end

local newUser = redis.call('INCRBY', userKey, deltaMicro)
if newUser <= 0 then
  redis.call('SET', userKey, 0)
  redis.call('EXPIRE', userKey, ttl)
else
  redis.call('EXPIRE', userKey, ttl)
end

local newGlobal = redis.call('INCRBY', globalKey, deltaMicro)
if newGlobal <= 0 then
  redis.call('SET', globalKey, 0)
  redis.call('EXPIRE', globalKey, ttl)
else
  redis.call('EXPIRE', globalKey, ttl)
end
return 1
`;

export function usdToMicro(usd: number): number {
  return Math.round(usd * MICRO_USD_FACTOR);
}

export function microToUsd(micro: number): number {
  return micro / MICRO_USD_FACTOR;
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

function handleRedisFailure(error: unknown): never {
  if (error instanceof PlatformError) {
    throw error;
  }

  platformMetrics.incrementRedisGuardFailure('budget');
  logger.error({ error }, '[AI_BUDGET_REDIS_FAILURE]');
  throw new PlatformError(
    PlatformErrorCodes.PROVIDER_UNAVAILABLE,
    'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً. حاول مرة أخرى بعد قليل.',
    true,
  );
}

/**
 * Atomically reserves estimated spend against user + global daily caps.
 * Fail closed when Redis is unavailable.
 */
export async function reserveDailyBudgetUsd(params: {
  userId: string;
  estimatedUsd: number;
  userCapUsd: number;
  globalCapUsd: number;
}): Promise<BudgetReservation | null> {
  const reserveMicro = usdToMicro(params.estimatedUsd);
  if (reserveMicro <= 0) {
    return null;
  }

  const userCapMicro = params.userCapUsd > 0 ? usdToMicro(params.userCapUsd) : 0;
  const globalCapMicro =
    params.globalCapUsd > 0 ? usdToMicro(params.globalCapUsd) : 0;

  if (userCapMicro <= 0 && globalCapMicro <= 0) {
    return null;
  }

  try {
    const reserved = await redis.eval(
      RESERVE_BUDGET_LUA,
      2,
      getUserBudgetKey(params.userId),
      getGlobalBudgetKey(),
      String(reserveMicro),
      String(userCapMicro),
      String(globalCapMicro),
      String(BUDGET_TTL_SECONDS),
    );

    if (Number(reserved) !== 1) {
      platformMetrics.incrementBudgetReservationRejected('cap_exceeded');
      throw new PlatformError(
        PlatformErrorCodes.COST_CAP_EXCEEDED,
        'تم تجاوز الحد اليومي لاستخدام الذكاء الاصطناعي. حاول مرة أخرى غداً.',
      );
    }

    return {
      userId: params.userId,
      reservedMicroUsd: reserveMicro,
    };
  } catch (error) {
    handleRedisFailure(error);
  }
}

async function adjustBudgetMicro(userId: string, deltaMicro: number): Promise<void> {
  if (deltaMicro === 0) {
    return;
  }

  await redis.eval(
    ADJUST_BUDGET_LUA,
    2,
    getUserBudgetKey(userId),
    getGlobalBudgetKey(),
    String(deltaMicro),
    String(BUDGET_TTL_SECONDS),
  );
}

/** Reconcile reserved budget to actual spend after a successful run. */
export async function reconcileDailyBudgetUsd(params: {
  userId: string;
  reservedMicroUsd: number;
  actualUsd: number;
}): Promise<void> {
  if (params.reservedMicroUsd <= 0) {
    return;
  }

  const actualMicro = usdToMicro(params.actualUsd);
  const deltaMicro = actualMicro - params.reservedMicroUsd;

  try {
    await adjustBudgetMicro(params.userId, deltaMicro);
  } catch (error) {
    platformMetrics.incrementRedisGuardFailure('budget_reconcile');
    logger.error(
      { error, userId: params.userId, deltaMicro },
      '[AI_BUDGET_RECONCILE_FAILURE]',
    );
    throw new PlatformError(
      PlatformErrorCodes.PROVIDER_UNAVAILABLE,
      'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً. حاول مرة أخرى بعد قليل.',
      true,
    );
  }
}

/** Release a reservation when the run fails before producing billable output. */
export async function releaseDailyBudgetReservation(
  reservation: BudgetReservation | null,
): Promise<void> {
  if (!reservation || reservation.reservedMicroUsd <= 0) {
    return;
  }

  try {
    await adjustBudgetMicro(
      reservation.userId,
      -reservation.reservedMicroUsd,
    );
  } catch (error) {
    platformMetrics.incrementRedisGuardFailure('budget_release');
    logger.error(
      { error, userId: reservation.userId },
      '[AI_BUDGET_RELEASE_FAILURE]',
    );
  }
}

/** Read-only budget check for legacy callers and scripts. */
export async function assertUserDailyBudgetUsd(
  userId: string,
  capUsd: number,
): Promise<void> {
  if (!capUsd || capUsd <= 0) {
    return;
  }

  try {
    const spentMicro = Number(await redis.get(getUserBudgetKey(userId)) ?? 0);
    if (isOverBudget(spentMicro, capUsd)) {
      platformMetrics.incrementBudgetReservationRejected('cap_exceeded');
      throw new PlatformError(
        PlatformErrorCodes.COST_CAP_EXCEEDED,
        'تم تجاوز الحد اليومي لاستخدام الذكاء الاصطناعي. حاول مرة أخرى غداً.',
      );
    }
  } catch (error) {
    handleRedisFailure(error);
  }
}

/** Read-only global budget check for legacy callers. */
export async function assertGlobalDailyBudgetUsd(capUsd: number): Promise<void> {
  if (!capUsd || capUsd <= 0) {
    return;
  }

  try {
    const spentMicro = Number(await redis.get(getGlobalBudgetKey()) ?? 0);
    if (isOverBudget(spentMicro, capUsd)) {
      platformMetrics.incrementBudgetReservationRejected('cap_exceeded');
      throw new PlatformError(
        PlatformErrorCodes.COST_CAP_EXCEEDED,
        'تم تجاوز الحد اليومي لاستخدام الذكاء الاصطناعي. حاول مرة أخرى غداً.',
      );
    }
  } catch (error) {
    handleRedisFailure(error);
  }
}

/** @deprecated Use reconcileDailyBudgetUsd after reserveDailyBudgetUsd */
export async function recordDailySpendUsd(params: {
  userId: string;
  usd: number;
}): Promise<void> {
  const microUsd = usdToMicro(params.usd);
  if (microUsd <= 0) {
    return;
  }

  try {
    await adjustBudgetMicro(params.userId, microUsd);
  } catch (error) {
    platformMetrics.incrementRedisGuardFailure('budget_record');
    logger.error({ error, userId: params.userId }, '[AI_BUDGET_RECORD_FAILURE]');
    throw new PlatformError(
      PlatformErrorCodes.PROVIDER_UNAVAILABLE,
      'خدمة الذكاء الاصطناعي غير متاحة مؤقتاً. حاول مرة أخرى بعد قليل.',
      true,
    );
  }
}
