<script setup lang="ts">
import { Pencil, Trash2 } from 'lucide-vue-next'

type WeddingExpense = {
  id: string
  title: string
  amount: number
  side: 'nha-trai' | 'nha-gai'
  note: string | null
  createdAt: string
}

const props = defineProps<{ adminPassword: string }>()
const expenses = ref<WeddingExpense[]>([])
const loading = ref(true)
const saving = ref(false)
const busyId = ref('')
const error = ref('')
const formError = ref('')
const message = ref('')
const search = ref('')
const sideFilter = ref<'all' | WeddingExpense['side']>('all')
const dialog = ref<HTMLDialogElement>()
const editingId = ref('')
const form = reactive({
  title: '',
  amount: '',
  side: 'nha-trai' as WeddingExpense['side'],
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

function onAmountInput(event: Event) {
  const input = event.target as HTMLInputElement
  const formatted = formatAmountInput(input.value)
  form.amount = formatted
  input.value = formatted
}

const formattedAmount = computed({
  get: () => formatAmountInput(form.amount),
  set: (value: string) => {
    form.amount = formatAmountInput(value)
  }
})

function formatCurrency(amount: number) {
  return `${currencyFormatter.format(amount)} đ`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value))
}

const filtered = computed(() => expenses.value.filter((item) => {
  const keyword = search.value.trim().toLocaleLowerCase('vi')
  return (!keyword || `${item.title} ${item.note || ''}`.toLocaleLowerCase('vi').includes(keyword))
    && (sideFilter.value === 'all' || item.side === sideFilter.value)
}))

const totalAmount = computed(() => filtered.value.reduce((sum, item) => sum + item.amount, 0))

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
    expenses.value = await $fetch<WeddingExpense[]>('/api/admin/expenses', { headers: headers() })
  }
  catch (cause) {
    error.value = errorText(cause)
  }
  finally {
    loading.value = false
  }
}

onMounted(load)

function openForm(item?: WeddingExpense) {
  editingId.value = item?.id || ''
  form.title = item?.title || ''
  form.amount = formatAmountInput(item?.amount)
  form.side = item?.side || (sideFilter.value === 'nha-gai' ? 'nha-gai' : 'nha-trai')
  form.note = item?.note || ''
  formError.value = ''
  dialog.value?.showModal()
}

async function save() {
  if (saving.value) return
  const amount = parseAmountInput(form.amount)
  if (amount === null) {
    formError.value = 'Vui lòng nhập số tiền chi tiêu.'
    return
  }

  saving.value = true
  formError.value = ''
  try {
    const item = await $fetch<WeddingExpense>(editingId.value ? `/api/admin/expenses/${editingId.value}` : '/api/admin/expenses', {
      method: editingId.value ? 'PATCH' : 'POST',
      headers: headers(),
      body: {
        title: form.title,
        amount,
        side: form.side,
        note: form.note
      }
    })
    if (editingId.value) {
      expenses.value = expenses.value.map(old => old.id === item.id ? item : old)
    }
    else {
      expenses.value.unshift(item)
    }
    dialog.value?.close()
    message.value = editingId.value ? `Đã cập nhật khoản chi “${item.title}”.` : `Đã thêm khoản chi “${item.title}”.`
  }
  catch (cause) {
    formError.value = errorText(cause)
  }
  finally {
    saving.value = false
  }
}

async function remove(item: WeddingExpense) {
  if (busyId.value || !window.confirm(`Xóa khoản chi “${item.title}”?`)) return
  busyId.value = item.id
  error.value = ''
  try {
    await $fetch(`/api/admin/expenses/${item.id}`, { method: 'DELETE', headers: headers() })
    expenses.value = expenses.value.filter(old => old.id !== item.id)
    message.value = `Đã xóa khoản chi “${item.title}”.`
  }
  catch (cause) {
    error.value = errorText(cause)
  }
  finally {
    busyId.value = ''
  }
}
</script>

