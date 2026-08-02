import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  AskTutorError,
  AskTutorErrorCodes,
} from '@/features/ai-tutor/application/errors/ask-tutor.errors';

describe('tutor request guards contract', () => {
  it('defines SERVICE_UNAVAILABLE for redis guard failures', () => {
    const error = new AskTutorError(
      503,
      'خدمة المدرس الذكي غير متاحة مؤقتاً',
      AskTutorErrorCodes.SERVICE_UNAVAILABLE,
    );

    assert.equal(error.status, 503);
    assert.equal(error.code, 'SERVICE_UNAVAILABLE');
  });
});
