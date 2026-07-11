<script setup lang="ts">
type AdminWeddingResponse = {
  id: string
  guestName: string
  wishMessage: string | null
  attendanceStatus: 'attending' | 'not_attending' | 'pending'
  guestCount: number
  isApproved: boolean
  responseSource: 'website' | 'admin'
  createdAt: string
}

type CreateResponseForm = {
  guestName: string
  wishMessage: string
  attendanceStatus: 'attending' | 'not_attending'
  guestCount: number
}

const password = ref('')
const isUnlocked = ref(false)
const isLoading = ref(false)
const isCreateDialogOpen = ref(false)
const isEditDialogOpen = ref(false)
const isCreatingResponse = ref(false)
const isEditingResponse = ref(false)
const errorMessage = ref('')
const createStatusMessage = ref('')
const editStatusMessage = ref('')
const responses = ref<AdminWeddingResponse[]>([])
const updatingIds = ref(new Set<string>())
const deletingIds = ref(new Set<string>())
const editingResponse = ref<AdminWeddingResponse | null>(null)
const createForm = reactive<CreateResponseForm>({
  guestName: '',
  wishMessage: '',
  attendanceStatus: 'attending',
  guestCount: 1
})
const editForm = reactive({
  attendanceStatus: 'attending' as 'attending' | 'not_attending',
  guestCount: 1
})

const approvedCount = computed(() => responses.value.filter((item) => item.isApproved).length)
const pendingCount = computed(() => responses.value.filter((item) => !item.isApproved).length)
const approvedGuestCount = computed(() => {
  return responses.value.reduce((total, item) => {
    if (!item.isApproved || item.attendanceStatus !== 'attending') {
      return total
    }

    return total + item.guestCount
  }, 0)
})

function getAdminHeaders() {
  return {
    'x-admin-password': password.value
  }
}

async function loadResponses() {
  isLoading.value = true
  errorMessage.value = ''

  try {
    responses.value = await $fetch<AdminWeddingResponse[]>('/api/admin/responses', {
      headers: getAdminHeaders()
    })
    isUnlocked.value = true
  }
  catch (error) {
    isUnlocked.value = false
    errorMessage.value = error instanceof Error ? error.message : 'Không thể tải danh sách.'
  }
  finally {
    isLoading.value = false
  }
}

async function toggleApproval(response: AdminWeddingResponse) {
  updatingIds.value.add(response.id)
  errorMessage.value = ''

  try {
    const updated = await $fetch<{ id: string; isApproved: boolean }>(`/api/admin/responses/${response.id}`, {
      method: 'PATCH',
      headers: getAdminHeaders(),
      body: {
        isApproved: !response.isApproved
      }
    })

    response.isApproved = updated.isApproved
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Không thể cập nhật trạng thái duyệt.'
  }
  finally {
    updatingIds.value.delete(response.id)
  }
}

async function deleteResponse(response: AdminWeddingResponse) {
  const confirmed = window.confirm(`Xóa phản hồi của “${response.guestName}”? Thao tác này không thể hoàn tác.`)

  if (!confirmed) {
    return
  }

  deletingIds.value.add(response.id)
  errorMessage.value = ''

  try {
    await $fetch(`/api/admin/responses/${response.id}`, {
      method: 'DELETE',
      headers: getAdminHeaders()
    })

    responses.value = responses.value.filter(item => item.id !== response.id)
  }
  catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'Không thể xóa bản ghi.'
  }
  finally {
    deletingIds.value.delete(response.id)
  }
}

function openCreateDialog() {
  errorMessage.value = ''
  createStatusMessage.value = ''
  isCreateDialogOpen.value = true
}

function closeCreateDialog() {
  if (isCreatingResponse.value) {
    return
  }

  isCreateDialogOpen.value = false
  createStatusMessage.value = ''
}

