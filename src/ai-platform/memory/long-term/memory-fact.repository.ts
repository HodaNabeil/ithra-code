import { prisma } from '@/lib/prisma';

import type {
  MemoryFact,
  MemoryQuery,
  MemoryStorePort,
} from '../../domain/ports/memory-store.port';
import { withSpan } from '../../observability/opentelemetry/span-helpers';

export class PrismaMemoryFactRepository implements MemoryStorePort {
  async storeFact(fact: MemoryFact): Promise<MemoryFact> {
    return withSpan(
      'ai.memory.store',
      { 'ai.memory.fact_type': fact.factType },
      async () => this.storeFactInner(fact),
    );
  }

  private async storeFactInner(fact: MemoryFact): Promise<MemoryFact> {
    const created = await prisma.aiMemoryFact.create({
      data: {
        userId: fact.userId,
        agentId: fact.agentId,
        scopeType: fact.scopeType,
        scopeId: fact.scopeId,
        factType: fact.factType,
        content: fact.content,
        confidence: fact.confidence,
        sourceRunId: fact.sourceRunId,
        expiresAt: fact.expiresAt,
      },
    });

    return {
      id: created.id,
      userId: created.userId,
      agentId: created.agentId ?? undefined,
      scopeType: created.scopeType as MemoryFact['scopeType'],
      scopeId: created.scopeId ?? undefined,
      factType: created.factType as MemoryFact['factType'],
      content: created.content,
      confidence: created.confidence,
      sourceRunId: created.sourceRunId ?? undefined,
      expiresAt: created.expiresAt ?? undefined,
    };
  }

  async getFacts(query: MemoryQuery): Promise<MemoryFact[]> {
    return withSpan(
      'ai.memory.read',
      { 'ai.memory.user_id': query.userId },
      async () => this.getFactsInner(query),
    );
  }

  private async getFactsInner(query: MemoryQuery): Promise<MemoryFact[]> {
    const rows = await prisma.aiMemoryFact.findMany({
      where: {
        userId: query.userId,
        agentId: query.agentId,
        scopeType: query.scopeType,
        scopeId: query.scopeId,
        factType: query.factTypes ? { in: query.factTypes } : undefined,
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
      orderBy: { createdAt: 'desc' },
      take: query.limit ?? 20,
    });

    return rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      agentId: row.agentId ?? undefined,
      scopeType: row.scopeType as MemoryFact['scopeType'],
      scopeId: row.scopeId ?? undefined,
      factType: row.factType as MemoryFact['factType'],
      content: row.content,
      confidence: row.confidence,
      sourceRunId: row.sourceRunId ?? undefined,
      expiresAt: row.expiresAt ?? undefined,
    }));
  }

  async deleteFacts(
    userId: string,
    scope?: { type?: string; courseId?: string; lectureId?: string },
  ): Promise<number> {
    const result = await prisma.aiMemoryFact.deleteMany({
      where: {
        userId,
        scopeType: scope?.type,
        scopeId: scope?.courseId ?? scope?.lectureId,
      },
    });
    return result.count;
  }
}

export const prismaMemoryFactRepository = new PrismaMemoryFactRepository();
