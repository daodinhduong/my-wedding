import { defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../utils/adminAuth'
import { prisma } from '../../utils/db'

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)

  const responses = await prisma.weddingResponse.findMany({
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      guestName: true,
      wishMessage: true,
      attendanceStatus: true,
      guestCount: true,
      attendRehearsal: true,
      attendCeremony: true,
      isApproved: true,
      responseSource: true,
      invitationSide: true,
      createdAt: true,
      invitation: {
        select: {
          inviterRole: true,
          note: true
        }
      }
    }
  })

  return responses.map(({ invitation, ...response }) => ({
    ...response,
    id: response.id.toString(),
    inviterRole: invitation?.inviterRole ?? null,
    invitationNote: invitation?.note ?? null,
    createdAt: response.createdAt.toISOString()
  }))
})
