import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  extractGraphInjectionPorts,
  extractRunMetadata,
} from '../graph-port-extractor';
import type { ResponseProcessorPort } from '../../../domain/ports/response-processor.port';
import { readExecutionPolicy } from '../../../graph/state/shared-channels';

describe('graph-port-extractor', () => {
  it('wraps legacy contentValidator as responseProcessor', async () => {
    const processor = extractGraphInjectionPorts({
      contentValidator: {
        async validateResponse() {
          return { isValid: false, suggestedResponse: 'guided' };
        },
      },
    }).responseProcessor;

    assert.ok(processor);
    const result = await processor!.process('leak', { question: 'q' });
    assert.equal(result.disposition, 'replaced');
    assert.equal(result.output, 'guided');
  });

  it('prefers explicit responseProcessor over legacy validator', () => {
    const explicit: ResponseProcessorPort = {
      async process(response) {
        return { output: response, disposition: 'unchanged' };
      },
    };

    const ports = extractGraphInjectionPorts({
      responseProcessor: explicit,
      contentValidator: {
        async validateResponse() {
          return { isValid: false, suggestedResponse: 'legacy' };
        },
      },
    });

    assert.equal(ports.responseProcessor, explicit);
  });

  it('extracts opaque run metadata from graph state', () => {
    const metadata = extractRunMetadata({
      assessmentBlocked: true,
      runSignals: { custom: true },
      validationErrors: ['content_filter'],
    });

    assert.deepEqual(metadata, {
      custom: true,
      assessmentBlocked: true,
      filterTriggered: true,
    });
  });
});

describe('readExecutionPolicy', () => {
  it('defaults to LIVE when policy is absent', () => {
    assert.equal(readExecutionPolicy({}), 'LIVE');
  });

  it('reads BUFFERED from state', () => {
    assert.equal(readExecutionPolicy({ executionPolicy: 'BUFFERED' }), 'BUFFERED');
  });
});
