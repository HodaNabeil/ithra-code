-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- CreateEnum
CREATE TYPE "knowledge_content_type" AS ENUM ('COURSE_OVERVIEW', 'LECTURE_DESCRIPTION', 'LECTURE_CONTENT', 'TRANSCRIPT', 'ATTACHMENT');

-- CreateEnum
CREATE TYPE "knowledge_sensitivity" AS ENUM ('PUBLIC', 'ASSESSMENT', 'INSTRUCTOR');

-- AlterTable
ALTER TABLE "courses" ADD COLUMN "knowledge_indexed_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "lecture_transcripts" (
    "id" TEXT NOT NULL,
    "lecture_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "language" TEXT NOT NULL DEFAULT 'ar',
    "source" TEXT NOT NULL DEFAULT 'manual',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lecture_transcripts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "knowledge_chunks" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "section_id" TEXT,
    "lecture_id" TEXT,
    "source_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "content_type" "knowledge_content_type" NOT NULL,
    "sensitivity" "knowledge_sensitivity" NOT NULL DEFAULT 'PUBLIC',
    "chunk_index" INTEGER NOT NULL,
    "token_count" INTEGER,
    "metadata" JSONB,
    "embedding" vector(1536),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_chunks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "lecture_transcripts_lecture_id_key" ON "lecture_transcripts"("lecture_id");

-- CreateIndex
CREATE INDEX "knowledge_chunks_course_id_idx" ON "knowledge_chunks"("course_id");

-- CreateIndex
CREATE INDEX "knowledge_chunks_lecture_id_idx" ON "knowledge_chunks"("lecture_id");

-- CreateIndex
CREATE INDEX "knowledge_chunks_section_id_idx" ON "knowledge_chunks"("section_id");

-- CreateIndex
CREATE INDEX "knowledge_chunks_content_type_idx" ON "knowledge_chunks"("content_type");

-- CreateIndex
CREATE INDEX "knowledge_chunks_sensitivity_idx" ON "knowledge_chunks"("sensitivity");

-- CreateIndex
CREATE UNIQUE INDEX "knowledge_chunks_source_id_chunk_index_key" ON "knowledge_chunks"("source_id", "chunk_index");

-- CreateIndex
CREATE INDEX "knowledge_chunks_embedding_idx" ON "knowledge_chunks" USING hnsw ("embedding" vector_cosine_ops);

-- AddForeignKey
ALTER TABLE "lecture_transcripts" ADD CONSTRAINT "lecture_transcripts_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_chunks" ADD CONSTRAINT "knowledge_chunks_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE SET NULL ON UPDATE CASCADE;
