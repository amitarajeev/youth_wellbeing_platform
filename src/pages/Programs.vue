<template> 
  <div>
    <h1 class="mb-3 text-center">Programs</h1>

    <!-- Caregiver-only controls -->
    <div v-if="canManage" class="mb-4">
      <form @submit.prevent="addProgram">
        <div class="row g-2">
          <div class="col-md-4">
            <input v-model="newProgram.title" type="text" class="form-control" placeholder="Program Title" required />
          </div>
          <div class="col-md-3">
            <input v-model="newProgram.topic" type="text" class="form-control" placeholder="Topic" required />
          </div>
          <div class="col-md-3">
            <input v-model="newProgram.date" type="date" class="form-control" required />
          </div>
          <div class="col-md-2">
            <select v-model="newProgram.mode" class="form-select" required>
              <option disabled value="">Mode</option>
              <option value="Online">Online</option>
              <option value="In-person">In-person</option>
            </select>
          </div>
        </div>

        <div class="row g-2 mt-2">
          <div class="col-md-3">
            <input v-model.number="newProgram.seats" type="number" class="form-control" placeholder="Seats" min="1" required />
          </div>
          <div class="col-md-9 d-flex gap-2">
            <button type="submit" class="btn btn-custom">Add Program</button>
            <button type="button" class="btn btn-custom" @click="clearForm">Clear Form</button>
            <button type="button" class="btn btn-custom ms-auto" @click="clearPrograms">Clear Programs</button>
          </div>
        </div>
      </form>
    </div>

    <h1 class="mb-3 text-center">Upcoming Programs</h1>

    <!-- Toolbar: global search + export (BR D.3 & E.4) -->
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <div class="input-group" style="max-width: 420px">
        <span class="input-group-text">Search all</span>
        <input
          v-model="filters['global'].value"
          type="text"
          class="form-control"
          placeholder="Type to search title, topic, date, mode…"
        />
        <button class="btn btn-custom" @click="clearFilters">Clear</button>
      </div>

      <div class="ms-lg-auto d-flex gap-2">
        <button class="btn btn-custom" @click="exportCSV()">Export CSV</button>
        <button class="btn btn-custom" @click="exportPDF()">Export PDF</button>
      </div>
    </div>

    <div class="table-responsive-fluid">
      <DataTable
        :value="programs"
        paginator
        :rows="10"
        :rowsPerPageOptions="[10,20,50]"
        responsiveLayout="stack"
        breakpoint="992px"
        sortMode="multiple"
        class="p-datatable-sm shadow-sm"
        :filters="filters"
        :globalFilterFields="['title','topic','date','mode','seats']"
      >
        <!-- Title -->
        <Column field="title" header="Title" sortable filter :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <input v-model="filterModel.value" type="text" class="form-control" placeholder="Search title" />
          </template>
        </Column>

        <!-- Topic -->
        <Column field="topic" header="Topic" sortable filter :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <input v-model="filterModel.value" type="text" class="form-control" placeholder="Search topic" />
          </template>
        </Column>

        <!-- Date -->
        <Column field="date" header="Date" sortable filter :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <input v-model="filterModel.value" type="text" class="form-control" placeholder="yyyy-mm-dd" />
          </template>
        </Column>

        <!-- Mode -->
        <Column field="mode" header="Mode" sortable filter :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <select v-model="filterModel.value" class="form-select">
              <option value="">All</option>
              <option value="Online">Online</option>
              <option value="In-person">In-person</option>
            </select>
          </template>
        </Column>

        <!-- Seats -->
        <Column field="seats" header="Seats Left" sortable filter :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <input v-model="filterModel.value" type="number" class="form-control" placeholder="e.g. 5" />
          </template>
        </Column>

        <!-- Avg Rating -->
        <Column header="Rating">
          <template #body="slotProps">
            <div class="d-flex align-items-center gap-2">
              <Rating :modelValue="avgRating(slotProps.data.id)" :cancel="false" readonly />
              <small>({{ avgRating(slotProps.data.id).toFixed(1) }})</small>
            </div>
          </template>
        </Column>

        <!-- Actions -->
        <Column header="Action" bodyClass="text-center">
          <template #body="slotProps">
            <div class="d-flex justify-content-center gap-2">
              <button
                class="btn btn-custom btn-sm"
                @click="registerProgram(slotProps.data)"
                :disabled="slotProps.data.seats === 0 || !isLoggedIn"
                :title="!isLoggedIn ? 'Login to register' : ''"
              >
                {{ slotProps.data.seats === 0 ? "Full" : "Register" }}
              </button>
              <router-link
                class="btn btn-custom btn-sm"
                :to="{ name: 'reviews', query: { programId: slotProps.data.id } }"
                :title="!isLoggedIn ? 'Login to review' : ''"
              >
                Review
              </router-link>
            </div>
          </template>
        </Column>

        <!-- Optional friendly empty-state -->
        <template #empty>
          <div class="py-4 text-center text-muted">
            No programs yet. Caregivers/Admins can add new programs above.
          </div>
        </template>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Rating from 'primevue/rating'
import { sanitize } from '../utils/security'

/* === Cloud Function URL for registration email (added) === */
const SEND_REG_URL = 'https://sendregistrationemail-6rwlj53o6q-ts.a.run.app'

