/**
 * ContentFilterPort
 *
 * Abstraction for content filtering and validation.
 * Ensures educational integrity by preventing assessment answer leakage
 * and maintaining appropriate tutoring boundaries.
 *
 * Implementations must handle:
 * - Assessment content detection
 * - Response filtering
 * - Educational guidance transformation
 * - Compliance validation
 */

export interface ValidationResult {
  isValid: boolean;
  violations: ValidationViolation[];
  guidance?: string;
  suggestedResponse?: string;
}

export interface ValidationViolation {
  type:
    | 'assessment_leak'
    | 'inappropriate_content'
    | 'off_topic'
    | 'too_direct';
  severity: 'low' | 'medium' | 'high';
  description: string;
  location?: {
    start: number;
    end: number;
  };
}

export interface ContentClassification {
  type: 'learning_material' | 'assessment' | 'solution' | 'hint' | 'general';
  confidence: number;
  metadata: Record<string, any>;
}

export interface FilterOptions {
  strictMode?: boolean;
  courseId?: string;
  lectureId?: string;
  userRole?: 'student' | 'instructor' | 'admin';
}

/**
 * ContentFilterPort interface
 * Provides content filtering and educational integrity validation
 */
export interface ContentFilterPort {
  /**
   * Check if content should be filtered
   *
   * @param content - Content to check
   * @param options - Filter configuration
   * @returns True if content should be filtered/blocked
   * @throws ContentFilterError if filtering fails
   *
   * @example
   * const shouldFilter = await filter.shouldFilter(
   *   'The answer to question 3 is option B',
   *   { strictMode: true, courseId: 'course-123' }
   * );
   * console.log(shouldFilter); // true (direct assessment answer)
   */
  shouldFilter(content: string, options?: FilterOptions): Promise<boolean>;

  /**
   * Classify content type for educational appropriateness
   *
   * @param content - Content to classify
   * @param options - Classification options
   * @returns Content classification result
   *
   * @example
   * const classification = await filter.classifyContent(
   *   'What is the time complexity of bubble sort?'
   * );
   * console.log(classification.type); // 'learning_material'
   */
  classifyContent(
    content: string,
    options?: FilterOptions,
  ): Promise<ContentClassification>;

  /**
   * Transform direct answers into guided learning
   *
   * @param content - Direct answer or solution
   * @param context - Educational context
   * @returns Guided learning response
   * @throws ContentFilterError if transformation fails
   *
   * @example
   * const guided = await filter.transformToGuidance(
   *   'The answer is bubble sort has O(n²) complexity',
   *   { courseId: 'cs101', topic: 'algorithms' }
   * );
   * console.log(guided); // "Think about how many comparisons bubble sort makes..."
   */
  transformToGuidance(
    content: string,
    context: {
      courseId?: string;
      lectureId?: string;
      topic?: string;
      question?: string;
    },
  ): Promise<string>;

  /**
   * Validate AI response for educational appropriateness
   *
   * @param response - AI-generated response
   * @param context - Request context
   * @param options - Validation options
   * @returns Validation result with violations and suggestions
   *
   * @example
   * const validation = await filter.validateResponse(
   *   'The correct answer is option C',
   *   {
   *     question: 'What is the output of this code?',
   *     retrievedSources: [...]
   *   }
   * );
   * if (!validation.isValid) {
   *   console.log(validation.guidance); // Alternative response suggestion
   * }
   */
  validateResponse(
    response: string,
    context: {
      question?: string;
      retrievedSources?: Array<{
        content: string;
        metadata: Record<string, any>;
      }>;
      courseId?: string;
      lectureId?: string;
    },
    options?: FilterOptions,
  ): Promise<ValidationResult>;

  /**
   * Get suggested fallback responses for filtered content
   *
   * @param originalQuestion - User's original question
   * @param filterReason - Why content was filtered
   * @param context - Educational context
   * @returns Suggested alternative responses
   *
   * @example
   * const suggestions = await filter.getSuggestedResponses(
   *   'What is the answer to question 5?',
   *   'assessment_leak',
   *   { courseId: 'math101' }
   * );
   * console.log(suggestions[0]); // "I can help you understand the concepts..."
   */
  getSuggestedResponses(
    originalQuestion: string,
    filterReason: string,
    context: {
      courseId?: string;
      lectureId?: string;
      topic?: string;
    },
  ): Promise<string[]>;

  /**
   * Mark content as assessment material for future filtering
   *
   * @param content - Content to mark
   * @param assessmentType - Type of assessment
   * @param metadata - Additional metadata
   */
  markAsAssessment(
    content: string,
    assessmentType: 'quiz' | 'assignment' | 'exam' | 'homework',
    metadata?: Record<string, any>,
  ): Promise<void>;

  /**
   * Update filter rules for a course
   *
   * @param courseId - Course ID
   * @param rules - Filter rules to apply
   */
  updateCourseRules(
    courseId: string,
    rules: {
      strictMode?: boolean;
      blockedPatterns?: string[];
      allowedContentTypes?: string[];
      customGuidance?: Record<string, string>;
    },
  ): Promise<void>;

  /**
   * Get filter statistics
   *
   * @param courseId - Course ID (optional)
   * @returns Filter usage statistics
   */
  getFilterStats(courseId?: string): Promise<{
    totalFiltered: number;
    filtersByType: Record<string, number>;
    lastUpdated: Date;
  }>;
}

/**
 * ContentFilterError
 * Represents errors from content filtering operations
 */
export class ContentFilterError extends Error {
  constructor(
    public code: string,
    message: string,
    public retryable: boolean = false,
  ) {
    super(message);
    this.name = 'ContentFilterError';
  }
}

/**
 * Common content filter error codes
 */
export const ContentFilterErrorCodes = {
  CLASSIFICATION_FAILED: 'CLASSIFICATION_FAILED',
  TRANSFORMATION_FAILED: 'TRANSFORMATION_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  RULE_UPDATE_FAILED: 'RULE_UPDATE_FAILED',
  INVALID_CONTENT: 'INVALID_CONTENT',
  UNKNOWN: 'UNKNOWN',
} as const;
