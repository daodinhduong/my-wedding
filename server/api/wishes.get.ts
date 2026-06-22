import { defineEventHandler } from 'h3'
import { useDb } from '../utils/db'
import { ensureWeddingResponsesSchema } from '../utils/weddingResponses'

type ApprovedWishRow = {
  id: string
  name: string
  message: string
}

export default defineEventHandler(async () => {
  await ensureWeddingResponsesSchema()

  const result = await useDb().query<ApprovedWishRow>(`
    select
      id::text,
      guest_name as name,
      wish_message as message
    from wedding_responses
    where is_approved = true
      and wish_message is not null
      and length(trim(wish_message)) > 0
    order by created_at desc
    limit 30
  `)

  return result.rows
})
