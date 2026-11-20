import { createError } from 'h3'

export function validateExpense(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : ''
  if (!title || title.length > 200) {
    throw createError({ statusCode: 400, statusMessage: 'Ten hang muc chi tieu phai tu 1 den 200 ky tu.' })
  }

  const parsedAmount = Number(body.amount)
  if (body.amount === undefined || body.amount === null || body.amount === '' || !Number.isInteger(parsedAmount) || parsedAmount < 0 || parsedAmount > 2_000_000_000) {
    throw createError({ statusCode: 400, statusMessage: 'So tien chi tieu khong hop le.' })
  }

  const side = body.side ?? 'nha-trai'
  if (side !== 'nha-trai' && side !== 'nha-gai') {
    throw createError({ statusCode: 400, statusMessage: 'Ben chi tieu khong hop le.' })
  }

  const paidBy = typeof body.paidBy === 'string' ? body.paidBy.trim() : ''
  if ((body.paidBy !== undefined && body.paidBy !== null && typeof body.paidBy !== 'string') || paidBy.length > 100) {
    throw createError({ statusCode: 400, statusMessage: 'Nguoi chi toi da 100 ky tu.' })
  }

  const note = typeof body.note === 'string' ? body.note.trim() : ''
  if ((body.note !== undefined && body.note !== null && typeof body.note !== 'string') || note.length > 2000) {
    throw createError({ statusCode: 400, statusMessage: 'Ghi chu toi da 2000 ky tu.' })
  }

  return {
    title,
    amount: parsedAmount,
    side,
    paidBy: paidBy || null,
    note: note || null
  }
}
