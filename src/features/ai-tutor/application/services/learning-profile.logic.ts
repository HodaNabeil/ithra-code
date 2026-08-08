import type { MessageDTO } from '../../domain/ports/ConversationRepositoryPort';
import {
  DEFAULT_LEARNING_PROFILE,
  type ContentStyle,
  type ExplanationDepth,
  type StudentLearningProfile,
} from '../../domain/models/StudentLearningProfile';

export type PreferenceSignals = {
  explanationDepth: ExplanationDepth;
  contentStyle: ContentStyle;
  signalStrength: number;
};

const CODE_PATTERNS = [
  /\bcode\b/i,
  /\bexample\b/i,
  /\bsnippet\b/i,
  /```/,
  /\bfunction\b/i,
  /\bclass\b/i,
  /\bimplement\b/i,
  /كود/,
  /مثال/,
  /برمج/,
];

const THEORY_PATTERNS = [
  /\bconcept\b/i,
  /\btheory\b/i,
  /\bwhy\b/i,
  /\bexplain\b/i,
  /\bunderstand\b/i,
  /مفهوم/,
  /لماذا/,
  /اشرح/,
  /فهم/,
];

const CONCISE_PATTERNS = [
  /\bquick\b/i,
  /\bbrief\b/i,
  /\bshort\b/i,
  /\btldr\b/i,
  /باختصار/,
  /بسرعة/,
  /ملخص/,
];

const DETAILED_PATTERNS = [
  /\bdetailed\b/i,
  /\bstep by step\b/i,
  /\bin depth\b/i,
  /\bthorough\b/i,
  /بالتفصيل/,
  /خطوة بخطوة/,
  /شرح مفصل/,
];

function countPatternMatches(text: string, patterns: RegExp[]): number {
  return patterns.reduce(
    (count, pattern) => count + (pattern.test(text) ? 1 : 0),
    0,
  );
}

export function inferPreferenceSignalsFromText(text: string): PreferenceSignals {
  const trimmed = text.trim();
  const wordCount = trimmed.split(/\s+/).filter(Boolean).length;
  const codeScore = countPatternMatches(trimmed, CODE_PATTERNS);
  const theoryScore = countPatternMatches(trimmed, THEORY_PATTERNS);
  const conciseScore = countPatternMatches(trimmed, CONCISE_PATTERNS);
  const detailedScore = countPatternMatches(trimmed, DETAILED_PATTERNS);

  let explanationDepth: ExplanationDepth = 'balanced';
  let depthStrength = 0.2;

  if (conciseScore > detailedScore || wordCount <= 8) {
    explanationDepth = conciseScore >= detailedScore ? 'concise' : 'balanced';
    depthStrength = conciseScore > 0 || wordCount <= 8 ? 0.6 : 0.3;
  } else if (detailedScore > 0 || wordCount >= 30) {
    explanationDepth = 'detailed';
    depthStrength = detailedScore > 0 || wordCount >= 40 ? 0.7 : 0.5;
  }

  let contentStyle: ContentStyle = 'balanced';
  let styleStrength = 0.2;

  if (codeScore > theoryScore && codeScore > 0) {
    contentStyle = 'code_heavy';
    styleStrength = Math.min(0.35 + codeScore * 0.15, 0.85);
  } else if (theoryScore > codeScore && theoryScore > 0) {
    contentStyle = 'theory';
    styleStrength = Math.min(0.35 + theoryScore * 0.15, 0.85);
  }

  return {
    explanationDepth,
    contentStyle,
    signalStrength: Math.max(depthStrength, styleStrength),
  };
}

export function inferPreferenceSignalsFromMessages(
  messages: MessageDTO[],
): PreferenceSignals {
  const userMessages = messages.filter((message) => message.role === 'user');

  if (userMessages.length === 0) {
    return {
      explanationDepth: DEFAULT_LEARNING_PROFILE.explanationDepth,
      contentStyle: DEFAULT_LEARNING_PROFILE.contentStyle,
      signalStrength: 0,
    };
  }

  const recentMessages = userMessages.slice(-5);
  const aggregate = recentMessages.map((message) =>
    inferPreferenceSignalsFromText(message.content),
  );

  const depthVotes = new Map<ExplanationDepth, number>();
  const styleVotes = new Map<ContentStyle, number>();
  let totalStrength = 0;

  for (const signal of aggregate) {
    depthVotes.set(
      signal.explanationDepth,
      (depthVotes.get(signal.explanationDepth) ?? 0) + signal.signalStrength,
    );
    styleVotes.set(
      signal.contentStyle,
      (styleVotes.get(signal.contentStyle) ?? 0) + signal.signalStrength,
    );
    totalStrength += signal.signalStrength;
  }

  const explanationDepth =
    [...depthVotes.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    DEFAULT_LEARNING_PROFILE.explanationDepth;
  const contentStyle =
    [...styleVotes.entries()].sort((left, right) => right[1] - left[1])[0]?.[0] ??
    DEFAULT_LEARNING_PROFILE.contentStyle;

  return {
    explanationDepth,
    contentStyle,
    signalStrength: totalStrength / aggregate.length,
  };
}

function mergePreferenceValue<T extends string>(
  current: T,
  incoming: T,
  confidence: number,
  signalStrength: number,
): T {
  if (confidence < 0.25 || signalStrength >= 0.65) {
    return incoming;
  }

  if (current === incoming) {
    return current;
  }

  return signalStrength >= 0.45 ? incoming : current;
}

export function mergeLearningProfile(
  existing: StudentLearningProfile,
  signals: PreferenceSignals,
): StudentLearningProfile {
  const interactionCount = existing.interactionCount + 1;
  const confidence = Math.min(
    1,
    existing.confidence * 0.85 + signals.signalStrength * 0.25,
  );

  return {
    ...existing,
    explanationDepth: mergePreferenceValue(
      existing.explanationDepth,
      signals.explanationDepth,
      existing.confidence,
      signals.signalStrength,
    ),
    contentStyle: mergePreferenceValue(
      existing.contentStyle,
      signals.contentStyle,
      existing.confidence,
      signals.signalStrength,
    ),
    confidence,
    interactionCount,
    lastUpdatedAt: new Date(),
  };
}

export function buildAdaptiveFormattingInstructions(
  profile?: StudentLearningProfile,
): string {
  if (!profile || profile.confidence < 0.2) {
    return '';
  }

  const depthInstruction =
    profile.explanationDepth === 'concise'
      ? '- فضّل إجابات مختصرة ومركزة مع أمثلة قصيرة عند الحاجة.'
      : profile.explanationDepth === 'detailed'
        ? '- قدّم شرحاً مفصلاً خطوة بخطوة مع أمثلة توضيحية.'
        : '- اجمع بين الوضوح والتفصيل المعتدل.';

  const styleInstruction =
    profile.contentStyle === 'code_heavy'
      ? '- ركّز على أمثلة عملية وأكواد عند الإمكان.'
      : profile.contentStyle === 'theory'
        ? '- ركّز على المفاهيم والأسباب قبل التفاصيل التقنية.'
        : '- وازن بين الشرح النظري والأمثلة العملية.';

  return ['## تفضيلات التعلم المستنتجة', depthInstruction, styleInstruction].join(
    '\n',
  );
}
