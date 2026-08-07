export type EvalSample = {
  id: string;
  input: string;
  locale?: 'ar' | 'en';
  courseId?: string;
  answer?: string;
  expectedTopics?: string[];
  retrievedContext?: string[];
  groundTruth?: string;
  mustNotContain?: string[];
};

export type EvalDataset = {
  name: string;
  agentId: string;
  samples: EvalSample[];
};

export type RagasMetrics = {
  faithfulness: number;
  answerRelevancy: number;
  contextPrecision: number;
  contextRecall: number;
};

export type RagasThresholds = RagasMetrics;

export const DEFAULT_RAGAS_THRESHOLDS: RagasThresholds = {
  faithfulness: 0.85,
  answerRelevancy: 0.8,
  contextPrecision: 0.75,
  contextRecall: 0.7,
};

export type RagasSampleResult = {
  sampleId: string;
  metrics: Partial<RagasMetrics>;
  passed: boolean;
};

export type RagasResult = {
  metrics: RagasMetrics;
  perSample: RagasSampleResult[];
  durationMs: number;
  passed: boolean;
  /**
   * True when real Ragas (via `eval/ragas_eval.py`) could not run — e.g. the
   * `ragas` Python package isn't installed — and metrics were instead
   * computed by the local lexical-overlap heuristic. Threshold checks still
   * apply, but a fallback result should never be silently treated as a real
   * Ragas evaluation in CI.
   */
  usedFallback: boolean;
};

export type EvalReport = {
  datasetName: string;
  agentId: string;
  status: 'passed' | 'failed';
  metrics: RagasMetrics;
  thresholds: RagasThresholds;
  perSample: RagasSampleResult[];
  durationMs: number;
  generatedAt: string;
  usedFallback: boolean;
};
