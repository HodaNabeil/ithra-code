-- Partial unique index: one general thread (lecture_id IS NULL) per conversation
CREATE UNIQUE INDEX IF NOT EXISTS "tutor_threads_conversation_general_unique"
  ON "tutor_threads" ("conversation_id")
  WHERE "lecture_id" IS NULL;

-- Course indexing outbox for at-least-once enqueue
CREATE TYPE "course_indexing_outbox_status" AS ENUM ('PENDING', 'SENT', 'FAILED');

CREATE TABLE "course_indexing_outbox" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "course_slug" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "lecture_id" TEXT,
    "content_version" TEXT NOT NULL,
    "triggered_by_user_id" TEXT NOT NULL,
    "status" "course_indexing_outbox_status" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "last_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "course_indexing_outbox_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "course_indexing_outbox_status_created_at_idx" ON "course_indexing_outbox"("status", "created_at");
CREATE INDEX "course_indexing_outbox_course_id_idx" ON "course_indexing_outbox"("course_id");

ALTER TABLE "course_indexing_outbox" ADD CONSTRAINT "course_indexing_outbox_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
