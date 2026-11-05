import { createError, defineEventHandler, getRouterParam } from 'h3'
import { assertAdminPassword } from '../../../utils/adminAuth'
import { prisma } from '../../../utils/db'
import { readJsonBody } from '../../../utils/readJsonBody'
import { validateInvitation } from '../../../utils/invitation'

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)
  const id = getRouterParam(event, 'id') || ''
  const body = await readJsonBody<Record<string, unknown>>(event)
  const data = validateInvitation(body || {})
  try {
    return await prisma.invitation.update({
      where: { id, ...(!data.isSent ? { isSent: false } : {}) },
      data
    })
  }
  catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      if (!data.isSent && await prisma.invitation.findUnique({ where: { id }, select: { id: true } })) {
        throw createError({ statusCode: 409, statusMessage: 'Thiep da gui, khong the chuyen ve chua gui.' })
      }
      throw createError({ statusCode: 404, statusMessage: 'Khong tim thay thiep moi.' })
    }
    throw error
  }
})
