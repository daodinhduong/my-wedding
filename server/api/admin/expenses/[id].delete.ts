import { createError, defineEventHandler, getRouterParam } from 'h3'
import { assertAdminPassword } from '../../../utils/adminAuth'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)
  const result = await prisma.weddingExpense.deleteMany({ where: { id: getRouterParam(event, 'id') || '' } })
  if (!result.count) throw createError({ statusCode: 404, statusMessage: 'Khong tim thay khoan chi tieu.' })
  return { ok: true }
})
