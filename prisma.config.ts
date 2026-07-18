import 'dotenv/config'
import { defineConfig } from 'prisma/config'

const localDatabaseUrl = process.env.DB_PASSWORD
  ? `postgresql://nuxt:${encodeURIComponent(process.env.DB_PASSWORD)}@localhost:5432/nuxt_app`
  : undefined
const databaseUrl = process.env.DATABASE_URL
  || localDatabaseUrl
  || 'postgresql://nuxt:nuxt@localhost:5432/nuxt_app'

process.env.DATABASE_URL ??= databaseUrl

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations'
  },
  datasource: {
    url: databaseUrl
  }
})
