import { createError, defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../utils/adminAuth'
import { useDb } from '../../utils/db'
import { readJsonBody } from '../../utils/readJsonBody'
import { ensureWeddingResponsesSchema } from '../../utils/weddingResponses'

type AttendanceStatus = 'attending' | 'not_attending'

type CreateAdminWeddingResponseBody = {
  guestName?: unknown
  wishMessage?: unknown
  attendanceStatus?: unknown
  guestCount?: unknown
}

type AdminWeddingResponse = {
  id: string
  guestName: string
  wishMessage: string | null
  attendanceStatus: AttendanceStatus
  guestCount: number
  isApproved: boolean
  responseSource: 'admin'
  createdAt: string
}

const attendanceStatuses: AttendanceStatus[] = ['attending', 'not_attending']

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)

  const body = await readJsonBody<CreateAdminWeddingResponseBody>(event)
  const guestName = typeof body.guestName === 'string' ? body.guestName.trim() : ''
  const wishMessage = typeof body.wishMessage === 'string' ? body.wishMessage.trim() : ''
  const attendanceStatus = attendanceStatuses.includes(body.attendanceStatus as AttendanceStatus)
    ? body.attendanceStatus as AttendanceStatus
    : undefined
  const rawGuestCount = Number(body.guestCount)
  const guestCount = attendanceStatus === 'attending' ? rawGuestCount : 0

  if (!guestName) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Vui long nhap ten khach moi.'
    })
  }

  if (!attendanceStatus) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Trang thai tham du khong hop le.'
    })
  }

  if (attendanceStatus === 'attending' && (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'So luong khach phai nam trong khoang 1 den 20.'
    })
  }

  await ensureWeddingResponsesSchema()

  const result = await useDb().query<AdminWeddingResponse>(
    `
      insert into wedding_responses (
        guest_name,
        wish_message,
        attendance_status,
        guest_count,
        is_approved,
        response_source
      )
      values ($1, $2, $3, $4, false, 'admin')
      returning
        id::text as "id",
        guest_name as "guestName",
        wish_message as "wishMessage",
        attendance_status as "attendanceStatus",
        guest_count as "guestCount",
        is_approved as "isApproved",
        response_source as "responseSource",
        created_at::text as "createdAt"
    `,
    [guestName, wishMessage || null, attendanceStatus, guestCount]
  )

  return result.rows[0]
})
