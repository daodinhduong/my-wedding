import { createError, defineEventHandler } from 'h3'
import { prisma } from '../utils/db'
import { readJsonBody } from '../utils/readJsonBody'

type AttendanceStatus = 'attending' | 'not_attending'

type RsvpBody = {
  guestName?: unknown
  wishMessage?: unknown
  attendanceStatus?: unknown
  guestCount?: unknown
  invitationSide?: unknown
  invitationId?: unknown
}

const attendanceStatuses: AttendanceStatus[] = ['attending', 'not_attending']

export default defineEventHandler(async (event) => {
  const body = await readJsonBody<RsvpBody>(event)
  if (!body || typeof body !== 'object') throw createError({ statusCode: 400, statusMessage: 'Du lieu khong hop le.' })
  const hasInvitationId = body.invitationId !== undefined && body.invitationId !== null
  if (hasInvitationId && (typeof body.invitationId !== 'string' || !body.invitationId.trim())) {
    throw createError({ statusCode: 400, statusMessage: 'ID thiep moi khong hop le.' })
  }
  const invitationId = hasInvitationId ? (body.invitationId as string).trim() : null
  if (invitationId && !await prisma.invitation.findUnique({ where: { id: invitationId }, select: { id: true } })) {
    throw createError({ statusCode: 404, statusMessage: 'Khong tim thay thiep moi.' })
  }
  const guestName = typeof body.guestName === 'string' ? body.guestName.trim() : ''
  const wishMessage = typeof body.wishMessage === 'string' ? body.wishMessage.trim() : ''
  const attendanceStatus = attendanceStatuses.includes(body.attendanceStatus as AttendanceStatus)
    ? body.attendanceStatus as AttendanceStatus
    : undefined
  const rawGuestCount = Number(body.guestCount)
  const guestCount = attendanceStatus === 'attending' ? rawGuestCount : 0
  const invitationSide = body.invitationSide

  if (!guestName) {
    throw createError({ statusCode: 400, statusMessage: 'Vui long nhap ten cua ban.' })
  }

  if (guestName.length > 50) {
    throw createError({ statusCode: 400, statusMessage: 'Ten toi da 50 ky tu.' })
  }

  if (wishMessage.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Loi chuc toi da 200 ky tu.' })
  }

  if (!attendanceStatus) {
    throw createError({ statusCode: 400, statusMessage: 'Trang thai tham du khong hop le.' })
  }

  if (invitationSide !== 'nha-trai' && invitationSide !== 'nha-gai') {
    throw createError({ statusCode: 400, statusMessage: 'Ben moi khong hop le.' })
  }

  if (attendanceStatus === 'attending' && (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'So luong khach phai nam trong khoang 1 den 20.'
    })
  }

  const data = {
      guestName,
      wishMessage: wishMessage || null,
      attendanceStatus,
      guestCount,
      isApproved: !!invitationId,
      responseSource: 'website',
      invitationSide
    }
  const response = invitationId
    ? await prisma.weddingResponse.upsert({
        where: { invitationId },
        create: { ...data, invitationId },
        update: data,
        select: { id: true }
      })
    : await prisma.weddingResponse.create({ data, select: { id: true } })

  return {
    ok: true,
    id: response.id.toString(),
    isApproved: !!invitationId,
    message: invitationId ? 'Da luu loi chuc.' : 'Cam on ban. Loi chuc se hien thi sau khi duoc duyet.'
  }
})
