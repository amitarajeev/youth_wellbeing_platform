<template>
  <div id="app">
    <!-- Skip link must be FIRST so it receives focus before navbar -->
    <a href="#main" class="skip-link btn-custom">Skip to main content</a>

    <NavBar />

    <main id="main" class="container py-4" tabindex="-1">
      <RouterView v-slot="{ Component }">
        <transition name="fade" mode="out-in">
          <component :is="Component" />
        </transition>
      </RouterView>
    </main>

    <Footer />
    <SafetyBanner />
  </div>
</template>

<script setup>
import NavBar from './components/NavBar.vue'
import SafetyBanner from './components/SafetyBanner.vue'
import Footer from './components/Footer.vue'
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
