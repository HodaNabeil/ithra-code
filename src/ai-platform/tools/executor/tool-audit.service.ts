import type { Prisma } from '@prisma/client';

import type { ToolInvocationRecord } from '../types';

async function getPrismaClient() {
  const { prisma } = await import('@/lib/prisma');
  return prisma;
}

export async function logToolInvocation(
  record: ToolInvocationRecord,
): Promise<void> {
  try {
    const prisma = await getPrismaClient();
    await prisma.aiToolInvocation.create({
      data: {
        toolId: record.toolId,
        agentRunId: record.agentRunId,
        userId: record.userId,
        status: record.status,
        input: record.input as Prisma.InputJsonValue,
        output: record.output as Prisma.InputJsonValue | undefined,
        error: record.error,
        durationMs: record.durationMs,
      },
    });
  } catch {
    // Audit failures must not break agent execution.
  }
}
