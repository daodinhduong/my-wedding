import { createError, defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../../utils/adminAuth'
import { prisma } from '../../../utils/db'
import { readJsonBody } from '../../../utils/readJsonBody'

type AttendanceStatus = 'attending' | 'not_attending'

type UpdateResponseBody = {
  isApproved?: unknown
  attendanceStatus?: unknown
  guestCount?: unknown
}

const attendanceStatuses: AttendanceStatus[] = ['attending', 'not_attending']

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)

  const id = event.context.params?.id
  const body = await readJsonBody<UpdateResponseBody>(event)

  if (!id || !/^\d+$/.test(id)) {
    throw createError({ statusCode: 400, statusMessage: 'ID khong hop le.' })
  }

  const hasApprovalUpdate = typeof body.isApproved === 'boolean'
  const hasAttendanceUpdate = body.attendanceStatus !== undefined || body.guestCount !== undefined
  const attendanceStatus = attendanceStatuses.includes(body.attendanceStatus as AttendanceStatus)
    ? body.attendanceStatus as AttendanceStatus
    : undefined
  const rawGuestCount = Number(body.guestCount)
  const guestCount = attendanceStatus === 'attending' ? rawGuestCount : 0

  if (!hasApprovalUpdate && !hasAttendanceUpdate) {
    throw createError({ statusCode: 400, statusMessage: 'Khong co du lieu cap nhat.' })
  }

  if (body.isApproved !== undefined && !hasApprovalUpdate) {
    throw createError({ statusCode: 400, statusMessage: 'Trang thai duyet khong hop le.' })
  }

  if (hasAttendanceUpdate && !attendanceStatus) {
    throw createError({ statusCode: 400, statusMessage: 'Trang thai tham du khong hop le.' })
  }

  if (attendanceStatus === 'attending' && (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'So luong khach phai nam trong khoang 1 den 20.'
    })
  }

  const recordId = BigInt(id)
  const existing = await prisma.weddingResponse.findUnique({
    where: { id: recordId },
    select: { id: true }
  })

  if (!existing) {
    throw createError({ statusCode: 404, statusMessage: 'Khong tim thay ban ghi.' })
  }

  const response = await prisma.weddingResponse.update({
    where: { id: recordId },
    data: {
      ...(hasApprovalUpdate ? { isApproved: body.isApproved as boolean } : {}),
      ...(hasAttendanceUpdate ? { attendanceStatus, guestCount } : {})
    },
    select: {
      id: true,
      isApproved: true,
      attendanceStatus: true,
      guestCount: true
    }
  })

  return {
    ...response,
    id: response.id.toString()
  }
})
