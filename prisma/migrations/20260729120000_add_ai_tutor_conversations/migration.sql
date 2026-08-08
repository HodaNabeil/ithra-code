-- CreateEnum
CREATE TYPE "tutor_message_role" AS ENUM ('USER', 'ASSISTANT');

-- CreateTable
CREATE TABLE "tutor_conversations" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_threads" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "lecture_id" TEXT,
    "topic" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tutor_messages" (
    "id" TEXT NOT NULL,
    "thread_id" TEXT NOT NULL,
    "role" "tutor_message_role" NOT NULL,
    "content" TEXT NOT NULL,
    "retrieved_sources" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tutor_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tutor_conversations_user_id_idx" ON "tutor_conversations"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_conversations_course_id_user_id_key" ON "tutor_conversations"("course_id", "user_id");

-- CreateIndex
CREATE INDEX "tutor_threads_conversation_id_idx" ON "tutor_threads"("conversation_id");

-- CreateIndex
CREATE INDEX "tutor_threads_lecture_id_idx" ON "tutor_threads"("lecture_id");

-- CreateIndex
CREATE UNIQUE INDEX "tutor_threads_conversation_id_lecture_id_key" ON "tutor_threads"("conversation_id", "lecture_id");

-- CreateIndex
CREATE INDEX "tutor_messages_thread_id_created_at_idx" ON "tutor_messages"("thread_id", "created_at");

-- AddForeignKey
ALTER TABLE "tutor_conversations" ADD CONSTRAINT "tutor_conversations_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_conversations" ADD CONSTRAINT "tutor_conversations_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_threads" ADD CONSTRAINT "tutor_threads_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "tutor_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_threads" ADD CONSTRAINT "tutor_threads_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tutor_messages" ADD CONSTRAINT "tutor_messages_thread_id_fkey" FOREIGN KEY ("thread_id") REFERENCES "tutor_threads"("id") ON DELETE CASCADE ON UPDATE CASCADE;
