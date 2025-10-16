<template>
  <section class="container py-4">
    <h1 class="mb-3 text-center">Send Email</h1>
    <h2 class="page-title text-center mb-2"> Use this form to send an email (with optional attachment) via our secure backend.</h2>
   
    <!-- Composer form -->
    <EmailComposer />
  </section>
</template>

<script setup>
import EmailComposer from '@/components/EmailComposer.vue'
</script>
<style scoped>
h2 {
  font-weight: 600;
}
</style>

