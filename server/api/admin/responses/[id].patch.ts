import { createError, defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../../utils/adminAuth'
import { useDb } from '../../../utils/db'
import { readJsonBody } from '../../../utils/readJsonBody'
import { ensureWeddingResponsesSchema } from '../../../utils/weddingResponses'

type AttendanceStatus = 'attending' | 'not_attending'

type UpdateResponseBody = {
  isApproved?: unknown
  attendanceStatus?: unknown
  guestCount?: unknown
}

type AdminWeddingResponseUpdate = {
  id: string
  isApproved: boolean
  attendanceStatus: AttendanceStatus | 'pending'
  guestCount: number
}

const attendanceStatuses: AttendanceStatus[] = ['attending', 'not_attending']

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)

  const id = event.context.params?.id
  const body = await readJsonBody<UpdateResponseBody>(event)

  if (!id || !/^\d+$/.test(id)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'ID khong hop le.'
    })
  }

  const hasApprovalUpdate = typeof body.isApproved === 'boolean'
  const hasAttendanceUpdate = body.attendanceStatus !== undefined || body.guestCount !== undefined
  const attendanceStatus = attendanceStatuses.includes(body.attendanceStatus as AttendanceStatus)
    ? body.attendanceStatus as AttendanceStatus
    : undefined
  const rawGuestCount = Number(body.guestCount)
  const guestCount = attendanceStatus === 'attending' ? rawGuestCount : 0

  if (!hasApprovalUpdate && !hasAttendanceUpdate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Khong co du lieu cap nhat.'
    })
  }

  if (body.isApproved !== undefined && !hasApprovalUpdate) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Trang thai duyet khong hop le.'
    })
  }

  if (hasAttendanceUpdate && !attendanceStatus) {
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

  const result = await useDb().query<AdminWeddingResponseUpdate>(
    `
      update wedding_responses
      set is_approved = coalesce($1, is_approved),
          attendance_status = coalesce($2, attendance_status),
          guest_count = coalesce($3, guest_count),
          updated_at = now()
      where id = $4
      returning
        id::text as "id",
        is_approved as "isApproved",
        attendance_status as "attendanceStatus",
        guest_count as "guestCount"
    `,
    [
      hasApprovalUpdate ? body.isApproved : null,
      attendanceStatus ?? null,
      hasAttendanceUpdate ? guestCount : null,
      id
    ]
  )

  if (!result.rowCount) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Khong tim thay ban ghi.'
    })
  }

  return result.rows[0]
})
