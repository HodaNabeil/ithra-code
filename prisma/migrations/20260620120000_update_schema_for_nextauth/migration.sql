-- CreateEnum
CREATE TYPE "OrderItemStatus" AS ENUM ('ACTIVE', 'REFUND_PENDING', 'REFUNDED', 'FINALIZED');

-- CreateEnum
CREATE TYPE "Frequency" AS ENUM ('ONCE', 'DAILY', 'WEEKLY');

-- CreateEnum
CREATE TYPE "CancelledBy" AS ENUM ('STUDENT', 'INSTRUCTOR', 'ADMIN', 'SYSTEM');

-- CreateEnum
CREATE TYPE "RescheduledBy" AS ENUM ('STUDENT', 'INSTRUCTOR');

-- CreateEnum
CREATE TYPE "RefundReasonCode" AS ENUM ('NOT_AS_DESCRIBED', 'TECHNICAL_ISSUE', 'ACCIDENTAL_PURCHASE', 'FOUND_BETTER_ALTERNATIVE', 'OTHER');

-- CreateEnum
CREATE TYPE "RefundRequestStatus" AS ENUM ('PENDING_REVIEW', 'AUTO_APPROVED', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'FAILED');

-- CreateEnum
CREATE TYPE "InstructorEarningStatus" AS ENUM ('HELD', 'AVAILABLE', 'VOIDED');

-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'RESCHEDULE_PENDING';

-- AlterEnum
ALTER TYPE "EnrollmentStatus" ADD VALUE 'REVOKED';

-- AlterEnum
ALTER TYPE "PaymentProvider" ADD VALUE 'CASH';

-- DropForeignKey
ALTER TABLE "PathSection" DROP CONSTRAINT "PathSection_pathId_fkey";

-- DropForeignKey
ALTER TABLE "PathSection" DROP CONSTRAINT "PathSection_trackId_fkey";

-- DropForeignKey
ALTER TABLE "consultation_bookings" DROP CONSTRAINT "consultation_bookings_availability_id_fkey";

-- DropForeignKey
ALTER TABLE "consultation_bookings" DROP CONSTRAINT "consultation_bookings_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "coupon_courses" DROP CONSTRAINT "coupon_courses_course_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_coupon_id_fkey";

-- DropForeignKey
ALTER TABLE "orders" DROP CONSTRAINT "orders_payment_id_fkey";

-- DropForeignKey
ALTER TABLE "refunds" DROP CONSTRAINT "refunds_payment_id_fkey";

-- DropIndex
DROP INDEX "consultation_bookings_scheduled_at_idx";

-- DropIndex
DROP INDEX "courses_slug_idx";

-- DropIndex
DROP INDEX "instructor_availabilities_instructor_id_day_of_week_key";

-- Clear legacy consultation bookings before structural changes
DELETE FROM "consultation_bookings";

-- AlterTable
ALTER TABLE "consultation_bookings" DROP COLUMN "notes",
DROP COLUMN "scheduled_at",
ADD COLUMN     "amount_cents" INTEGER NOT NULL,
ADD COLUMN     "cancellation_reason" TEXT,
ADD COLUMN     "cancelled_at" TIMESTAMP(3),
ADD COLUMN     "cancelled_by" "CancelledBy",
ADD COLUMN     "completed_at" TIMESTAMP(3),
ADD COLUMN     "currency" "Currency" NOT NULL DEFAULT 'EGP',
ADD COLUMN     "ends_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "google_event_id" TEXT,
ADD COLUMN     "instructor_id" TEXT NOT NULL,
ADD COLUMN     "instructor_notes" TEXT,
ADD COLUMN     "rescheduled_availability_id" TEXT,
ADD COLUMN     "rescheduled_by" "RescheduledBy",
ADD COLUMN     "rescheduled_duration_minutes" INTEGER,
ADD COLUMN     "rescheduled_starts_at" TIMESTAMP(3),
ADD COLUMN     "starts_at" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "student_notes" TEXT,
ALTER COLUMN "availability_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "courses" DROP COLUMN "archived_at";

