import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import type { PrismaClient } from '@/generated/prisma/client';
import { prisma as appPrisma } from '@/lib/prisma';

import type { EvalDataset, EvalReport, RagasThresholds } from '../types';
import { DEFAULT_RAGAS_THRESHOLDS } from '../types';
import { ensureEvalUser } from '../fixtures/eval-fixtures';
import { runRagasEvaluation } from '../ragas/ragas-runner';
import { enrichDatasetWithAgentOutput } from './tutor-agent-eval.runner';

const prisma = appPrisma as unknown as PrismaClient;

export function loadDataset(fileName: string): EvalDataset {
  const path = join(
    process.cwd(),
    'src/ai-platform/evaluation/datasets',
    fileName,
  );
  return JSON.parse(readFileSync(path, 'utf-8')) as EvalDataset;
}

export async function runOfflineEvaluation(params: {
  datasetFile: string;
  thresholds?: RagasThresholds;
}): Promise<EvalReport> {
  const loadedDataset = loadDataset(params.datasetFile);
  const thresholds = params.thresholds ?? DEFAULT_RAGAS_THRESHOLDS;

  const platformEnabled = process.env.AI_PLATFORM_ENABLED === 'true';
  const hasApiKey = Boolean(process.env.OPENAI_API_KEY);
  const willInvokeAgent =
    platformEnabled && hasApiKey && loadedDataset.agentId === 'tutor';

  if (willInvokeAgent) {
    await ensureEvalUser();
  }

  const enrichment =
    loadedDataset.agentId === 'tutor'
      ? await enrichDatasetWithAgentOutput(loadedDataset)
      : {
          dataset: loadedDataset,
          mustNotContainViolations: [],
          agentInvoked: false,
        };

  if (enrichment.mustNotContainViolations.length > 0) {
    const report: EvalReport = {
      datasetName: loadedDataset.name,
      agentId: loadedDataset.agentId,
      status: 'failed',
      metrics: {
        faithfulness: 0,
        answerRelevancy: 0,
        contextPrecision: 0,
        contextRecall: 0,
      },
      thresholds,
      perSample: enrichment.mustNotContainViolations.map((violation) => ({
        sampleId: violation.sampleId,
        metrics: {},
        passed: false,
      })),
      durationMs: 0,
      generatedAt: new Date().toISOString(),
      usedFallback: false,
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

  const result = await runRagasEvaluation(enrichment.dataset, thresholds);

  const report: EvalReport = {
    datasetName: enrichment.dataset.name,
    agentId: enrichment.dataset.agentId,
    status: result.passed ? 'passed' : 'failed',
    metrics: result.metrics,
    thresholds,
    perSample: result.perSample,
    durationMs: result.durationMs,
    generatedAt: new Date().toISOString(),
    usedFallback: result.usedFallback,
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
