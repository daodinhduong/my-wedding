<script setup lang="ts">
import { Pencil } from 'lucide-vue-next'

type Invitation = {
  id: string
  inviterRole: 'parents' | 'couple'
  guestName: string
  note: string | null
  personalMessage: string | null
  twoMeals: boolean
  giftType: 'cash' | 'other' | null
  giftAmount: number | null
  isSent: boolean
  deliveryType: 'invitation' | 'announcement'
  invitationSide: 'nha-trai' | 'nha-gai'
  createdAt: string
}

const props = defineProps<{ adminPassword: string }>()
const invitations = ref<Invitation[]>([])
const loading = ref(true)
const saving = ref(false)
const error = ref('')
const formError = ref('')
const message = ref('')
const search = ref('')
const inviterFilter = ref<'all' | Invitation['inviterRole']>('all')
const giftFilter = ref<'all' | 'has_gift' | 'no_gift'>('all')
const sideFilter = ref<Invitation['invitationSide']>('nha-trai')
const dialog = ref<HTMLDialogElement>()
const editingItem = ref<Invitation | null>(null)
const form = reactive({
  giftType: 'cash' as 'cash' | 'other',
  giftAmount: '',
  note: ''
})

const currencyFormatter = new Intl.NumberFormat('vi-VN')

function formatAmountInput(value: string | number | null | undefined): string {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits ? currencyFormatter.format(Number(digits)) : ''
}

function parseAmountInput(value: string | number | null | undefined): number | null {
  const digits = String(value ?? '').replace(/\D/g, '')
  return digits ? Number(digits) : null
}

function onGiftAmountInput(event: Event) {
  const input = event.target as HTMLInputElement
  const formatted = formatAmountInput(input.value)
  form.giftAmount = formatted
  input.value = formatted
}

const formattedGiftAmount = computed({
  get: () => formatAmountInput(form.giftAmount),
  set: (value: string) => {
    form.giftAmount = formatAmountInput(value)
  }
})

function formatCurrency(amount: number | null) {
  if (amount === null || amount === undefined) return '—'
  return `${currencyFormatter.format(amount)} đ`
}

function isGifted(item: Invitation) {
  return item.giftType === 'other' || (item.giftAmount !== null && item.giftAmount > 0)
}

const filtered = computed(() => invitations.value.filter((item) => {
  const keyword = search.value.trim().toLocaleLowerCase('vi')
  const gifted = isGifted(item)
  return (!keyword || `${item.guestName} ${item.note || ''}`.toLocaleLowerCase('vi').includes(keyword))
    && (inviterFilter.value === 'all' || item.inviterRole === inviterFilter.value)
    && (giftFilter.value === 'all' || (giftFilter.value === 'has_gift' ? gifted : !gifted))
    && item.invitationSide === sideFilter.value
}))

const giftedCount = computed(() => filtered.value.filter(isGifted).length)
const totalGiftAmount = computed(() => filtered.value.reduce((sum, item) => sum + (item.giftType === 'other' ? 0 : (item.giftAmount ?? 0)), 0))

function headers() {
  return { 'x-admin-password': props.adminPassword }
}

function errorText(cause: unknown) {
  const value = cause as { data?: { statusMessage?: string }; message?: string }
  return value?.data?.statusMessage || value?.message || 'Không thể thực hiện. Vui lòng thử lại.'
}

async function load() {
  loading.value = true
  error.value = ''
  try {
    invitations.value = await $fetch<Invitation[]>('/api/admin/invitations', { headers: headers() })
  }
  catch (cause) {
    error.value = errorText(cause)
  }
  finally {
    loading.value = false
  }
}

onMounted(load)
onActivated(load)

function openEdit(item: Invitation) {
  editingItem.value = item
  form.giftType = item.giftType || 'cash'
  form.giftAmount = formatAmountInput(item.giftAmount)
  form.note = item.note || ''
  formError.value = ''
  dialog.value?.showModal()
}

