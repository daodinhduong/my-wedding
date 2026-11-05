import { createError, defineEventHandler } from 'h3'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  event.node.res.setHeader('Cache-Control', 'no-store')
  const invitation = await prisma.invitation.findUnique({
    where: { id: event.context.params?.id || '' },
    select: { response: { select: { guestName: true, wishMessage: true, attendanceStatus: true, guestCount: true } } }
  })
  if (!invitation) throw createError({ statusCode: 404, statusMessage: 'Khong tim thay thiep moi.' })
  return { response: invitation.response }
})
