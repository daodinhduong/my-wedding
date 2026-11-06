ALTER TABLE "invitations" ADD COLUMN "inviter_role" TEXT NOT NULL DEFAULT 'couple';
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_inviter_role_check" CHECK ("inviter_role" IN ('parents', 'couple'));
