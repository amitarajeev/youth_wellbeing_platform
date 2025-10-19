<template>
  <section class="container py-4">
    <h1 class="mb-3">Admin Dashboard</h1>

    <div class="d-flex gap-2 mb-2">
      <button class="btn btn-outline-secondary btn-sm" @click="refreshFromStorage">Refresh</button>
      <small class="text-muted">Make sure all pages run on the same origin (same port) so data appears here.</small>
    </div>

    <div class="row g-3">
      <div class="col-md-3">
        <div class="card p-3 shadow-sm">
          <div class="h6 text-muted">Users</div>
          <div class="display-6">{{ counts.users }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card p-3 shadow-sm">
          <div class="h6 text-muted">Programs</div>
          <div class="display-6">{{ counts.programs }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card p-3 shadow-sm">
          <div class="h6 text-muted">Reviews</div>
          <div class="display-6">{{ counts.reviews }}</div>
        </div>
      </div>
      <div class="col-md-3">
        <div class="card p-3 shadow-sm">
          <div class="h6 text-muted">Avg Rating</div>
          <div class="display-6">{{ avgRating.toFixed(1) }}</div>
        </div>
      </div>
    </div>

    <div class="row g-3 mt-1">
      <div class="col-lg-6">
        <div class="card p-3 shadow-sm">
          <h5 class="mb-2">Users by Role</h5>
          <canvas ref="roleCanvas" aria-label="Users by role chart" role="img"></canvas>
        </div>
      </div>
      <div class="col-lg-6">
        <div class="card p-3 shadow-sm">
          <h5 class="mb-2">Program Seats vs Bookings</h5>
          <canvas ref="seatCanvas" aria-label="Program seats vs bookings chart" role="img"></canvas>
        </div>
      </div>
    </div>

    <div class="card p-3 shadow-sm mt-3">
      <h5 class="mb-2">Bulk Email</h5>

      <div class="row g-2 align-items-end">
        <div class="col-lg-8">
          <label class="form-label">Recipients (comma-separated emails)</label>
          <input v-model="bulk.toCsv" class="form-control" placeholder="user1@example.com, user2@example.com" />
          <small class="text-muted">Tip: click “Load reviewer emails” to prefill from recent reviews.</small>
        </div>
        <div class="col-lg-4">
          <label class="form-label">Subject</label>
          <input v-model="bulk.subject" class="form-control" placeholder="Upcoming programs" />
        </div>
      </div>

      <div class="mt-2">
        <label class="form-label">Message (HTML allowed)</label>
        <textarea v-model="bulk.html" class="form-control" rows="5"
          placeholder="<p>Hi all — here are our upcoming sessions…</p>"></textarea>
      </div>

      <div class="d-flex gap-2 mt-2">
        <button class="btn btn-outline-secondary" @click="prefillFromReviews">Load reviewer emails</button>
        <button class="btn btn-custom" :disabled="sending" @click="sendBulk">Send Bulk Email</button>
        <small v-if="sending" class="text-muted">Sending…</small>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { Chart, BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend, Title } from 'chart.js'
Chart.register(BarElement, BarController, CategoryScale, LinearScale, Tooltip, Legend, Title)

// ---- storage helpers
function load(name, def){ try { return JSON.parse(localStorage.getItem(name) || 'null') ?? def } catch { return def } }
function uniq(arr){ return [...new Set(arr.filter(Boolean))] }

// state
const users    = ref([])
const programs = ref([])
const reviews  = ref([])
const bookings = ref([])

const counts    = ref({ users: 0, programs: 0, reviews: 0 })
const avgRating = ref(0)

const roleCanvas = ref(null)
const seatCanvas = ref(null)
let roleChart = null
let seatChart = null

// bulk email state
const bulk = ref({
  toCsv: 'user1@example.com, user2@example.com',
  subject: 'Upcoming programs',
  html: '<p>Hi all — here are our upcoming sessions…</p>'
})
const sending = ref(false)

function computeStats(){
  counts.value = {
    users: users.value.length,
    programs: programs.value.length,
    reviews: reviews.value.length
  }
  avgRating.value = reviews.value.length
    ? reviews.value.reduce((a,b)=>a+(Number(b.rating)||0),0)/reviews.value.length
    : 0
}

function buildRoleChart(){
  const roleMap = users.value.reduce((m,u)=>{
    const r = (u.role||'user').toLowerCase(); m[r]=(m[r]||0)+1; return m
  }, {})
  const roleLabels = Object.keys(roleMap)
  const roleValues = Object.values(roleMap)

  if (roleChart) { roleChart.destroy() }
  roleChart = new Chart(roleCanvas.value.getContext('2d'), {
    type: 'bar',
    data: { labels: roleLabels, datasets:[{ label:'Users', data: roleValues }] },
    options: { responsive:true, plugins:{ legend:{ display:false } } }
  })
}

function buildSeatChart(){
  const labels = programs.value.map(p=>p.title)
  const seats  = programs.value.map(p=>Number(p.seats||0))
  const booked = programs.value.map(p =>
    bookings.value.filter(b => Number(b.programId)===Number(p.id)).length
  )

  if (seatChart) { seatChart.destroy() }
  seatChart = new Chart(seatCanvas.value.getContext('2d'), {
    type: 'bar',
    data: { labels, datasets: [
      { label:'Seats',  data: seats  },
      { label:'Booked', data: booked }
    ]},
    options: { responsive:true }
  })
}

function refreshFromStorage(){
  users.value    = load('users', [])
  programs.value = load('programs', [])
  reviews.value  = load('reviews', [])
  bookings.value = load('bookings', [])
  computeStats()
  buildRoleChart()
  buildSeatChart()
}

function onStorage(e){
  if (['users','programs','reviews','bookings'].includes(e.key)) {
    refreshFromStorage()
  }
}

onMounted(() => {
  refreshFromStorage()
  window.addEventListener('storage', onStorage)
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorage)
  roleChart?.destroy()
  seatChart?.destroy()
})

// ---- Bulk email (uses your Cloud Run function)
const BULK_URL = 'https://sendbulkemail-6rwlj53o6q-ts.a.run.app'

function prefillFromReviews(){
  const emails = uniq(reviews.value.map(r => (r.userEmail || '').trim()).filter(Boolean))
  if (emails.length) {
    bulk.value.toCsv = emails.join(', ')
  } else {
    alert('No reviewer emails found in local data.')
  }
}

async function sendBulk(){
  const recipients = uniq(
    (bulk.value.toCsv || '')
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
  )
  if (!recipients.length){ alert('No recipients.'); return }
  if (!bulk.value.subject.trim()){ alert('Please add a subject.'); return }
  if (!bulk.value.html.trim()){ alert('Please add a message.'); return }

  try {
    sending.value = true
    const res = await fetch(BULK_URL, {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({
        to: recipients,
        subject: bulk.value.subject,
        html: bulk.value.html
      })
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    alert('Bulk email requested successfully.')
  } catch (e) {
    console.warn('Bulk email failed:', e)
    alert('Could not send bulk email. Check console/network and CORS on your function.')
  } finally {
    sending.value = false
  }
}
</script>
