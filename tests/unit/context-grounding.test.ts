import { describe, expect, it } from 'vitest';

import {
  buildGroundedRefusalResponse,
  evaluateContextGrounding,
} from '@/ai-platform/graph/nodes/guards/context-grounding';
import {
  groundingCheckNode,
  routeAfterGroundingCheck,
} from '@/ai-platform/graph/nodes/grounding-check.node';
import type { RetrievedChunkState } from '@/ai-platform/graph/state/tutor-agent.state';

const MIN_SCORE = 0.7;

function makeChunk(
  score: number,
  content = 'Angular component basics',
): RetrievedChunkState {
  return {
    id: `chunk-${score}`,
    content,
    score,
    metadata: { title: 'Test lecture' },
  };
}

describe('evaluateContextGrounding', () => {
  it('Test 1 — in-course question with strong retrieval allows generation', () => {
    const evaluation = evaluateContextGrounding({
      chunks: [makeChunk(0.82), makeChunk(0.75)],
      retrievalStrategy: 'strict',
      minScore: MIN_SCORE,
    });

    expect(evaluation.grounded).toBe(true);
    expect(evaluation.reason).toBe('SUFFICIENT_CONTEXT');
    expect(evaluation.chunkCount).toBe(2);
    expect(evaluation.topScore).toBeGreaterThanOrEqual(MIN_SCORE);
  });

  it('Test 2 — off-topic question with weak React-only chunks blocks generation', () => {
    const evaluation = evaluateContextGrounding({
      chunks: [
        makeChunk(0.35, 'Angular is different from React in many ways.'),
        makeChunk(0.32, 'React uses a virtual DOM.'),
        makeChunk(0.31, 'This course compares Angular and React.'),
      ],
      retrievalStrategy: 'lecture-relaxed',
      minScore: MIN_SCORE,
    });

    expect(evaluation.grounded).toBe(false);
    expect(evaluation.reason).toBe('LOW_RELEVANCE');
    expect(evaluation.chunkCount).toBe(3);
  });

  it('Test 3 — no retrieval blocks generation', () => {
    const evaluation = evaluateContextGrounding({
      chunks: [],
      retrievalStrategy: 'none',
      minScore: MIN_SCORE,
    });

    expect(evaluation.grounded).toBe(false);
    expect(evaluation.reason).toBe('INSUFFICIENT_CONTEXT');
    expect(evaluation.chunkCount).toBe(0);
  });

  it('Test 4 — chunks present but scores below threshold block generation', () => {
    const evaluation = evaluateContextGrounding({
      chunks: [makeChunk(0.55), makeChunk(0.52), makeChunk(0.48)],
      retrievalStrategy: 'strict',
      minScore: MIN_SCORE,
    });

    expect(evaluation.grounded).toBe(false);
    expect(evaluation.reason).toBe('LOW_RELEVANCE');
    expect(evaluation.chunkCount).toBe(3);
  });

  it('Test 5 — multi-chunk answer with good relevance allows generation', () => {
    const evaluation = evaluateContextGrounding({
      chunks: [
        makeChunk(0.88, 'Angular components are building blocks of apps.'),
        makeChunk(0.79, 'Each component has a template and class.'),
        makeChunk(0.74, 'Components communicate via inputs and outputs.'),
      ],
      retrievalStrategy: 'expanded',
      minScore: MIN_SCORE,
    });

    expect(evaluation.grounded).toBe(true);
    expect(evaluation.reason).toBe('SUFFICIENT_CONTEXT');
    expect(evaluation.chunkCount).toBe(3);
  });

  it('allows session-meta questions without course chunks', () => {
    const evaluation = evaluateContextGrounding({
      chunks: [],
      retrievalStrategy: 'none',
      minScore: MIN_SCORE,
      sessionMetaMode: true,
    });

    expect(evaluation.grounded).toBe(true);
    expect(evaluation.reason).toBe('SUFFICIENT_CONTEXT');
  });
});

describe('groundingCheckNode', () => {
  it('short-circuits to buffered refusal without calling the LLM path', async () => {
    const result = await groundingCheckNode(
      {
        agentId: 'tutor',
        userId: 'user-1',
        input: 'اشرح React Server Components',
        locale: 'ar',
        systemPrompt: '',
        conversationHistory: [],
        retrievedChunks: [makeChunk(0.35, 'Angular vs React comparison')],
        retrievalStrategy: 'lecture-relaxed',
        sanitizedInput: 'اشرح React Server Components',
        assessmentBlocked: false,
        groundingBlocked: false,
        outputValid: false,
        pendingToolCalls: [],
        toolResults: [],
        toolIterations: 0,
        executionPolicy: 'LIVE',
        finalResponse: '',
        tokensUsed: { input: 0, output: 0 },
        embeddingTokensUsed: 0,
        validationErrors: [],
        runSignals: {},
      },
      { configurable: {} },
    );

    expect(result.groundingBlocked).toBe(true);
    expect(result.executionPolicy).toBe('BUFFERED');
    expect(result.finalResponse).toBe(buildGroundedRefusalResponse('ar'));
    expect(result.runSignals?.grounded).toBe(false);
    expect(result.runSignals?.groundingReason).toBe('LOW_RELEVANCE');
  });

  it('routes to prepare-history when context is sufficient', async () => {
    const state = {
      groundingBlocked: false,
    };

    expect(routeAfterGroundingCheck(state)).toBe('prepare-history');
  });

  it('routes to validate-output when context is insufficient', async () => {
    const state = {
      groundingBlocked: true,
    };

    expect(routeAfterGroundingCheck(state)).toBe('validate-output');
  });

  it('does not set groundingBlocked when context is sufficient', async () => {
    const result = await groundingCheckNode(
      {
        agentId: 'tutor',
        userId: 'user-1',
        input: 'ما هو Angular Component؟',
        locale: 'ar',
        systemPrompt: '',
        conversationHistory: [],
        retrievedChunks: [makeChunk(0.85, 'Angular component definition')],
        retrievalStrategy: 'strict',
        sanitizedInput: 'ما هو Angular Component؟',
        assessmentBlocked: false,
        groundingBlocked: false,
        outputValid: false,
        pendingToolCalls: [],
        toolResults: [],
        toolIterations: 0,
        executionPolicy: 'LIVE',
        finalResponse: '',
        tokensUsed: { input: 0, output: 0 },
        embeddingTokensUsed: 0,
        validationErrors: [],
        runSignals: {},
      },
      { configurable: {} },
    );

    expect(result.groundingBlocked).toBe(false);
    expect(result.executionPolicy).toBeUndefined();
    expect(result.finalResponse).toBeUndefined();
    expect(result.runSignals?.grounded).toBe(true);
    expect(result.runSignals?.groundingReason).toBe('SUFFICIENT_CONTEXT');
  });
});

describe('buildGroundedRefusalResponse', () => {
  it('returns Arabic refusal message', () => {
    expect(buildGroundedRefusalResponse('ar')).toContain('محتوى الكورس الحالي');
  });
});
