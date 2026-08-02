import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { buildNoResultsMessage } from '@/features/ai-tutor/application/services/rag-helpers';

describe('buildNoResultsMessage knowledge index state', () => {
  it('returns preparation message when course is not indexed', () => {
    const message = buildNoResultsMessage('ما هو React؟', {
      knowledgeIndexed: false,
    });

    assert.match(message, /قيد التحضير/);
  });

  it('returns standard fallback when course is indexed', () => {
    const message = buildNoResultsMessage('ما هو React؟', {
      knowledgeIndexed: true,
    });

    assert.match(message, /لم أجد معلومات/);
  });
});
