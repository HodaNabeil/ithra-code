-- Recover from partial apply: custom sessions may already be user_sessions
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'sessions'
  ) AND EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'sessions' AND column_name = 'access_token'
  ) THEN
    ALTER TABLE "sessions" RENAME TO "user_sessions";

    ALTER INDEX IF EXISTS "sessions_pkey" RENAME TO "user_sessions_pkey";
    ALTER INDEX IF EXISTS "sessions_access_token_key" RENAME TO "user_sessions_access_token_key";
    ALTER INDEX IF EXISTS "sessions_refresh_token_key" RENAME TO "user_sessions_refresh_token_key";
    ALTER INDEX IF EXISTS "sessions_user_id_idx" RENAME TO "user_sessions_user_id_idx";
    ALTER INDEX IF EXISTS "sessions_access_token_idx" RENAME TO "user_sessions_access_token_idx";
    ALTER INDEX IF EXISTS "sessions_refresh_token_idx" RENAME TO "user_sessions_refresh_token_idx";
    ALTER INDEX IF EXISTS "sessions_expires_at_idx" RENAME TO "user_sessions_expires_at_idx";

    ALTER TABLE "user_sessions" RENAME CONSTRAINT "sessions_user_id_fkey" TO "user_sessions_user_id_fkey";
  END IF;
END $$;

-- Rename legacy constraint/index names if table was renamed in a failed migration
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'user_sessions'
  ) THEN
    ALTER INDEX IF EXISTS "sessions_pkey" RENAME TO "user_sessions_pkey";
    ALTER INDEX IF EXISTS "sessions_access_token_key" RENAME TO "user_sessions_access_token_key";
    ALTER INDEX IF EXISTS "sessions_refresh_token_key" RENAME TO "user_sessions_refresh_token_key";
    ALTER INDEX IF EXISTS "sessions_user_id_idx" RENAME TO "user_sessions_user_id_idx";
    ALTER INDEX IF EXISTS "sessions_access_token_idx" RENAME TO "user_sessions_access_token_idx";
    ALTER INDEX IF EXISTS "sessions_refresh_token_idx" RENAME TO "user_sessions_refresh_token_idx";
    ALTER INDEX IF EXISTS "sessions_expires_at_idx" RENAME TO "user_sessions_expires_at_idx";

    IF EXISTS (
      SELECT 1
      FROM information_schema.table_constraints
      WHERE table_schema = 'public'
        AND table_name = 'user_sessions'
        AND constraint_name = 'sessions_user_id_fkey'
    ) THEN
      ALTER TABLE "user_sessions" RENAME CONSTRAINT "sessions_user_id_fkey" TO "user_sessions_user_id_fkey";
    END IF;
  END IF;
END $$;

-- NextAuth session storage (unused with JWT strategy, required by Prisma adapter)
CREATE TABLE IF NOT EXISTS "sessions" (
    "id" TEXT NOT NULL,
    "session_token" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sessions_session_token_key" ON "sessions"("session_token");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.table_constraints
    WHERE table_schema = 'public'
      AND table_name = 'sessions'
      AND constraint_name = 'sessions_user_id_fkey'
  ) THEN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

-- Email magic link / verification tokens for Auth.js
CREATE TABLE IF NOT EXISTS "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- Auth.js standard user fields
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "email_verified" TIMESTAMP(3);

UPDATE "users"
SET "email_verified" = NOW()
WHERE "is_email_verified" = true
  AND "email_verified" IS NULL;
