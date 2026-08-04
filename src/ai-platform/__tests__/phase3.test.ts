import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { calculatorToolHandler } from '@/ai-platform/tools/builtin/calculator.tool';
import { detectSupervisorRoute } from '@/ai-platform/agents/evaluator/evaluator-agent.definition';
import {
  extractJsonFromText,
  validateStructuredOutput,
} from '@/ai-platform/structured-output/validator/output-validator';
import { evaluatorRubricV1Schema } from '@/ai-platform/structured-output/schemas/evaluator-rubric.v1';

describe('Phase 3 — calculator tool', () => {
  it('evaluates basic arithmetic', async () => {
    const result = await calculatorToolHandler({ expression: '(2 + 3) * 4' });
    assert.equal(result.result, 20);
  });

  it('rejects unsafe expressions', async () => {
    await assert.rejects(() => calculatorToolHandler({ expression: 'eval(1)' }));
  });
});

describe('Phase 3 — supervisor routing', () => {
  it('routes grading intent to evaluator', () => {
    assert.equal(detectSupervisorRoute('Please grade this assignment'), 'evaluator');
  });

  it('routes code review intent to code-reviewer', () => {
    assert.equal(detectSupervisorRoute('Can you code review my function?'), 'code-reviewer');
  });

  it('defaults to tutor', () => {
    assert.equal(detectSupervisorRoute('Explain recursion'), 'tutor');
  });
});

describe('Phase 3 — structured output validator', () => {
  it('extracts JSON from markdown fences', () => {
    const raw = 'Here is the result:\n```json\n{"schemaVersion":1,"overallGrade":"pass","scores":[],"feedback":"ok","confidence":0.9}\n```';
    const parsed = extractJsonFromText(raw);
    assert.ok(parsed);
    const validation = validateStructuredOutput(evaluatorRubricV1Schema, parsed);
    assert.equal(validation.valid, true);
  });
});