-- AlterTable: migrate instructor availability rows before dropping legacy columns
ALTER TABLE "instructor_availabilities"
ADD COLUMN     "durations" INTEGER[] DEFAULT ARRAY[60]::INTEGER[],
ADD COLUMN     "end_at" TIMESTAMP(3),
ADD COLUMN     "frequency" "Frequency" NOT NULL DEFAULT 'ONCE',
ADD COLUMN     "price" DECIMAL(10,2),
ADD COLUMN     "start_at" TIMESTAMP(3),
ADD COLUMN     "timezone" TEXT NOT NULL DEFAULT 'UTC';

UPDATE "instructor_availabilities"
SET
  "price" = "price_per_slot",
  "durations" = ARRAY["slot_duration"],
  "start_at" = (
    CURRENT_DATE
    + (("day_of_week" - EXTRACT(DOW FROM CURRENT_DATE)::int + 7) % 7) * INTERVAL '1 day'
    + "start_time"::time
  ),
  "end_at" = (
    CURRENT_DATE
    + (("day_of_week" - EXTRACT(DOW FROM CURRENT_DATE)::int + 7) % 7) * INTERVAL '1 day'
    + "end_time"::time
  );

ALTER TABLE "instructor_availabilities"
ALTER COLUMN "end_at" SET NOT NULL,
ALTER COLUMN "price" SET NOT NULL,
ALTER COLUMN "start_at" SET NOT NULL;

ALTER TABLE "instructor_availabilities"
DROP COLUMN "day_of_week",
DROP COLUMN "end_time",
DROP COLUMN "price_per_slot",
DROP COLUMN "slot_duration",
DROP COLUMN "start_time";

-- AlterTable
ALTER TABLE "lectures" DROP COLUMN "mux_playback_id",
DROP COLUMN "video_duration",
DROP COLUMN "video_url",
ADD COLUMN     "video_id" TEXT;

-- AlterTable
ALTER TABLE "order_items" ADD COLUMN     "refunded_at" TIMESTAMP(3),
ADD COLUMN     "status" "OrderItemStatus" NOT NULL DEFAULT 'ACTIVE';

-- AlterTable
ALTER TABLE "orders" DROP COLUMN "stripe_session_id";

-- AlterTable
ALTER TABLE "paths" ALTER COLUMN "is_published" SET DEFAULT false;

-- AlterTable
ALTER TABLE "tracks" ALTER COLUMN "is_published" SET DEFAULT false;

-- DropTable
DROP TABLE "PathSection";

-- DropEnum
DROP TYPE "PathSectionType";

