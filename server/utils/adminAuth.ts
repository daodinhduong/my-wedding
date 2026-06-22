import { createError } from 'h3'
import { useRuntimeConfig } from '#imports'

type HeaderEvent = {
  node?: {
    req?: {
      headers?: Record<string, string | string[] | undefined>
    }
  }
}

export function assertAdminPassword(event: HeaderEvent) {
  const config = useRuntimeConfig()
  const expectedPassword = config.adminPassword || process.env.ADMIN_PASSWORD
  const rawPassword = event.node?.req?.headers?.['x-admin-password']
  const password = Array.isArray(rawPassword) ? rawPassword[0] : rawPassword

  if (!expectedPassword) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ADMIN_PASSWORD chua duoc cau hinh.'
    })
  }

  if (!password || password !== expectedPassword) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Mat khau admin khong dung.'
    })
  }
}
