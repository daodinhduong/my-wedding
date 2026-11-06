<script setup lang="ts">
import { Copy, Pencil, Trash2 } from 'lucide-vue-next'

type Invitation = {
  id: string
  inviterRole: 'parents' | 'couple'
  guestName: string
  note: string | null
  personalMessage: string | null
  twoMeals: boolean
  isSent: boolean
  deliveryType: 'invitation' | 'announcement'
  invitationSide: 'nha-trai' | 'nha-gai'
  createdAt: string
}
const props = defineProps<{ adminPassword: string }>()
const invitations = ref<Invitation[]>([])
const loading = ref(true)
const saving = ref(false)
const busyId = ref('')
const error = ref('')
const formError = ref('')
const message = ref('')
const search = ref('')
const statusFilter = ref('all')
const sideFilter = ref<Invitation['invitationSide']>('nha-trai')
const dialog = ref<HTMLDialogElement>()
const editingId = ref('')
const isSentLocked = ref(false)
const hasPersonalMessage = ref(false)
const form = reactive({ twoMeals: false, inviterRole: 'couple' as Invitation['inviterRole'], guestName: '', note: '', personalMessage: '', isSent: false, deliveryType: 'invitation' as Invitation['deliveryType'], invitationSide: 'nha-trai' as Invitation['invitationSide'] })
const deliveryLabels = { invitation: 'Thiệp mời', announcement: 'Thiệp báo hỷ' }
const sentCount = computed(() => invitations.value.filter(item => item.isSent).length)
const filtered = computed(() => invitations.value.filter((item) => {
  const keyword = search.value.trim().toLocaleLowerCase('vi')
  return (!keyword || `${item.guestName} ${item.inviterRole} ${item.note || ''}`.toLocaleLowerCase('vi').includes(keyword))
    && (statusFilter.value === 'all' || item.isSent === (statusFilter.value === 'sent'))
    && item.invitationSide === sideFilter.value
}))
function headers() { return { 'x-admin-password': props.adminPassword } }
function errorText(cause: unknown) {
  const value = cause as { data?: { statusMessage?: string }; message?: string }
  return value?.data?.statusMessage || value?.message || 'Không thể thực hiện. Vui lòng thử lại.'
}
async function load() {
  loading.value = true
  error.value = ''
  try { invitations.value = await $fetch<Invitation[]>('/api/admin/invitations', { headers: headers() }) }
  catch (cause) { error.value = errorText(cause) }
  finally { loading.value = false }
}
onMounted(load)
function openForm(item?: Invitation) {
  editingId.value = item?.id || ''
  form.personalMessage = item?.personalMessage || ''
  hasPersonalMessage.value = !!form.personalMessage.trim()
  isSentLocked.value = item?.isSent === true
  Object.assign(form, { twoMeals: item?.twoMeals ?? false, inviterRole: item?.inviterRole || 'couple', guestName: item?.guestName || '', note: item?.note || '', isSent: item?.isSent || false, deliveryType: item?.deliveryType || 'invitation', invitationSide: item?.invitationSide || sideFilter.value })
  formError.value = ''
  dialog.value?.showModal()
}
async function save() {
  if (saving.value) return
  saving.value = true
  formError.value = ''
  try {
    const item = await $fetch<Invitation>(editingId.value ? `/api/admin/invitations/${editingId.value}` : '/api/admin/invitations', {
      method: editingId.value ? 'PATCH' : 'POST', headers: headers(), body: { ...form, personalMessage: hasPersonalMessage.value ? form.personalMessage : '' }
    })
    if (editingId.value) invitations.value = invitations.value.map(old => old.id === item.id ? item : old)
    else invitations.value.unshift(item)
    sideFilter.value = item.invitationSide
    statusFilter.value = 'all'
    search.value = ''
    dialog.value?.close()
    message.value = 'Đã lưu thiệp mời. Bạn có thể mở hoặc sao chép link để gửi cho khách.'
  }
  catch (cause) { formError.value = errorText(cause) }
  finally { saving.value = false }
}
async function toggleSent(item: Invitation) {
  if (busyId.value || item.isSent) return
  busyId.value = item.id
  error.value = ''
  try {
    const updated = await $fetch<Invitation>(`/api/admin/invitations/${item.id}`, { method: 'PATCH', headers: headers(), body: { ...item, note: item.note || '', isSent: true } })
    Object.assign(item, updated)
  }
  catch (cause) { error.value = errorText(cause) }
  finally { busyId.value = '' }
}
async function remove(item: Invitation) {
  if (busyId.value || !window.confirm(`Xóa thiệp của “${item.guestName}”? Link đã gửi sẽ không còn mở được.`)) return
  busyId.value = item.id
  error.value = ''
  try {
    await $fetch(`/api/admin/invitations/${item.id}`, { method: 'DELETE', headers: headers() })
    invitations.value = invitations.value.filter(old => old.id !== item.id)
  }
  catch (cause) { error.value = errorText(cause) }
  finally { busyId.value = '' }
}
async function copyLink(item: Invitation) {
  const url = `${window.location.origin}/${encodeURIComponent(item.id)}`
  try {
    await navigator.clipboard.writeText(url)
    message.value = `Đã sao chép link thiệp của ${item.guestName}.`
  }
  catch { window.prompt('Sao chép đường dẫn thiệp mời:', url) }
}
</script>

