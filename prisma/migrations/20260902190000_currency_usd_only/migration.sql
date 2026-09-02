-- Remove EGP from Currency enum; platform uses USD only.

UPDATE "courses" SET "currency" = 'USD' WHERE "currency" = 'EGP';
UPDATE "carts" SET "currency" = 'USD' WHERE "currency" = 'EGP';
UPDATE "cart_items" SET "currency" = 'USD' WHERE "currency" = 'EGP';
UPDATE "orders" SET "currency" = 'USD' WHERE "currency" = 'EGP';
UPDATE "order_items" SET "currency" = 'USD' WHERE "currency" = 'EGP';
UPDATE "payments" SET "currency" = 'USD' WHERE "currency" = 'EGP';
UPDATE "payment_disputes" SET "currency" = 'USD' WHERE "currency" = 'EGP';
UPDATE "refunds" SET "currency" = 'USD' WHERE "currency" = 'EGP';
UPDATE "checkout_sessions" SET "currency" = 'USD' WHERE "currency" = 'EGP';
UPDATE "instructor_availabilities" SET "currency" = 'USD' WHERE "currency" = 'EGP';
UPDATE "consultation_bookings" SET "currency" = 'USD' WHERE "currency" = 'EGP';
UPDATE "refund_requests" SET "currency" = 'USD' WHERE "currency" = 'EGP';
UPDATE "instructor_earnings" SET "currency" = 'USD' WHERE "currency" = 'EGP';

ALTER TYPE "Currency" RENAME TO "Currency_old";
CREATE TYPE "Currency" AS ENUM ('USD');

ALTER TABLE "courses" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "courses" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "courses" ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "carts" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "carts" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "cart_items" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "cart_items" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "cart_items" ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "orders" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "orders" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "order_items" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "order_items" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "order_items" ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "payments" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "payments" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "payment_disputes" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "payment_disputes" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "payment_disputes" ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "refunds" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "refunds" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "refunds" ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "checkout_sessions" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "checkout_sessions" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "checkout_sessions" ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "instructor_availabilities" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "instructor_availabilities" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "instructor_availabilities" ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "consultation_bookings" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "consultation_bookings" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "consultation_bookings" ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "refund_requests" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "refund_requests" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "refund_requests" ALTER COLUMN "currency" SET DEFAULT 'USD';

ALTER TABLE "instructor_earnings" ALTER COLUMN "currency" DROP DEFAULT;
ALTER TABLE "instructor_earnings" ALTER COLUMN "currency" TYPE "Currency" USING ("currency"::text::"Currency");
ALTER TABLE "instructor_earnings" ALTER COLUMN "currency" SET DEFAULT 'USD';

DROP TYPE "Currency_old";
