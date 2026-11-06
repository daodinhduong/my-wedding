ALTER TABLE "invitations" ADD COLUMN "two_meals" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "wedding_responses" ADD COLUMN "attend_rehearsal" BOOLEAN NOT NULL DEFAULT false, ADD COLUMN "attend_ceremony" BOOLEAN NOT NULL DEFAULT false;