function resetCreateForm() {
  createForm.guestName = ''
  createForm.wishMessage = ''
  createForm.attendanceStatus = 'attending'
  createForm.guestCount = 1
}

function openEditDialog(response: AdminWeddingResponse) {
  if (response.attendanceStatus === 'pending') {
    editForm.attendanceStatus = 'attending'
    editForm.guestCount = 1
  }
  else {
    editForm.attendanceStatus = response.attendanceStatus
    editForm.guestCount = response.attendanceStatus === 'attending' ? response.guestCount : 1
  }

  editingResponse.value = response
  editStatusMessage.value = ''
  errorMessage.value = ''
  isEditDialogOpen.value = true
}

function closeEditDialog() {
  if (isEditingResponse.value) {
    return
  }

  isEditDialogOpen.value = false
  editStatusMessage.value = ''
  editingResponse.value = null
}

async function createResponse() {
  if (isCreatingResponse.value) {
    return
  }

  isCreatingResponse.value = true
  errorMessage.value = ''
  createStatusMessage.value = ''

  try {
    const created = await $fetch<AdminWeddingResponse>('/api/admin/responses', {
      method: 'POST',
      headers: getAdminHeaders(),
      body: {
        guestName: createForm.guestName,
        wishMessage: createForm.wishMessage,
        attendanceStatus: createForm.attendanceStatus,
        guestCount: createForm.attendanceStatus === 'attending' ? createForm.guestCount : 0
      }
    })

    responses.value = [created, ...responses.value]
    resetCreateForm()
    isCreateDialogOpen.value = false
  }
  catch (error) {
    createStatusMessage.value = error instanceof Error ? error.message : 'Không thể thêm khách mời.'
  }
  finally {
    isCreatingResponse.value = false
  }
}

async function updateResponseAttendance() {
  const response = editingResponse.value

  if (!response || isEditingResponse.value) {
    return
  }

  isEditingResponse.value = true
  editStatusMessage.value = ''
  errorMessage.value = ''

  try {
    const updated = await $fetch<{
      id: string
      isApproved: boolean
      attendanceStatus: AdminWeddingResponse['attendanceStatus']
      guestCount: number
    }>(`/api/admin/responses/${response.id}`, {
      method: 'PATCH',
      headers: getAdminHeaders(),
      body: {
        attendanceStatus: editForm.attendanceStatus,
        guestCount: editForm.attendanceStatus === 'attending' ? editForm.guestCount : 0
      }
    })

    response.attendanceStatus = updated.attendanceStatus
    response.guestCount = updated.guestCount
    response.isApproved = updated.isApproved
    isEditDialogOpen.value = false
    editStatusMessage.value = ''
    editingResponse.value = null
  }
  catch (error) {
    editStatusMessage.value = error instanceof Error ? error.message : 'Không thể cập nhật khách mời.'
  }
  finally {
    isEditingResponse.value = false
  }
}

function formatAttendance(status: AdminWeddingResponse['attendanceStatus']) {
  if (status === 'attending') {
    return 'Tham dự'
  }

  if (status === 'not_attending') {
    return 'Không tham dự'
  }

  return 'Chưa rõ'
}

function formatResponseSource(source: AdminWeddingResponse['responseSource']) {
  return source === 'admin' ? 'Admin thêm' : 'Khách nhập'
}

function formatCreatedAt(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    dateStyle: 'short',
    timeStyle: 'short'
  }).format(new Date(value))
}
</script>

