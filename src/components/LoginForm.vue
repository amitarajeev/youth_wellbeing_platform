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
import { sanitize, verifyPassword } from '@/utils/security'
import { useAuth } from '@/composables/useAuth'

const email = ref('')
const password = ref('')
const router = useRouter()
const { loginUser } = useAuth()

async function handleLogin() {
  const normalized = (email.value || '').trim().toLowerCase()
  const users = JSON.parse(localStorage.getItem('users') || '[]')
  const user = users.find(u => (u.email || '').trim().toLowerCase() === normalized)

  if (!user) {
    alert('Invalid credentials.')
    return
  }

  // Use the verifier (compares salted hash)
  const ok = await verifyPassword(password.value, user.salt, user.passwordHash)
  if (!ok) {
    alert('Invalid credentials.')
    return
  }

  loginUser(user)
  router.push({ name: 'home' })
}
</script>
