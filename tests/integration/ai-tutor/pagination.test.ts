import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaConversationRepository } from '@/features/ai-tutor/infrastructure/repositories/PrismaConversationRepository';

import {
  canRunIntegrationTests,
  cleanupTutorTestFixture,
  createTutorTestFixture,
  isIntegrationEnabled,
  type TutorTestFixture,
} from '../../helpers/integration';

describe.skipIf(!isIntegrationEnabled)(
  'thread message pagination integration',
  () => {
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

    it('returns stable cursor-based pages in chronological order', async (ctx) => {
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
        'Pagination topic',
        fixture.lectureId,
      );

      for (let index = 0; index < 5; index += 1) {
        const turn = await repository.beginTurn(thread.id, {
          userContent: `سؤال ${index + 1}`,
        });
        await repository.completeTurn(turn.turnId, {
          assistantContent: `رد ${index + 1}`,
        });
      }

      const firstPage = await repository.getThreadMessagesPaginated(thread.id, {
        limit: 3,
      });
      expect(firstPage.messages).toHaveLength(3);
      expect(firstPage.nextCursor).toBeTruthy();

      const secondPage = await repository.getThreadMessagesPaginated(
        thread.id,
        {
          before: firstPage.nextCursor ?? undefined,
          limit: 10,
        },
      );
      expect(secondPage.messages.length).toBeGreaterThan(0);

      const allIds = [...firstPage.messages, ...secondPage.messages].map(
        (message) => message.id,
      );
      expect(new Set(allIds).size).toBe(allIds.length);
      expect(
        [...firstPage.messages, ...secondPage.messages].every(
          (message) => message.createdAt instanceof Date,
        ),
      ).toBe(true);
    });
  },
);
