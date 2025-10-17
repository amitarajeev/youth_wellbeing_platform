<template>
  <section class="container py-4">
    <h1 class="mb-3">Program Reviews</h1>

    <!-- Write review form (unchanged) -->
    <form @submit.prevent="submitReview" class="mb-4">
      <div class="row g-2">
        <div class="col-md-4">
          <label class="form-label">Program</label>
          <select v-model.number="programId" class="form-select" required>
            <option disabled value="">Select a program</option>
            <option v-for="p in programs" :key="p.id" :value="p.id">
              {{ p.title }} ({{ p.date }})
            </option>
          </select>
        </div>

        <div class="col-md-4">
          <label class="form-label">Rating</label>
          <div class="d-flex align-items-center">
            <Rating v-model="rating" :cancel="false" />
            <span class="ms-2">{{ rating }}</span>
          </div>
        </div>

        <div class="col-12 mt-2">
          <label class="form-label">Comment (optional)</label>
          <textarea
            v-model="comment"
            class="form-control"
            rows="3"
            maxlength="300"
            placeholder="Share your thoughts (max 300 chars)"
          ></textarea>
        </div>
      </div>

      <button type="submit" class="btn btn-custom mt-3">Submit Review</button>
    </form>

    <h4 class="mb-2">Recent Reviews</h4>

    <!-- Toolbar: global search + export (D.3 + E.4) -->
    <div class="d-flex flex-wrap align-items-center gap-2 mb-3">
      <div class="input-group" style="max-width: 480px">
        <span class="input-group-text">Search all</span>
        <input
          v-model="filters['global'].value"
          type="text"
          class="form-control"
          placeholder="Type to search program, comment, user, date…"
        />
        <button class="btn btn-custom" @click="clearFilters">Clear</button>
      </div>

      <div class="ms-lg-auto d-flex gap-2">
        <button class="btn btn-custom" @click="exportCSV()">Export CSV</button>
        <button class="btn btn-custom" @click="exportPDF()">Export PDF</button>
      </div>
    </div>

    <!-- Interactive table -->
    <div class="table-responsive-fluid">
      <DataTable
        :value="reviews"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[10,20,50]"
        responsiveLayout="stack"
        breakpoint="992px"
        class="p-datatable-sm shadow-sm"
        sortMode="multiple"
        :filters="filters"
        :globalFilterFields="['programTitle','comment','userEmail','createdAt']"
      >
        <Column field="programTitle" header="Program" sortable filter :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <input v-model="filterModel.value" type="text" class="form-control" placeholder="Search program" />
          </template>
        </Column>

        <Column header="Rating" sortable field="rating" filter :showFilterMenu="false">
          <template #body="slotProps">
            <div class="d-flex align-items-center gap-2">
              <Rating :modelValue="slotProps.data.rating" :cancel="false" readonly />
              <small>({{ Number(slotProps.data.rating || 0).toFixed(1) }})</small>
            </div>
          </template>
          <template #filter="{ filterModel }">
            <input v-model.number="filterModel.value" type="number" min="1" max="5" step="1" class="form-control" placeholder="≥ stars" />
          </template>
        </Column>

        <Column field="comment" header="Comment" sortable filter :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <input v-model="filterModel.value" type="text" class="form-control" placeholder="Search comment" />
          </template>
        </Column>

        <Column field="userEmail" header="By" sortable filter :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <input v-model="filterModel.value" type="text" class="form-control" placeholder="Search email" />
          </template>
        </Column>

        <Column field="createdAt" header="When" sortable filter :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <input v-model="filterModel.value" type="text" class="form-control" placeholder="yyyy-mm-dd or time" />
          </template>
        </Column>

        <template #empty>
          <div class="py-4 text-center text-muted">No reviews yet.</div>
        </template>
      </DataTable>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Rating from 'primevue/rating'
import { sanitize } from '../utils/security'
import useAuth from '../composables/useAuth'

const route = useRoute()

// === Cloud Function URL (added) ===
const MODERATE_URL = 'https://moderatereview-6rwlj53o6q-ts.a.run.app'

// reactive state
const programs = ref([])
const reviews  = ref([])

const programId = ref('')
const rating    = ref(0)
const comment   = ref('')

// ---- Interactive filters (unchanged) ----
const filters = ref({
  global:       { value: null, matchMode: 'contains' },
  programTitle: { value: null, matchMode: 'contains' },
  rating:       { value: null, matchMode: 'gte'      },
  comment:      { value: null, matchMode: 'contains' },
  userEmail:    { value: null, matchMode: 'contains' },
  createdAt:    { value: null, matchMode: 'contains' },
})
function clearFilters () {
  Object.keys(filters.value).forEach(k => { filters.value[k].value = null })
}

