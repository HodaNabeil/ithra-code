import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { TutorAgentState } from '../../state/tutor-agent.state';
import { validateOutputNode } from '../validate-output.node';

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

describe('validate-output.node', () => {
  it('marks empty responses invalid', async () => {
    const result = await validateOutputNode(baseState({ finalResponse: '   ' }), noopConfig);
    assert.equal(result.outputValid, false);
    assert.ok(result.validationErrors?.includes('empty_response'));
  });

  it('accepts a normal response', async () => {
    const result = await validateOutputNode(
      baseState({ finalResponse: 'A loop repeats code.' }),
      noopConfig,
    );
    assert.equal(result.outputValid, true);
    assert.deepEqual(result.validationErrors, []);
  });

  it('replaces a leaked direct answer with a guided-learning response, but keeps the turn valid', async () => {
    const result = await validateOutputNode(
      baseState({ finalResponse: 'The correct answer is option B.' }),
      noopConfig,
    );

    assert.ok(result.validationErrors?.includes('assessment_leak'));
    assert.doesNotMatch(result.finalResponse ?? '', /correct answer is option B/i);
    assert.equal(result.outputValid, true);
  });

  it('does not run leak detection on already-blocked assessment responses', async () => {
    const guided = 'guided learning response text';
    const result = await validateOutputNode(
      baseState({ finalResponse: guided, assessmentBlocked: true }),
      noopConfig,
    );

    assert.equal(result.finalResponse, guided);
    assert.deepEqual(result.validationErrors, []);
  });
});
