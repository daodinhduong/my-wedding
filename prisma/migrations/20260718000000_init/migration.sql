CREATE TABLE IF NOT EXISTS "wedding_responses" (
  "id" BIGSERIAL NOT NULL,
  "guest_name" TEXT NOT NULL,
  "wish_message" TEXT,
  "attendance_status" TEXT NOT NULL DEFAULT 'pending',
  "guest_count" INTEGER NOT NULL DEFAULT 0,
  "is_approved" BOOLEAN NOT NULL DEFAULT false,
  "response_source" TEXT NOT NULL DEFAULT 'website',
  "phone" TEXT,
  "note" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "wedding_responses_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "wedding_responses_guest_name_not_blank"
    CHECK (length(trim("guest_name")) > 0),
  CONSTRAINT "wedding_responses_attendance_status_valid"
    CHECK ("attendance_status" IN ('pending', 'attending', 'not_attending')),
  CONSTRAINT "wedding_responses_guest_count_valid"
    CHECK (
      ("attendance_status" = 'attending' AND "guest_count" BETWEEN 1 AND 20)
      OR ("attendance_status" <> 'attending' AND "guest_count" = 0)
    ),
  CONSTRAINT "wedding_responses_response_source_valid"
    CHECK ("response_source" IN ('website', 'admin'))
);

ALTER TABLE "wedding_responses"
  ADD COLUMN IF NOT EXISTS "is_approved" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "wedding_responses"
  ADD COLUMN IF NOT EXISTS "response_source" TEXT NOT NULL DEFAULT 'website';

CREATE INDEX IF NOT EXISTS "wedding_responses_created_at_idx"
  ON "wedding_responses" ("created_at" DESC);
CREATE INDEX IF NOT EXISTS "wedding_responses_attendance_status_idx"
  ON "wedding_responses" ("attendance_status");
CREATE INDEX IF NOT EXISTS "wedding_responses_is_approved_idx"
  ON "wedding_responses" ("is_approved", "created_at" DESC);
CREATE INDEX IF NOT EXISTS "wedding_responses_response_source_idx"
  ON "wedding_responses" ("response_source");