<template>
  <section class="expenses-panel" role="tabpanel" aria-label="Chi tiêu">
    <header>
      <div>
        <p class="eyebrow">Admin</p>
        <h1>Quản lý chi tiêu</h1>
      </div>
      <div class="actions">
        <span class="badge">{{ filtered.length }} khoản chi</span>
        <span class="badge total">Tổng chi: {{ formatCurrency(totalAmount) }}</span>
        <button type="button" @click="openForm()">Thêm khoản chi</button>
      </div>
    </header>
    <p class="hint">Theo dõi các khoản chi phí chuẩn bị và tổ chức đám cưới.</p>
    <div class="filters">
      <label>Tìm kiếm<input v-model="search" type="search" placeholder="Hạng mục, ghi chú"></label>
      <label>Bên
        <select v-model="sideFilter">
          <option value="all">Tất cả</option>
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
            <th>Hạng mục chi tiêu</th>
            <th>Bên</th>
            <th>Số tiền</th>
            <th>Ghi chú</th>
            <th>Ngày tạo</th>
            <th>Thao tác</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="loading"><td colspan="7" class="empty">Đang tải danh sách chi tiêu...</td></tr>
          <tr v-else-if="!filtered.length"><td colspan="7" class="empty">{{ expenses.length ? 'Không có khoản chi phù hợp.' : 'Chưa có khoản chi nào. Bấm “Thêm khoản chi” để tạo mới.' }}</td></tr>
          <template v-else>
            <tr v-for="(item, index) in filtered" :key="item.id">
              <td>{{ index + 1 }}</td>
              <td><strong>{{ item.title }}</strong></td>
              <td>{{ item.side === 'nha-gai' ? 'Nhà gái' : 'Nhà trai' }}</td>
              <td class="amount">{{ formatCurrency(item.amount) }}</td>
              <td class="note">{{ item.note || '—' }}</td>
              <td class="date">{{ formatDate(item.createdAt) }}</td>
              <td>
                <div class="row-actions">
                  <button type="button" class="icon-action" aria-label="Sửa khoản chi" title="Sửa khoản chi" :disabled="!!busyId" @click="openForm(item)"><Pencil :size="18" aria-hidden="true" /></button>
                  <button type="button" class="danger icon-action" aria-label="Xóa khoản chi" title="Xóa khoản chi" :disabled="!!busyId" @click="remove(item)"><Trash2 :size="18" aria-hidden="true" /></button>
                </div>
              </td>
            </tr>
          </template>
        </tbody>
      </table>
    </div>
    <dialog ref="dialog" aria-labelledby="expense-form-title" @cancel="saving && $event.preventDefault()">
      <form @submit.prevent="save">
        <div class="dialog-header">
          <h2 id="expense-form-title">{{ editingId ? 'Sửa khoản chi' : 'Thêm khoản chi' }}</h2>
          <button type="button" class="secondary" :disabled="saving" aria-label="Đóng" @click="dialog?.close()">×</button>
        </div>
        <label>
          Hạng mục chi tiêu
          <input v-model="form.title" maxlength="200" required placeholder="Ví dụ: Đặt cọc nhà hàng, Chụp ảnh cưới...">
        </label>
        <label>
          Bên
          <select v-model="form.side">
            <option value="nha-trai">Nhà trai</option>
            <option value="nha-gai">Nhà gái</option>
          </select>
        </label>
        <label>
          Số tiền (VNĐ)
          <input v-model="formattedAmount" type="text" inputmode="numeric" required placeholder="Ví dụ: 5.000.000" @input="onAmountInput">
        </label>
        <label>
          Ghi chú
          <textarea v-model="form.note" rows="3" maxlength="2000" placeholder="Chi tiết khoản chi (nếu có)..." />
        </label>
        <p v-if="formError" class="error" role="alert">{{ formError }}</p>
        <div class="actions">
          <button type="button" class="secondary" :disabled="saving" @click="dialog?.close()">Hủy</button>
          <button type="submit" :disabled="saving">{{ saving ? 'Đang lưu...' : editingId ? 'Lưu thay đổi' : 'Thêm khoản chi' }}</button>
        </div>
      </form>
    </dialog>
  </section>
</template>

<style scoped>
.expenses-panel { display: grid; gap: 22px; min-width: 0; padding: clamp(16px, 3vw, 28px); border: 1px solid #e2d4c9; background: #fffdf9; color: #2d2926; }
header, .actions, .dialog-header { display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 10px; }
h1 { margin: 0; font-size: clamp(1.8rem, 4vw, 2.8rem); line-height: 1.12; }
h2 { margin: 0; font-size: 1.4rem; }
.eyebrow { margin: 0 0 8px; color: #8f4f42; font-size: .78rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.badge { padding: 8px 12px; border: 1px solid #e2d4c9; font-size: .86rem; font-weight: 800; }
.badge.total { background: #fbeae7; border-color: #ebc9c3; color: #8c3127; }
.hint { margin: 0; color: #786a60; line-height: 1.6; }
.filters { display: flex; flex-wrap: wrap; align-items: end; gap: 16px; }
.filters label:first-child { flex: 1; min-width: 220px; }
label { display: grid; gap: 8px; font-weight: 700; }
input, select, textarea { box-sizing: border-box; width: 100%; min-height: 48px; padding: 10px 14px; border: 1px solid #d8c8bc; background: #fffaf4; color: inherit; font: inherit; }
textarea { resize: vertical; }
button { display: inline-flex; align-items: center; justify-content: center; gap: 6px; box-sizing: border-box; min-height: 44px; padding: 8px 14px; border: 0; background: #6f3d34; color: #fff; font: inherit; font-weight: 700; cursor: pointer; }
button:disabled { opacity: .6; cursor: not-allowed; }
.secondary { background: #efe4db; color: #6f3d34; }
.danger { background: #9f3f34; }
.table-wrap { overflow-x: auto; border: 1px solid #e2d4c9; }
table { width: 100%; min-width: 780px; border-collapse: collapse; }
th, td { padding: 14px; text-align: left; vertical-align: middle; border-bottom: 1px solid #eadfd7; }
th { background: #f1e8df; color: #5a514c; font-size: .78rem; text-transform: uppercase; letter-spacing: .06em; }
tbody tr { transition: background-color .15s ease; }
tbody tr:hover { background: #f6ede4; }
td { overflow-wrap: anywhere; }
.amount { font-weight: 800; color: #8c3127; white-space: nowrap; }
.note { white-space: pre-wrap; max-width: 300px; }
.date { white-space: nowrap; color: #6f6259; font-size: .9rem; }
.row-actions { display: flex; flex-wrap: nowrap; align-items: center; gap: 8px; }
.row-actions .icon-action { flex: 0 0 44px; width: 44px; padding: 0; }
.empty { text-align: center; color: #786a60; padding: 36px; }
.error { margin: 0; color: #9f3f34; font-weight: 700; }
dialog { width: min(520px, calc(100vw - 24px)); padding: 24px; border: 1px solid #d8c8bc; background: #fffdf9; color: #2d2926; }
dialog::backdrop { background: rgba(31, 21, 17, .48); }
dialog form { display: grid; gap: 16px; }
</style>
