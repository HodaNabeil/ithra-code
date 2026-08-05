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
  const fellBack = reports.filter((report) => report.usedFallback);

  // In CI, a fallback result means the real `ragas` package didn't run at
  // all — never treat placeholder heuristic metrics as a passing evaluation
  // there, even if they happen to clear the thresholds.
  if (process.env.CI && fellBack.length > 0) {
    console.error(
      `[eval] FAIL — ${fellBack.length} dataset(s) used the heuristic fallback instead of ` +
        'real Ragas in CI. Check that eval/requirements.txt installed correctly.',
    );
    process.exit(1);
  }

  if (failed.length > 0) {
    console.error(`[eval] FAIL — ${failed.length} dataset(s) below threshold`);
    process.exit(1);
  }

  if (fellBack.length > 0) {
    console.warn(
      `[eval] WARNING — ${fellBack.length} dataset(s) used the heuristic fallback (not real Ragas)`,
    );
  }

  console.log('[eval] PASS — all datasets met thresholds');
}

void main();
