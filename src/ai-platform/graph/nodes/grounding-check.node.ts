import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import { AIPlatformConfig } from '../../infrastructure/config/ai-platform.config';
import type { RetrievalStrategy } from '../../rag/retrieval/types';
import type { ExecutionPolicy } from '../state/shared-channels';
import type { TutorAgentState } from '../state/tutor-agent.state';
import {
  buildGroundedRefusalResponse,
  evaluateContextGrounding,
} from './guards/context-grounding';

export async function groundingCheckNode(
  state: TutorAgentState,
  _config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  const retrievalConfig = AIPlatformConfig.getRetrievalConfig();
  const retrievalStrategy =
    (state.retrievalStrategy as RetrievalStrategy | undefined) ?? 'none';

  const evaluation = evaluateContextGrounding({
    chunks: state.retrievedChunks ?? [],
    retrievalStrategy,
    minScore: retrievalConfig.minSimilarity,
    sessionMetaMode: state.personalization?.sessionMetaMode,
  });

  const runSignals = {
    ...state.runSignals,
    grounded: evaluation.grounded,
    groundingReason: evaluation.reason,
    topRetrievalScore: evaluation.topScore,
    retrievalChunkCount: evaluation.chunkCount,
    retrievalStrategy: evaluation.retrievalStrategy,
  };

  if (evaluation.grounded) {
    return {
      groundingBlocked: false,
      runSignals,
    };
  }

  return {
    groundingBlocked: true,
    executionPolicy: 'BUFFERED' satisfies ExecutionPolicy,
    finalResponse: buildGroundedRefusalResponse(state.locale),
    runSignals: {
      ...runSignals,
      groundingBlocked: true,
    },
  };
}

export function routeAfterGroundingCheck(
  state: Pick<TutorAgentState, 'groundingBlocked'>,
): 'prepare-history' | 'validate-output' {
  return state.groundingBlocked ? 'validate-output' : 'prepare-history';
}
