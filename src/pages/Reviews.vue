<template>
  <section class="container py-4">
    <h2 class="mb-3">Program Reviews</h2>

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
          <textarea v-model="comment" class="form-control" rows="3" maxlength="300"
                    placeholder="Share your thoughts (max 300 chars)"></textarea>
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
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'
import Rating from 'primevue/rating'
import { sanitize } from '@/utils/security'
import { useAuth } from '@/composables/useAuth'

const { currentUser } = useAuth()
const route = useRoute()

const programs = ref([])
const reviews = ref([])

const programId = ref('')
const rating = ref(0)
const comment = ref('')

onMounted(() => {
  programs.value = JSON.parse(localStorage.getItem('programs') || '[]')
  reviews.value = loadReviews()

  // preselect program if navigated with ?programId=...
  const pre = Number(route.query.programId || '')
  if (pre) programId.value = pre
})

function loadReviews() {
  try { return JSON.parse(localStorage.getItem('reviews') || '[]') } catch { return [] }
}
function saveReviews(list) {
  localStorage.setItem('reviews', JSON.stringify(list))
}

function findProgram(id) {
  return programs.value.find(p => p.id === id)
}

function submitReview() {
  if (!programId.value || !rating.value) return
  const p = findProgram(programId.value)
  if (!p) return

  const entry = {
    id: Date.now(),
    programId: programId.value,
    programTitle: p.title,
    rating: Number(rating.value),
    comment: sanitize(comment.value).slice(0, 300),
    userId: currentUser.value?.id || null,
    userEmail: currentUser.value?.email || 'unknown',
    createdAt: new Date().toLocaleString()
  }

  const updated = [entry, ...reviews.value]
  reviews.value = updated
  saveReviews(updated)

  // clear form
  rating.value = 0
  comment.value = ''
}
</script>
