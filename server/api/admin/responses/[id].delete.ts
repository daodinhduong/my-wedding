import { createError, defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../../utils/adminAuth'
import { useDb } from '../../../utils/db'
import { ensureWeddingResponsesSchema } from '../../../utils/weddingResponses'

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)

  const id = event.context.params?.id

  if (!id || !/^\d+$/.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID không hợp lệ.'
    })
  }

  await ensureWeddingResponsesSchema()

  const result = await useDb().query<{ id: string }>(
    `
      delete from wedding_responses
      where id = $1
      returning id::text as "id"
    `,
    [id]
  )

  if (!result.rowCount) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Không tìm thấy bản ghi.'
    })
  }

  return {
    ok: true,
    id: result.rows[0]?.id
  }
})
