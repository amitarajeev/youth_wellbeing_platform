<template>
  <div id="app">
    <!-- Navigation -->
    <NavBar />

    <!-- Main Content -->
    <main class="container my-4">
      <router-view />
    </main>

    <!-- Safety Banner -->
    <SafetyBanner />

    <!-- Footer -->
    <Footer />
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import Footer from './components/Footer.vue'
import SafetyBanner from './components/SafetyBanner.vue'
</script>

<style>
/* Global App Styles */
body {
  font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  background-color: #f5f8fa;
  margin: 0;
  padding: 0;
}

#app {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

main {
  flex: 1;
  min-height: 70vh;
}
</style>
