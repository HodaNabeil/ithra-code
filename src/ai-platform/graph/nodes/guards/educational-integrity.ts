/**
 * Educational integrity guard — pre-LLM assessment-seeking detection and
 * post-LLM direct-answer leak detection. Ported into ai-platform so the
 * tutor graph enforces these rules for every caller of runAgent('tutor'),
 * not only the src/features/ai-tutor use case.
 */

const ARABIC_PATTERN = /[\u0600-\u06FF]/;

function isLikelyEnglish(text: string): boolean {
  return !ARABIC_PATTERN.test(text);
}

export interface AssessmentIntent {
  isAssessmentSeeking: boolean;
  confidence: number;
  reasons: string[];
}

export interface ResponseIntegrityResult {
  isValid: boolean;
  violations: Array<{
    type: 'assessment_leak' | 'too_direct';
    severity: 'low' | 'medium' | 'high';
    description: string;
  }>;
}

const ASSESSMENT_QUESTION_PATTERNS: Array<{
  pattern: RegExp;
  weight: number;
  reason: string;
}> = [
  {
    pattern: /\b(what|which)\s+is\s+the\s+(correct\s+)?answer\b/i,
    weight: 0.9,
    reason: 'asks_for_answer',
  },
  {
    pattern: /\bgive\s+me\s+the\s+(answer|solution)\b/i,
    weight: 0.95,
    reason: 'asks_for_answer',
  },
  {
    pattern: /\b(tell|show)\s+me\s+the\s+(answer|solution|correct)\b/i,
    weight: 0.9,
    reason: 'asks_for_answer',
  },
  {
    pattern: /\bquiz\s+question\s*\d+\b/i,
    weight: 0.85,
    reason: 'quiz_reference',
  },
  {
    pattern: /\bquestion\s*\d+\s*(answer|solution)?\b/i,
    weight: 0.7,
    reason: 'question_number',
  },
  {
    pattern: /\b(assignment|homework|exam)\s+(solution|answer|key)\b/i,
    weight: 0.95,
    reason: 'assignment_solution',
  },
  {
    pattern: /\bsolve\s+(the\s+)?(assignment|homework|quiz|exam)\b/i,
    weight: 0.9,
    reason: 'solve_assessment',
  },
  { pattern: /\bcorrect\s+option\b/i, weight: 0.85, reason: 'asks_for_option' },
  {
    pattern: /\bwhich\s+option\s+is\s+correct\b/i,
    weight: 0.9,
    reason: 'asks_for_option',
  },
  {
    pattern: /ما\s*(هي|هو)?\s*الإجابة\s*(الصحيحة)?/,
    weight: 0.9,
    reason: 'asks_for_answer_ar',
  },
  {
    pattern: /أعطني\s*(الإجابة|الحل)/,
    weight: 0.95,
    reason: 'asks_for_answer_ar',
  },
  {
    pattern: /حل\s*(الواجب|الاختبار|الامتحان|التمرين)/,
    weight: 0.9,
    reason: 'solve_assessment_ar',
  },
  {
    pattern: /إجابة\s*السؤال\s*\d+/,
    weight: 0.85,
    reason: 'question_number_ar',
  },
  { pattern: /مفتاح\s*الإجابة/, weight: 0.95, reason: 'answer_key_ar' },
  { pattern: /الخيار\s*الصحيح/, weight: 0.85, reason: 'asks_for_option_ar' },
];

const DIRECT_ANSWER_RESPONSE_PATTERNS: Array<{
  pattern: RegExp;
  severity: 'low' | 'medium' | 'high';
  description: string;
}> = [
  {
    pattern: /\bthe\s+correct\s+answer\s+is\b/i,
    severity: 'high',
    description: 'States the correct answer directly',
  },
  {
    pattern: /\bthe\s+answer\s+is\s+(option\s+)?[A-D]\b/i,
    severity: 'high',
    description: 'Reveals a multiple-choice answer',
  },
  {
    pattern: /\bcorrect\s+option\s*(is|:)\s*[A-D]\b/i,
    severity: 'high',
    description: 'Reveals the correct option letter',
  },
  {
    pattern: /\banswer\s*key\b/i,
    severity: 'high',
    description: 'References an answer key',
  },
  {
    pattern: /\bfinal\s+solution\s*(is|:)\b/i,
    severity: 'medium',
    description: 'Provides a final solution framing',
  },
  {
    pattern: /الإجابة\s*الصحيحة\s*(هي|:)/,
    severity: 'high',
    description: 'States the correct answer directly (Arabic)',
  },
  {
    pattern: /الخيار\s*(الصحيح)?\s*(هو|:)?\s*[أ-دA-D]/,
    severity: 'high',
    description: 'Reveals the correct option (Arabic)',
  },
  {
    pattern: /مفتاح\s*الإجابة/,
    severity: 'high',
    description: 'References an answer key (Arabic)',
  },
  {
    pattern: /الحل\s*النهائي\s*(هو|:)/,
    severity: 'medium',
    description: 'Provides a final solution framing (Arabic)',
  },
];

const GUIDED_RESPONSE_EN = `I can't give you the direct answer to quiz or assignment questions — that would bypass the learning process.

Instead, I can help you understand the underlying concepts. Try this approach:
1. Re-read the related lecture materials and learning objectives.
2. Identify which concept the question is testing.
3. Ask me about that concept (for example: "Can you explain X with an example?").

If you share what you've tried so far, I'll guide you with hints — without spoiling the answer.`;

const GUIDED_RESPONSE_AR = `لا يمكنني إعطاء الإجابة المباشرة لأسئلة الاختبار أو الواجبات — فهذا يتجاوز عملية التعلم.

بدلاً من ذلك، يمكنني مساعدتك على فهم المفاهيم الأساسية. جرّب هذا الأسلوب:
1. أعد قراءة مواد المحاضرة وأهداف التعلم ذات الصلة.
2. حدّد المفهوم الذي يختبره السؤال.
3. اسألني عن هذا المفهوم (مثلاً: "هل يمكنك شرح X بمثال؟").

إذا شاركتني ما حاولته حتى الآن، سأرشدك بتلميحات — دون كشف الإجابة.`;

export function detectAssessmentIntent(question: string): AssessmentIntent {
  const reasons: string[] = [];
  let score = 0;

  for (const entry of ASSESSMENT_QUESTION_PATTERNS) {
    if (entry.pattern.test(question)) {
      score = Math.max(score, entry.weight);
      reasons.push(entry.reason);
    }
  }

  return {
    isAssessmentSeeking: score >= 0.7,
    confidence: score,
    reasons,
  };
}

export function validateEducationalResponse(
  response: string,
): ResponseIntegrityResult {
  const violations: ResponseIntegrityResult['violations'] = [];

  for (const entry of DIRECT_ANSWER_RESPONSE_PATTERNS) {
    if (entry.pattern.test(response)) {
      violations.push({
        type: 'assessment_leak',
        severity: entry.severity,
        description: entry.description,
      });
    }
  }

  const hasHighSeverity = violations.some(
    (violation) => violation.severity === 'high',
  );

  return { isValid: !hasHighSeverity, violations };
}

export function buildGuidedLearningResponse(question: string): string {
  return isLikelyEnglish(question) ? GUIDED_RESPONSE_EN : GUIDED_RESPONSE_AR;
}
