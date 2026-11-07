import { createError } from 'h3'

export function scheduleSide(value: unknown): 'nha-trai' | 'nha-gai' {
  if (value !== 'nha-trai' && value !== 'nha-gai') {
    throw createError({ statusCode: 400, statusMessage: 'Invalid invitation side.' })
  }
  return value
}
