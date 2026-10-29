import { randomUUID } from 'node:crypto'
import { PutObjectCommand, DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3'
import { createError, defineEventHandler } from 'h3'
import { useRuntimeConfig } from '#imports'
import { assertAdminPassword } from '../../../utils/adminAuth'
import { prisma } from '../../../utils/db'
import { galleryUrl, listGalleryImages } from '../../../utils/gallery'

const maxSize = 15 * 1024 * 1024

function imageFormat(bytes: Buffer) {
  if (bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) return { ext: 'jpg', mime: 'image/jpeg' }
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { ext: 'png', mime: 'image/png' }
  if (bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP') return { ext: 'webp', mime: 'image/webp' }
  if (bytes.toString('ascii', 0, 3) === 'GIF') return { ext: 'gif', mime: 'image/gif' }
  if (bytes.toString('ascii', 4, 8) === 'ftyp' && bytes.toString('ascii', 8, 12).startsWith('avi')) return { ext: 'avif', mime: 'image/avif' }
  return null
}

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)
  const config = useRuntimeConfig()
  const request = event.node.req
  const declaredSize = Number(request.headers['content-length'])
  if (Number.isFinite(declaredSize) && declaredSize > maxSize) {
    throw createError({ statusCode: 413, statusMessage: 'Anh vuot qua 15 MB.' })
  }
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of request) {
    const bytes = Buffer.from(chunk)
    size += bytes.length
    if (size > maxSize) throw createError({ statusCode: 413, statusMessage: 'Anh vuot qua 15 MB.' })
    chunks.push(bytes)
  }
  const body = Buffer.concat(chunks)
  const format = imageFormat(body)
  if (!format) throw createError({ statusCode: 400, statusMessage: 'Chi nhan anh JPG, PNG, WebP, GIF hoac AVIF.' })

  const rawName = request.headers['x-file-name']
  let fileName = 'photo'
  try {
    fileName = decodeURIComponent(Array.isArray(rawName) ? rawName[0] || 'photo' : rawName || 'photo')
  }
  catch {
    throw createError({ statusCode: 400, statusMessage: 'Ten tep khong hop le.' })
  }
  const stem = fileName.split(/[\\/]/).pop()?.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9_-]+/g, '-').slice(0, 60) || 'photo'
  const key = `uploads/${randomUUID()}-${stem}.${format.ext}`
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId: config.r2AccessKeyId, secretAccessKey: config.r2SecretAccessKey }
  })
  try {
    const current = await listGalleryImages()
    try {
      await client.send(new PutObjectCommand({ Bucket: config.r2BucketName, Key: key, Body: body, ContentType: format.mime }))
    }
    catch (error) {
      if (error instanceof Error && error.name === 'AccessDenied') {
        throw createError({ statusCode: 403, statusMessage: 'Khoa Cloudflare R2 hien khong co quyen them anh.' })
      }
      throw error
    }
    try {
      await prisma.galleryImage.create({
        data: { key, position: Math.max(-1, ...current.map(image => image.position)) + 1, isVisible: true }
      })
    }
    catch (error) {
      await client.send(new DeleteObjectCommand({ Bucket: config.r2BucketName, Key: key }))
      throw error
    }
    return { key, url: galleryUrl(key, config.r2PublicUrl.replace(/\/+$/, '')) }
  }
  finally {
    client.destroy()
  }
})