-- CreateTable
CREATE TABLE "videos" (
    "id" TEXT NOT NULL,
    "bunny_video_id" TEXT NOT NULL,
    "library_id" TEXT NOT NULL,
    "duration" INTEGER,
    "thumbnail_url" TEXT,
    "status" TEXT NOT NULL DEFAULT 'processing',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "videos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_collections" (
    "id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "bunny_collection_id" TEXT NOT NULL,
    "library_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_collections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tracked_devices" (
    "id" TEXT NOT NULL,
    "device_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_name" TEXT NOT NULL,
    "device_type" TEXT NOT NULL,
    "os" TEXT NOT NULL,
    "browser" TEXT NOT NULL,
    "ip_address" TEXT NOT NULL,
    "timezone" TEXT NOT NULL,
    "screen_resolution" TEXT,
    "language" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "is_trusted" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "login_count" INTEGER NOT NULL DEFAULT 1,
    "first_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_seen" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tracked_devices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "token_families" (
    "id" TEXT NOT NULL,
    "token_family" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "device_id" TEXT,
    "is_revoked" BOOLEAN NOT NULL DEFAULT false,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "token_families_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payments" (
    "id" TEXT NOT NULL,
    "paymob_transaction_id" TEXT,
    "paymob_order_id" TEXT,
    "paymob_intention_id" TEXT,
    "provider" "PaymentProvider" NOT NULL DEFAULT 'PAYMOB',
    "provider_transaction_id" TEXT,
    "provider_metadata" JSONB,
    "amount_cents" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'EGP',
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "payment_method" TEXT,
    "integration_id" INTEGER,
    "last4" TEXT,
    "brand" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "paid_at" TIMESTAMP(3),

    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

INSERT INTO "payments" (
    "id",
    "provider",
    "provider_transaction_id",
    "provider_metadata",
    "amount_cents",
    "currency",
    "status",
    "payment_method",
    "last4",
    "brand",
    "created_at",
    "updated_at",
    "paid_at"
)
SELECT
    "id",
    "provider",
    COALESCE("provider_transaction_id", "stripe_payment_intent_id"),
    "provider_metadata",
    "amount_cents",
    "currency",
    "status",
    "paymentMethod",
    "last4",
    "brand",
    "createdAt",
    "updatedAt",
    "paidAt"
FROM "Payment";

DROP TABLE "Payment";

-- CreateTable
CREATE TABLE "availability_date_overrides" (
    "id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "override_date" DATE NOT NULL,
    "start_time" TEXT,
    "end_time" TEXT,
    "is_available" BOOLEAN NOT NULL,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "availability_date_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_schedule_settings" (
    "id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "min_notice_hours" INTEGER NOT NULL DEFAULT 12,
    "buffer_minutes" INTEGER NOT NULL DEFAULT 15,
    "max_bookings_per_day" INTEGER,
    "booking_window_days" INTEGER NOT NULL DEFAULT 30,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_schedule_settings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refund_requests" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "reason_code" "RefundReasonCode" NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'EGP',
    "status" "RefundRequestStatus" NOT NULL DEFAULT 'PENDING_REVIEW',
    "auto_approved" BOOLEAN NOT NULL DEFAULT false,
    "progress_percent" DECIMAL(5,2) NOT NULL,
    "review_note" TEXT,
    "resolved_at" TIMESTAMP(3),
    "provider_refund_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "refund_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "instructor_earnings" (
    "id" TEXT NOT NULL,
    "instructor_id" TEXT NOT NULL,
    "order_item_id" TEXT NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'EGP',
    "status" "InstructorEarningStatus" NOT NULL DEFAULT 'HELD',
    "held_until" TIMESTAMP(3) NOT NULL,
    "released_at" TIMESTAMP(3),
    "voided_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "instructor_earnings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "testimonials" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "avatar_url" TEXT,
    "content" TEXT NOT NULL,
    "rating" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "source_review_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "testimonials_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "faqs" (
    "id" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "faqs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "videos_bunny_video_id_key" ON "videos"("bunny_video_id");

-- CreateIndex
CREATE UNIQUE INDEX "video_collections_course_id_key" ON "video_collections"("course_id");

-- CreateIndex
CREATE INDEX "video_collections_library_id_idx" ON "video_collections"("library_id");

-- CreateIndex
CREATE UNIQUE INDEX "tracked_devices_device_id_key" ON "tracked_devices"("device_id");

-- CreateIndex
CREATE INDEX "tracked_devices_user_id_is_active_idx" ON "tracked_devices"("user_id", "is_active");

-- CreateIndex
CREATE INDEX "tracked_devices_fingerprint_idx" ON "tracked_devices"("fingerprint");

-- CreateIndex
CREATE INDEX "tracked_devices_expires_at_idx" ON "tracked_devices"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "tracked_devices_user_id_fingerprint_key" ON "tracked_devices"("user_id", "fingerprint");

-- CreateIndex
CREATE UNIQUE INDEX "token_families_token_family_key" ON "token_families"("token_family");

-- CreateIndex
CREATE INDEX "token_families_user_id_idx" ON "token_families"("user_id");

-- CreateIndex
CREATE INDEX "token_families_user_id_device_id_idx" ON "token_families"("user_id", "device_id");

-- CreateIndex
CREATE INDEX "token_families_expires_at_idx" ON "token_families"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "payments_paymob_transaction_id_key" ON "payments"("paymob_transaction_id");

-- CreateIndex
CREATE INDEX "payments_status_idx" ON "payments"("status");

-- CreateIndex
CREATE INDEX "payments_provider_idx" ON "payments"("provider");

-- CreateIndex
CREATE INDEX "availability_date_overrides_instructor_id_idx" ON "availability_date_overrides"("instructor_id");

-- CreateIndex
CREATE INDEX "availability_date_overrides_override_date_idx" ON "availability_date_overrides"("override_date");

-- CreateIndex
CREATE INDEX "availability_date_overrides_instructor_id_override_date_idx" ON "availability_date_overrides"("instructor_id", "override_date");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_schedule_settings_instructor_id_key" ON "instructor_schedule_settings"("instructor_id");

-- CreateIndex
CREATE INDEX "refund_requests_user_id_idx" ON "refund_requests"("user_id");

-- CreateIndex
CREATE INDEX "refund_requests_status_idx" ON "refund_requests"("status");

-- CreateIndex
CREATE INDEX "refund_requests_user_id_created_at_idx" ON "refund_requests"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "refund_requests_provider_refund_id_idx" ON "refund_requests"("provider_refund_id");

-- CreateIndex
CREATE UNIQUE INDEX "refund_requests_order_item_id_key" ON "refund_requests"("order_item_id");

-- CreateIndex
CREATE UNIQUE INDEX "instructor_earnings_order_item_id_key" ON "instructor_earnings"("order_item_id");

-- CreateIndex
CREATE INDEX "instructor_earnings_instructor_id_idx" ON "instructor_earnings"("instructor_id");

-- CreateIndex
CREATE INDEX "instructor_earnings_status_held_until_idx" ON "instructor_earnings"("status", "held_until");

-- CreateIndex
CREATE UNIQUE INDEX "testimonials_source_review_id_key" ON "testimonials"("source_review_id");

-- CreateIndex
CREATE INDEX "testimonials_is_active_idx" ON "testimonials"("is_active");

-- CreateIndex
CREATE INDEX "testimonials_rating_idx" ON "testimonials"("rating");

-- CreateIndex
CREATE INDEX "faqs_is_active_idx" ON "faqs"("is_active");

-- CreateIndex
CREATE INDEX "faqs_sort_order_idx" ON "faqs"("sort_order");

-- CreateIndex
CREATE INDEX "consultation_bookings_instructor_id_idx" ON "consultation_bookings"("instructor_id");

-- CreateIndex
CREATE INDEX "consultation_bookings_starts_at_idx" ON "consultation_bookings"("starts_at");

-- CreateIndex
CREATE INDEX "consultation_bookings_instructor_id_starts_at_idx" ON "consultation_bookings"("instructor_id", "starts_at");

-- CreateIndex
CREATE INDEX "consultation_bookings_instructor_id_status_idx" ON "consultation_bookings"("instructor_id", "status");

-- CreateIndex
CREATE INDEX "consultation_bookings_student_id_status_idx" ON "consultation_bookings"("student_id", "status");

-- CreateIndex
CREATE INDEX "courses_status_visibility_idx" ON "courses"("status", "visibility");

-- CreateIndex
CREATE INDEX "courses_instructor_id_status_idx" ON "courses"("instructor_id", "status");

-- CreateIndex
CREATE INDEX "courses_created_at_idx" ON "courses"("created_at");

-- CreateIndex
CREATE INDEX "instructor_availabilities_instructor_id_start_at_idx" ON "instructor_availabilities"("instructor_id", "start_at");

-- CreateIndex
CREATE INDEX "instructor_availabilities_instructor_id_frequency_idx" ON "instructor_availabilities"("instructor_id", "frequency");

-- CreateIndex
CREATE INDEX "instructor_availabilities_instructor_id_is_active_idx" ON "instructor_availabilities"("instructor_id", "is_active");

-- CreateIndex
CREATE UNIQUE INDEX "lectures_video_id_key" ON "lectures"("video_id");

-- CreateIndex
CREATE INDEX "order_items_status_idx" ON "order_items"("status");

-- AddForeignKey
ALTER TABLE "lectures" ADD CONSTRAINT "lectures_video_id_fkey" FOREIGN KEY ("video_id") REFERENCES "videos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tracked_devices" ADD CONSTRAINT "tracked_devices_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "token_families" ADD CONSTRAINT "token_families_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "orders" ADD CONSTRAINT "orders_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "availability_date_overrides" ADD CONSTRAINT "availability_date_overrides_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_schedule_settings" ADD CONSTRAINT "instructor_schedule_settings_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_bookings" ADD CONSTRAINT "consultation_bookings_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_bookings" ADD CONSTRAINT "consultation_bookings_availability_id_fkey" FOREIGN KEY ("availability_id") REFERENCES "instructor_availabilities"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "consultation_bookings" ADD CONSTRAINT "consultation_bookings_payment_id_fkey" FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refund_requests" ADD CONSTRAINT "refund_requests_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_earnings" ADD CONSTRAINT "instructor_earnings_instructor_id_fkey" FOREIGN KEY ("instructor_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "instructor_earnings" ADD CONSTRAINT "instructor_earnings_order_item_id_fkey" FOREIGN KEY ("order_item_id") REFERENCES "order_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;
