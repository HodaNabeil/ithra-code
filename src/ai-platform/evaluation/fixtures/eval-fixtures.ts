import type { PrismaClient } from '@/generated/prisma/client';
import { prisma as appPrisma } from '@/lib/prisma';

const prisma = appPrisma as unknown as PrismaClient;

export const EVAL_USER_ID = 'eval-user';
export const EVAL_USER_EMAIL = 'eval@ithracode.local';
export const EVAL_COURSE_ID = 'eval-course-id';

/**
 * Ensures the synthetic user used by offline agent evaluation exists so cost
 * ledger writes to `ai_agent_runs` satisfy the `user_id` foreign key.
 */
export async function ensureEvalUser(): Promise<string> {
  await prisma.user.upsert({
    where: { id: EVAL_USER_ID },
    create: {
      id: EVAL_USER_ID,
      email: EVAL_USER_EMAIL,
      role: 'ADMIN',
      isActive: true,
      isEmailVerified: true,
      firstName: 'Eval',
      lastName: 'Runner',
    },
    update: {},
  });

  return EVAL_USER_ID;
}
