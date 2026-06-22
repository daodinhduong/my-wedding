<script setup lang="ts">
type AdminWeddingResponse = {
  id: string
  guestName: string
  wishMessage: string | null
  attendanceStatus: 'attending' | 'not_attending' | 'pending'
  guestCount: number
  isApproved: boolean
  createdAt: string
}

const password = ref('')
const isUnlocked = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')
const responses = ref<AdminWeddingResponse[]>([])
const updatingIds = ref(new Set<string>())

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

function formatAttendance(status: AdminWeddingResponse['attendanceStatus']) {
  if (status === 'attending') {
    return 'Tham dự'
  }

  if (status === 'not_attending') {
    return 'Không tham dự'
  }

  return 'Chưa rõ'
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
          <button type="button" :disabled="isLoading" @click="loadResponses">
            Làm mới
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
              <th>Ngày gửi</th>
              <th>Hiển thị</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="!responses.length">
              <td colspan="6" class="empty-state">Chưa có phản hồi nào.</td>
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
              <td>{{ formatCreatedAt(response.createdAt) }}</td>
              <td>
                <button
                  class="approval-button"
                  type="button"
                  :class="{ 'is-approved': response.isApproved }"
                  :disabled="updatingIds.has(response.id)"
                  @click="toggleApproval(response)"
                >
                  {{ response.isApproved ? 'Ẩn' : 'Duyệt' }}
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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

input {
  min-height: 48px;
  border: 1px solid #d8c8bc;
  background: #fffaf4;
  padding: 0 14px;
  color: inherit;
  font: inherit;
  font-weight: 500;
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
  min-width: 920px;
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

.approval-button {
  min-width: 86px;
  background: #52734d;
}

.approval-button.is-approved {
  background: #9f3f34;
}

.empty-state {
  padding: 34px 14px;
  color: #776b64;
  text-align: center;
}

@media (max-width: 760px) {
  .admin-header {
    display: grid;
    align-items: start;
  }

  .admin-actions {
    justify-content: start;
  }
}
</style>
