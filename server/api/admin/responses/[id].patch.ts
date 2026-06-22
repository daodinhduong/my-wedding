import { createError, defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../../utils/adminAuth'
import { useDb } from '../../../utils/db'
import { readJsonBody } from '../../../utils/readJsonBody'
import { ensureWeddingResponsesSchema } from '../../../utils/weddingResponses'

type UpdateApprovalBody = {
  isApproved?: unknown
}

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)

  const id = event.context.params?.id
  const body = await readJsonBody<UpdateApprovalBody>(event)

  if (!id || !/^\d+$/.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID khong hop le.'
    })
  }

  if (typeof body.isApproved !== 'boolean') {
    throw createError({
      statusCode: 400,
      statusMessage: 'Trang thai duyet khong hop le.'
    })
  }

  await ensureWeddingResponsesSchema()

  const result = await useDb().query<{ id: string; isApproved: boolean }>(
    `
      update wedding_responses
      set is_approved = $1,
          updated_at = now()
      where id = $2
      returning id::text as "id", is_approved as "isApproved"
    `,
    [body.isApproved, id]
  )

  if (!result.rowCount) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Khong tim thay ban ghi.'
    })
  }

  return result.rows[0]
})
