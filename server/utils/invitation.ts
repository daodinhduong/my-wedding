import { createError } from 'h3'

export function validateInvitation(body: Record<string, unknown>) {
  const senderName = typeof body.senderName === 'string' ? body.senderName.trim() : ''
  const guestName = typeof body.guestName === 'string' ? body.guestName.trim() : ''
  const note = typeof body.note === 'string' ? body.note.trim() : ''
  const personalMessage = typeof body.personalMessage === 'string' ? body.personalMessage.trim() : ''
  if ((body.personalMessage != null && typeof body.personalMessage !== 'string') || personalMessage.length > 2000) {
    throw createError({ statusCode: 400, statusMessage: 'Loi nhan rieng toi da 2000 ky tu.' })
  }
  if (!senderName || senderName.length > 200 || !guestName || guestName.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Ten nguoi gui va khach moi phai tu 1 den 200 ky tu.' })
  }
  if ((body.note !== undefined && typeof body.note !== 'string') || note.length > 2000) {
    throw createError({ statusCode: 400, statusMessage: 'Ghi chu toi da 2000 ky tu.' })
  }
  if (body.deliveryType !== 'online' && body.deliveryType !== 'paper' && body.deliveryType !== 'both') {
    throw createError({ statusCode: 400, statusMessage: 'Hinh thuc gui khong hop le.' })
  }
  if (body.invitationSide !== 'nha-trai' && body.invitationSide !== 'nha-gai') {
    throw createError({ statusCode: 400, statusMessage: 'Ben moi khong hop le.' })
  }
  if (typeof body.isSent !== 'boolean') {
    throw createError({ statusCode: 400, statusMessage: 'Trang thai gui khong hop le.' })
  }
  return { senderName, guestName, note: note || null, personalMessage: personalMessage || null, deliveryType: body.deliveryType, invitationSide: body.invitationSide, isSent: body.isSent }
}
