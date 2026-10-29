import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'
import { useRuntimeConfig } from '#imports'
import { createError } from 'h3'
import { prisma } from './db'

export async function listGalleryKeys() {
  const config = useRuntimeConfig()
  if (!config.r2AccessKeyId || !config.r2SecretAccessKey) {
    throw createError({ statusCode: 503, statusMessage: 'Gallery is not configured' })
  }
  const client = new S3Client({
    region: 'auto',
    endpoint: `https://${config.r2AccountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: config.r2AccessKeyId,
      secretAccessKey: config.r2SecretAccessKey
    }
  })
  try {
    const keys: string[] = []
    let cursor: string | undefined
    do {
      const page = await client.send(new ListObjectsV2Command({
        Bucket: config.r2BucketName,
        ContinuationToken: cursor
      }))
      for (const object of page.Contents || []) {
        if (object.Key && /\.(webp|avif|jpe?g|png|gif)$/i.test(object.Key)) keys.push(object.Key)
      }
      cursor = page.IsTruncated ? page.NextContinuationToken : undefined
      if (page.IsTruncated && !cursor) throw new Error('Missing pagination cursor')
    } while (cursor)
    return keys.sort()
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'Unable to load gallery' })
  }
  finally {
    client.destroy()
  }
}

export function galleryUrl(key: string, baseUrl: string) {
  return `${baseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`
}

export async function listGalleryImages() {
  const baseUrl = useRuntimeConfig().r2PublicUrl.replace(/\/+$/, '')
  const [keys, saved] = await Promise.all([
    listGalleryKeys(),
    prisma.galleryImage.findMany()
  ])
  const settings = new Map(saved.map(image => [image.key, image]))
  return keys.map((key, index) => ({
    key,
    url: galleryUrl(key, baseUrl),
    position: settings.get(key)?.position ?? saved.length + index,
    isVisible: settings.get(key)?.isVisible ?? true
  })).sort((a, b) => a.position - b.position || a.key.localeCompare(b.key))
}
