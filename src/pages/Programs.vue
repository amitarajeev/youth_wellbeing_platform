<template>
  <div>
    <h1>Programs</h1>
    <p class="text-muted">Browse, register, or create youth wellbeing programs.</p>
    <ProgramTable />
  </div>
</template>

<script setup>
import ProgramTable from '../components/ProgramTable.vue'
</script>

<style scoped>
h1 {
  margin-bottom: 1rem;
}
</style>
