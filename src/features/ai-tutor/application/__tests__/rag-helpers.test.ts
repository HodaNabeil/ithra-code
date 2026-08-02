import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildNoResultsMessage,
  buildRetrievalQuery,
  detectFollowUpQuestion,
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

  it('detects follow-up questions that need conversation context', () => {
    assert.equal(detectFollowUpQuestion('اي المفاهيم اللي قالها', true), true);
    assert.equal(detectFollowUpQuestion('what concepts did he mention?', true), true);
    assert.equal(detectFollowUpQuestion('ما هو React Context؟', true), false);
    assert.equal(detectFollowUpQuestion('اي المفاهيم اللي قالها', false), false);
  });

  it('expands follow-up retrieval queries with lecture and history context', () => {
    const query = buildRetrievalQuery({
      question: 'اي المفاهيم اللي قالها',
      lectureTitle: 'مقدمة عامة',
      courseTitle: 'AWS for Developers',
      recentHistory: [
        { role: 'user', content: 'الدرس بيتكلم عن اي' },
        {
          role: 'assistant',
          content:
            'المحاضرة الحالية مقدمة عامة وهي فيديو تعريفي عن محتوى الدورة.',
        },
      ],
    });

    assert.match(query, /محاضرة: مقدمة عامة/);
    assert.match(query, /دورة: AWS for Developers/);
    assert.match(query, /الدرس بيتكلم عن اي/);
    assert.match(query, /سؤال متابعة: اي المفاهيم اللي قالها/);
  });

  it('keeps standalone questions unchanged for retrieval', () => {
    const query = buildRetrievalQuery({
      question: 'ما هو React Context؟',
      lectureTitle: 'React Context',
      recentHistory: [{ role: 'user', content: 'مرحبا' }],
    });

    assert.equal(query, 'ما هو React Context؟');
  });
});
