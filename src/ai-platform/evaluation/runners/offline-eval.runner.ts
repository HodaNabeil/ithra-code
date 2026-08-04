import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { PrismaClient } from '@/generated/prisma/client';
import { prisma as appPrisma } from '@/lib/prisma';

import type { EvalDataset, EvalReport, RagasThresholds } from '../types';
import { DEFAULT_RAGAS_THRESHOLDS } from '../types';
import { runRagasEvaluation } from '../ragas/ragas-runner';

const prisma = appPrisma as unknown as PrismaClient;

export function loadDataset(fileName: string): EvalDataset {
  const path = join(process.cwd(), 'src/ai-platform/evaluation/datasets', fileName);
  return JSON.parse(readFileSync(path, 'utf-8')) as EvalDataset;
}

export async function runOfflineEvaluation(params: {
  datasetFile: string;
  thresholds?: RagasThresholds;
}): Promise<EvalReport> {
  const dataset = loadDataset(params.datasetFile);
  const thresholds = params.thresholds ?? DEFAULT_RAGAS_THRESHOLDS;
  const result = await runRagasEvaluation(dataset, thresholds);

  const report: EvalReport = {
    datasetName: dataset.name,
    agentId: dataset.agentId,
    status: result.passed ? 'passed' : 'failed',
    metrics: result.metrics,
    thresholds,
    perSample: result.perSample,
    durationMs: result.durationMs,
    generatedAt: new Date().toISOString(),
  };

  await prisma.aiEvaluationRun.create({
    data: {
      datasetName: report.datasetName,
      agentId: report.agentId,
      status: report.status,
      metrics: report.metrics,
      thresholds: report.thresholds,
      durationMs: report.durationMs,
    },
  });

  return report;
}

export async function runNightlyEvaluationSuite(): Promise<EvalReport[]> {
  const datasets = ['tutor-golden.json', 'evaluator-golden.json'];
  const reports: EvalReport[] = [];

  for (const datasetFile of datasets) {
    reports.push(await runOfflineEvaluation({ datasetFile }));
  }

  return reports;
}
