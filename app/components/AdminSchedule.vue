<script setup lang="ts">
import { ArrowUp, ArrowDown, Plus, Trash2, Check, Save, Clock3, Eye, RotateCcw } from 'lucide-vue-next'
const props = defineProps<{ adminPassword: string }>()
type Side = 'nha-trai' | 'nha-gai'
type Item = { key: number, time: string, title: string, description: string }
let nextKey = 0
const side = ref<Side>('nha-trai')
const drafts = reactive<Record<Side, Item[]>>({ 'nha-trai': [], 'nha-gai': [] })
const snapshots = reactive<Partial<Record<Side, string>>>({})
const items = computed(() => drafts[side.value])
const serialize = (rows: Item[]) => JSON.stringify(rows.map(({ time, title, description }) => ({ time, title, description })))
const dirty = computed(() => snapshots[side.value] !== undefined && serialize(items.value) !== snapshots[side.value])
const sideName = computed(() => side.value === 'nha-trai' ? 'Nhà trai' : 'Nhà gái')
const loading = ref(false)
const saving = ref(false)
const loadError = ref(false)
const message = ref('')
const messageError = ref(false)
const removed = ref<{ item: Item, index: number, side: Side } | null>(null)

async function load() {
  message.value = ''
  loadError.value = false
  removed.value = null
  if (snapshots[side.value] !== undefined) return
  loading.value = true
  try {
    const rows = await $fetch<Omit<Item, 'key'>[]>('/api/schedule', { query: { side: side.value } })
    drafts[side.value] = rows.map(row => ({ ...row, key: nextKey++ }))
    snapshots[side.value] = serialize(items.value)
  }
  catch { loadError.value = true }
  finally { loading.value = false }
}

async function save() {
  saving.value = true
  message.value = ''
  messageError.value = false
  try {
    await $fetch('/api/admin/schedule', {
      method: 'PUT',
      headers: { 'x-admin-password': props.adminPassword },
      body: { side: side.value, items: JSON.parse(serialize(items.value)) }
    })
    snapshots[side.value] = serialize(items.value)
    removed.value = null
    message.value = `Đã lưu lịch trình ${sideName.value.toLowerCase()}.`
  }
  catch { messageError.value = true; message.value = 'Chưa lưu được. Các chỉnh sửa vẫn được giữ lại, hãy thử lại.' }
  finally { saving.value = false }
}

function move(index: number, offset: number) {
  const target = index + offset
  if (target < 0 || target >= items.value.length) return
  const item = items.value.splice(index, 1)[0]!
  items.value.splice(target, 0, item)
}

async function add() {
  const item = { key: nextKey++, time: items.value.at(-1)?.time || '10:00', title: '', description: '' }
  items.value.push(item)
  await nextTick()
  document.getElementById(`schedule-title-${item.key}`)?.focus()
}

function remove(index: number) {
  removed.value = { item: items.value.splice(index, 1)[0]!, index, side: side.value }
}
function undo() {
  if (!removed.value) return
  drafts[removed.value.side].splice(removed.value.index, 0, removed.value.item)
  removed.value = null
}
function beforeLeave(event: BeforeUnloadEvent) {
  if (Object.entries(snapshots).some(([key, snapshot]) => serialize(drafts[key as Side]) !== snapshot)) {
    event.preventDefault()
    event.returnValue = ''
  }
}
watch(side, load)
watch(() => serialize(items.value), () => { message.value = '' })
onMounted(() => { load(); window.addEventListener('beforeunload', beforeLeave) })
onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeLeave))
</script>

