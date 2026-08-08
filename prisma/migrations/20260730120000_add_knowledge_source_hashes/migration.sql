-- CreateTable
CREATE TABLE "knowledge_source_hashes" (
    "source_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "lecture_id" TEXT,
    "content_hash" TEXT NOT NULL,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "knowledge_source_hashes_pkey" PRIMARY KEY ("source_id")
);

-- CreateIndex
CREATE INDEX "knowledge_source_hashes_course_id_idx" ON "knowledge_source_hashes"("course_id");

-- CreateIndex
CREATE INDEX "knowledge_source_hashes_lecture_id_idx" ON "knowledge_source_hashes"("lecture_id");

-- AddForeignKey
ALTER TABLE "knowledge_source_hashes" ADD CONSTRAINT "knowledge_source_hashes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "knowledge_source_hashes" ADD CONSTRAINT "knowledge_source_hashes_lecture_id_fkey" FOREIGN KEY ("lecture_id") REFERENCES "lectures"("id") ON DELETE CASCADE ON UPDATE CASCADE;
