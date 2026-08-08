-- Backfill generic fields from Paymob columns before dropping them
UPDATE "payments"
SET
  "provider_transaction_id" = COALESCE("provider_transaction_id", "paymob_transaction_id"),
  "provider_metadata" = COALESCE("provider_metadata", '{}'::jsonb)
    || jsonb_strip_nulls(jsonb_build_object(
      'orderId', "paymob_order_id",
      'intentionId', "paymob_intention_id",
      'transactionId', "paymob_transaction_id"
    ))
WHERE "provider" = 'PAYMOB'
  AND (
    "paymob_transaction_id" IS NOT NULL
    OR "paymob_order_id" IS NOT NULL
    OR "paymob_intention_id" IS NOT NULL
  );

-- Drop old Paymob unique index and columns
DROP INDEX IF EXISTS "payments_paymob_transaction_id_key";

ALTER TABLE "payments" DROP COLUMN IF EXISTS "paymob_transaction_id",
  DROP COLUMN IF EXISTS "paymob_order_id",
  DROP COLUMN IF EXISTS "paymob_intention_id";

-- Add failure tracking columns
ALTER TABLE "payments" ADD COLUMN "failure_code" TEXT,
  ADD COLUMN "failure_message" TEXT;

-- Composite unique: provider + transaction ID (NULLs allowed for pending payments)
CREATE UNIQUE INDEX "payments_provider_provider_transaction_id_key"
  ON "payments"("provider", "provider_transaction_id");
