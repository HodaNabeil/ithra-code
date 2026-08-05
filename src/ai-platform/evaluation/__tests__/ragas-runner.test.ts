import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { computeHeuristicMetrics, runRagasEvaluation } from '../ragas/ragas-runner';
import type { EvalDataset } from '../types';

describe('ragas runner', () => {
  it('loads tutor golden dataset', () => {
    const path = join(
      process.cwd(),
      'src/ai-platform/evaluation/datasets/tutor-golden.json',
    );
    const dataset = JSON.parse(readFileSync(path, 'utf-8')) as EvalDataset;
    assert.ok(dataset.samples.length > 0);
  });

  it('runs heuristic evaluation when python is unavailable', async () => {
    const dataset: EvalDataset = {
      name: 'smoke',
      agentId: 'tutor',
      samples: [
        {
          id: 's1',
          input: 'test',
          retrievedContext: ['context'],
          expectedTopics: ['topic'],
        },
      ],
    };

    const result = await runRagasEvaluation(dataset, {
      faithfulness: 0.5,
      answerRelevancy: 0.5,
      contextPrecision: 0.5,
      contextRecall: 0.5,
    });

    assert.equal(result.passed, true);
    assert.ok(result.metrics.faithfulness > 0);
  });

  it('flags heuristic-fallback results so callers never mistake them for real Ragas', async () => {
    const dataset: EvalDataset = {
      name: 'smoke',
      agentId: 'tutor',
      samples: [
        {
          id: 's1',
          input: 'What is a variable?',
          retrievedContext: ['A variable stores a value in a program.'],
          groundTruth: 'A variable stores a value.',
          expectedTopics: ['storage', 'value'],
        },
      ],
    };

    const result = await runRagasEvaluation(dataset);

    assert.equal(result.usedFallback, true);
  });

  it('produces lower faithfulness/context-recall scores for samples with unrelated context', () => {
    const dataset: EvalDataset = {
      name: 'smoke',
      agentId: 'tutor',
      samples: [
        {
          id: 'grounded',
          input: 'What is a variable?',
          retrievedContext: ['A variable stores a value in a program.'],
          groundTruth: 'A variable stores a value.',
        },
        {
          id: 'ungrounded',
          input: 'What is a variable?',
          retrievedContext: ['Bananas are a good source of potassium.'],
          groundTruth: 'A variable stores a value.',
        },
      ],
    };

    const result = computeHeuristicMetrics(dataset);
    const grounded = result.perSample.find((sample) => sample.sampleId === 'grounded');
    const ungrounded = result.perSample.find((sample) => sample.sampleId === 'ungrounded');

    assert.ok(grounded && ungrounded);
    assert.ok((grounded!.metrics.faithfulness ?? 0) > (ungrounded!.metrics.faithfulness ?? 0));
    assert.equal(result.usedFallback, true);
  });
});
