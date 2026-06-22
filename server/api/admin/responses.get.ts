import { defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../utils/adminAuth'
import { useDb } from '../../utils/db'
import { ensureWeddingResponsesSchema } from '../../utils/weddingResponses'

type AdminWeddingResponse = {
  id: string
  guestName: string
  wishMessage: string | null
  attendanceStatus: 'attending' | 'not_attending' | 'pending'
  guestCount: number
  isApproved: boolean
  createdAt: string
}

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)
  await ensureWeddingResponsesSchema()

  const result = await useDb().query<AdminWeddingResponse>(`
    select
      id::text as "id",
      guest_name as "guestName",
      wish_message as "wishMessage",
      attendance_status as "attendanceStatus",
      guest_count as "guestCount",
      is_approved as "isApproved",
      created_at::text as "createdAt"
    from wedding_responses
    order by created_at desc
    limit 200
  `)

  return result.rows
})
