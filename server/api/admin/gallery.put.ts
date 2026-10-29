import { createError, defineEventHandler } from 'h3'
import { assertAdminPassword } from '../../utils/adminAuth'
import { prisma } from '../../utils/db'
import { listGalleryKeys } from '../../utils/gallery'
import { readJsonBody } from '../../utils/readJsonBody'

type GalleryUpdate = { images?: { key?: unknown, isVisible?: unknown }[] }

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)
  const body = await readJsonBody<GalleryUpdate>(event)
  const images = body?.images
  if (!Array.isArray(images) || images.some(image => typeof image?.key !== 'string' || typeof image?.isVisible !== 'boolean')) {
    throw createError({ statusCode: 400, statusMessage: 'Danh sach anh khong hop le.' })
  }
  const keys = await listGalleryKeys()
  const submitted = images.map(image => image.key as string)
  if (submitted.length !== keys.length || new Set(submitted).size !== keys.length || submitted.some(key => !keys.includes(key))) {
    throw createError({ statusCode: 409, statusMessage: 'Danh sach anh da thay doi. Hay tai lai trang.' })
  }
  await prisma.$transaction(images.map((image, position) => prisma.galleryImage.upsert({
    where: { key: image.key as string },
    create: { key: image.key as string, position, isVisible: image.isVisible as boolean },
    update: { position, isVisible: image.isVisible as boolean }
  })))
  return { ok: true }
})
