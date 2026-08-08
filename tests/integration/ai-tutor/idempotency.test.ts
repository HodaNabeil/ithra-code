import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaConversationRepository } from '@/features/ai-tutor/infrastructure/repositories/PrismaConversationRepository';

import {
  canRunIntegrationTests,
  cleanupTutorTestFixture,
  createTutorTestFixture,
  isIntegrationEnabled,
  type TutorTestFixture,
} from '../../helpers/integration';

describe.skipIf(!isIntegrationEnabled)('idempotency integration', () => {
  let fixture: TutorTestFixture | undefined;
  let dbAvailable = false;
  const repository = new PrismaConversationRepository();

  beforeAll(async () => {
    dbAvailable = await canRunIntegrationTests();
  });

  beforeEach(async () => {
    if (!dbAvailable) {
      return;
    }

    fixture = await createTutorTestFixture();
  });

  afterEach(async () => {
    await cleanupTutorTestFixture(fixture);
    fixture = undefined;
  });

  it('returns replay for completed idempotency key', async (ctx) => {
    if (!dbAvailable || !fixture) {
      ctx.skip();
      return;
    }

    const conversation = await repository.getOrCreateConversation(
      fixture.courseId,
      fixture.studentId,
    );
    const thread = await repository.getOrCreateThread(
      conversation.id,
      'Test topic',
      fixture.lectureId,
    );
    const key = `idem-${fixture.suffix}`;

    const created = await repository.claimIdempotencyKey({
      userId: fixture.studentId,
      idempotencyKey: key,
      threadId: thread.id,
    });
    expect(created.kind).toBe('created');

    const turn = await repository.beginTurn(thread.id, {
      userContent: 'ما هو الاختبار؟',
    });

    await repository.completeTurn(turn.turnId, {
      assistantContent: 'إجابة الاختبار',
    });

    await repository.completeIdempotencyKey({
      userId: fixture.studentId,
      idempotencyKey: key,
      turnId: turn.turnId,
    });

    const claim = await repository.claimIdempotencyKey({
      userId: fixture.studentId,
      idempotencyKey: key,
      threadId: thread.id,
    });

    expect(claim.kind).toBe('replay');
    if (claim.kind === 'replay') {
      expect(claim.record.turnId).toBe(turn.turnId);
    }
  });

  it('marks concurrent duplicate keys as conflict', async (ctx) => {
    if (!dbAvailable || !fixture) {
      ctx.skip();
      return;
    }

    const conversation = await repository.getOrCreateConversation(
      fixture.courseId,
      fixture.studentId,
    );
    const thread = await repository.getOrCreateThread(
      conversation.id,
      'Conflict topic',
      fixture.lectureId,
    );

    const key = `conflict-${fixture.suffix}`;
    const first = await repository.claimIdempotencyKey({
      userId: fixture.studentId,
      idempotencyKey: key,
      threadId: thread.id,
    });
    const second = await repository.claimIdempotencyKey({
      userId: fixture.studentId,
      idempotencyKey: key,
      threadId: thread.id,
    });

    expect(first.kind).toBe('created');
    expect(second.kind).toBe('conflict');
  });
});
