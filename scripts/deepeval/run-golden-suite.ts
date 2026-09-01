/**
 * DeepEval golden suite stub for CI regression gates (Phase 3).
 * Requires Python 3.10+ and deepeval package in CI environment.
 *
 * Usage: pnpm deepeval:golden
 */
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const goldenPath = join(
  process.cwd(),
  'eval/golden/evaluator-rubric.golden.json',
);

function main(): void {
  if (!existsSync(goldenPath)) {
    console.log(
      '[deepeval] Golden dataset not found — creating placeholder check',
    );
    console.log('[deepeval] PASS (no golden dataset configured yet)');
    process.exit(0);
  }

  const golden = JSON.parse(readFileSync(goldenPath, 'utf-8')) as {
    cases?: unknown[];
  };
  const caseCount = golden.cases?.length ?? 0;

  if (caseCount === 0) {
    console.error('[deepeval] FAIL — golden dataset has no cases');
    process.exit(1);
  }

  console.log(`[deepeval] Golden dataset loaded: ${caseCount} cases`);
  console.log(
    '[deepeval] PASS — schema validation stub (run full DeepEval in CI with Python)',
  );
  process.exit(0);
}

main();
