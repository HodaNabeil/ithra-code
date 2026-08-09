import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import {
  getWorkingMemory,
  setWorkingMemory,
} from '../../memory/short-term/working-memory.cache';
import { retrieveRelevantContent } from '../../rag/retrieval/content-retriever.service';
import type { RetrievedContentChunk, RetrievalStrategy } from '../../rag/retrieval/types';
import { isAssessmentAdjacent } from '../../prompts/tutor-system-prompt.builder';
import { getGraphRuntimeConfig } from '../runtime-config';
import type { RetrievedChunkState, TutorAgentState } from '../state/tutor-agent.state';

const WORKING_MEMORY_SCOPE = 'retrieval';

interface CachedRetrieval {
  chunks: RetrievedChunkState[];
  usedFallback: boolean;
  retrievalStrategy?: RetrievalStrategy;
}

function toRetrievedChunkState(chunk: RetrievedContentChunk): RetrievedChunkState {
  return {
    id: chunk.id,
    content: chunk.content,
    score: chunk.score,
    metadata: {
      ...chunk.metadata,
      title: chunk.title,
      contentType: chunk.contentType,
      lectureId: chunk.lectureId,
    },
  };
}

/**
 * Fetches RAG context for the tutor agent via EmbeddingPort + VectorSearchPort
 * and stores the result in graph state. Falls back to a pass-through when the
 * ports or course scope aren't available (e.g. agents without RAG capability).
 */
export async function retrieveContextNode(
  state: TutorAgentState,
  config: LangGraphRunnableConfig,
): Promise<Partial<TutorAgentState>> {
  const runtime = getGraphRuntimeConfig(config);

  if (!runtime.embeddingPort || !runtime.vectorSearchPort || !runtime.courseId) {
    return {
      retrievedChunks: state.retrievedChunks ?? [],
    };
  }

  const question = state.sanitizedInput || state.input;

  const cached = runtime.runId
    ? ((await getWorkingMemory(runtime.runId, WORKING_MEMORY_SCOPE)) as CachedRetrieval | null)
    : null;

  let retrievedChunks: RetrievedChunkState[];
  let usedFallback: boolean;
  let retrievalStrategy: RetrievalStrategy = 'none';
  let embeddingTokensUsed = 0;

  if (cached) {
    retrievedChunks = cached.chunks;
    usedFallback = cached.usedFallback;
    retrievalStrategy = cached.retrievalStrategy ?? 'none';
  } else {
    const result = await retrieveRelevantContent(
      {
        question,
        courseId: runtime.courseId,
        lectureId: runtime.lectureId,
        lectureTitle:
          typeof state.personalization?.lectureTitle === 'string'
            ? state.personalization.lectureTitle
            : undefined,
        courseTitle:
          typeof state.personalization?.courseTitle === 'string'
            ? state.personalization.courseTitle
            : undefined,
        recentHistory: state.conversationHistory
          .filter((message) => message.role === 'user' || message.role === 'assistant')
          .map((message) => ({
            role: message.role as 'user' | 'assistant',
            content: message.content,
          })),
      },
      {
        embeddingPort: runtime.embeddingPort,
        vectorSearchPort: runtime.vectorSearchPort,
      },
    );

    retrievedChunks = result.chunks.map(toRetrievedChunkState);
    usedFallback = result.usedFallback;
    retrievalStrategy = result.retrievalStrategy;
    embeddingTokensUsed = result.embeddingTokensUsed;

    if (runtime.runId) {
      await setWorkingMemory(runtime.runId, WORKING_MEMORY_SCOPE, {
        chunks: retrievedChunks,
        usedFallback,
        retrievalStrategy,
      } satisfies CachedRetrieval);
    }
  }

  if (runtime.onRetrieval) {
    await runtime.onRetrieval(retrievedChunks, usedFallback);
  }

  const stateUpdate: Partial<TutorAgentState> = {
    retrievedChunks,
    embeddingTokensUsed,
    retrievalStrategy,
    runSignals: {
      ...state.runSignals,
      usedFallback,
      retrievalStrategy,
      retrievalChunkCount: retrievedChunks.length,
    },
  };

  if (isAssessmentAdjacent(retrievedChunks)) {
    stateUpdate.executionPolicy = 'BUFFERED';
    stateUpdate.runSignals = {
      ...state.runSignals,
      assessmentAdjacentRetrieval: true,
    };
  }

  return stateUpdate;
}
