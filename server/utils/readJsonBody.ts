import { createError } from 'h3'

type JsonEvent = {
  node?: {
    req?: AsyncIterable<Buffer | Uint8Array | string>
  }
}

export async function readJsonBody<T extends Record<string, unknown>>(event: JsonEvent): Promise<T> {
  const request = event.node?.req

  if (!request) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Khong doc duoc noi dung request.'
    })
  }

  let rawBody = ''

  for await (const chunk of request) {
    rawBody += typeof chunk === 'string'
      ? chunk
      : Buffer.from(chunk).toString('utf8')
  }

  if (!rawBody.trim()) {
    return {} as T
  }

  try {
    return JSON.parse(rawBody) as T
  }
  catch {
    throw createError({
      statusCode: 400,
      statusMessage: 'JSON body khong hop le.'
    })
  }
}
