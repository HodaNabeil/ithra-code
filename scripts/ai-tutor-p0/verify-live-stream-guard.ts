import assert from 'node:assert/strict';

import { LiveStreamGuard } from '@/ai-platform/application/runtime/live-stream-guard';

function main(): void {
  const guard = new LiveStreamGuard();
  const tokens = ['The ', 'correct ', 'answer ', 'is ', 'B'];
  let emitted = '';

  for (const token of tokens) {
    const { emit, blocked } = guard.push(token);
    emitted += emit;
    if (blocked) {
      break;
    }
  }

  assert(guard.isBlocked(), 'guard must block assessment leak pattern');
  assert(
    !/correct\s+answer\s+is/i.test(emitted),
    `leaked span must not appear in emitted output: "${emitted}"`,
  );

  const safeGuard = new LiveStreamGuard();
  let safeEmitted = '';
  for (const token of ['Hello', ' world']) {
    const { emit } = safeGuard.push(token);
    safeEmitted += emit;
  }
  safeEmitted += safeGuard.flush();

  assert.equal(safeEmitted, 'Hello world');

  console.log('[verify-live-stream-guard] PASS');
}

try {
  main();
} catch (error) {
  console.error('[verify-live-stream-guard] FAIL', error);
  process.exit(1);
}
