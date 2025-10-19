<template>
  <section class="container py-4">
    <h1 class="mb-3">Book a Session</h1>

    <div class="d-flex gap-2 mb-2">
      <button class="btn btn-outline-secondary btn-sm" @click="refreshFromStorage">Refresh</button>
      <small class="text-muted">Programs come from localStorage “programs”. Keep all pages on the same origin.</small>
    </div>

    <div class="row g-3 mb-3">
      <div class="col-md-4">
        <label class="form-label">Program</label>
        <select v-model.number="programId" class="form-select" aria-label="Select a program">
          <option disabled value="">Select…</option>
          <option v-for="p in programs" :key="p.id" :value="p.id">
            {{ p.title }} ({{ p.date }}) • Seats: {{ p.seats }}
          </option>
        </select>
      </div>
      <div class="col-md-4">
        <label class="form-label">Your name</label>
        <input v-model="name" class="form-control" placeholder="Full name" />
      </div>
      <div class="col-md-4">
        <label class="form-label">Your email</label>
        <input v-model="email" class="form-control" type="email" placeholder="you@example.com" />
      </div>
    </div>

    <div class="alert alert-secondary small">
      <strong>Rules:</strong> no double-booking the same time; seats can’t go below 0; bookings are 1-hour blocks on program day.
    </div>

    <div class="card p-3 shadow-sm">
      <div ref="calWrap" />
    </div>

    <div class="mt-3">
      <button class="btn btn-custom" @click="clearMyHolds" :disabled="!heldCount">Clear my holds (local)</button>
    </div>
  </section>
</template>

<script setup>
import { onMounted, onBeforeUnmount, ref, watch, nextTick } from 'vue'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Calendar } from '@fullcalendar/core'

function load(name, def){ try { return JSON.parse(localStorage.getItem(name) || 'null') ?? def } catch { return def } }
function save(name, val){ localStorage.setItem(name, JSON.stringify(val)) }
function toISODate(dateStr){ return new Date(`${dateStr}T09:00:00`) }

// state
const programs = ref([])
const bookings = ref([]) // [{id, programId, start, end, name, email}]
const calWrap = ref(null)
const calendar = ref(null)

const programId = ref('')
const name = ref('')
const email = ref('')

const heldCount = ref(0)

function buildEvents() {
  const evts = []
  for (const p of programs.value) {
    const start = toISODate(p.date)
    const end = new Date(start.getTime() + 8 * 3600 * 1000)
    evts.push({ id:`program-${p.id}`, title:`${p.title} • window`, start, end, display:'background', backgroundColor:'#7c3aed22' })
  }
  for (const b of bookings.value) {
    evts.push({ id:`bk-${b.id}`, title:`Reserved: ${b.name}`, start:b.start, end:b.end, color:'#7c3aed' })
  }
  return evts
}

function withinProgramWindow(date, p) {
  const d = toISODate(p.date)
  return date.toDateString() === d.toDateString()
}
function seatsLeft(p) {
  const count = bookings.value.filter(b => Number(b.programId) === Number(p.id)).length
  return Math.max(0, Number(p.seats || 0) - count)
}
function hasTimeConflict(pId, startISO, endISO, userEmail) {
  const s = new Date(startISO).getTime()
  const e = new Date(endISO).getTime()
  return bookings.value.some(b => {
    if (Number(b.programId) !== Number(pId)) return false
    const bs = new Date(b.start).getTime()
    const be = new Date(b.end).getTime()
    const overlap = Math.max(0, Math.min(e, be) - Math.max(s, bs)) > 0
    const sameUser = (b.email || '').toLowerCase() === (userEmail || '').toLowerCase()
    return overlap || sameUser
  })
}

function addBooking(p, startISO) {
  const oneHour = 3600 * 1000
  const start = new Date(startISO)
  const end = new Date(start.getTime() + oneHour)

  if (!withinProgramWindow(start, p)) { alert('Pick a time on the program date.'); return }
  if (seatsLeft(p) <= 0)            { alert('No seats left for this program.'); return }
  if (hasTimeConflict(p.id, start.toISOString(), end.toISOString(), email.value)) {
    alert('Conflict: overlapping booking or you already hold a slot.')
    return
  }
  if (!name.value.trim() || !email.value.trim()) { alert('Please fill your name and email.'); return }

  const entry = {
    id: Date.now(),
    programId: Number(p.id),
    start: start.toISOString(),
    end: end.toISOString(),
    name: name.value.trim(),
    email: email.value.trim()
  }
  bookings.value = [entry, ...bookings.value]
  save('bookings', bookings.value)
  heldCount.value++
  calendar.value?.addEvent({ id:`bk-${entry.id}`, title:`Reserved: ${entry.name}`, start:entry.start, end:entry.end, color:'#7c3aed' })
  alert('Booked! (local demo). You can send confirmations via Admin “Bulk Email”.')
}

function clearMyHolds() {
  const me = (email.value || '').toLowerCase()
  const keep = bookings.value.filter(b => (b.email || '').toLowerCase() !== me)
  const removed = bookings.value.length - keep.length
  bookings.value = keep
  save('bookings', keep)
  heldCount.value = 0
  rebuildCalendarEvents()
  alert(`Removed ${removed} of your local holds.`)
}

function rebuildCalendarEvents(){
  if (!calendar.value) return
  calendar.value.removeAllEvents()
  calendar.value.addEventSource(buildEvents())
}

function refreshFromStorage(){
  programs.value = load('programs', [])
  bookings.value = load('bookings', [])
  rebuildCalendarEvents()
}

function onStorage(e){
  if (['programs','bookings'].includes(e.key)) {
    refreshFromStorage()
  }
}

onMounted(async () => {
  programs.value = load('programs', [])
  bookings.value = load('bookings', [])
  await nextTick()
  calendar.value = new Calendar(calWrap.value, {
    plugins: [dayGridPlugin, timeGridPlugin, interactionPlugin],
    headerToolbar: { left: 'prev,next today', center: 'title', right: 'timeGridDay,dayGridMonth' },
    initialView: 'timeGridDay',
    height: 680,
    selectable: true,
    selectMirror: true,
    events: buildEvents(),
    select: (info) => {
      const p = programs.value.find(x => Number(x.id) === Number(programId.value))
      if (!p) { alert('Please select a program first.'); return }
      addBooking(p, info.startStr)
    },
    eventClick: (arg) => {
      if (String(arg.event.id).startsWith('bk-')) {
        const ok = confirm('Cancel this booking?')
        if (!ok) return
        const id = Number(String(arg.event.id).slice(3))
        bookings.value = bookings.value.filter(b => Number(b.id) !== id)
        save('bookings', bookings.value)
        arg.event.remove()
      }
    }
  })
  calendar.value.render()
  window.addEventListener('storage', onStorage)

  // If a program is selected, jump calendar to that date
  watch(programId, () => {
    const p = programs.value.find(x => Number(x.id) === Number(programId.value))
    if (p) calendar.value?.gotoDate(toISODate(p.date))
  })
})

onBeforeUnmount(() => {
  window.removeEventListener('storage', onStorage)
})
</script>

<style scoped>
.fc .fc-toolbar-title{ font-weight:600 }
</style>
