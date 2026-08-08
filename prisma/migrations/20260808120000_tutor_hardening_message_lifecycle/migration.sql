-- Tutor message lifecycle + idempotent turn submission
CREATE TYPE "tutor_message_status" AS ENUM ('PENDING', 'COMPLETED', 'FAILED', 'CANCELLED');
CREATE TYPE "tutor_turn_idempotency_status" AS ENUM ('PROCESSING', 'COMPLETED', 'FAILED');

ALTER TABLE "tutor_messages"
  ADD COLUMN "status" "tutor_message_status" NOT NULL DEFAULT 'COMPLETED',
  ADD COLUMN "turn_id" TEXT;

CREATE INDEX "tutor_messages_turn_id_idx" ON "tutor_messages"("turn_id");

CREATE TABLE "tutor_turn_idempotency" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "idempotency_key" TEXT NOT NULL,
  "thread_id" TEXT NOT NULL,
  "turn_id" TEXT,
  "status" "tutor_turn_idempotency_status" NOT NULL DEFAULT 'PROCESSING',
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "tutor_turn_idempotency_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "tutor_turn_idempotency_user_id_idempotency_key_key"
  ON "tutor_turn_idempotency"("user_id", "idempotency_key");

CREATE INDEX "tutor_turn_idempotency_thread_id_idx"
  ON "tutor_turn_idempotency"("thread_id");
