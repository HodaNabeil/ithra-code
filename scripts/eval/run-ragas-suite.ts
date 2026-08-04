import { runNightlyEvaluationSuite } from '@/ai-platform/evaluation/runners/offline-eval.runner';
import {
  formatEvaluationMarkdown,
  writeEvaluationReport,
} from '@/ai-platform/evaluation/reporting/eval-report';

async function main(): Promise<void> {
  const reports = await runNightlyEvaluationSuite();

  for (const report of reports) {
    const path = writeEvaluationReport(report);
    console.log(formatEvaluationMarkdown(report));
    console.log(`[eval] report written to ${path}`);
  }

  const failed = reports.filter((report) => report.status === 'failed');
  if (failed.length > 0) {
    console.error(`[eval] FAIL — ${failed.length} dataset(s) below threshold`);
    process.exit(1);
  }

  console.log('[eval] PASS — all datasets met thresholds');
}

void main();