async function save() {
  if (saving.value || !editingItem.value) return
  saving.value = true
  formError.value = ''
  try {
    const current = editingItem.value
    const giftAmount = form.giftType === 'cash' ? parseAmountInput(form.giftAmount) : null
    const giftType = form.giftType === 'other' ? 'other' : (giftAmount !== null ? 'cash' : null)
    const updated = await $fetch<Invitation>(`/api/admin/invitations/${current.id}`, {
      method: 'PATCH',
      headers: headers(),
      body: {
        twoMeals: current.twoMeals,
        inviterRole: current.inviterRole,
        guestName: current.guestName,
        personalMessage: current.personalMessage || '',
        deliveryType: current.deliveryType,
        invitationSide: current.invitationSide,
        isSent: current.isSent,
        note: form.note,
        giftType,
        giftAmount
      }
    })
    invitations.value = invitations.value.map(old => old.id === updated.id ? updated : old)
    dialog.value?.close()
    message.value = `Đã cập nhật tiền mừng cho ${updated.guestName}.`
  }
  catch (cause) {
    formError.value = errorText(cause)
  }
  finally {
    saving.value = false
  }
}
</script>

<template>
  <section class="gifts-panel" role="tabpanel" aria-label="Tiền mừng">
    <header>
      <div>
        <p class="eyebrow">Admin</p>
        <h1>Quản lý tiền mừng</h1>
      </div>
      <div class="actions">
        <span class="badge">{{ filtered.length }} thiệp</span>
        <span class="badge">{{ giftedCount }} đã gửi tiền mừng</span>
        <span class="badge total">Tổng: {{ formatCurrency(totalGiftAmount) }}</span>
      </div>
    </header>
    <p class="hint">Theo dõi và cập nhật tiền mừng cưới theo từng thiệp mời. Dữ liệu đồng bộ trực tiếp với tab Thiệp mời.</p>
    <div class="filters">
      <label>Tìm kiếm<input v-model="search" type="search" placeholder="Tên khách, ghi chú"></label>
      <label>Người mời
        <select v-model="inviterFilter">
          <option value="all">Tất cả</option>
          <option value="couple">Cô dâu &amp; chú rể</option>
          <option value="parents">Bố mẹ</option>
        </select>
      </label>
      <label>Trạng thái mừng
        <select v-model="giftFilter">
          <option value="all">Tất cả</option>
          <option value="has_gift">Đã gửi tiền mừng</option>
          <option value="no_gift">Chưa nhập</option>
        </select>
      </label>
      <label>Bên gửi
        <select v-model="sideFilter">
          <option value="nha-trai">Nhà trai</option>
          <option value="nha-gai">Nhà gái</option>
        </select>
      </label>
      <button type="button" class="secondary" :disabled="loading" @click="load">Tải lại</button>
    </div>
    <p v-if="error" class="error" role="alert">{{ error }}</p>
    <p v-if="message" class="hint" role="status">{{ message }}</p>
    <div class="table-wrap" :aria-busy="loading">
      <table>
        <thead>
          <tr>
            <th>STT</th>
            <th>Tên khách mời</th>
            <th>Người đứng lời mời</th>
            <th>Bên mời</th>
            <th>Ghi chú</th>
            <th>Tiền mừng</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="empty">Đang tải danh sách tiền mừng...</td></tr>
          <tr v-else-if="!filtered.length"><td colspan="7" class="empty">{{ invitations.length ? 'Không có thiệp phù hợp với bộ lọc.' : 'Chưa có thiệp mời nào.' }}</td></tr>
          <template v-else>
            <tr v-for="(item, index) in filtered" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td><strong>{{ item.guestName }}</strong></td>
              <td>{{ item.inviterRole === 'parents' ? 'Bố mẹ' : 'Cô dâu & chú rể' }}</td>
              <td>{{ item.invitationSide === 'nha-trai' ? 'Nhà trai' : 'Nhà gái' }}</td>
              <td class="note">{{ item.note || '—' }}</td>
              <td>
                <span v-if="item.giftType === 'other'" class="other-tag">Khác</span>
                <span v-else class="amount" :class="{ empty: item.giftAmount === null }">{{ formatCurrency(item.giftAmount) }}</span>
              </td>
              <td>
                <button type="button" class="icon-action" aria-label="Nhập hoặc sửa tiền mừng" title="Nhập / sửa tiền mừng" @click="openEdit(item)">
                  <Pencil :size="16" aria-hidden="true" />
                  <span>{{ isGifted(item) ? 'Sửa' : 'Nhập' }}</span>
                </button>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <dialog ref="dialog" aria-labelledby="gift-form-title" @cancel="saving && $event.preventDefault()">
      <form @submit.prevent="save">
        <div class="dialog-header">
          <h2 id="gift-form-title">Tiền mừng — {{ editingItem?.guestName }}</h2>
          <button type="button" class="secondary" :disabled="saving" aria-label="Đóng" @click="dialog?.close()">×</button>
        </div>
        <fieldset class="gift-options">
          <legend>Hình thức</legend>
          <label><input v-model="form.giftType" type="radio" value="cash">Tiền mặt</label>
          <label><input v-model="form.giftType" type="radio" value="other">Khác</label>
        </fieldset>
        <label v-if="form.giftType === 'cash'">
          Tiền mừng cưới (VNĐ)
          <input v-model="formattedGiftAmount" type="text" inputmode="numeric" placeholder="Ví dụ: 500.000" @input="onGiftAmountInput">
        </label>
        <p v-if="form.giftType === 'other'" class="hint">Không cần nhập số tiền — ghi chi tiết vào ô Ghi chú bên dưới.</p>
        <label>
          Ghi chú
          <textarea v-model="form.note" rows="3" maxlength="2000" :placeholder="form.giftType === 'other' ? 'Ví dụ: 1 chỉ vàng...' : ''" />
        </label>
        <p v-if="formError" class="error" role="alert">{{ formError }}</p>
        <div class="actions">
          <button type="button" class="secondary" :disabled="saving" @click="dialog?.close()">Hủy</button>
          <button type="submit" :disabled="saving">{{ saving ? 'Đang lưu...' : 'Lưu' }}</button>
        </div>
      </form>
    </dialog>
  </section>
