BEGIN;
ALTER TABLE "invitations" DROP CONSTRAINT "invitations_delivery_type_check";
UPDATE "invitations" SET "delivery_type" = 'invitation' WHERE "delivery_type" IN ('online', 'paper', 'both');
ALTER TABLE "invitations" ALTER COLUMN "delivery_type" SET DEFAULT 'invitation';
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_delivery_type_check" CHECK ("delivery_type" IN ('invitation', 'announcement'));
COMMIT;
