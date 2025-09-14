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

    <div class="table-responsive-fluid">
      <DataTable
        :value="programs"
        paginator
        :rows="5"
        responsiveLayout="stack"
        breakpoint="992px"
        sortMode="multiple"
        class="p-datatable-sm shadow-sm"
      >
        <Column field="title" header="Title" sortable />
        <Column field="topic" header="Topic" sortable />
        <Column field="date" header="Date" sortable />
        <Column field="mode" header="Mode" sortable />
        <Column field="seats" header="Seats Left" sortable />

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

// ---- Safe session access (works regardless of composable shape) ----
function getSession() {
  try {
    // support both keys used earlier in your app
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
  { id: 1, title: 'Managing Anxiety',     topic: 'Anxiety',      date: '2025-09-10', mode: 'Online',    seats: 12, isDefault: true },
  { id: 2, title: 'Sleep and Mindfulness',topic: 'Sleep',        date: '2025-09-15', mode: 'In-person', seats:  8, isDefault: true },
  { id: 3, title: 'Healthy Friendships',  topic: 'Relationships',date: '2025-09-18', mode: 'Online',    seats:  0, isDefault: true },
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
  // keep only the seeded defaults
  programs.value = programs.value.filter(p => p.isDefault === true)
  // also persist immediately so a refresh still shows defaults
  try { localStorage.setItem('programs', JSON.stringify(programs.value)) } catch {}
}

function registerProgram(program) {
  if (!isLoggedIn.value) return
  if (program.seats > 0) {
    program.seats -= 1
    alert(`You registered for: ${program.title}`)
  }
}

/* ------- Ratings aggregation from localStorage ------- */
function getReviews() {
  try { return JSON.parse(localStorage.getItem('reviews') || '[]') } catch { return [] }
}
function avgRating(programId) {
  const list = getReviews()
  // Prefer per-program ratings if present; otherwise show 0
  const filtered = list.filter(r => r && Number(r.programId) === Number(programId))
  if (!filtered.length) return 0
  const sum = filtered.reduce((acc, r) => acc + (Number(r.rating ?? r.stars) || 0), 0)
  return sum / filtered.length
}
</script>

<style scoped>
h2 {
  font-weight: 600;
}
</style>