<template>
  <main class="admin-page">
    <section v-if="!isUnlocked" class="login-panel">
      <div>
        <p class="eyebrow">Admin</p>
        <h1>Quản lý lời chúc</h1>
      </div>

      <form class="login-form" @submit.prevent="loadResponses">
        <label>
          Mật khẩu
          <input
            v-model="password"
            type="password"
            autocomplete="current-password"
            required
            placeholder="Nhập mật khẩu admin"
          >
        </label>

        <button type="submit" :disabled="isLoading">
          {{ isLoading ? 'Đang kiểm tra...' : 'Vào trang admin' }}
        </button>
        <p v-if="errorMessage" class="status is-error">{{ errorMessage }}</p>
      </form>
    </section>

    <section v-else class="admin-shell">
      <header class="admin-header">
        <div>
          <p class="eyebrow">Admin</p>
          <h1>Danh sách phản hồi</h1>
        </div>

        <div class="admin-actions">
          <span>{{ responses.length }} bản ghi</span>
          <span>{{ pendingCount }} chờ duyệt</span>
          <span>{{ approvedCount }} đã duyệt</span>
          <span>{{ approvedGuestCount }} khách mời</span>
          <button type="button" @click="openCreateDialog">
            Thêm mới
          </button>
        </div>
      </header>

      <p v-if="errorMessage" class="status is-error">{{ errorMessage }}</p>

      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Khách</th>
              <th>Lời chúc</th>
              <th>Tham dự</th>
              <th>Số người</th>
              <th>Nguồn</th>
              <th>Ngày gửi</th>
              <th>Hiển thị</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!responses.length">
              <td colspan="7" class="empty-state">Chưa có phản hồi nào.</td>
            </tr>
            <tr v-for="response in responses" :key="response.id">
              <td>
                <strong>{{ response.guestName }}</strong>
                <small>#{{ response.id }}</small>
              </td>
              <td class="wish-cell">
                {{ response.wishMessage || 'Không có lời chúc' }}
              </td>
              <td>{{ formatAttendance(response.attendanceStatus) }}</td>
              <td>{{ response.guestCount }}</td>
              <td>
                <span class="source-badge" :class="`is-${response.responseSource}`">
                  {{ formatResponseSource(response.responseSource) }}
                </span>
              </td>
              <td>{{ formatCreatedAt(response.createdAt) }}</td>
              <td>
                <div class="row-actions">
                  <button
                    class="edit-button"
                    type="button"
                    :disabled="updatingIds.has(response.id) || deletingIds.has(response.id)"
                    @click="openEditDialog(response)"
                  >
                    Sửa
                  </button>
                  <button
                    class="approval-button"
                    type="button"
                    :class="{ 'is-approved': response.isApproved }"
                    :disabled="updatingIds.has(response.id) || deletingIds.has(response.id)"
                    @click="toggleApproval(response)"
                  >
                    {{ response.isApproved ? 'Ẩn' : 'Duyệt' }}
                  </button>
                  <button
                    class="delete-button"
                    type="button"
                    :disabled="updatingIds.has(response.id) || deletingIds.has(response.id)"
                    @click="deleteResponse(response)"
                  >
                    {{ deletingIds.has(response.id) ? 'Đang xóa...' : 'Xóa' }}
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div
        v-if="isCreateDialogOpen"
        class="modal-backdrop"
        role="presentation"
        @click.self="closeCreateDialog"
      >
        <section
          class="create-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="create-response-title"
        >
          <header class="create-dialog__header">
            <div>
              <p class="eyebrow">Khách mời</p>
              <h2 id="create-response-title">Thêm người tham dự</h2>
            </div>
            <button
              class="icon-button"
              type="button"
              :disabled="isCreatingResponse"
              aria-label="Đóng"
              @click="closeCreateDialog"
            >
              ×
            </button>
          </header>

          <form class="create-form" @submit.prevent="createResponse">
            <label>
              Tên khách mời
              <input
                v-model="createForm.guestName"
                type="text"
                required
                autocomplete="off"
                placeholder="Nhập tên khách mời"
              >
            </label>

            <label>
              Trạng thái tham dự
              <select v-model="createForm.attendanceStatus">
                <option value="attending">Tham dự</option>
                <option value="not_attending">Không tham dự</option>
              </select>
            </label>

            <label v-if="createForm.attendanceStatus === 'attending'">
              Số người
              <input
                v-model.number="createForm.guestCount"
                type="number"
                min="1"
                max="20"
                required
              >
            </label>

            <label>
              Lời chúc
              <textarea
                v-model="createForm.wishMessage"
                rows="4"
                placeholder="Có thể để trống"
              />
            </label>

            <p v-if="createStatusMessage" class="status is-error">{{ createStatusMessage }}</p>

            <div class="create-form__actions">
              <button type="button" :disabled="isCreatingResponse" @click="closeCreateDialog">
                Hủy
              </button>
              <button type="submit" :disabled="isCreatingResponse">
                {{ isCreatingResponse ? 'Đang thêm...' : 'Thêm khách mời' }}
              </button>
            </div>
          </form>
        </section>
      </div>

      <div
        v-if="isEditDialogOpen"
        class="modal-backdrop"
        role="presentation"
        @click.self="closeEditDialog"
      >
        <section
          class="create-dialog"
          role="dialog"
          aria-modal="true"
          aria-labelledby="edit-response-title"
        >
          <header class="create-dialog__header">
            <div>
              <p class="eyebrow">Chỉnh sửa</p>
              <h2 id="edit-response-title">{{ editingResponse?.guestName }}</h2>
            </div>
            <button
              class="icon-button"
              type="button"
              :disabled="isEditingResponse"
              aria-label="Đóng"
              @click="closeEditDialog"
            >
              ×
            </button>
          </header>

          <form class="create-form" @submit.prevent="updateResponseAttendance">
            <label>
              Trạng thái tham dự
              <select v-model="editForm.attendanceStatus">
                <option value="attending">Tham dự</option>
                <option value="not_attending">Không tham dự</option>
              </select>
            </label>

            <label v-if="editForm.attendanceStatus === 'attending'">
              Số người
              <input
                v-model.number="editForm.guestCount"
                type="number"
                min="1"
                max="20"
                required
              >
            </label>

            <p v-if="editStatusMessage" class="status is-error">{{ editStatusMessage }}</p>

            <div class="create-form__actions">
              <button type="button" :disabled="isEditingResponse" @click="closeEditDialog">
                Hủy
              </button>
              <button type="submit" :disabled="isEditingResponse">
                {{ isEditingResponse ? 'Đang lưu...' : 'Lưu thay đổi' }}
              </button>
            </div>
          </form>
        </section>
      </div>
    </section>
  </main>
