import { defineEventHandler } from 'h3'
import { prisma } from '../utils/db'
import { scheduleSide } from '../utils/schedule'

export default defineEventHandler(event => {
  const query = new URL(event.node.req.url || '/', 'http://localhost').searchParams
  const side = scheduleSide(query.get('side'))
  return prisma.scheduleItem.findMany({ where: { side }, orderBy: [{ position: 'asc' }, { id: 'asc' }] })
})
