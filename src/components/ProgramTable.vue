<template>
  <div>
    <h2 class="mb-3">Upcoming Programs</h2>

    <!-- Program Table -->
    <DataTable
      :value="programs"
      paginator
      :rows="5"
      :filters="filters"
      filterDisplay="row"
      responsiveLayout="scroll"
      sortMode="multiple"
      class="p-datatable-sm shadow-sm"
    >
      <Column field="title" header="Title" sortable filter filterPlaceholder="Search by title" />
      <Column field="topic" header="Topic" sortable filter filterPlaceholder="Filter by topic" />
      <Column field="date" header="Date" sortable />
      <Column field="mode" header="Mode" sortable filter filterPlaceholder="Online/In-person" />
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
import { DataTable } from 'primevue/datatable'
import { Column } from 'primevue/column'

const defaultPrograms = [
  {
    id: 1,
    title: 'Managing Anxiety',
    topic: 'Anxiety',
    date: '2025-09-10',
    mode: 'Online',
    seats: 12,
  },
  {
    id: 2,
    title: 'Sleep and Mindfulness',
    topic: 'Sleep',
    date: '2025-09-15',
    mode: 'In-person',
    seats: 8,
  },
  {
    id: 3,
    title: 'Healthy Friendships',
    topic: 'Relationships',
    date: '2025-09-18',
    mode: 'Online',
    seats: 0,
  },
]

const programs = ref([])
const filters = ref({
  global: { value: null, matchMode: 'contains' },
})

// Load from localStorage on mount
onMounted(() => {
  const stored = localStorage.getItem('programs')
  programs.value = stored ? JSON.parse(stored) : defaultPrograms
})

// Watch and persist changes to localStorage
watch(
  programs,
  (newVal) => {
    localStorage.setItem('programs', JSON.stringify(newVal))
  },
  { deep: true }
)

function registerProgram(program) {
  if (program.seats > 0) {
    program.seats -= 1
    alert(`You registered for: ${program.title}`)
  }
}
</script>

<style scoped>
h2 {
  font-weight: 600;
  margin-bottom: 1rem;
}
</style>
