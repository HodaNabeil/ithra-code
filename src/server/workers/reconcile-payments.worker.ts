import 'dotenv/config';
import { env } from '@/config';
import { logger } from '@/lib/logger';
import { createReconcilePaymentsUseCase } from '@/features/payments/infrastructure/di/payments.container';

const intervalMs = env.PAYMENT_RECONCILE_INTERVAL_MS;
const shutdownGraceMs = env.PAYMENT_RECONCILE_SHUTDOWN_GRACE_MS;

let running = false;
let inFlight: Promise<void> | null = null;
let shuttingDown = false;

async function runReconciliation(): Promise<void> {
  if (running) {
    logger.warn(
      '[PAYMENT_RECONCILE_WORKER_SKIPPED] Previous batch still running',
    );
    return;
  }

  running = true;
  const batch = (async () => {
    const useCase = createReconcilePaymentsUseCase();
    await useCase.execute();
  })();

  inFlight = batch;

  try {
    await batch;
  } catch (error) {
    logger.error({ error }, '[PAYMENT_RECONCILE_WORKER_ERROR]');
  } finally {
    running = false;
    if (inFlight === batch) {
      inFlight = null;
    }
  }
}

async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info({ signal }, '[PAYMENT_RECONCILE_WORKER_SHUTTING_DOWN]');
  clearInterval(timer);

  if (inFlight) {
    await Promise.race([
      inFlight,
      new Promise((resolve) => setTimeout(resolve, shutdownGraceMs)),
    ]);
  }

  process.exit(0);
}

logger.info(
  { intervalMs, shutdownGraceMs },
  '[PAYMENT_RECONCILE_WORKER_STARTED]',
);

void runReconciliation();

const timer = setInterval(() => {
  if (!shuttingDown) {
    void runReconciliation();
  }
}, intervalMs);

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});
