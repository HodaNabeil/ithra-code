import { afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest';

import { buildTutorSessionContext } from '@/features/ai-tutor/application/services/course-context.service';
import { PrismaCourseContextRepository } from '@/features/ai-tutor/infrastructure/repositories/PrismaCourseContextRepository';
import { PrismaStudentLearningProfileRepository } from '@/features/ai-tutor/infrastructure/repositories/PrismaStudentLearningProfileRepository';

import {
  canRunIntegrationTests,
  cleanupTutorTestFixture,
  createTutorTestFixture,
  InMemorySessionContextCache,
  isIntegrationEnabled,
  type TutorTestFixture,
} from '../../helpers/integration';

describe.skipIf(!isIntegrationEnabled)('lecture validation integration', () => {
  let fixture: TutorTestFixture | undefined;
  let dbAvailable = false;
  const deps = {
    courseContextRepository: new PrismaCourseContextRepository(),
    sessionContextCache: new InMemorySessionContextCache(),
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

  it('rejects foreign lectureId before thread creation path', async (ctx) => {
    if (!dbAvailable || !fixture) {
      ctx.skip();
      return;
    }

    await expect(
      buildTutorSessionContext(
        {
          courseSlug: fixture.courseSlug,
          userId: fixture.studentId,
          lectureId: fixture.foreignLectureId,
        },
        deps,
      ),
    ).rejects.toMatchObject({
      status: 400,
      code: 'INVALID_LECTURE',
    });
  });
});
