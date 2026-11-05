CREATE TABLE "invitations" (
    "id" TEXT NOT NULL,
    "sender_name" TEXT NOT NULL,
    "guest_name" TEXT NOT NULL,
    "note" TEXT,
    "is_sent" BOOLEAN NOT NULL DEFAULT false,
    "delivery_type" TEXT NOT NULL DEFAULT 'online',
    "invitation_side" TEXT NOT NULL DEFAULT 'nha-trai',
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL,
    CONSTRAINT "invitations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "invitations_delivery_type_check" CHECK ("delivery_type" IN ('online', 'paper', 'both')),
    CONSTRAINT "invitations_side_check" CHECK ("invitation_side" IN ('nha-trai', 'nha-gai'))
);
CREATE INDEX "invitations_created_at_idx" ON "invitations"("created_at" DESC);