</template>

<style scoped>
.gifts-panel { display: grid; gap: 22px; min-width: 0; padding: clamp(16px, 3vw, 28px); border: 1px solid #e2d4c9; background: #fffdf9; color: #2d2926; }
header, .actions, .dialog-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
h1 { margin: 0; font-size: clamp(1.8rem, 4vw, 2.8rem); line-height: 1.12; }
h2 { margin: 0; font-size: 1.35rem; }
.eyebrow { margin: 0 0 8px; color: #8f4f42; font-size: .78rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.badge { padding: 8px 12px; border: 1px solid #e2d4c9; font-size: .86rem; font-weight: 800; }
.badge.total { background: #e6efdf; border-color: #c8dbb9; color: #2f5228; }
.hint { margin: 0; color: #786a60; line-height: 1.6; }
.filters { display: flex; flex-wrap: wrap; align-items: end; gap: 16px; }
.filters label:first-child { flex: 1; min-width: 200px; }
label { display: grid; gap: 8px; font-weight: 700; }
input, select, textarea { box-sizing: border-box; width: 100%; min-height: 48px; padding: 10px 14px; border: 1px solid #d8c8bc; background: #fffaf4; color: inherit; font: inherit; }
textarea { resize: vertical; }
.gift-options { display: flex; flex-wrap: wrap; gap: 12px 24px; margin: 0; padding: 6px 0; border: 0; }
.gift-options legend { font-weight: 700; padding: 0; }
.gift-options label { display: flex; align-items: center; gap: 8px; cursor: pointer; }
.gift-options input { width: 18px; height: 18px; min-height: 0; padding: 0; margin: 0; accent-color: #6f3d34; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box; min-height: 44px; padding: 8px 14px; border: 0; background: #6f3d34; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
button:disabled { opacity: .6; cursor: not-allowed; }
.secondary { background: #efe4db; color: #6f3d34; }
.table-wrap { overflow-x: auto; border: 1px solid #e2d4c9; }
table { width: 100%; min-width: 780px; border-collapse: collapse; }
th, td { padding: 14px; text-align: left; vertical-align: middle; border-bottom: 1px solid #eadfd7; }
th { background: #f1e8df; color: #5a514c; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; }
tbody tr { transition: background-color .15s ease; }
tbody tr:hover { background: #f6ede4; }
td { overflow-wrap: anywhere; }
.note { white-space: pre-wrap; max-width: 260px; }
.amount { font-weight: 800; color: #2f5228; white-space: nowrap; }
.amount.empty { font-weight: 400; color: #786a60; }
.other-tag { display: inline-block; padding: 4px 10px; border: 1px solid #e6cf87; background: #fbf3d9; color: #7a5a0b; font-size: .84rem; font-weight: 800; white-space: nowrap; }
.icon-action { min-height: 38px; padding: 6px 12px; font-size: .85rem; }
.empty { text-align: center; color: #786a60; padding: 36px; }
.error { margin: 0; color: #9f3f34; font-weight: 700; }
dialog { width: min(520px, calc(100vw - 24px)); padding: 24px; border: 1px solid #d8c8bc; background: #fffdf9; color: #2d2926; }
dialog::backdrop { background: rgba(31, 21, 17, .48); }
dialog form { display: grid; gap: 16px; }
</style>
