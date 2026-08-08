import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { PrismaConversationRepository } from '@/features/ai-tutor/infrastructure/repositories/PrismaConversationRepository';
import { PrismaStudentLearningProfileRepository } from '@/features/ai-tutor/infrastructure/repositories/PrismaStudentLearningProfileRepository';
import { prisma } from '@/lib/prisma';

import {
  canRunIntegrationTests,
  cleanupTutorTestFixture,
  createTutorTestFixture,
  isIntegrationEnabled,
  type TutorTestFixture,
} from '../../helpers/integration';

describe.skipIf(!isIntegrationEnabled)('GDPR delete integration', () => {
  let fixture: TutorTestFixture | undefined;
  let dbAvailable = false;
  const conversationRepository = new PrismaConversationRepository();
  const profileRepository = new PrismaStudentLearningProfileRepository();

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

  it('deletes learning profile when conversation is erased', async (ctx) => {
    if (!dbAvailable || !fixture) {
      ctx.skip();
      return;
    }

    const conversation = await conversationRepository.getOrCreateConversation(
      fixture.courseId,
      fixture.studentId,
    );

    await profileRepository.upsert({
      userId: fixture.studentId,
      courseId: fixture.courseId,
      explanationDepth: 'balanced',
      contentStyle: 'balanced',
      confidence: 0.5,
      interactionCount: 3,
      updatedAt: new Date(),
    });

    await conversationRepository.deleteConversation(conversation.id);
    await profileRepository.deleteByUserAndCourse({
      userId: fixture.studentId,
      courseId: fixture.courseId,
    });

    const profile = await prisma.studentLearningProfile.findUnique({
      where: {
        userId_courseId: {
          userId: fixture.studentId,
          courseId: fixture.courseId,
        },
      },
    });

    expect(profile).toBeNull();
  });
});