</template>

<style scoped>
@import url("https://fonts.googleapis.com/css2?family=Be+Vietnam+Pro:wght@400;500;600;700;800&display=swap&subset=vietnamese");

:global(body) {
  margin: 0;
  background: #f7f3ee;
  color: #2d2926;
  font-family: "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif;
}

.admin-page {
  min-height: 100vh;
  padding: clamp(18px, 4vw, 42px);
}

.login-panel,
.admin-shell {
  width: min(100%, 1120px);
  margin: 0 auto;
}

.login-panel {
  min-height: calc(100vh - 84px);
  display: grid;
  align-content: center;
  gap: 28px;
  max-width: 440px;
}

.eyebrow {
  margin: 0 0 8px;
  color: #8f4f42;
  font-size: 0.78rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-family: "Be Vietnam Pro", ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(2rem, 4.5vw, 3.25rem);
  font-weight: 800;
  line-height: 1.12;
}

h2 {
  margin: 0;
  font-size: clamp(1.35rem, 3vw, 2rem);
  line-height: 1.2;
}

.login-form {
  display: grid;
  gap: 16px;
  padding: 24px;
  border: 1px solid #e2d4c9;
  background: #fffdf9;
}

label {
  display: grid;
  gap: 8px;
  font-weight: 800;
}

input,
select,
textarea {
  min-height: 48px;
  border: 1px solid #d8c8bc;
  background: #fffaf4;
  padding: 0 14px;
  color: inherit;
  font: inherit;
  font-weight: 500;
}

