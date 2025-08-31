<template>
  <section class="page-section">
    <div class="container">
      <h2 class="page-title">User Authentication</h2>
      <div class="row g-4">
        
        <!-- Register Form -->
        <div class="col-md-6">
          <div class="auth-card shadow-sm p-4">
            <h3 class="mb-3">Register</h3>
            <RegisterForm :users="users" @update:users="users = $event" />
          </div>
        </div>

        <!-- Login Form -->
        <div class="col-md-6">
          <div class="auth-card shadow-sm p-4">
            <h3 class="mb-3">Login</h3>
            <LoginForm :users="users" />
          </div>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import RegisterForm from '../components/RegisterForm.vue'
import LoginForm from '../components/LoginForm.vue'

const users = ref([])

onMounted(() => {
  const stored = localStorage.getItem('users')
  users.value = stored ? JSON.parse(stored) : []
})
</script>

<style scoped>
.page-section {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  background: var(--page-bg);
  padding: 3rem 1rem;
}

.page-title {
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 700;
  color: #2c1aff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.auth-card {
  background: white;
  border-radius: 12px;
}
</style>
