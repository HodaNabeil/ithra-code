import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { runRagasEvaluation } from '../ragas/ragas-runner';
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
});
