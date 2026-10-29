<script setup lang="ts">
type GalleryImage = { key: string, url: string, position: number, isVisible: boolean }

const props = defineProps<{ adminPassword: string }>()
const images = ref<GalleryImage[]>([])
const loading = ref(false)
const saving = ref(false)
const uploading = ref(false)
const deletingKey = ref<string | null>(null)
const fileInput = ref<HTMLInputElement | null>(null)
const dirty = ref(false)
const message = ref('')
const error = ref('')
onMounted(() => { void loadImages() })

function headers() {
  return { 'x-admin-password': props.adminPassword }
}

async function loadImages() {
  loading.value = true
  error.value = ''
  message.value = ''
  try {
    images.value = await $fetch<GalleryImage[]>('/api/admin/gallery', { headers: headers() })
    dirty.value = false
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể tải danh sách ảnh.'
  }
  finally {
    loading.value = false
  }
}

function moveImage(index: number, direction: -1 | 1) {
  const next = index + direction
  if (next < 0 || next >= images.value.length) return
  const updated = [...images.value]
  ;[updated[index], updated[next]] = [updated[next]!, updated[index]!]
  images.value = updated
  dirty.value = true
  message.value = ''
}

function moveToPosition(index: number, event: Event) {
  const input = event.target as HTMLInputElement
  const position = Number(input.value)
  if (!Number.isInteger(position) || position < 1 || position > images.value.length) {
    input.value = String(index + 1)
    return
  }
  const next = position - 1
  if (next === index) return
  const updated = [...images.value]
  const [image] = updated.splice(index, 1)
  updated.splice(next, 0, image!)
  images.value = updated
  dirty.value = true
  message.value = ''
}

function toggleImage(image: GalleryImage) {
  image.isVisible = !image.isVisible
  dirty.value = true
  message.value = ''
}

async function saveImages() {
  saving.value = true
  error.value = ''
  message.value = ''
  try {
    await $fetch('/api/admin/gallery', {
      method: 'PUT',
      headers: headers(),
      body: { images: images.value.map(image => ({ key: image.key, isVisible: image.isVisible })) }
    })
    dirty.value = false
    message.value = 'Đã lưu thứ tự và trạng thái hiển thị ảnh.'
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể lưu danh sách ảnh.'
  }
  finally {
    saving.value = false
  }
}

async function uploadImage(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return
  if (file.size > 15 * 1024 * 1024) {
    error.value = 'Ảnh phải nhỏ hơn 15 MB.'
    return
  }
  uploading.value = true
  error.value = ''
  message.value = ''
  try {
    const response = await fetch('/api/admin/gallery/upload', {
      method: 'POST',
      headers: { ...headers(), 'x-file-name': encodeURIComponent(file.name), 'content-type': file.type || 'application/octet-stream' },
      body: file
    })
    if (!response.ok) {
      const result = await response.json()
      throw new Error(result.statusMessage || 'Không thể tải ảnh lên.')
    }
    await loadImages()
    message.value = 'Đã thêm ảnh vào cuối album.'
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể tải ảnh lên.'
  }
  finally {
    uploading.value = false
  }
}

async function deleteImage(image: GalleryImage) {
  if (!window.confirm(`Xóa vĩnh viễn ảnh “${image.key}” khỏi Cloudflare?`)) return
  deletingKey.value = image.key
  error.value = ''
  message.value = ''
  try {
    await $fetch('/api/admin/gallery/image', {
      method: 'DELETE',
      headers: headers(),
      body: { key: image.key }
    })
    await loadImages()
    message.value = 'Đã xóa ảnh khỏi Cloudflare và album.'
  }
  catch (cause) {
    error.value = cause instanceof Error ? cause.message : 'Không thể xóa ảnh.'
  }
  finally {
    deletingKey.value = null
  }
}
</script>

