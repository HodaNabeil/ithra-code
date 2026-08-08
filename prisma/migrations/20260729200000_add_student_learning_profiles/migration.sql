-- CreateTable
CREATE TABLE "student_learning_profiles" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "explanation_depth" TEXT NOT NULL DEFAULT 'balanced',
    "content_style" TEXT NOT NULL DEFAULT 'balanced',
    "confidence" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "interaction_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "student_learning_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "student_learning_profiles_user_id_course_id_key" ON "student_learning_profiles"("user_id", "course_id");

-- CreateIndex
CREATE INDEX "student_learning_profiles_user_id_idx" ON "student_learning_profiles"("user_id");

-- CreateIndex
CREATE INDEX "student_learning_profiles_course_id_idx" ON "student_learning_profiles"("course_id");

-- AddForeignKey
ALTER TABLE "student_learning_profiles" ADD CONSTRAINT "student_learning_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_learning_profiles" ADD CONSTRAINT "student_learning_profiles_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("id") ON DELETE CASCADE ON UPDATE CASCADE;
