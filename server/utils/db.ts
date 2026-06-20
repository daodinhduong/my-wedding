import pg from 'pg'
import { useRuntimeConfig } from '#imports'

let pool: pg.Pool | undefined

export function useDb(): pg.Pool {
  if (!pool) {
    const config = useRuntimeConfig()

    pool = new pg.Pool({
      connectionString: config.databaseUrl
    })
  }

  return pool
}
