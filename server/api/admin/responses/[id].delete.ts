import { createError, defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../../utils/adminAuth'
import { prisma } from '../../../utils/db'

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)

  const id = event.context.params?.id

  if (!id || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID không hợp lệ.' })
  }

  const result = await prisma.weddingResponse.deleteMany({
    where: { id: BigInt(id) }
  })

  if (!result.count) {
    throw createError({ statusCode: 404, statusMessage: 'Không tìm thấy bản ghi.' })
  }

  return {
    ok: true,
    id
  }
})
