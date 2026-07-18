import { defineEventHandler } from 'h3'
import { prisma } from '../utils/db'

export default defineEventHandler(async () => {
  const wishes = await prisma.weddingResponse.findMany({
    where: {
      isApproved: true,
      wishMessage: { not: null }
    },
    orderBy: { createdAt: 'desc' },
    take: 30,
    select: {
      id: true,
      guestName: true,
      wishMessage: true
    }
  })

  return wishes
    .filter(wish => wish.wishMessage?.trim())
    .map(wish => ({
      id: wish.id.toString(),
      name: wish.guestName,
      message: wish.wishMessage as string
    }))
})
