import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { TutorAgentState } from '../../state/tutor-agent.state';
import { integrityCheckNode, routeAfterIntegrityCheck } from '../integrity-check.node';

function baseState(overrides: Partial<TutorAgentState> = {}): TutorAgentState {
  return {
    agentId: 'tutor',
    userId: 'user-1',
    input: 'What are loops?',
    locale: 'en',
    systemPrompt: 'system',
    conversationHistory: [],
    retrievedChunks: [],
    sanitizedInput: 'What are loops?',
    assessmentBlocked: false,
    finalResponse: '',
    outputValid: false,
    validationErrors: [],
    tokensUsed: { input: 0, output: 0 },
    pendingToolCalls: [],
    toolResults: [],
    toolIterations: 0,
    ...overrides,
  };
}

const noopConfig = {} as LangGraphRunnableConfig;

describe('integrity-check.node', () => {
  it('passes through non-assessment questions', async () => {
    const result = await integrityCheckNode(baseState(), noopConfig);
    assert.equal(result.assessmentBlocked, false);
    assert.equal(result.finalResponse, undefined);
    assert.equal(routeAfterIntegrityCheck({ assessmentBlocked: false }), 'retrieve-context');
  });

  it('short-circuits with a guided-learning response for assessment-seeking questions', async () => {
    const result = await integrityCheckNode(
      baseState({ sanitizedInput: 'Give me the answer to quiz question 3' }),
      noopConfig,
    );

    assert.equal(result.assessmentBlocked, true);
    assert.ok(result.finalResponse && result.finalResponse.length > 0);
    assert.equal(routeAfterIntegrityCheck({ assessmentBlocked: true }), 'validate-output');
  });

  it('detects Arabic assessment-seeking questions', async () => {
    const result = await integrityCheckNode(
      baseState({ sanitizedInput: 'أعطني الإجابة الصحيحة لسؤال الاختبار' }),
      noopConfig,
    );

    assert.equal(result.assessmentBlocked, true);
  });
});
