CREATE TABLE "gallery_images" (
  "key" TEXT NOT NULL PRIMARY KEY,
  "position" INTEGER NOT NULL,
  "is_visible" BOOLEAN NOT NULL DEFAULT true
);
