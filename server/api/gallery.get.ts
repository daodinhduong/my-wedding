import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3'

export default defineCachedEventHandler(async () => {
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
    const baseUrl = config.r2PublicUrl.replace(/\/+$/, '')
    return keys.sort().map(key => `${baseUrl}/${key.split('/').map(encodeURIComponent).join('/')}`)
  }
  catch {
    throw createError({ statusCode: 502, statusMessage: 'Unable to load gallery' })
  }
  finally {
    client.destroy()
  }
}, { maxAge: 300, name: 'r2-gallery' })
