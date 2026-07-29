import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildNoResultsMessage,
  isLikelyEnglish,
  mapChunksToSources,
} from '@/features/ai-tutor/application/services/rag-helpers';

describe('rag-helpers', () => {
  it('detects English questions', () => {
    assert.equal(isLikelyEnglish('What is React Context?'), true);
    assert.equal(isLikelyEnglish('ما هو React Context؟'), false);
  });

  it('returns localized no-results messages', () => {
    const english = buildNoResultsMessage('What is React?');
    const arabic = buildNoResultsMessage('ما هو React؟');

    assert.match(english, /couldn't find information/i);
    assert.match(arabic, /لم أجد معلومات/);
  });

  it('maps retrieved chunks to message sources', () => {
    const sources = mapChunksToSources([
      {
        id: 'chunk-1',
        title: 'مقدمة React',
        content: 'React is a library',
        score: 0.91,
        contentType: 'LECTURE_CONTENT',
        lectureId: 'lecture-1',
      },
    ]);

    assert.equal(sources.length, 1);
    assert.equal(sources[0]?.id, 'chunk-1');
    assert.equal(sources[0]?.title, 'مقدمة React');
    assert.equal(sources[0]?.relevanceScore, 0.91);
    assert.equal(sources[0]?.lectureId, 'lecture-1');
  });
});
