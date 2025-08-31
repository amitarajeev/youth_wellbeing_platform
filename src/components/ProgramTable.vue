<template>
  <div>
    <h2 class="mb-3">Add a New Program</h2>

    <!-- Add Program Form -->
    <form @submit.prevent="addProgram" class="mb-4">
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
          <input v-model.number="newProgram.seats" type="number" class="form-control" placeholder="Seats" required min="1" />
        </div>
        <div class="col-md-3 d-flex gap-2">
          <button type="submit" class="btn btn-custom">Add Program</button>
          <button type="button" class="btn btn-custom-secondary" @click="clearPrograms">Clear Programs</button>
        </div>
      </div>
    </form>

    <!-- Program Table -->
    <h2 class="mb-3">Upcoming Programs</h2>
    <DataTable
      :value="programs"
      paginator
      :rows="5"
      responsiveLayout="scroll"
      sortMode="multiple"
      class="p-datatable-sm shadow-sm"
    >
      <Column field="title" header="Title" sortable />
      <Column field="topic" header="Topic" sortable />
      <Column field="date" header="Date" sortable />
      <Column field="mode" header="Mode" sortable />
      <Column field="seats" header="Seats Left" sortable />

      <Column header="Action" bodyClass="text-center">
        <template #body="slotProps">
          <button
            class="btn btn-custom btn-sm"
            @click="registerProgram(slotProps.data)"
            :disabled="slotProps.data.seats === 0"
          >
            {{ slotProps.data.seats === 0 ? "Full" : "Register" }}
          </button>
        </template>
      </Column>
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

const defaultPrograms = [
  { id: 1, title: 'Managing Anxiety', topic: 'Anxiety', date: '2025-09-10', mode: 'Online', seats: 12 },
  { id: 2, title: 'Sleep and Mindfulness', topic: 'Sleep', date: '2025-09-15', mode: 'In-person', seats: 8 },
  { id: 3, title: 'Healthy Friendships', topic: 'Relationships', date: '2025-09-18', mode: 'Online', seats: 0 },
]

const programs = ref([])
const newProgram = ref({ title: '', topic: '', date: '', mode: '', seats: 1 })

// Load programs
onMounted(() => {
  const stored = localStorage.getItem('programs')
  programs.value = stored ? JSON.parse(stored) : [...defaultPrograms]
})

// Save programs
watch(programs, (val) => {
  localStorage.setItem('programs', JSON.stringify(val))
}, { deep: true })

function addProgram() {
  programs.value.push({
    id: Date.now(),
    ...newProgram.value,
  })
  newProgram.value = { title: '', topic: '', date: '', mode: '', seats: 1 }
}

// Register
function registerProgram(program) {
  if (program.seats > 0) {
    program.seats -= 1
    alert(`You registered for: ${program.title}`)
  }
}

// ✅ Clear only user-added programs, keep defaults
function clearPrograms() {
  programs.value = [...defaultPrograms]
}
</script>


<style scoped>
h2 {
  font-weight: 600;
}
</style>
