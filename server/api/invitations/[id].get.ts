import { createError, defineEventHandler, getRouterParam } from 'h3'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  event.node.res.setHeader('Cache-Control', 'no-store')
  const invitation = await prisma.invitation.findUnique({
    where: { id: getRouterParam(event, 'id') || '' },
    select: { twoMeals: true, guestName: true, inviterRole: true, invitationSide: true, personalMessage: true, deliveryType: true }
  })
  if (!invitation) throw createError({ statusCode: 404, statusMessage: 'Khong tim thay thiep moi.' })
  return invitation
})
