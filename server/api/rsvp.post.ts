import { createError, defineEventHandler } from 'h3'
import { useDb } from '../utils/db'
import { readJsonBody } from '../utils/readJsonBody'
import { ensureWeddingResponsesSchema } from '../utils/weddingResponses'

type AttendanceStatus = 'attending' | 'not_attending'

type RsvpBody = {
  guestName?: unknown
  wishMessage?: unknown
  attendanceStatus?: unknown
  guestCount?: unknown
}

const attendanceStatuses: AttendanceStatus[] = ['attending', 'not_attending']

export default defineEventHandler(async (event) => {
  const body = await readJsonBody<RsvpBody>(event)
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
      statusMessage: 'Vui long nhap ten cua ban.'
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

  const result = await useDb().query<{ id: string }>(
    `
      insert into wedding_responses (
        guest_name,
        wish_message,
        attendance_status,
        guest_count,
        is_approved
      )
      values ($1, $2, $3, $4, false)
      returning id
    `,
    [guestName, wishMessage || null, attendanceStatus, guestCount]
  )

  return {
    ok: true,
    id: result.rows[0]?.id,
    isApproved: false,
    message: 'Cam on ban. Loi chuc se hien thi sau khi duoc duyet.'
  }
})
