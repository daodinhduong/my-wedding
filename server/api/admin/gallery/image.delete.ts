import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createError, defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'
import { assertAdminPassword } from '../../../utils/adminAuth'
import { prisma } from '../../../utils/db'
import { listGalleryKeys } from '../../../utils/gallery'
import { readJsonBody } from '../../../utils/readJsonBody'

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)
  const config = useRuntimeConfig()
  const body = await readJsonBody<{ key?: unknown }>(event)
  if (typeof body.key !== 'string') throw createError({ statusCode: 400, statusMessage: 'Anh khong hop le.' })
  const keys = await listGalleryKeys()
  if (!keys.includes(body.key)) throw createError({ statusCode: 404, statusMessage: 'Khong tim thay anh.' })
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.r2AccessKeyId, secretAccessKey: config.r2SecretAccessKey }
  })
  try {
    try {
      await client.send(new DeleteObjectCommand({ Bucket: config.r2BucketName, Key: body.key }))
    }
    catch (error) {
      if (error instanceof Error && error.name === 'AccessDenied') {
        throw createError({ statusCode: 403, statusMessage: 'Khoa Cloudflare R2 hien khong co quyen xoa anh.' })
      }
      throw error
    }
    await prisma.galleryImage.deleteMany({ where: { key: body.key } })
    return { ok: true }
  }
  finally {
    client.destroy()
  }
})
