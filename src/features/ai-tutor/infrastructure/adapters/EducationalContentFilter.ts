import {
  ContentFilterError,
  ContentFilterErrorCodes,
  type ContentClassification,
  type ContentFilterPort,
  type FilterOptions,
  type ValidationResult,
} from '../../domain/ports/ContentFilterPort';
import {
  buildAssessmentFallbackSuggestions,
  detectAssessmentIntent,
  transformAnswerToGuidance,
  validateEducationalResponse,
} from '../../shared/educational-integrity-rules';

type CourseRuleSet = {
  strictMode?: boolean;
  blockedPatterns?: string[];
  allowedContentTypes?: string[];
  customGuidance?: Record<string, string>;
};

/**
 * EducationalContentFilter
 *
 * Implements ContentFilterPort with rule-based educational integrity checks.
 * Prevents assessment answer leakage and steers students toward guided learning.
 */
export class EducationalContentFilter implements ContentFilterPort {
  private readonly courseRules = new Map<string, CourseRuleSet>();
  private readonly filterStats = {
    totalFiltered: 0,
    filtersByType: {} as Record<string, number>,
    lastUpdated: new Date(),
  };

  private bumpStat(type: string): void {
    this.filterStats.totalFiltered += 1;
    this.filterStats.filtersByType[type] =
      (this.filterStats.filtersByType[type] ?? 0) + 1;
    this.filterStats.lastUpdated = new Date();
  }

  async shouldFilter(content: string, options?: FilterOptions): Promise<boolean> {
    const intent = detectAssessmentIntent(content);
    if (intent.isAssessmentSeeking) {
      this.bumpStat('assessment_question');
      return true;
    }

    const validation = validateEducationalResponse(content);
    if (!validation.isValid) {
      this.bumpStat('assessment_leak');
      return true;
    }

    const courseId = options?.courseId;
    if (courseId) {
      const rules = this.courseRules.get(courseId);
      if (rules?.blockedPatterns?.some((pattern) => new RegExp(pattern, 'i').test(content))) {
        this.bumpStat('blocked_pattern');
        return true;
      }
    }

    return Boolean(options?.strictMode && intent.confidence >= 0.5);
  }

  async classifyContent(
    content: string,
    _options?: FilterOptions,
  ): Promise<ContentClassification> {
    const intent = detectAssessmentIntent(content);
    if (intent.isAssessmentSeeking) {
      return {
        type: 'assessment',
        confidence: intent.confidence,
        metadata: { reasons: intent.reasons },
      };
    }

    const validation = validateEducationalResponse(content);
    if (!validation.isValid) {
      return {
        type: 'solution',
        confidence: 0.9,
        metadata: { violations: validation.violations },
      };
    }

    return {
      type: 'learning_material',
      confidence: 0.8,
      metadata: {},
    };
  }

  async transformToGuidance(
    content: string,
    context: {
      courseId?: string;
      lectureId?: string;
      topic?: string;
      question?: string;
    },
  ): Promise<string> {
    try {
      return transformAnswerToGuidance(content, {
        topic: context.topic,
        question: context.question ?? content,
      });
    } catch (error) {
      throw new ContentFilterError(
        ContentFilterErrorCodes.TRANSFORMATION_FAILED,
        error instanceof Error ? error.message : 'Failed to transform guidance',
        false,
      );
    }
  }

  async validateResponse(
    response: string,
    context: {
      question?: string;
      retrievedSources?: Array<{
        content: string;
        metadata: Record<string, unknown>;
      }>;
      courseId?: string;
      lectureId?: string;
    },
    options?: FilterOptions,
  ): Promise<ValidationResult> {
    try {
      const integrity = validateEducationalResponse(response);
      const questionIntent = context.question
        ? detectAssessmentIntent(context.question)
        : { isAssessmentSeeking: false, confidence: 0, reasons: [] };

      const violations = integrity.violations.map((violation) => ({
        type: violation.type,
        severity: violation.severity,
        description: violation.description,
      }));

      if (
        questionIntent.isAssessmentSeeking &&
        options?.strictMode !== false &&
        integrity.isValid === false
      ) {
        this.bumpStat('response_assessment_leak');
      } else if (!integrity.isValid) {
        this.bumpStat('response_assessment_leak');
      }

      if (integrity.isValid && !questionIntent.isAssessmentSeeking) {
        return { isValid: true, violations: [] };
      }

      if (integrity.isValid && questionIntent.isAssessmentSeeking) {
        // Question sought answers but response stayed guided — still valid.
        return { isValid: true, violations: [] };
      }

      const suggestedResponse = await this.transformToGuidance(response, {
        courseId: context.courseId,
        lectureId: context.lectureId,
        question: context.question,
      });

      return {
        isValid: false,
        violations,
        guidance:
          'Response replaced with guided learning to protect educational integrity.',
        suggestedResponse,
      };
    } catch (error) {
      throw new ContentFilterError(
        ContentFilterErrorCodes.VALIDATION_FAILED,
        error instanceof Error ? error.message : 'Failed to validate response',
        false,
      );
    }
  }

  async getSuggestedResponses(
    originalQuestion: string,
    filterReason: string,
    context: {
      courseId?: string;
      lectureId?: string;
      topic?: string;
    },
  ): Promise<string[]> {
    const suggestions = buildAssessmentFallbackSuggestions(originalQuestion);

    if (context.topic) {
      const topicLine = isArabic(originalQuestion)
        ? `راجع موضوع: ${context.topic}`
        : `Review topic: ${context.topic}`;
      return [suggestions[0] ?? '', topicLine, ...suggestions.slice(1)].filter(
        Boolean,
      );
    }

    if (filterReason) {
      return suggestions;
    }

    return suggestions;
  }

  async markAsAssessment(
    _content: string,
    assessmentType: 'quiz' | 'assignment' | 'exam' | 'homework',
    _metadata?: Record<string, unknown>,
  ): Promise<void> {
    this.bumpStat(`marked_${assessmentType}`);
  }

  async updateCourseRules(
    courseId: string,
    rules: CourseRuleSet,
  ): Promise<void> {
    this.courseRules.set(courseId, {
      ...this.courseRules.get(courseId),
      ...rules,
    });
  }

  async getFilterStats(courseId?: string): Promise<{
    totalFiltered: number;
    filtersByType: Record<string, number>;
    lastUpdated: Date;
  }> {
    void courseId;
    return {
      totalFiltered: this.filterStats.totalFiltered,
      filtersByType: { ...this.filterStats.filtersByType },
      lastUpdated: this.filterStats.lastUpdated,
    };
  }
}

function isArabic(text: string): boolean {
  return /[\u0600-\u06FF]/.test(text);
}

export const educationalContentFilter = new EducationalContentFilter();
