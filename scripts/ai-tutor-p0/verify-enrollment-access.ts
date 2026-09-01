import assert from 'node:assert/strict';

import {
  filterConversationsByAccessibleCourses,
  isCourseAccessible,
} from '@/features/ai-tutor/application/services/enrollment-access.service';

function main(): void {
  const accessible = new Set(['course-a', 'course-c']);
  const conversations = [
    { id: '1', courseId: 'course-a' },
    { id: '2', courseId: 'course-b' },
    { id: '3', courseId: 'course-c' },
  ];

  const filtered = filterConversationsByAccessibleCourses(
    conversations,
    accessible,
  );
  assert.deepEqual(
    filtered.map((conversation) => conversation.id),
    ['1', '3'],
  );

  assert.equal(isCourseAccessible('course-b', accessible), false);
  assert.equal(isCourseAccessible('course-a', accessible), true);

  console.log('[verify-enrollment-access] PASS');
}

try {
  main();
} catch (error) {
  console.error('[verify-enrollment-access] FAIL', error);
  process.exit(1);
}
