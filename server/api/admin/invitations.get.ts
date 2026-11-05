import { defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../utils/adminAuth'
import { prisma } from '../../utils/db'

export default defineEventHandler((event) => {
  assertAdminPassword(event)
  return prisma.invitation.findMany({ orderBy: [{ createdAt: 'desc' }, { id: 'desc' }] })
})
