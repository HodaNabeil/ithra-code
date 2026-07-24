/**
 * Ops report: reconciliation summary for ledger / PSP alignment.
 *
 * Usage: pnpm payment:reconcile-report [--since=YYYY-MM-DD]
 */
import 'dotenv/config';
import { prisma } from '@/lib/prisma';

function parseSinceArg(): Date {
  const arg = process.argv.find((value) => value.startsWith('--since='));
  if (!arg) {
    const d = new Date();
    d.setUTCDate(d.getUTCDate() - 7);
    return d;
  }

  const value = arg.split('=')[1];
  const parsed = new Date(value ?? '');
  if (Number.isNaN(parsed.getTime())) {
    throw new Error(`Invalid --since date: ${value}`);
  }

  return parsed;
}

async function main(): Promise<void> {
  const since = parseSinceArg();

  const [attempts, manualReview, settled, failed] = await Promise.all([
    prisma.paymentReconcileAttempt.groupBy({
      by: ['outcome'],
      _count: { _all: true },
      where: { createdAt: { gte: since } },
    }),
    prisma.payment.count({ where: { reconcileStatus: 'MANUAL_REVIEW' } }),
    prisma.payment.count({
      where: {
        status: 'SUCCEEDED',
        paidAt: { gte: since },
      },
    }),
    prisma.payment.count({
      where: {
        status: 'FAILED',
        updatedAt: { gte: since },
      },
    }),
  ]);

  const report = {
    generatedAt: new Date().toISOString(),
    since: since.toISOString(),
    reconcileAttemptsByOutcome: Object.fromEntries(
      attempts.map((row) => [row.outcome, row._count._all]),
    ),
    paymentsSettledSince: settled,
    paymentsFailedSince: failed,
    manualReviewQueueDepth: manualReview,
  };

  console.log(JSON.stringify(report, null, 2));
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
