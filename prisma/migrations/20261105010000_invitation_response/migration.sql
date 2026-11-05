ALTER TABLE "wedding_responses" ADD COLUMN "invitation_id" TEXT;
CREATE UNIQUE INDEX "wedding_responses_invitation_id_key" ON "wedding_responses"("invitation_id");
ALTER TABLE "wedding_responses" ADD CONSTRAINT "wedding_responses_invitation_id_fkey"
FOREIGN KEY ("invitation_id") REFERENCES "invitations"("id") ON DELETE SET NULL ON UPDATE CASCADE;
