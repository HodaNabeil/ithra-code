import { isLikelyEnglish } from '../../shared/language';

export type SuggestableLecture = {
  id: string;
  title: string;
  description?: string;
  sectionTitle: string;
};

export type ContentSuggestion = {
  lectureId: string;
  title: string;
  sectionTitle: string;
  score: number;
  reason: string;
};

export type RankedSuggestionsResult = {
  suggestions: ContentSuggestion[];
  formattedMessage: string;
};

const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'to',
  'of',
  'in',
  'on',
  'for',
  'and',
  'or',
  'what',
  'how',
  'why',
  'when',
  'where',
  'which',
  'who',
  'can',
  'you',
  'me',
  'my',
  'please',
  'help',
  'explain',
  'about',
  'this',
  'that',
  'with',
  'from',
  'هل',
  'ما',
  'هو',
  'هي',
  'في',
  'من',
  'على',
  'إلى',
  'عن',
  'هذا',
  'هذه',
  'ذلك',
  'التي',
  'الذي',
  'شرح',
  'اشرح',
  'أريد',
  'ممكن',
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !STOP_WORDS.has(token));
}

function uniqueTokens(tokens: string[]): string[] {
  return [...new Set(tokens)];
}

function scoreLecture(
  questionTokens: string[],
  lecture: SuggestableLecture,
): { score: number; matched: string[] } {
  const titleTokens = uniqueTokens(tokenize(lecture.title));
  const descriptionTokens = uniqueTokens(tokenize(lecture.description ?? ''));
  const sectionTokens = uniqueTokens(tokenize(lecture.sectionTitle));

  const matched = new Set<string>();
  let score = 0;

  for (const token of questionTokens) {
    if (titleTokens.includes(token)) {
      score += 3;
      matched.add(token);
    } else if (sectionTokens.includes(token)) {
      score += 2;
      matched.add(token);
    } else if (descriptionTokens.includes(token)) {
      score += 1;
      matched.add(token);
    }
  }

  if (questionTokens.length > 0) {
    score = score / questionTokens.length;
  }

  return { score, matched: [...matched] };
}

export function rankContentSuggestions(
  question: string,
  lectures: SuggestableLecture[],
  options?: { limit?: number; minScore?: number; excludeLectureId?: string },
): ContentSuggestion[] {
  const limit = options?.limit ?? 3;
  const minScore = options?.minScore ?? 0.15;
  const questionTokens = uniqueTokens(tokenize(question));

  if (questionTokens.length === 0 || lectures.length === 0) {
    return [];
  }

  const ranked = lectures
    .filter((lecture) => lecture.id !== options?.excludeLectureId)
    .map((lecture) => {
      const { score, matched } = scoreLecture(questionTokens, lecture);
      return {
        lectureId: lecture.id,
        title: lecture.title,
        sectionTitle: lecture.sectionTitle,
        score,
        reason:
          matched.length > 0
            ? `matched: ${matched.slice(0, 4).join(', ')}`
            : 'related course material',
      } satisfies ContentSuggestion;
    })
    .filter((item) => item.score >= minScore)
    .sort((a, b) => b.score - a.score);

  return ranked.slice(0, limit);
}

export function formatSuggestionMessage(
  question: string,
  suggestions: ContentSuggestion[],
): string {
  if (suggestions.length === 0) {
    return '';
  }

  const english = isLikelyEnglish(question);

  if (english) {
    const lines = suggestions.map(
      (suggestion, index) =>
        `${index + 1}. "${suggestion.title}" (${suggestion.sectionTitle})`,
    );
    return [
      'Here are related lectures you can review:',
      ...lines,
      'Open one of these lectures and ask me about a specific concept from it.',
    ].join('\n');
  }

  const lines = suggestions.map(
    (suggestion, index) =>
      `${index + 1}. «${suggestion.title}» (${suggestion.sectionTitle})`,
  );
  return [
    'إليك محاضرات ذات صلة يمكنك مراجعتها:',
    ...lines,
    'افتح إحدى هذه المحاضرات واسألني عن مفهوم محدد منها.',
  ].join('\n');
}

export function buildSuggestionFallback(
  question: string,
  lectures: SuggestableLecture[],
  options?: { excludeLectureId?: string },
): RankedSuggestionsResult {
  const suggestions = rankContentSuggestions(question, lectures, {
    limit: 3,
    excludeLectureId: options?.excludeLectureId,
  });

  return {
    suggestions,
    formattedMessage: formatSuggestionMessage(question, suggestions),
  };
}