const defaults = [
  { id: 1, title: 'Managing Anxiety',    topic: 'Anxiety',       date: '2025-09-10', mode: 'Online',   seats: 12, isDefault: true },
  { id: 2, title: 'Sleep and Mindfulness', topic: 'Sleep',       date: '2025-09-15', mode: 'In-person', seats: 8,  isDefault: true },
  { id: 3, title: 'Healthy Friendships', topic: 'Relationships', date: '2025-09-18', mode: 'Online',   seats: 0,  isDefault: true },
]

onMounted(() => {
  try {
    const stored = JSON.parse(localStorage.getItem('programs') || '[]')
    programs.value = Array.isArray(stored) && stored.length ? stored : defaults
  } catch { programs.value = defaults }

  reviews.value = loadReviews()

  const pre = Number(route.query.programId || '')
  if (pre) programId.value = pre
  else if (programs.value.length) programId.value = programs.value[0].id
})

function loadReviews () {
  try { return JSON.parse(localStorage.getItem('reviews') || '[]') } catch { return [] }
}
function saveReviews (list) {
  localStorage.setItem('reviews', JSON.stringify(list))
}

// === submitReview now calls the moderation function (added) ===
async function submitReview () {
  if (!useAuth.isAuthed()) {
    alert('Please log in to submit a review.')
    return
  }
  if (!programId.value || !rating.value) return

  // call Cloud Function to moderate the comment
  let cleanedText = (comment.value || '')
  try {
    const r = await fetch(MODERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: cleanedText })
    })
    if (r.ok) {
      const data = await r.json()
      if (!data.allowed) {
        // show reasons and stop
        alert(`Your comment was blocked by moderation: ${ (data.reasons || []).join(', ') }`)
        return
      }
      cleanedText = data.cleaned || cleanedText
    } else {
      // if the function errors, fail open (still save locally) but inform user
      console.warn('Moderation function returned non-200', r.status)
    }
  } catch (e) {
  console.warn('Moderation function error', e);
  alert('Unable to verify your comment right now. Please try again in a moment.');
  return;     // ⬅️ fail closed; do not save
}

  const p = programs.value.find(x => x.id === Number(programId.value))
  if (!p) return

  const all   = loadReviews()
  const email = (useAuth.currentUser()?.email || 'unknown').trim().toLowerCase()

  const idx = all.findIndex(r =>
    Number(r.programId) === Number(programId.value) &&
    (r.userEmail || '').trim().toLowerCase() === email
  )

  const entry = {
    id: Date.now(),
    programId: Number(programId.value),
    programTitle: p.title,
    rating: Number(rating.value),
    // use sanitized + moderated text
    comment: sanitize(cleanedText || '').slice(0, 300),
    userEmail: useAuth.currentUser()?.email || 'unknown',
    createdAt: new Date().toLocaleString(),
  }

  if (idx >= 0) all[idx] = { ...all[idx], rating: entry.rating, comment: entry.comment, createdAt: entry.createdAt }
  else all.unshift(entry)

  saveReviews(all)
  reviews.value = all

  rating.value = 0
  comment.value = ''
  alert('Review saved!')
}

/* ---------------- Exports (E.4) ---------------- */
function exportCSV () {
  const headers = ['Program','Rating','Comment','By','When']
  const rows = reviews.value.map(r => ([
    safe(r.programTitle),
    String(r.rating ?? ''),
    safe(r.comment),
    safe(r.userEmail),
    safe(r.createdAt),
  ]))
  const csv = [headers, ...rows].map(r =>
    r.map(f => `"${String(f).replace(/"/g, '""')}"`).join(',')
  ).join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'reviews.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportPDF () {
  const head = `
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      h1 { margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 8px; vertical-align: top; }
      th { background: #f2f2f2; text-align: left; }
    </style>
  `
  const rows = reviews.value.map(r => `
    <tr>
      <td>${escapeHtml(r.programTitle)}</td>
      <td>${String(r.rating ?? '')}</td>
      <td>${escapeHtml(r.comment || '')}</td>
      <td>${escapeHtml(r.userEmail || '')}</td>
      <td>${escapeHtml(r.createdAt || '')}</td>
    </tr>
  `).join('')

  const html = `
    <!doctype html>
    <html>
      <head>${head}</head>
      <body onload="window.print()">
        <h1>Program Reviews</h1>
        <table>
          <thead>
            <tr>
              <th>Program</th>
              <th>Rating</th>
              <th>Comment</th>
              <th>By</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `
  const w = window.open('', '_blank')
  if (w) {
    w.document.open()
    w.document.write(html)
    w.document.close()
  }
}

/* ---------------- small helpers ---------------- */
function escapeHtml (s = '') {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;')
}
function safe (s = '') { return String(s ?? '').trim() }
</script>
