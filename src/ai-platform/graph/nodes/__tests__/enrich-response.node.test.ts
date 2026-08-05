import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { LangGraphRunnableConfig } from '@langchain/langgraph';

import type { TutorAgentState } from '../../state/tutor-agent.state';
import { enrichResponseNode } from '../enrich-response.node';
import type { ResponseEnricherPort } from '../../../domain/ports/response-enricher.port';

function baseState(overrides: Partial<TutorAgentState> = {}): TutorAgentState {
  return {
    agentId: 'tutor',
    userId: 'user-1',
    input: 'Give me the answer',
    locale: 'en',
    systemPrompt: 'system',
    conversationHistory: [],
    retrievedChunks: [],
    sanitizedInput: 'Give me the answer',
    assessmentBlocked: true,
    executionPolicy: 'BUFFERED',
    finalResponse: 'Guided learning response',
    outputValid: true,
    validationErrors: [],
    runSignals: {},
    tokensUsed: { input: 0, output: 0 },
    pendingToolCalls: [],
    toolResults: [],
    toolIterations: 0,
    ...overrides,
  };
}

describe('enrich-response.node', () => {
  it('appends enricher output for assessment-blocked responses', async () => {
    const enricher: ResponseEnricherPort = {
      async enrich(response) {
        return `${response}\n\nSuggested lectures`;
      },
    };

    const result = await enrichResponseNode(
      baseState(),
      {
        configurable: {
          llmPort: {} as never,
          responseEnricher: enricher,
        },
      } as LangGraphRunnableConfig,
    );

    assert.equal(result.finalResponse, 'Guided learning response\n\nSuggested lectures');
  });

  it('skips enrichment when assessment was not blocked', async () => {
    const result = await enrichResponseNode(
      baseState({ assessmentBlocked: false }),
      {
        configurable: {
          llmPort: {} as never,
          responseEnricher: {
            async enrich() {
              return 'should not run';
            },
          },
        },
      } as LangGraphRunnableConfig,
    );

    assert.deepEqual(result, {});
  });
});
