import 'dotenv/config';

import {
  getIndexCourseUseCaseDeps,
  indexCourseUseCase,
} from '@/features/ai-tutor/infrastructure/di/ai-tutor-container';

async function main(): Promise<void> {
  const courseSlug = process.argv[2]?.trim();
  const userId = process.argv[3]?.trim();

  if (!courseSlug || !userId) {
    console.error('Usage: pnpm index:course <courseSlug> <userId>');
    process.exit(1);
  }

  const result = await indexCourseUseCase(
    {
      courseSlug,
      userId,
      userRole: 'ADMIN',
    },
    getIndexCourseUseCaseDeps(),
  );

  console.log('[index-course] completed', result);
}

main().catch((error) => {
  console.error('[index-course] failed', error);
  process.exit(1);
});