textarea {
  min-height: 112px;
  padding: 12px 14px;
  resize: vertical;
}

button {
  min-height: 44px;
  border: 0;
  background: #6f3d34;
  color: #fff;
  padding: 0 16px;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
}

button:disabled {
  cursor: not-allowed;
  opacity: 0.62;
}

.status {
  margin: 0;
  font-weight: 700;
}

.status.is-error {
  color: #9f3f34;
}

.admin-shell {
  display: grid;
  gap: 22px;
}

.admin-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 18px;
}

.admin-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  justify-content: end;
}

.admin-actions span {
  min-height: 34px;
  display: inline-flex;
  align-items: center;
  border: 1px solid #e2d4c9;
  background: #fffdf9;
  padding: 0 12px;
  color: #5a514c;
  font-size: 0.86rem;
  font-weight: 800;
}

.table-wrap {
  overflow-x: auto;
  border: 1px solid #e2d4c9;
  background: #fffdf9;
}

table {
  width: 100%;
  min-width: 1060px;
  border-collapse: collapse;
}

th,
td {
  padding: 14px;
  border-bottom: 1px solid #eadfd7;
  text-align: left;
  vertical-align: top;
}

th {
  background: #f1e8df;
  color: #5a514c;
  font-size: 0.78rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

td strong,
td small {
  display: block;
}

td small {
  margin-top: 4px;
  color: #8c8078;
}

.wish-cell {
  max-width: 380px;
  line-height: 1.65;
}

.source-badge {
  min-height: 30px;
  display: inline-flex;
  align-items: center;
  border: 1px solid #d8c8bc;
  padding: 0 10px;
  background: #fffaf4;
  color: #5a514c;
  font-size: 0.78rem;
  font-weight: 800;
  white-space: nowrap;
}

.source-badge.is-admin {
  border-color: #b88c5a;
  background: #fff4df;
  color: #755327;
}

.source-badge.is-website {
  border-color: #b7c9b1;
  background: #f3fbf0;
  color: #52734d;
}

.edit-button {
  min-width: 64px;
  border: 1px solid #6f3d34;
  background: #fffaf4;
  color: #6f3d34;
}

.approval-button {
  min-width: 86px;
  background: #52734d;
}

.approval-button.is-approved {
  background: #9f3f34;
}

.row-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.delete-button {
  min-width: 72px;
  border: 1px solid #9f3f34;
  background: transparent;
  color: #9f3f34;
}

.empty-state {
  padding: 34px 14px;
  color: #776b64;
  text-align: center;
}

.modal-backdrop {
  position: fixed;
  inset: 0;
  z-index: 20;
  display: grid;
  align-items: center;
  justify-items: center;
  overflow-y: auto;
  padding: 24px;
  background: rgba(45, 41, 38, 0.48);
}

.create-dialog {
  width: min(100%, 520px);
  border: 1px solid #e2d4c9;
  background: #fffdf9;
  box-shadow: 0 24px 80px rgba(45, 41, 38, 0.24);
}

.create-dialog__header {
  display: flex;
  align-items: start;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 24px 0;
}

.icon-button {
  width: 42px;
  min-height: 42px;
  padding: 0;
  border: 1px solid #e2d4c9;
  background: #fffaf4;
  color: #6f3d34;
  font-size: 1.5rem;
  line-height: 1;
}

.create-form {
  display: grid;
  gap: 16px;
  padding: 22px 24px 24px;
}

.create-form__actions {
  display: flex;
  justify-content: end;
  gap: 10px;
}

.create-form__actions button[type="button"] {
  border: 1px solid #d8c8bc;
  background: transparent;
  color: #6f3d34;
}

@media (max-width: 760px) {
  .admin-header {
    display: grid;
    align-items: start;
  }

  .admin-actions {
    justify-content: start;
  }

  .modal-backdrop {
    padding: 12px;
  }

  .create-form__actions {
    display: grid;
  }
}
</style>
