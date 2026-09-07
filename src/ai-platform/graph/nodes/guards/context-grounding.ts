import type { RetrievalStrategy } from '../../../rag/retrieval/types';
import type { RetrievedChunkState } from '../../state/tutor-agent.state';

export type GroundingReason =
  | 'SUFFICIENT_CONTEXT'
  | 'INSUFFICIENT_CONTEXT'
  | 'LOW_RELEVANCE';

export interface ContextGroundingEvaluation {
  grounded: boolean;
  reason: GroundingReason;
  topScore: number;
  chunkCount: number;
  retrievalStrategy: RetrievalStrategy;
}

export function evaluateContextGrounding(params: {
  chunks: RetrievedChunkState[];
  retrievalStrategy: RetrievalStrategy;
  minScore: number;
  sessionMetaMode?: boolean;
}): ContextGroundingEvaluation {
  const { chunks, retrievalStrategy, minScore, sessionMetaMode } = params;
  const chunkCount = chunks.length;
  const topScore =
    chunkCount > 0 ? Math.max(...chunks.map((chunk) => chunk.score)) : 0;

  if (sessionMetaMode) {
    return {
      grounded: true,
      reason: 'SUFFICIENT_CONTEXT',
      topScore,
      chunkCount,
      retrievalStrategy,
    };
  }

  if (chunkCount === 0 || retrievalStrategy === 'none') {
    return {
      grounded: false,
      reason: 'INSUFFICIENT_CONTEXT',
      topScore,
      chunkCount,
      retrievalStrategy,
    };
  }

  // `lecture-relaxed` chunks were already filtered by the retriever's own
  // fallback threshold and are scoped to the current lecture, so we accept
  // them here and let the LLM (with its "answer strictly from context"
  // instruction) decide whether it can help. Rejecting them here made the
  // whole relaxed-retrieval path dead code and caused false refusals.
  if (retrievalStrategy === 'lecture-relaxed') {
    return {
      grounded: true,
      reason: 'SUFFICIENT_CONTEXT',
      topScore,
      chunkCount,
      retrievalStrategy,
    };
  }

  if (topScore < minScore) {
    return {
      grounded: false,
      reason: 'LOW_RELEVANCE',
      topScore,
      chunkCount,
      retrievalStrategy,
    };
  }

  return {
    grounded: true,
    reason: 'SUFFICIENT_CONTEXT',
    topScore,
    chunkCount,
    retrievalStrategy,
  };
}

export function buildGroundedRefusalResponse(locale: 'ar' | 'en'): string {
  if (locale === 'ar') {
    return 'المعلومة دي مش موجودة في محتوى الكورس الحالي، ومقدرش أجاوب عليها من خارج محتوى الكورس. جرّب تسأل سؤالاً مرتبطاً بالمحاضرة أو مواد الدورة الحالية.';
  }

  return "This information isn't in the current course content, and I can't answer from outside the course. Try asking a question related to the current lecture or course materials.";
}
