<template> 
  <form @submit.prevent="handleLogin" class="mt-4">
    <h3>Login</h3>

    <div class="mb-3">
      <label class="form-label">Email</label>
      <input v-model.trim="email" type="email" class="form-control" required />
    </div>

    <div class="mb-3">
      <label class="form-label">Password</label>
      <input v-model="password" type="password" class="form-control" required />
    </div>

    <button type="submit" class="btn btn-custom">Login</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { canAttemptLogin, recordLoginFailure, recordLoginSuccess, sanitize } from '../utils/security'
import useAuthDefault, { useAuth as authObj } from '../composables/useAuth'

// Support either import style because useAuth.js exports both:
const useAuth = authObj || useAuthDefault

const email = ref('')
const password = ref('')
const router = useRouter()

async function handleLogin() {
  if (!canAttemptLogin()) {
    alert('Too many failed attempts. Please wait a moment and try again.')
    return
  }

  const session = await useAuth.login({
    email: sanitize((email.value || '').trim().toLowerCase()),
    password: password.value || ''
  })

  if (!session) {
    recordLoginFailure()
    alert('Invalid credentials.')
    return
  }

  recordLoginSuccess()
  alert(`✅ Welcome back, ${session.name}!`)
  email.value = ''
  password.value = ''
  router.push('/') // use route name if you prefer: { name: 'home' }
}
</script>

<style scoped>
/* keep your existing styles */
</style>
