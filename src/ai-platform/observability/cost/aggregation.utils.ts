export type UsageSlice = {
  runs: number;
  inputTokens: number;
  outputTokens: number;
  costUsd: number;
};

export type UsageBreakdowns = {
  byProvider: Record<string, UsageSlice>;
  byModel: Record<string, UsageSlice>;
  byAgent: Record<string, UsageSlice>;
};

export function addSlice(
  map: Record<string, UsageSlice>,
  key: string,
  run: {
    inputTokens: number | null;
    outputTokens: number | null;
    estimatedCostUsd: unknown;
  },
): void {
  const existing = map[key] ?? {
    runs: 0,
    inputTokens: 0,
    outputTokens: 0,
    costUsd: 0,
  };
  existing.runs += 1;
  existing.inputTokens += run.inputTokens ?? 0;
  existing.outputTokens += run.outputTokens ?? 0;
  existing.costUsd += Number(run.estimatedCostUsd ?? 0);
  map[key] = existing;
}