<template>
  <section class="schedule-admin" role="tabpanel">
    <header class="panel-header">
      <div><p class="eyebrow">CHƯƠNG TRÌNH NGÀY CƯỚI</p><h1>Lịch trình buổi tiệc</h1><p class="subtitle">Sắp xếp từng khoảnh khắc cho ngày vui của hai gia đình.</p></div>
      <span class="count"><Clock3 :size="15" /> {{ items.length }} hạng mục</span>
    </header>
    <div class="side-switch" role="group" aria-label="Chọn gia đình">
      <button v-for="option in (['nha-trai', 'nha-gai'] as const)" :key="option" type="button" :aria-pressed="side === option" :class="{ selected: side === option }" :disabled="loading || saving" @click="side = option">
        {{ option === 'nha-trai' ? 'Nhà trai' : 'Nhà gái' }}<span v-if="snapshots[option] !== undefined && serialize(drafts[option]) !== snapshots[option]" class="dirty-dot" aria-label="Có thay đổi chưa lưu" />
      </button>
    </div>
    <div v-if="loading" class="empty" role="status">Đang tải lịch trình…</div>
    <div v-else-if="loadError" class="empty" role="alert"><p>Không thể tải lịch trình.</p><button type="button" @click="load">Thử lại</button></div>
    <form v-else @submit.prevent="save">
      <div class="workspace">
        <fieldset :disabled="saving" class="editor">
          <div class="section-label"><h2>{{ sideName }}</h2><span>Hiển thị theo thứ tự bên dưới</span></div>
          <div v-if="!items.length" class="empty"><Clock3 :size="30" /><h3>Thêm khoảnh khắc đầu tiên</h3><p>Lịch trình sẽ hiển thị trên thiệp sau khi bạn lưu.</p></div>
          <article v-for="(item, index) in items" :key="item.key" class="item-card">
            <div class="card-header"><span class="item-number">{{ String(index + 1).padStart(2, '0') }}</span><span class="card-caption">Hạng mục {{ index + 1 }}</span><div class="item-actions">
              <button type="button" class="icon-button" :aria-label="`Di chuyển hạng mục ${index + 1} lên`" title="Di chuyển lên" :disabled="index === 0" @click="move(index, -1)"><ArrowUp :size="16" /></button>
              <button type="button" class="icon-button" :aria-label="`Di chuyển hạng mục ${index + 1} xuống`" title="Di chuyển xuống" :disabled="index === items.length - 1" @click="move(index, 1)"><ArrowDown :size="16" /></button>
              <button type="button" class="icon-button danger" :aria-label="`Xóa hạng mục ${index + 1}`" title="Xóa hạng mục" @click="remove(index)"><Trash2 :size="16" /></button>
            </div></div>
            <div class="field-row"><label class="time-field">Thời gian<input v-model="item.time" type="time" required step="60"></label><label>Tiêu đề<input :id="`schedule-title-${item.key}`" v-model="item.title" required maxlength="200" pattern=".*\S.*" placeholder="Ví dụ: Đón khách"></label></div>
            <label>Mô tả <span class="optional">Không bắt buộc</span><textarea v-model="item.description" maxlength="2000" rows="2" placeholder="Chia sẻ thêm về khoảnh khắc này…" /></label>
          </article>
          <button type="button" class="add-button" :disabled="items.length >= 100" @click="add"><Plus :size="18" /> Thêm hạng mục</button>
          <div v-if="removed" class="undo-message" role="status">Đã xóa hạng mục.<button type="button" @click="undo"><RotateCcw :size="14" /> Hoàn tác</button></div>
        </fieldset>
        <aside class="preview" aria-label="Xem trước lịch trình">
          <div class="preview-label"><Eye :size="16" /> XEM TRƯỚC</div><p class="preview-script">Wedding day</p><h2>Lịch trình buổi tiệc</h2><p class="preview-side">{{ sideName }}</p>
          <p v-if="!items.length" class="preview-empty">Các hạng mục của bạn sẽ xuất hiện ở đây.</p>
          <ol><li v-for="item in items" :key="item.key"><time>{{ item.time || '--:--' }}</time><div><h3>{{ item.title || 'Tiêu đề hạng mục' }}</h3><p v-if="item.description">{{ item.description }}</p></div></li></ol>
          <p class="preview-note">Nội dung cập nhật trên thiệp khi lưu.</p>
        </aside>
      </div>
      <footer class="save-bar"><div class="save-status" aria-live="polite" :class="{ 'has-error': messageError && message }"><template v-if="message">{{ message }}</template><template v-else-if="dirty"><span class="dirty-dot" /> Có thay đổi chưa lưu</template><template v-else><Check :size="16" /> Đã đồng bộ</template></div><button type="submit" class="primary" :disabled="saving || !dirty"><Save :size="17" />{{ saving ? 'Đang lưu…' : 'Lưu lịch trình' }}</button></footer>
    </form>
  </section>
