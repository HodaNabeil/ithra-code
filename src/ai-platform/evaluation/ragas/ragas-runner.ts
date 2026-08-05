import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

import type { EvalDataset, RagasResult, RagasThresholds } from '../types';
import { DEFAULT_RAGAS_THRESHOLDS } from '../types';

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function tokenize(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^\p{L}\p{N}]+/u)
      .filter((token) => token.length > 1),
  );
}

/** Fraction of `needle`'s tokens that also appear in `haystack`. */
function overlapRatio(needle: Set<string>, haystack: Set<string>): number {
  if (needle.size === 0) {
    return 0;
  }
  let hits = 0;
  for (const token of needle) {
    if (haystack.has(token)) {
      hits += 1;
    }
  }
  return hits / needle.size;
}

/**
 * Lightweight, non-LLM approximation of the four Ragas metrics using lexical
 * token overlap between the sample's context/answer/ground-truth fields.
 * This is a *heuristic fallback* used only when the real `ragas` Python
 * package isn't available — it is intentionally never reported as if it were
 * a real Ragas evaluation (see `usedFallback` on the result).
 */
export function computeHeuristicMetrics(dataset: EvalDataset): RagasResult {
  const perSample = dataset.samples.map((sample) => {
    const contextText = sample.retrievedContext?.join(' ') ?? '';
    const contextTokens = tokenize(contextText);
    const groundTruthTokens = tokenize(sample.groundTruth ?? '');
    const topicTokens = tokenize((sample.expectedTopics ?? []).join(' '));
    const inputTokens = tokenize(sample.input);

    // Faithfulness: how much of the (simulated) answer — approximated here by
    // ground truth — is grounded in retrieved context tokens.
    const faithfulness =
      groundTruthTokens.size > 0 && contextTokens.size > 0
        ? overlapRatio(groundTruthTokens, contextTokens)
        : contextTokens.size > 0
          ? 0.5
          : 0.2;

    // Answer relevancy: overlap between expected topics and the question.
    const answerRelevancy =
      topicTokens.size > 0 ? Math.min(1, overlapRatio(topicTokens, inputTokens) + 0.5) : 0.5;

    // Context precision: fraction of context tokens relevant to the question.
    const contextPrecision =
      contextTokens.size > 0 ? overlapRatio(inputTokens, contextTokens) : 0.3;

    // Context recall: how much of the ground truth is covered by context.
    const contextRecall =
      groundTruthTokens.size > 0 && contextTokens.size > 0
        ? overlapRatio(groundTruthTokens, contextTokens)
        : contextTokens.size > 0
          ? 0.4
          : 0.2;

    return {
      sampleId: sample.id,
      metrics: {
        faithfulness,
        answerRelevancy,
        contextPrecision,
        contextRecall,
      },
      passed: true,
    };
  });

  const metrics = {
    faithfulness: average(perSample.map((s) => s.metrics.faithfulness ?? 0)),
    answerRelevancy: average(perSample.map((s) => s.metrics.answerRelevancy ?? 0)),
    contextPrecision: average(perSample.map((s) => s.metrics.contextPrecision ?? 0)),
    contextRecall: average(perSample.map((s) => s.metrics.contextRecall ?? 0)),
  };

  return {
    metrics,
    perSample,
    durationMs: 0,
    passed: true,
    usedFallback: true,
  };
}

async function runPythonRagas(
  dataset: EvalDataset,
  outputDir: string,
): Promise<RagasResult | null> {
  const datasetPath = join(outputDir, 'dataset.json');
  const outputPath = join(outputDir, 'results.json');
  const scriptPath = join(process.cwd(), 'eval/ragas_eval.py');

  if (!existsSync(scriptPath)) {
    console.warn(
      `[ragas] eval/ragas_eval.py not found at ${scriptPath} — falling back to the ` +
        'local heuristic evaluator. Results will NOT reflect real Ragas metrics.',
    );
    return null;
  }

  writeFileSync(datasetPath, JSON.stringify(dataset, null, 2));

  return new Promise((resolve) => {
    const child = spawn('python3', [scriptPath, datasetPath, outputPath], {
      stdio: 'inherit',
    });

    child.on('error', (error) => {
      console.warn(
        `[ragas] failed to spawn python3 (${error.message}) — falling back to the ` +
          'local heuristic evaluator. Results will NOT reflect real Ragas metrics.',
      );
      resolve(null);
    });

    child.on('close', (code) => {
      if (code !== 0 || !existsSync(outputPath)) {
        console.warn(
          `[ragas] eval/ragas_eval.py exited with code ${code} — falling back to the ` +
            'local heuristic evaluator. Results will NOT reflect real Ragas metrics.',
        );
        resolve(null);
        return;
      }

      try {
        const parsed = JSON.parse(readFileSync(outputPath, 'utf-8')) as RagasResult;
        if (parsed.usedFallback) {
          console.warn(
            '[ragas] eval/ragas_eval.py reported it could not import the `ragas` package ' +
              'and used its own placeholder metrics — install eval/requirements.txt for a ' +
              'real evaluation.',
          );
        }
        resolve(parsed);
      } catch {
        console.warn(
          '[ragas] failed to parse eval/ragas_eval.py output — falling back to the local ' +
            'heuristic evaluator. Results will NOT reflect real Ragas metrics.',
        );
        resolve(null);
      }
    });
  });
}

export async function runRagasEvaluation(
  dataset: EvalDataset,
  thresholds: RagasThresholds = DEFAULT_RAGAS_THRESHOLDS,
): Promise<RagasResult> {
  const startedAt = Date.now();
  const outputDir = join(tmpdir(), `ragas-eval-${Date.now()}`);
  mkdirSync(outputDir, { recursive: true });

  const pythonResult = await runPythonRagas(dataset, outputDir);
  const result = pythonResult ?? computeHeuristicMetrics(dataset);
  result.durationMs = Date.now() - startedAt;

  result.passed =
    result.metrics.faithfulness >= thresholds.faithfulness &&
    result.metrics.answerRelevancy >= thresholds.answerRelevancy &&
    result.metrics.contextPrecision >= thresholds.contextPrecision &&
    result.metrics.contextRecall >= thresholds.contextRecall;

  return result;
}