<template>
  <section class="gallery-page">
    <div class="gallery-container">
      <header>
        <p class="eyebrow">Album ảnh</p>
        <h2>Ẩn, hiện và sắp xếp ảnh</h2>
      </header>

      <section>
        <div class="toolbar">
          <p>{{ images.length }} ảnh · {{ dirty ? 'Lưu thay đổi trước khi thêm hoặc xóa ảnh.' : 'Thay đổi thứ tự/ẩn hiện xuất hiện trên thiệp sau khi bấm Lưu.' }}</p>
          <div class="actions">
            <input ref="fileInput" class="sr-only" type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" @change="uploadImage">
            <button type="button" :disabled="loading || saving || uploading || dirty" @click="fileInput?.click()">
              {{ uploading ? 'Đang tải lên...' : 'Thêm ảnh' }}
            </button>
            <button type="button" :disabled="loading || saving || uploading || dirty" @click="loadImages">Tải lại</button>
            <button type="button" :disabled="!dirty || loading || saving" @click="saveImages">
              {{ saving ? 'Đang lưu...' : 'Lưu thay đổi' }}
            </button>
          </div>
        </div>
        <p v-if="loading">Đang tải ảnh...</p>
        <p v-else-if="!images.length">Chưa có ảnh trong album.</p>
        <ol v-else class="image-list">
          <li v-for="(image, index) in images" :key="image.key" :class="{ hidden: !image.isVisible }">
            <label class="position-field">
              <span class="sr-only">STT của {{ image.key }}</span>
              <input type="number" :value="index + 1" :min="1" :max="images.length" :disabled="saving" :aria-label="`STT của ${image.key}`" @change="moveToPosition(index, $event)">
            </label>
            <img :src="image.url" alt="" loading="lazy">
            <span class="image-name" :title="image.key">{{ image.key }}</span>
            <div class="actions">
              <button type="button" :disabled="index === 0 || saving" :aria-label="`Đưa ${image.key} lên`" @click="moveImage(index, -1)">↑</button>
              <button type="button" :disabled="index === images.length - 1 || saving" :aria-label="`Đưa ${image.key} xuống`" @click="moveImage(index, 1)">↓</button>
              <button type="button" :disabled="saving" @click="toggleImage(image)">{{ image.isVisible ? 'Ẩn' : 'Hiện' }}</button>
              <button type="button" class="delete-button" :disabled="saving || uploading || dirty || deletingKey !== null" @click="deleteImage(image)">
                {{ deletingKey === image.key ? 'Đang xóa...' : 'Xóa' }}
              </button>
            </div>
          </li>
        </ol>
      </section>
      <p v-if="error" class="error" role="alert">{{ error }}</p>
      <p v-if="message" role="status">{{ message }}</p>
    </div>
  </section>
</template>

<style scoped>
.gallery-page { color: #2d2926; font-family: "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif; }
.gallery-container { width: min(100%, 1120px); margin: auto; }
a { color: #6f3d34; font-weight: 700; }
header { margin: 28px 0; }
.eyebrow { margin: 0 0 8px; color: #8f4f42; font-size: .78rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
h2 { margin: 0; font-size: clamp(1.5rem, 3vw, 2rem); line-height: 1.12; }
.login-form { display: grid; gap: 16px; max-width: 440px; padding: 24px; border: 1px solid #e2d4c9; background: #fffdf9; }
label { font-weight: 800; }
input { min-height: 48px; padding: 0 14px; border: 1px solid #d8c8bc; background: #fffaf4; font: inherit; }
button { min-height: 44px; padding: 0 16px; border: 0; background: #6f3d34; color: #fff; font: inherit; font-weight: 800; cursor: pointer; }
button:disabled { opacity: .62; cursor: not-allowed; }
.toolbar, .actions { display: flex; flex-wrap: wrap; gap: 10px; align-items: center; justify-content: space-between; }
.toolbar { position: sticky; top: 0; z-index: 2; margin-bottom: 18px; padding: 12px; border: 1px solid #e2d4c9; background: #fffdf9; }
.image-list { display: grid; gap: 8px; margin: 0; padding: 0; list-style: none; }
.image-list li { display: grid; grid-template-columns: 64px 64px minmax(0, 1fr) auto; gap: 12px; align-items: center; padding: 8px; border: 1px solid #eadfd7; background: #fffdf9; }
.position-field input { width: 100%; min-height: 44px; padding: 0 4px; text-align: center; }
.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
.image-list img { width: 64px; height: 64px; object-fit: cover; }
.image-name { overflow-wrap: anywhere; }
.hidden img, .hidden .image-name { opacity: .4; }
.actions button { min-width: 44px; }
.delete-button { background: #9f3f34; }
.error { color: #9f3f34; font-weight: 700; }
@media (max-width: 600px) {
  .image-list li { grid-template-columns: 64px 54px minmax(0, 1fr); }
  .image-list img { width: 54px; height: 54px; }
  .image-list .actions { grid-column: 1 / -1; justify-content: end; }
}
</style>
