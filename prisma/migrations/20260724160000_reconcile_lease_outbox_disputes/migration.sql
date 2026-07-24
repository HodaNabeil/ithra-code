-- Split reconcile lease from schedule + ops indexes + outbox + disputes

ALTER TABLE "payments"
  ADD COLUMN "reconcile_lease_expires_at" TIMESTAMP(3);

CREATE INDEX "payments_reconcile_claim_idx"
  ON "payments" ("reconcile_status", "next_reconcile_at")
  WHERE "status" IN ('PENDING', 'PROCESSING')
    AND "reconcile_status" IN ('IDLE', 'SCHEDULED');

CREATE INDEX "payments_reconcile_lease_expires_at_idx"
  ON "payments" ("reconcile_lease_expires_at");

-- Time-range scans on attempt history (partitioning precursor)
CREATE INDEX "payment_reconcile_attempts_created_at_brin_idx"
  ON "payment_reconcile_attempts" USING BRIN ("created_at");

CREATE TYPE "PaymentDomainOutboxStatus" AS ENUM ('PENDING', 'PUBLISHED', 'FAILED');

CREATE TABLE "payment_domain_outbox" (
  "id" TEXT NOT NULL,
  "event_type" TEXT NOT NULL,
  "aggregate_id" TEXT NOT NULL,
  "payload" JSONB NOT NULL,
  "status" "PaymentDomainOutboxStatus" NOT NULL DEFAULT 'PENDING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "published_at" TIMESTAMP(3),
  CONSTRAINT "payment_domain_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_domain_outbox_status_created_at_idx"
  ON "payment_domain_outbox" ("status", "created_at");

CREATE TYPE "PaymentDisputeStatus" AS ENUM (
  'OPEN',
  'EVIDENCE_REQUIRED',
  'WON',
  'LOST',
  'CLOSED'
);

CREATE TABLE "payment_disputes" (
  "id" TEXT NOT NULL,
  "payment_id" TEXT NOT NULL,
  "status" "PaymentDisputeStatus" NOT NULL DEFAULT 'OPEN',
  "provider_dispute_id" TEXT,
  "amount_cents" INTEGER NOT NULL,
  "currency" "Currency" NOT NULL DEFAULT 'EGP',
  "reason" TEXT,
  "opened_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "resolved_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "payment_disputes_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "payment_disputes_payment_id_idx" ON "payment_disputes" ("payment_id");
CREATE INDEX "payment_disputes_status_idx" ON "payment_disputes" ("status");

ALTER TABLE "payment_disputes"
  ADD CONSTRAINT "payment_disputes_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments" ("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
