-- Add checkout fingerprint for pending-order reuse and invoices table for async fulfillment.

ALTER TABLE "orders" ADD COLUMN "checkout_fingerprint" TEXT;

CREATE INDEX "orders_user_id_status_checkout_fingerprint_idx"
  ON "orders"("user_id", "status", "checkout_fingerprint");

CREATE TABLE "invoices" (
  "id" TEXT NOT NULL,
  "order_id" TEXT NOT NULL,
  "invoice_number" TEXT NOT NULL,
  "storage_path" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "invoices_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "invoices_order_id_key" ON "invoices"("order_id");
CREATE UNIQUE INDEX "invoices_invoice_number_key" ON "invoices"("invoice_number");
CREATE INDEX "invoices_invoice_number_idx" ON "invoices"("invoice_number");

ALTER TABLE "invoices"
  ADD CONSTRAINT "invoices_order_id_fkey"
  FOREIGN KEY ("order_id") REFERENCES "orders"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
