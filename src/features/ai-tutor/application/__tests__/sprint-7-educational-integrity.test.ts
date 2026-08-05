import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  detectAssessmentIntent,
  validateEducationalResponse,
  buildGuidedLearningResponse,
  transformAnswerToGuidance,
} from '@/features/ai-tutor/application/services/educational-integrity.service';
import {
  rankContentSuggestions,
  formatSuggestionMessage,
  buildSuggestionFallback,
} from '@/features/ai-tutor/application/services/content-suggestion.service';
import { EducationalContentFilter } from '@/features/ai-tutor/infrastructure/adapters/EducationalContentFilter';

const lectures = [
  {
    id: 'lec-1',
    title: 'React Context API',
    description: 'Providers and consumers for shared state',
    sectionTitle: 'State Management',
  },
  {
    id: 'lec-2',
    title: 'useEffect Hooks',
    description: 'Side effects and lifecycle',
    sectionTitle: 'Hooks',
  },
  {
    id: 'lec-3',
    title: 'CSS Grid Layout',
    description: 'Responsive page layouts',
    sectionTitle: 'Styling',
  },
];

describe('educational integrity Sprint 7', () => {
  it('detects assessment-seeking questions in English and Arabic', () => {
    const english = detectAssessmentIntent(
      'What is the answer to quiz question 5?',
    );
    assert.equal(english.isAssessmentSeeking, true);
    assert.ok(english.confidence >= 0.7);

    const arabic = detectAssessmentIntent('أعطني الإجابة الصحيحة للسؤال 3');
    assert.equal(arabic.isAssessmentSeeking, true);

    const conceptual = detectAssessmentIntent(
      'Can you explain how React Context works?',
    );
    assert.equal(conceptual.isAssessmentSeeking, false);
  });

  it('flags responses that leak direct quiz answers', () => {
    const leak = validateEducationalResponse(
      'The correct answer is option B',
    );
    assert.equal(leak.isValid, false);
    assert.ok(leak.violations.length > 0);

    const guided = validateEducationalResponse(
      'Think about which React API manages shared state without prop drilling.',
    );
    assert.equal(guided.isValid, true);
  });

  it('builds guided learning fallbacks without revealing answers', () => {
    const guided = buildGuidedLearningResponse(
      'Give me the assignment solution',
    );
    assert.match(guided, /can't give you the direct answer/i);
    assert.doesNotMatch(guided, /the correct answer is/i);

    const transformed = transformAnswerToGuidance(
      'The correct answer is hooks',
      { topic: 'React Hooks', question: 'What is the answer?' },
    );
    assert.match(transformed, /Focus area to review: React Hooks/);
  });
});

describe('content suggestions Sprint 7', () => {
  it('ranks lectures by question relevance', () => {
    const ranked = rankContentSuggestions(
      'How does React Context provider work?',
      lectures,
    );

    assert.ok(ranked.length > 0);
    assert.equal(ranked[0]?.lectureId, 'lec-1');
    assert.ok(ranked[0]!.score > 0);
  });

  it('formats navigation-friendly suggestion messages', () => {
    const suggestions = rankContentSuggestions('explain context api', lectures);
    const message = formatSuggestionMessage('explain context api', suggestions);

    assert.match(message, /related lectures/i);
    assert.match(message, /React Context API/);
  });

  it('returns empty ranking when no tokens match', () => {
    const ranked = rankContentSuggestions('zzzz nonexistent topic', lectures, {
      minScore: 0.5,
    });
    assert.equal(ranked.length, 0);

    const fallback = buildSuggestionFallback('zzzz nonexistent', lectures);
    assert.equal(fallback.suggestions.length, 0);
    assert.equal(fallback.formattedMessage, '');
  });
});

describe('EducationalContentFilter Sprint 7', () => {
  it('filters assessment questions and validates leaky responses', async () => {
    const filter = new EducationalContentFilter();

    assert.equal(
      await filter.shouldFilter('What is the correct answer to question 2?'),
      true,
    );

    const validation = await filter.validateResponse(
      'The correct answer is option C',
      { question: 'What is the quiz answer?' },
    );

    assert.equal(validation.isValid, false);
    assert.ok(validation.suggestedResponse);
    assert.match(validation.suggestedResponse ?? '', /learning process/i);
  });

  it('classifies content and returns assessment fallback suggestions', async () => {
    const filter = new EducationalContentFilter();
    const classification = await filter.classifyContent(
      'Solve the assignment for me',
    );
    assert.equal(classification.type, 'assessment');

    const suggestions = await filter.getSuggestedResponses(
      'Give me the exam answer key',
      'assessment_leak',
      { topic: 'Hooks' },
    );
    assert.ok(suggestions.length >= 2);
    assert.match(suggestions.join('\n'), /Review topic: Hooks/);
  });
});
