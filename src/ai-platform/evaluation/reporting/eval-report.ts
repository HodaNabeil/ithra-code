import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import type { EvalReport } from '../types';

export function writeEvaluationReport(
  report: EvalReport,
  outputDir = join(process.cwd(), 'eval/reports'),
): string {
  mkdirSync(outputDir, { recursive: true });
  const fileName = `${report.datasetName}-${report.generatedAt.replace(/[:.]/g, '-')}.json`;
  const filePath = join(outputDir, fileName);
  writeFileSync(filePath, JSON.stringify(report, null, 2));
  return filePath;
}

export function formatEvaluationMarkdown(report: EvalReport): string {
  return [
    `# Evaluation Report: ${report.datasetName}`,
    '',
    `- Agent: ${report.agentId}`,
    `- Status: ${report.status}`,
    `- Duration: ${report.durationMs}ms`,
    `- Evaluation method: ${report.usedFallback ? 'heuristic fallback (NOT real Ragas)' : 'ragas'}`,
    '',
    '## Metrics',
    `- Faithfulness: ${report.metrics.faithfulness.toFixed(3)} (threshold ${report.thresholds.faithfulness})`,
    `- Answer Relevancy: ${report.metrics.answerRelevancy.toFixed(3)} (threshold ${report.thresholds.answerRelevancy})`,
    `- Context Precision: ${report.metrics.contextPrecision.toFixed(3)} (threshold ${report.thresholds.contextPrecision})`,
    `- Context Recall: ${report.metrics.contextRecall.toFixed(3)} (threshold ${report.thresholds.contextRecall})`,
  ].join('\n');
}
