CREATE TABLE "schedule_items" (
  "id" TEXT NOT NULL,
  "side" TEXT NOT NULL,
  "time" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT NOT NULL,
  "position" INTEGER NOT NULL,
  CONSTRAINT "schedule_items_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "schedule_items_side_check" CHECK ("side" IN ('nha-trai', 'nha-gai'))
);
CREATE INDEX "schedule_items_side_position_idx" ON "schedule_items"("side", "position");

INSERT INTO "schedule_items" ("id", "side", "time", "title", "description", "position") VALUES
('groom-welcome', 'nha-trai', '10:00', 'Đón khách', 'Cùng lưu lại những khung hình đầu tiên tại khu vực welcome.', 0),
('groom-ceremony', 'nha-trai', '11:00', 'Lễ thành hôn', 'Khoảnh khắc trao nhẫn và lời hẹn ước trước gia đình, bạn bè.', 1),
('groom-lunch', 'nha-trai', '11:30', 'Tiệc cưới trưa', 'Dùng bữa, nâng ly và chia sẻ niềm vui trong không gian ấm cúng.', 2),
('bride-welcome', 'nha-gai', '10:00', 'Đón khách', 'Cùng lưu lại những khung hình đầu tiên tại khu vực welcome.', 0),
('bride-ceremony', 'nha-gai', '11:00', 'Lễ vu quy', 'Khoảnh khắc trao nhẫn và lời hẹn ước trước gia đình, bạn bè.', 1),
('bride-lunch', 'nha-gai', '11:30', 'Tiệc cưới trưa', 'Dùng bữa, nâng ly và chia sẻ niềm vui trong không gian ấm cúng.', 2);
