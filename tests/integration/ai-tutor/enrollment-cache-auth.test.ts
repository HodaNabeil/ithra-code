import { EnrollmentStatus } from '@prisma/client';
import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTutorSessionContext } from '@/features/ai-tutor/application/services/course-context.service';
import { AskTutorError } from '@/features/ai-tutor/application/errors/ask-tutor.errors';
import { PrismaCourseContextRepository } from '@/features/ai-tutor/infrastructure/repositories/PrismaCourseContextRepository';
import { PrismaStudentLearningProfileRepository } from '@/features/ai-tutor/infrastructure/repositories/PrismaStudentLearningProfileRepository';
import { prisma } from '@/lib/prisma';

import {
  canRunIntegrationTests,
  cleanupTutorTestFixture,
  createTutorTestFixture,
  InMemorySessionContextCache,
  isIntegrationEnabled,
  type TutorTestFixture,
} from '../../helpers/integration';

describe.skipIf(!isIntegrationEnabled)(
  'enrollment cache auth integration',
  () => {
    let fixture: TutorTestFixture | undefined;
    let dbAvailable = false;
    const cache = new InMemorySessionContextCache();
    const deps = {
      courseContextRepository: new PrismaCourseContextRepository(),
      sessionContextCache: cache,
      studentLearningProfileRepository:
        new PrismaStudentLearningProfileRepository(),
    };

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

    it('rejects revoked enrollment even when session context is cached', async (ctx) => {
      if (!dbAvailable || !fixture) {
        ctx.skip();
        return;
      }

      const context = await buildTutorSessionContext(
        {
          courseSlug: fixture.courseSlug,
          userId: fixture.studentId,
        },
        deps,
      );

      await cache.set(
        `${fixture.studentId}:${fixture.courseSlug}:general`,
        context,
      );

      await prisma.enrollment.updateMany({
        where: {
          studentId: fixture.studentId,
          courseId: fixture.courseId,
        },
        data: { status: EnrollmentStatus.REVOKED },
      });

      await expect(
        buildTutorSessionContext(
          {
            courseSlug: fixture.courseSlug,
            userId: fixture.studentId,
          },
          deps,
        ),
      ).rejects.toBeInstanceOf(AskTutorError);
    });
  },
);
