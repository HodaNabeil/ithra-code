-- Payment reconcile control plane + attempt history
CREATE TYPE "PaymentReconcileStatus" AS ENUM ('IDLE', 'SCHEDULED', 'EXHAUSTED', 'MANUAL_REVIEW');

ALTER TABLE "payments"
  ADD COLUMN "reconcile_status" "PaymentReconcileStatus" NOT NULL DEFAULT 'IDLE',
  ADD COLUMN "reconcile_attempt_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "consecutive_not_found_count" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "next_reconcile_at" TIMESTAMP(3),
  ADD COLUMN "last_reconciled_at" TIMESTAMP(3),
  ADD COLUMN "last_provider_outcome" TEXT,
  ADD COLUMN "last_provider_detail" TEXT;

CREATE INDEX "payments_next_reconcile_at_idx" ON "payments"("next_reconcile_at");
CREATE INDEX "payments_reconcile_status_idx" ON "payments"("reconcile_status");

-- Backfill: schedule existing non-terminal payments for reconcile
UPDATE "payments"
SET
  "reconcile_status" = 'SCHEDULED',
  "next_reconcile_at" = COALESCE("updated_at", "created_at") + INTERVAL '30 minutes'
WHERE "status" IN ('PENDING', 'PROCESSING')
  AND "next_reconcile_at" IS NULL;

CREATE TABLE "payment_reconcile_attempts" (
  "id" TEXT NOT NULL,
  "payment_id" TEXT NOT NULL,
  "attempt" INTEGER NOT NULL,
  "outcome" TEXT NOT NULL,
  "decision" TEXT,
  "http_status" INTEGER,
  "detail" TEXT,
  "latency_ms" INTEGER,
  "correlation_id" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "payment_reconcile_attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_reconcile_attempts_payment_id_idx" ON "payment_reconcile_attempts"("payment_id");
CREATE INDEX "payment_reconcile_attempts_created_at_idx" ON "payment_reconcile_attempts"("created_at");

ALTER TABLE "payment_reconcile_attempts"
  ADD CONSTRAINT "payment_reconcile_attempts_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
