<template>
  <div>
    <h1>Resources</h1>
    <p class="text-muted">
      Explore self-help guides, stories, and tools to support mental health.
    </p>

    <div class="row">
      <div class="col-md-4 mb-4" v-for="resource in resources" :key="resource.id">
        <div class="card h-100 shadow-sm">
          <div class="card-body">
            <h5 class="card-title">{{ resource.title }}</h5>
            <p class="card-text">{{ resource.description }}</p>
            <button class="btn btn-custom btn-sm" @click="saveResource(resource)">
              Save
            </button>
            <button class="btn btn-outline-secondary btn-sm ms-2" @click="reportResource(resource)">
              Report
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'

const defaultResources = [
  { id: 1, title: 'Mindfulness Guide', description: 'Learn how to practice mindfulness daily.' },
  { id: 2, title: 'Coping with Stress', description: 'Strategies to manage stress effectively.' },
  { id: 3, title: 'Healthy Sleep Tips', description: 'Better sleep for better mental health.' },
]

const resources = ref([])
const savedResources = ref([])

onMounted(() => {
  const stored = localStorage.getItem('resources')
  resources.value = stored ? JSON.parse(stored) : defaultResources
})

watch(
  resources,
  (newVal) => {
    localStorage.setItem('resources', JSON.stringify(newVal))
  },
  { deep: true }
)

function saveResource(resource) {
  savedResources.value.push(resource)
  alert(`Saved: ${resource.title}`)
}

function reportResource(resource) {
  alert(`Reported: ${resource.title}`)
}
</script>

<style scoped>
.card {
  transition: transform 0.2s;
}
.card:hover {
  transform: scale(1.02);
}
</style>