</template>

<style scoped>
.schedule-admin { --accent: #75483f; --line: #e9dfd6; color: #382c27; background: #fffdfb; border: 1px solid var(--line); border-radius: 18px; padding: clamp(18px, 3vw, 32px); min-width: 0; }
.panel-header { display: flex; align-items: center; justify-content: space-between; gap: 20px; margin-bottom: 24px; }
.eyebrow { font-size: 10px; font-weight: 700; letter-spacing: .16em; color: #9a7162; margin: 0 0 10px; }
h1 { font-size: clamp(23px, 2.4vw, 32px); line-height: 1.3; margin: 0; letter-spacing: -.04em; }
.subtitle { color: #8b7a70; font-size: 13px; margin: 10px 0 0; line-height: 1.7; }
.count { display: inline-flex; align-items: center; gap: 7px; white-space: nowrap; background: #f2ebe4; padding: 9px 12px; border-radius: 24px; font-size: 12px; color: #866653; }
button { display: inline-flex; justify-content: center; align-items: center; gap: 8px; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; border: 1px solid var(--line); border-radius: 9px; padding: 10px 14px; background: white; color: var(--accent); transition: background .15s, border-color .15s; min-height: 42px; }
button:hover:not(:disabled) { background: #f5ece5; border-color: #c5ab98; }
button:disabled { opacity: .4; cursor: default; }
button:focus-visible, input:focus-visible, textarea:focus-visible { outline: 3px solid #c49a7566; outline-offset: 3px; }
.side-switch { display: inline-flex; gap: 4px; background: #f1ebe5; padding: 4px; border-radius: 12px; margin-bottom: 28px; }
.side-switch button { background: transparent; border-color: transparent; min-width: 126px; }
.side-switch .selected { background: white; border-color: #e8d9ce; box-shadow: 0 2px 5px #51351d0a; }
.workspace { display: grid; grid-template-columns: minmax(0, 1fr) minmax(260px, 340px); gap: 28px; align-items: start; }
.editor { border: 0; padding: 0; margin: 0; min-width: 0; display: grid; gap: 14px; }
.section-label { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-bottom: 4px; }
.section-label h2 { font-size: 15px; margin: 0; }.section-label span { font-size: 11px; color: #96877d; }
.item-card { background: white; border: 1px solid var(--line); border-radius: 12px; padding: 18px; }
.card-header { display: flex; align-items: center; gap: 9px; margin-bottom: 16px; }
.item-number { background: #f3eae1; color: #96735a; border-radius: 7px; width: 29px; height: 29px; display: grid; place-items: center; font-size: 11px; font-weight: 700; }
.card-caption { font-size: 12px; font-weight: 600; color: #8c776a; }.item-actions { margin-left: auto; display: flex; gap: 4px; }
.icon-button { padding: 6px; min-height: 34px; width: 34px; border-color: transparent; background: transparent; }.danger { color: #af6d60; }.danger:hover:not(:disabled) { background: #fff0ed; border-color: #edcdc5; }
.field-row { display: grid; grid-template-columns: 130px minmax(0, 1fr); gap: 14px; margin-bottom: 14px; }
label { position: relative; display: grid; gap: 7px; font-size: 12px; font-weight: 600; color: #6b5549; min-width: 0; }
input, textarea { font: inherit; font-size: 14px; font-weight: 400; color: #382c27; padding: 11px 12px; border: 1px solid #e2d8cf; border-radius: 7px; width: 100%; box-sizing: border-box; background: #fffefc; min-height: 43px; }
input::placeholder, textarea::placeholder { color: #b4a69b; }textarea { resize: vertical; line-height: 1.6; }.optional { position: absolute; right: 0; top: 0; font-size: 10px; color: #a39285; font-weight: 400; }
.add-button { width: 100%; border-style: dashed; background: #fbf7f2; padding: 14px; }
.preview { position: sticky; top: 24px; padding: 24px; background: #f8f2eb; border: 1px solid #eadfd2; border-radius: 13px; }
.preview-label { display: flex; align-items: center; gap: 7px; font-size: 10px; letter-spacing: .13em; color: #9a806d; }
.preview-script { font-family: Georgia, serif; font-style: italic; font-size: 25px; color: #b6966c; text-align: center; margin: 28px 0 8px; }
.preview h2 { font-family: Georgia, serif; font-size: 24px; font-weight: 400; text-align: center; margin: 0; }.preview-side { text-align: center; font-size: 11px; color: #9b8574; margin: 10px 0 28px; }
ol { list-style: none; padding: 0; margin: 0; }li { display: grid; grid-template-columns: 45px minmax(0, 1fr); gap: 14px; padding: 0 0 25px; }li time { color: #9a744c; font-size: 12px; font-weight: 600; padding-top: 2px; }li>div { position: relative; padding-left: 17px; border-left: 1px solid #d9c6af; }li>div::before { content: ''; position: absolute; width: 7px; height: 7px; background: #b59872; border-radius: 50%; left: -4px; top: 5px; }li h3 { font-size: 13px; margin: 0 0 6px; overflow-wrap: anywhere; }li p { font-size: 11px; line-height: 1.8; color: #96806f; margin: 0; white-space: pre-line; overflow-wrap: anywhere; }.preview-note { border-top: 1px solid #e7dbcd; padding-top: 16px; font-size: 10px; line-height: 1.6; text-align: center; color: #a18e7c; margin-bottom: 0; }
.save-bar { position: sticky; bottom: 12px; z-index: 2; display: flex; justify-content: space-between; align-items: center; gap: 14px; margin-top: 24px; padding: 14px 18px; background: #fffdfbf5; border: 1px solid var(--line); border-radius: 12px; box-shadow: 0 5px 25px #59412b0d; }
.save-status { display: flex; align-items: center; gap: 7px; font-size: 12px; color: #887465; }.dirty-dot { display: inline-block; width: 6px; height: 6px; flex-shrink: 0; border-radius: 50%; background: #bf914e; }.has-error { color: #ac483a; }
.primary { background: var(--accent); color: white; border-color: var(--accent); padding: 12px 20px; flex-shrink: 0; }.primary:hover:not(:disabled) { background: #60392f; border-color: #60392f; }
.empty { text-align: center; padding: 36px 18px; color: #9a8473; border: 1px dashed var(--line); border-radius: 12px; }.empty svg { margin: auto; }.empty h3 { font-size: 15px; }.empty p, .preview-empty { font-size: 12px; line-height: 1.7; }.undo-message { display: flex; align-items: center; justify-content: space-between; gap: 10px; font-size: 12px; color: #8b7563; }.undo-message button { border: 0; background: transparent; }
@media (min-width: 1400px) { .workspace { grid-template-columns: minmax(0, 1fr) 360px; gap: 40px; }.schedule-admin { padding: 32px 40px; }.editor { max-width: 900px; width: 100%; } }
@media (max-width: 900px) { .workspace { grid-template-columns: minmax(0, 1fr); }.preview { position: static; }.panel-header { align-items: start; }.count { display: none; } }
@media (max-width: 520px) { .schedule-admin { padding: 18px 14px; }.side-switch { display: flex; }.side-switch button { flex: 1; min-width: 0; }.section-label { align-items: start; flex-direction: column; }.item-card { padding: 14px; }.field-row { grid-template-columns: 110px minmax(0, 1fr); gap: 10px; }.card-caption { font-size: 11px; }.save-bar { padding: 12px; bottom: 8px; flex-wrap: wrap; }.save-status { width: 100%; font-size: 11px; }.primary { width: 100%; }.preview { padding: 20px; } }
</style>
