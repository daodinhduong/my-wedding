import { createError, defineEventHandler, getRouterParam } from 'h3'
import { assertAdminPassword } from '../../../utils/adminAuth'
import { prisma } from '../../../utils/db'
import { readJsonBody } from '../../../utils/readJsonBody'
import { validateExpense } from '../../../utils/expense'

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)
  const id = getRouterParam(event, 'id') || ''
  const body = await readJsonBody<Record<string, unknown>>(event)
  const data = validateExpense(body || {})
  try {
    return await prisma.weddingExpense.update({
      where: { id },
      data
    })
  }
  catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      throw createError({ statusCode: 404, statusMessage: 'Khong tim thay khoan chi tieu.' })
    }
    throw error
  }
})
