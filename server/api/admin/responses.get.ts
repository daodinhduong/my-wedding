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
      isApproved: true,
      responseSource: true,
      createdAt: true
    }
  })

  return responses.map(response => ({
    ...response,
    id: response.id.toString(),
    createdAt: response.createdAt.toISOString()
  }))
})