<template>
  <section class="invitations-panel" role="tabpanel" aria-label="Thiệp mời">
    <header>
      <div><p class="eyebrow">Admin</p><h1>Danh sách thiệp mời</h1></div>
      <div class="actions">
        <span class="badge">{{ invitations.length }} thiệp</span>
        <span class="badge">{{ sentCount }} đã gửi</span>
        <span class="badge">{{ invitations.length - sentCount }} chưa gửi</span>
        <button type="button" @click="openForm()">Thêm mới</button>
      </div>
    </header>
    <p class="hint">Tạo link riêng cho từng khách. Trạng thái “Đã gửi” được bạn cập nhật sau khi gửi thiệp.</p>
    <div class="filters">
      <label>Tìm kiếm<input v-model="search" type="search" placeholder="Tên khách, người gửi, ghi chú"></label>
      <label>Trạng thái<select v-model="statusFilter"><option value="all">Tất cả</option><option value="unsent">Chưa gửi</option><option value="sent">Đã gửi</option></select></label>
      <label>Bên gửi<select v-model="sideFilter"><option value="nha-trai">Nhà trai</option><option value="nha-gai">Nhà gái</option></select></label>
      <button type="button" class="secondary" :disabled="loading" @click="load">Tải lại</button>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="message" class="hint" role="status">{{ message }}</p>
    <div class="table-wrap" :aria-busy="loading">
      <table>
        <thead><tr><th>Tên khách mời</th><th>Người đứng lời mời</th><th>Ghi chú</th><th>Bên mời</th><th>Hình thức</th><th>Trạng thái</th><th>Thao tác</th></tr></thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="empty">Đang tải thiệp mời...</td></tr>
          <tr v-else-if="!filtered.length"><td colspan="7" class="empty">{{ invitations.length ? 'Không có thiệp phù hợp với bộ lọc.' : 'Chưa có thiệp mời. Bấm “Thêm mới” để tạo thiệp đầu tiên.' }}</td></tr>
          <template v-else>
            <tr v-for="item in filtered" :key="item.id">
              <td><strong>{{ item.guestName }}</strong></td><td>{{ item.inviterRole === 'parents' ? 'Bố mẹ' : 'Cô dâu & chú rể' }}</td>
              <td class="note">{{ item.note || '—' }}</td>
              <td>{{ item.invitationSide === 'nha-trai' ? 'Nhà trai' : 'Nhà gái' }}</td>
              <td>{{ deliveryLabels[item.deliveryType] }}</td>
              <td><button type="button" class="sent-button" :class="{ sent: item.isSent }" :aria-pressed="item.isSent" :disabled="!!busyId || item.isSent" :title="item.isSent ? 'Thiệp đã gửi, không thể chuyển về chưa gửi' : 'Đánh dấu đã gửi'" @click="toggleSent(item)">{{ busyId === item.id ? 'Đang lưu...' : item.isSent ? 'Đã gửi ✓' : 'Chưa gửi' }}</button></td>
              <td><div class="row-actions">
                <a :href="`/${encodeURIComponent(item.id)}`" target="_blank" rel="noopener">Mở thiệp ↗</a>
                <button type="button" class="secondary icon-action" aria-label="Sao chép link" title="Sao chép link" @click="copyLink(item)"><Copy :size="18" aria-hidden="true" /></button>
                <button type="button" class="icon-action" aria-label="Sửa thiệp mời" title="Sửa thiệp mời" :disabled="!!busyId" @click="openForm(item)"><Pencil :size="18" aria-hidden="true" /></button>
                <button type="button" class="danger icon-action" aria-label="Xóa thiệp mời" title="Xóa thiệp mời" :disabled="!!busyId" @click="remove(item)"><Trash2 :size="18" aria-hidden="true" /></button>
              </div></td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <dialog ref="dialog" aria-labelledby="invitation-form-title" @cancel="saving && $event.preventDefault()" @click="!saving && $event.target === dialog && dialog?.close()">
      <form @submit.prevent="save">
        <div class="dialog-header"><h2 id="invitation-form-title">{{ editingId ? 'Sửa thiệp mời' : 'Tạo thiệp mời' }}</h2><button type="button" class="secondary" :disabled="saving" aria-label="Đóng" @click="dialog?.close()">×</button></div>
        <label>Tên khách mời<input v-model="form.guestName" maxlength="200" required></label>
        <fieldset class="inviter-options">
          <legend>Người đứng lời mời</legend>
          <label><input v-model="form.inviterRole" type="radio" value="couple">Cô dâu &amp; chú rể</label>
          <label><input v-model="form.inviterRole" type="radio" value="parents">Bố mẹ</label>
        </fieldset>
        <div class="form-grid">
          <label>Bên mời<select v-model="form.invitationSide"><option value="nha-trai">Nhà trai</option><option value="nha-gai">Nhà gái</option></select></label>
          <label>Hình thức<select v-model="form.deliveryType"><option value="invitation">Thiệp mời</option><option value="announcement">Thiệp báo hỷ</option></select></label>
        </div>
        <label v-if="editingId">Trạng thái<select v-model="form.isSent" :disabled="isSentLocked"><option :value="false">Chưa gửi</option><option :value="true">Đã gửi</option></select></label>
        <label class="message-toggle"><input v-model="form.twoMeals" type="checkbox">Đi ăn 2 bữa</label>
        <label class="message-toggle"><input v-model="hasPersonalMessage" type="checkbox" aria-controls="personal-message-input" :aria-expanded="hasPersonalMessage">Lời nhắn riêng</label>
        <label v-if="hasPersonalMessage" for="personal-message-input">Nội dung lời nhắn<textarea id="personal-message-input" v-model="form.personalMessage" rows="3" maxlength="2000" /></label>
        <label>Ghi chú nội bộ<textarea v-model="form.note" rows="3" maxlength="2000" /></label>
        <p v-if="formError" class="error" role="alert">{{ formError }}</p>
        <div class="actions"><button type="button" class="secondary" :disabled="saving" @click="dialog?.close()">Hủy</button><button type="submit" :disabled="saving">{{ saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Tạo thiệp' }}</button></div>
      </form>
    </dialog>
  </section>
</template>

<style scoped>
.invitations-panel { display: grid; gap: 22px; min-width: 0; padding: clamp(16px, 3vw, 28px); border: 1px solid #e2d4c9; background: #fffdf9; color: #2d2926; }
header, .actions, .dialog-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
h1 { margin: 0; font-size: clamp(1.8rem, 4vw, 2.8rem); line-height: 1.12; }
h2 { margin: 0; font-size: 1.5rem; }
.eyebrow { margin: 0 0 8px; color: #8f4f42; font-size: .78rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.badge { padding: 8px 12px; border: 1px solid #e2d4c9; font-size: .86rem; font-weight: 800; }
.hint { margin: 0; color: #786a60; line-height: 1.6; }
.filters { display: flex; flex-wrap: wrap; align-items: end; gap: 16px; }
.filters label:first-child { flex: 1; min-width: 200px; }
label { display: grid; gap: 8px; font-weight: 700; }
input, select, textarea { box-sizing: border-box; width: 100%; min-height: 48px; padding: 10px 14px; border: 1px solid #d8c8bc; background: #fffaf4; color: inherit; font: inherit; }
textarea { resize: vertical; }
.message-toggle { display: flex; align-items: center; gap: 10px; cursor: pointer; }
.message-toggle input { width: 18px; height: 18px; min-height: 0; padding: 0; margin: 0; accent-color: #6f3d34; }
.inviter-options { display: flex; flex-wrap: wrap; gap: 12px 24px; margin: 0; padding: 12px 0; border: 0; }
.inviter-options legend { font-weight: 700; padding: 0; }
.inviter-options label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.inviter-options input { width: 18px; height: 18px; min-height: 0; padding: 0; margin: 0; accent-color: #6f3d34; }
button, .row-actions a { display: inline-flex; align-items: center; justify-content: center; box-sizing: border-box; min-height: 44px; padding: 8px 14px; border: 0; background: #6f3d34; color: #fff; font: inherit; font-weight: 700; cursor: pointer; text-decoration: none; }
button:disabled { opacity: .6; cursor: not-allowed; }
.secondary, .sent-button { background: #efe4db; color: #6f3d34; }
.sent-button.sent { background: #e6efdf; color: #42643b; }
.sent-button.sent:disabled { opacity: 1; cursor: default; }
.danger { background: #9f3f34; }
.table-wrap { overflow-x: auto; border: 1px solid #e2d4c9; }
table { width: 100%; min-width: 960px; border-collapse: collapse; }
th, td { padding: 14px; text-align: left; vertical-align: top; border-bottom: 1px solid #eadfd7; }
th { background: #f1e8df; color: #5a514c; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; }
td { overflow-wrap: anywhere; }
.note { white-space: pre-wrap; max-width: 240px; }
.row-actions { display: flex; flex-wrap: nowrap; align-items: center; gap: 8px; }
.row-actions button, .row-actions a { font-size: .82rem; }
.row-actions a { white-space: nowrap; }
.row-actions .icon-action { flex: 0 0 44px; width: 44px; padding: 0; }
.row-actions button:focus-visible, .row-actions a:focus-visible { outline: 2px solid #8f4f42; outline-offset: 3px; }
.empty { text-align: center; padding: 36px 16px; color: #786a60; }
.error { color: #9f3f34; font-weight: 700; }
dialog { width: min(560px, calc(100% - 32px)); max-height: calc(100dvh - 40px); box-sizing: border-box; padding: 24px; border: 1px solid #e2d4c9; background: #fffdf9; color: #2d2926; overflow-y: auto; }
dialog::backdrop { background: rgb(35 26 22 / .55); }
form { display: grid; gap: 18px; }
.form-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
@media (max-width: 600px) { .form-grid { grid-template-columns: 1fr; } header { align-items: start; } .filters label { flex: 1; min-width: 140px; } }
</style>
