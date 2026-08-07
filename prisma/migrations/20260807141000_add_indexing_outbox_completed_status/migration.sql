-- Add COMPLETED status for indexing outbox lifecycle tracking.
ALTER TYPE "course_indexing_outbox_status" ADD VALUE IF NOT EXISTS 'COMPLETED';
