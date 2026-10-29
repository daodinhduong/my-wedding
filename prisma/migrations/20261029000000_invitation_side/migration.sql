ALTER TABLE "wedding_responses"
  ADD COLUMN "invitation_side" TEXT;

ALTER TABLE "wedding_responses"
  ADD CONSTRAINT "wedding_responses_invitation_side_valid"
  CHECK ("invitation_side" IS NULL OR "invitation_side" IN ('nha-trai', 'nha-gai'));

CREATE INDEX "wedding_responses_invitation_side_idx"
  ON "wedding_responses" ("invitation_side");
