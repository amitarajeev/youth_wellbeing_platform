<template>
  <div>
    <!-- Toolbar (matches the Users section UX) -->
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

    <!-- Interactive DataTable -->
    <div class="table-responsive-fluid">
      <DataTable
        :value="programs"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[10,20,50]"
        :responsiveLayout="'stack'"
        breakpoint="992px"
        class="p-datatable-sm shadow-sm"
        :sortMode="'multiple'"
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
                @click="$emit('register', slotProps.data)"
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
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Rating from 'primevue/rating'
import { useAuth } from '@/composables/useAuth'

/**
 * This component assumes the parent (Programs.vue) owns the programs array
 * and passes it in. If you currently keep programs locally here, you can
 * remove the `defineProps` and use your existing state instead.
 */
const props = defineProps({
  programs: { type: Array, required: true }
})

const { isLoggedIn } = useAuth()

/* PrimeVue-like filters without importing primevue/api (build-safe) */
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

/* ------- Ratings aggregation from localStorage ------- */
function getReviews () {
  try { return JSON.parse(localStorage.getItem('reviews') || '[]') } catch { return [] }
}
function avgRating (programId) {
  const r = getReviews().filter(x => String(x.programId) === String(programId))
  if (!r.length) return 0
  const sum = r.reduce((acc, x) => acc + (Number(x.rating) || 0), 0)
  return sum / r.length
}

/* ------- Export helpers (CSV & PDF) ------- */
function exportCSV () {
  const headers = ['Title','Topic','Date','Mode','Seats','AvgRating']
  const rows = (props.programs || []).map(p => ([
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

  const rows = (props.programs || []).map(p => `
    <tr>
      <td>${escapeHtml(p.title)}</td>
      <td>${escapeHtml(p.topic)}</td>
      <td>${escapeHtml(p.date)}</td>
      <td>${escapeHtml(p.mode)}</td>
      <td>${String(p.seats)}</td>
      <td>${Number(avgRating(p.id)).toFixed(1)}</td>
    </tr>
  `).join('');

  // Use body onload to trigger print (no <script> tag inside)
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
/* No visual changes to your theme; toolbar matches Users section */
</style>
