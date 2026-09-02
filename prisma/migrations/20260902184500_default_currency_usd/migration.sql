-- Unify platform currency default to USD and migrate existing EGP rows.

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

ALTER TABLE "courses" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "carts" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "cart_items" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "orders" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "order_items" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "payments" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "payment_disputes" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "refunds" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "checkout_sessions" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "instructor_availabilities" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "consultation_bookings" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "refund_requests" ALTER COLUMN "currency" SET DEFAULT 'USD';
ALTER TABLE "instructor_earnings" ALTER COLUMN "currency" SET DEFAULT 'USD';
