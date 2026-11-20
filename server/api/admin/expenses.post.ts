import { defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../utils/adminAuth'
import { prisma } from '../../utils/db'
import { readJsonBody } from '../../utils/readJsonBody'
import { validateExpense } from '../../utils/expense'

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)
  const body = await readJsonBody<Record<string, unknown>>(event)
  return prisma.weddingExpense.create({ data: validateExpense(body || {}) })
})
