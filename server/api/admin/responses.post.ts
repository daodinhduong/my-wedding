import { createError, defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../utils/adminAuth'
import { prisma } from '../../utils/db'
import { readJsonBody } from '../../utils/readJsonBody'

type AttendanceStatus = 'attending' | 'not_attending'

type CreateAdminWeddingResponseBody = {
  guestName?: unknown
  wishMessage?: unknown
  attendanceStatus?: unknown
  guestCount?: unknown
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
    throw createError({ statusCode: 400, statusMessage: 'Vui long nhap ten khach moi.' })
  }

  if (!attendanceStatus) {
    throw createError({ statusCode: 400, statusMessage: 'Trang thai tham du khong hop le.' })
  }

  if (attendanceStatus === 'attending' && (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'So luong khach phai nam trong khoang 1 den 20.'
    })
  }

  const response = await prisma.weddingResponse.create({
    data: {
      guestName,
      wishMessage: wishMessage || null,
      attendanceStatus,
      guestCount,
      isApproved: false,
      responseSource: 'admin'
    }
  })

  return {
    ...response,
    id: response.id.toString(),
    createdAt: response.createdAt.toISOString(),
    updatedAt: response.updatedAt.toISOString()
  }
})
