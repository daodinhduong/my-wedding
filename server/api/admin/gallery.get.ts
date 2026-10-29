import { assertAdminPassword } from '../../utils/adminAuth'
import { listGalleryImages } from '../../utils/gallery'

export default defineEventHandler(async (event) => {
  assertAdminPassword(event)
  return listGalleryImages()
})