// ---- Safe session access (works regardless of composable shape) ----
function getSession() {
  try {
    return JSON.parse(localStorage.getItem('session') || localStorage.getItem('currentUser') || 'null')
  } catch {
    return null
  }
}
const session = ref(getSession())
const isLoggedIn = computed(() => !!session.value)
const canManage = computed(() => {
  const r = (session.value?.role || '').toLowerCase()
  return r === 'caregiver' || r === 'admin'
})

// ---- Defaults everyone should see ----
const defaultPrograms = [
  { id: 1, title: 'Managing Anxiety',     topic: 'Anxiety',       date: '2025-09-10', mode: 'Online',    seats: 12, isDefault: true },
  { id: 2, title: 'Sleep and Mindfulness',topic: 'Sleep',         date: '2025-09-15', mode: 'In-person', seats:  8, isDefault: true },
  { id: 3, title: 'Healthy Friendships',  topic: 'Relationships', date: '2025-09-18', mode: 'Online',    seats:  0, isDefault: true },
]

const programs = ref([])
const newProgram = ref({ title: '', topic: '', date: '', mode: '', seats: 1 })

// Seed defaults if storage is empty/missing
onMounted(() => {
  let stored = []
  try {
    const raw = localStorage.getItem('programs')
    stored = raw ? JSON.parse(raw) : []
  } catch {
    stored = []
  }
  if (!Array.isArray(stored) || stored.length === 0) {
    programs.value = [...defaultPrograms]
    localStorage.setItem('programs', JSON.stringify(programs.value))
  } else {
    programs.value = stored
  }
})

// Persist changes
watch(programs, (val) => {
  try { localStorage.setItem('programs', JSON.stringify(val)) } catch {}
}, { deep: true })

function addProgram() {
  programs.value.push({
    id: Date.now(),
    title: sanitize(newProgram.value.title),
    topic: sanitize(newProgram.value.topic),
    date: newProgram.value.date,
    mode: newProgram.value.mode,
    seats: Number(newProgram.value.seats) || 1,
    isDefault: false
  })
  clearForm()
}

function clearForm() {
  newProgram.value = { title: '', topic: '', date: '', mode: '', seats: 1 }
}

function clearPrograms() {
  programs.value = programs.value.filter(p => p.isDefault === true)
  try { localStorage.setItem('programs', JSON.stringify(programs.value)) } catch {}
}

/* === Register + send confirmation email (updated) === */
async function registerProgram(program) {
  if (!isLoggedIn.value) return
  if (program.seats > 0) {
    program.seats -= 1
    alert(`You registered for: ${program.title}`)

    // fire the confirmation email via Cloud Function (best-effort)
    try {
      const to =
        (session.value?.email || session.value?.user?.email || '').trim()
      if (to) {
        await fetch(SEND_REG_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to,
            program: {
              title: program.title,
              topic: program.topic,
              date: program.date,
              mode: program.mode
            }
          })
        })
      }
    } catch (e) {
      console.warn('sendRegistrationEmail failed (non-blocking):', e)
    }
  }
}

/* ------- Reviews aggregation kept unchanged ------- */
function getReviews() {
  try { return JSON.parse(localStorage.getItem('reviews') || '[]') } catch { return [] }
}
function avgRating(programId) {
  const list = getReviews()
  const filtered = list.filter(r => r && Number(r.programId) === Number(programId))
  if (!filtered.length) return 0
  const sum = filtered.reduce((acc, r) => acc + (Number(r.rating ?? r.stars) || 0), 0)
  return sum / filtered.length
}

/* ------- Interactive filters (no external API import) ------- */
const filters = ref({
  global: { value: null, matchMode: 'contains' },
  title:  { value: null, matchMode: 'contains' },
  topic:  { value: null, matchMode: 'contains' },
  date:   { value: null, matchMode: 'contains' },
  mode:   { value: null, matchMode: 'equals'   },
  seats:  { value: null, matchMode: 'equals'   }
})
function clearFilters () {
  Object.keys(filters.value).forEach(k => { filters.value[k].value = null })
}

/* ------- Export helpers (CSV & PDF) ------- */
function exportCSV () {
  const headers = ['Title','Topic','Date','Mode','Seats','AvgRating']
  const rows = programs.value.map(p => ([
    safe(p.title), safe(p.topic), safe(p.date), safe(p.mode),
    String(p.seats),
    avgRating(p.id).toFixed(1)
  ]))
  const csv = [headers, ...rows].map(r =>
    r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'programs.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF () {
  const head = `
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      h1 { margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 8px; }
      th { background: #f2f2f2; text-align: left; }
    </style>
  `;

  const rows = programs.value.map(p => `
    <tr>
      <td>${escapeHtml(p.title)}</td>
      <td>${escapeHtml(p.topic)}</td>
      <td>${escapeHtml(p.date)}</td>
      <td>${escapeHtml(p.mode)}</td>
      <td>${String(p.seats)}</td>
      <td>${Number(avgRating(p.id)).toFixed(1)}</td>
    </tr>
  `).join('');

  const html = `
    <!doctype html>
    <html>
      <head>${head}</head>
      <body onload="window.print()">
        <h1>Programs</h1>
        <table>
          <thead>
            <tr>
              <th>Title</th>
              <th>Topic</th>
              <th>Date</th>
              <th>Mode</th>
              <th>Seats</th>
              <th>Rating</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;

  const w = window.open('', '_blank');
  if (w) {
    w.document.open();
    w.document.write(html);
    w.document.close();
  }
}

function escapeHtml (s = '') {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;')
}
function safe (s = '') {
  return String(s ?? '').trim()
}
</script>

<style scoped>
h2 {
  font-weight: 600;
}
</style>



