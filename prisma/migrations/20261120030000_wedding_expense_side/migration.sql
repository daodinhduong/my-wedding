ALTER TABLE "wedding_expenses" ADD COLUMN "side" TEXT NOT NULL DEFAULT 'nha-trai';
CREATE INDEX "wedding_expenses_side_idx" ON "wedding_expenses"("side");
