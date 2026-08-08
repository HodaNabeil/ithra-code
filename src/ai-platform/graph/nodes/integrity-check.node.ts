import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import { buildGuidedLearningResponse, detectAssessmentIntent } from './guards/educational-integrity';
import type { ExecutionPolicy } from '../state/shared-channels';
import type { TutorAgentState } from '../state/tutor-agent.state';

/**
 * Pre-LLM educational integrity gate. When the student appears to be asking
 * for a direct quiz/assignment answer, short-circuits the graph with a
 * guided-learning response instead of calling the LLM at all — this runs for
 * every caller of runAgent('tutor'), not only src/features/ai-tutor.
 */
export async function integrityCheckNode(
  state: TutorAgentState,
  _config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  const question = state.sanitizedInput || state.input;
  const intent = detectAssessmentIntent(question);

  if (!intent.isAssessmentSeeking) {
    return {
      assessmentBlocked: false,
      executionPolicy: 'LIVE' satisfies ExecutionPolicy,
    };
  }

  return {
    assessmentBlocked: true,
    executionPolicy: 'BUFFERED' satisfies ExecutionPolicy,
    finalResponse: buildGuidedLearningResponse(question),
    runSignals: { assessmentBlocked: true },
  };
}

export function routeAfterIntegrityCheck(
  state: Pick<TutorAgentState, 'assessmentBlocked'>,
): 'retrieve-context' | 'validate-output' {
  return state.assessmentBlocked ? 'validate-output' : 'retrieve-context';
}
