import { defineEventHandler } from 'h3'
import { prisma } from '../utils/db'

export default defineEventHandler(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`

    return {
      ok: true,
      message: `PostgreSQL phản hồi lúc ${new Date().toISOString()}.`
    }
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Không thể kết nối PostgreSQL.'
    }
  }
})
