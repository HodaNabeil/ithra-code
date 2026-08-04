export type EvalSample = {
  id: string;
  input: string;
  locale?: 'ar' | 'en';
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
};
