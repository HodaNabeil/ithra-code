import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { jsonSchemaToZodObject } from '../json-schema-to-zod';

describe('jsonSchemaToZodObject', () => {
  it('builds an object schema enforcing required fields and types', () => {
    const schema = jsonSchemaToZodObject({
      type: 'object',
      properties: {
        query: { type: 'string' },
        topK: { type: 'integer' },
        active: { type: 'boolean' },
      },
      required: ['query'],
    });

    assert.equal(schema.safeParse({ query: 'react' }).success, true);
    assert.equal(schema.safeParse({ topK: 5 }).success, false);
    assert.equal(schema.safeParse({ query: 'react', topK: 'nope' }).success, false);
    assert.equal(schema.safeParse({ query: 'react', active: true }).success, true);
  });

  it('supports enum and array item types', () => {
    const schema = jsonSchemaToZodObject({
      type: 'object',
      properties: {
        mode: { type: 'string', enum: ['fast', 'slow'] },
        tags: { type: 'array', items: { type: 'string' } },
      },
      required: ['mode'],
    });

    assert.equal(schema.safeParse({ mode: 'fast', tags: ['a', 'b'] }).success, true);
    assert.equal(schema.safeParse({ mode: 'medium' }).success, false);
  });

  it('falls back to a permissive record schema when no schema is provided', () => {
    const schema = jsonSchemaToZodObject(undefined);
    assert.equal(schema.safeParse({ anything: 'goes' }).success, true);
  });
});
