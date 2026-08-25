import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import {
  buildGuidedLearningResponse,
  validateEducationalResponse,
} from './guards/educational-integrity';
import { getGraphRuntimeConfig } from '../runtime-config';
import type { TutorAgentState } from '../state/tutor-agent.state';

const MAX_RESPONSE_LENGTH = 8000;

export async function validateOutputNode(
  state: TutorAgentState,
  config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  let response = state.finalResponse?.trim() ?? '';
  const errors: string[] = [];
  const signals: Record<string, unknown> = {};

  if (!response) {
    errors.push('empty_response');
  }

  if (response.length > MAX_RESPONSE_LENGTH) {
    errors.push('response_too_long');
    response = response.slice(0, MAX_RESPONSE_LENGTH);
  }

  const hardFailure = errors.length > 0;

  // Skip the leak check for already-blocked assessment/grounding responses — they are
  // our own guided-learning or grounded-refusal message, not LLM output that might leak answers.
  if (response && !state.assessmentBlocked && !state.groundingBlocked) {
    let courseId: string | undefined;
    let lectureId: string | undefined;

    try {
      const runtime = getGraphRuntimeConfig(config);
      courseId = runtime.courseId;
      lectureId = runtime.lectureId;

      if (runtime.responseProcessor) {
        const processed = await runtime.responseProcessor.process(response, {
          question: state.sanitizedInput || state.input,
          retrievedSources: state.retrievedChunks.map((chunk) => ({
            content: chunk.content,
            metadata: chunk.metadata ?? {},
          })),
          scope: { courseId, lectureId },
        });

        if (processed.disposition === 'replaced') {
          errors.push('content_filter');
          response = processed.output;
          signals.filterTriggered = true;
        } else if (processed.disposition === 'rejected') {
          errors.push('content_filter');
          response = buildGuidedLearningResponse(
            state.sanitizedInput || state.input,
          );
          signals.filterTriggered = true;
        }

        if (processed.signals) {
          Object.assign(signals, processed.signals);
        }
      } else {
        const integrity = validateEducationalResponse(response);
        if (!integrity.isValid) {
          errors.push('assessment_leak');
          response = buildGuidedLearningResponse(
            state.sanitizedInput || state.input,
          );
          signals.filterTriggered = true;
        }
      }
    } catch {
      // Unit tests and non-graph callers may omit configurable ports.
      const integrity = validateEducationalResponse(response);
      if (!integrity.isValid) {
        errors.push('assessment_leak');
        response = buildGuidedLearningResponse(
          state.sanitizedInput || state.input,
        );
        signals.filterTriggered = true;
      }
    }
  }

  return {
    outputValid: !hardFailure,
    validationErrors: errors,
    finalResponse: response,
    runSignals: signals,
  };
}

export function routeAfterValidateOutput(
  state: Pick<TutorAgentState, 'assessmentBlocked'>,
): 'enrich-response' | 'done' {
  return state.assessmentBlocked ? 'enrich-response' : 'done';
}
