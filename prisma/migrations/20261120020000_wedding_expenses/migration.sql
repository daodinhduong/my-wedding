CREATE TABLE "wedding_expenses" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "amount" INTEGER NOT NULL,
  "note" TEXT,
  "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMPTZ(6) NOT NULL,
  CONSTRAINT "wedding_expenses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "wedding_expenses_created_at_idx" ON "wedding_expenses"("created_at" DESC);
