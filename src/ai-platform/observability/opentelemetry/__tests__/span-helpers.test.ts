import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  isOtelActive,
  markOtelInitialized,
  withSpan,
  withSpanSync,
  wrapGraphNode,
} from '../span-helpers';

describe('span helpers', () => {
  it('runs without spans when OTEL is inactive', async () => {
    const result = await withSpan('test.span', { key: 'value' }, async () => 'ok');
    assert.equal(result, 'ok');
    assert.equal(isOtelActive(), false);
  });

  it('runs sync helper without spans when OTEL is inactive', () => {
    const result = withSpanSync('test.span', { key: 'value' }, () => 42);
    assert.equal(result, 42);
  });

  it('wraps graph nodes without throwing when OTEL is inactive', async () => {
    const node = wrapGraphNode('sanitize-input', async (state: { input: string }) => ({
      sanitizedInput: state.input.trim(),
    }));

    const result = await node({ input: ' hello ' }, {} as never);
    assert.deepEqual(result, { sanitizedInput: 'hello' });
  });

  it('marks OTEL initialized without enabling spans without config', () => {
    markOtelInitialized();
    assert.equal(isOtelActive(), false);
  });
});
