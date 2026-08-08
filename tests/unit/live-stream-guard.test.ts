import { describe, expect, it } from 'vitest';

import { LiveStreamGuard } from '@/ai-platform/application/runtime/live-stream-guard';

describe('LiveStreamGuard', () => {
  it('blocks assessment answer leaks and replaces via flush policy', () => {
    const guard = new LiveStreamGuard();
    const leak = 'The correct answer is option B for the quiz';

    for (const char of leak.split('')) {
      guard.push(char);
    }

    expect(guard.isBlocked()).toBe(true);
    expect(guard.flush()).toBe('');
  });

  it('releases withheld tail when stream completes safely', () => {
    const guard = new LiveStreamGuard();
    guard.push('شرح مفهوم المتغيرات في البرمجة');
    const tail = guard.flush();
    expect(tail.length).toBeGreaterThan(0);
    expect(guard.isBlocked()).toBe(false);
  });
});
