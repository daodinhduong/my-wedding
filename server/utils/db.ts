import pg from 'pg'
import { useRuntimeConfig } from '#imports'

let pool: pg.Pool | undefined

export function useDb(): pg.Pool {
  if (!pool) {
    const config = useRuntimeConfig()
    const localDatabaseUrl = process.env.DB_PASSWORD
      ? `postgres://nuxt:${encodeURIComponent(process.env.DB_PASSWORD)}@localhost:5432/nuxt_app`
      : undefined
    const connectionString = process.env.NODE_ENV === 'production'
      ? process.env.DATABASE_URL || config.databaseUrl
      : localDatabaseUrl || process.env.DATABASE_URL || config.databaseUrl

    pool = new pg.Pool({
      connectionString
    })
  }

  return pool
}
