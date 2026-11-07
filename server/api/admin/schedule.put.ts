import { createError, defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../utils/adminAuth'
import { prisma } from '../../utils/db'
import { readJsonBody } from '../../utils/readJsonBody'
import { scheduleSide } from '../../utils/schedule'

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)
  const body = await readJsonBody<{ side?: unknown, items?: unknown }>(event)
  const side = scheduleSide(body?.side)
  if (!Array.isArray(body?.items) || body.items.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Invalid schedule items (maximum 100).' })
  }
  const items = body.items.map((item, position) => {
    if (!item || typeof item.time !== 'string' || !/^([01]\d|2[0-3]):[0-5]\d$/.test(item.time)
      || typeof item.title !== 'string' || !item.title.trim() || item.title.trim().length > 200
      || typeof item.description !== 'string' || item.description.trim().length > 2000) {
      throw createError({ statusCode: 400, statusMessage: 'Invalid time, title or description.' })
    }
    return { side, time: item.time, title: item.title.trim(), description: item.description.trim(), position }
  })
  await prisma.$transaction(async (tx) => {
    await tx.scheduleItem.deleteMany({ where: { side } })
    if (items.length) await tx.scheduleItem.createMany({ data: items })
  })
  return { ok: true }
})
