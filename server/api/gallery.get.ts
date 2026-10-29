import { defineEventHandler } from 'h3'
import { listGalleryImages } from '../utils/gallery'

export default defineEventHandler(async () => {
  const images = await listGalleryImages()
  return images.filter(image => image.isVisible).map(image => image.url)
})
