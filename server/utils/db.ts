import { PrismaPg } from '@prisma/adapter-pg'
import { PrismaClient } from '@prisma/client'
import { useRuntimeConfig } from '#imports'

function createPrismaClient() {
  const config = useRuntimeConfig()
  const localDatabaseUrl = process.env.DB_PASSWORD
    ? `postgresql://nuxt:${encodeURIComponent(process.env.DB_PASSWORD)}@localhost:5432/nuxt_app`
    : undefined
  const connectionString = process.env.NODE_ENV === 'production'
    ? process.env.DATABASE_URL || config.databaseUrl
    : localDatabaseUrl || process.env.DATABASE_URL || config.databaseUrl

  return new PrismaClient({
    adapter: new PrismaPg({ connectionString })
  })
}

type PrismaClientSingleton = ReturnType<typeof createPrismaClient>
const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: PrismaClientSingleton
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}
