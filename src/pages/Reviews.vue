<template>
  <section class="container py-4">
    <h1 class="mb-3">Program Reviews</h1>

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
    <div class="table-responsive-fluid">
      <DataTable
        :value="reviews"
        paginator
        :rows="5"
        responsiveLayout="stack"
        breakpoint="992px"
        class="p-datatable-sm shadow-sm"
      >
        <Column field="programTitle" header="Program" />
        <Column header="Rating">
          <template #body="slotProps">
            <Rating :modelValue="slotProps.data.rating" :cancel="false" readonly />
          </template>
        </Column>
        <Column field="comment" header="Comment" />
        <Column field="userEmail" header="By" />
        <Column field="createdAt" header="When" />
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
import { sanitize } from '../utils/security'        // relative path
import useAuth from '../composables/useAuth'        // ⬅️ import the OBJECT, not a function

const route = useRoute()

// reactive state
const programs = ref([])
const reviews  = ref([])

const programId = ref('')
const rating    = ref(0)
const comment   = ref('')

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

function submitReview () {
  if (!useAuth.isAuthed()) {             // ⬅️ call method on the object
    alert('Please log in to submit a review.')
    return
  }

  if (!programId.value || !rating.value) return

  const p = programs.value.find(x => x.id === Number(programId.value))
  if (!p) return

  const all   = loadReviews()
  const email = (useAuth.currentUser()?.email || 'unknown').trim().toLowerCase()

  // one review per user per program — update if exists
  const idx = all.findIndex(r =>
    Number(r.programId) === Number(programId.value) &&
    (r.userEmail || '').trim().toLowerCase() === email
  )

  const entry = {
    id: Date.now(),
    programId: Number(programId.value),      // NUMBER so Programs.vue avg matches
    programTitle: p.title,
    rating: Number(rating.value),
    comment: sanitize(comment.value || '').slice(0, 300),
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
</script>
