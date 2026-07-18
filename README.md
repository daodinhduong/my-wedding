# Nuxt 4 SQL Docker App

Ứng dụng Nuxt 4 kết nối PostgreSQL và chạy cả hai bằng Docker Compose.

## Chạy bằng Docker

```bash
docker compose up --build
```

Ứng dụng sẽ chạy tại `http://localhost:3000`.

PostgreSQL chạy tại `localhost:5432` với:

- Database: `nuxt_app`
- User: `nuxt`
- Password: `nuxt`

## Chạy local không Docker

Yêu cầu Node.js `^22.12.0 || ^24.11.0 || >=26.0.0`.

```bash
npm install
npm run dev
```

Nếu chạy app local và database trong Docker:

```bash
docker compose up db
```

Sau đó dùng `DATABASE_URL` trong `.env`:

```bash
DATABASE_URL=postgres://nuxt:nuxt@localhost:5432/nuxt_app

## Prisma

Database schema nằm trong `prisma/schema.prisma` và lịch sử migration nằm
trong `prisma/migrations`.

```bash
# Tạo Prisma Client sau khi sửa schema
npm run db:generate

# Tạo và áp dụng migration trong môi trường phát triển
npm run db:migrate -- --name ten_migration

# Áp dụng các migration đã có
npm run db:deploy

# Mở giao diện xem dữ liệu
npm run db:studio
```

Khi chạy bằng Docker Compose, ứng dụng tự chạy `prisma migrate deploy`
trước khi Nuxt server khởi động. Migration không xóa dữ liệu hiện có.
```
