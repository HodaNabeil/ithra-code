import type { ContentFilterPort } from '../../domain/ports/ContentFilterPort';
import type {
  ResponseProcessorContext,
  ResponseProcessorPort,
  ResponseProcessorResult,
} from '@/ai-platform/domain/ports/response-processor.port';
import { buildGuidedLearningResponse } from '../../shared/educational-integrity-rules';

/**
 * Adapts the feature ContentFilterPort to the platform ResponseProcessorPort.
 */
export class TutorResponseProcessorAdapter implements ResponseProcessorPort {
  constructor(private readonly contentFilter: ContentFilterPort) {}

  async process(
    response: string,
    context: ResponseProcessorContext,
  ): Promise<ResponseProcessorResult> {
    const validation = await this.contentFilter.validateResponse(
      response,
      {
        question: context.question,
        retrievedSources: context.retrievedSources,
        courseId: context.scope?.courseId,
        lectureId: context.scope?.lectureId,
      },
      {
        courseId: context.scope?.courseId,
        lectureId: context.scope?.lectureId,
      },
    );

    if (validation.isValid) {
      return { output: response, disposition: 'unchanged' };
    }

    return {
      output:
        validation.suggestedResponse ??
        buildGuidedLearningResponse(context.question ?? response),
      disposition: 'replaced',
      signals: { filterTriggered: true },
    };
  }
}
