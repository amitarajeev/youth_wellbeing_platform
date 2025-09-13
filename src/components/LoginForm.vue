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
<template>
  <form class="form mt-4" @submit.prevent="handleLogin" novalidate>
    <h2>Login</h2>

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
import { login } from '@/useAuth'                               // ← secure login (salted hash compare)
import { canAttemptLogin, recordLoginFailure, recordLoginSuccess } from '@/security' // ← lockout

const email = ref('')
const password = ref('')

async function handleLogin() {
  if (!canAttemptLogin()) {
    alert('Too many failed attempts. Please wait a moment and try again.')
    return
  }

  const session = await login({ email: email.value, password: password.value })
  if (!session) {
    recordLoginFailure()
    alert('❌ Invalid email or password.')
    return
  }

  recordLoginSuccess()
  // Clear inputs for safety
  email.value = ''
  password.value = ''
  alert(`✅ Welcome back, ${session.name}!`)
}
</script>
    <button type="submit" class="btn btn-custom">Login</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { hashPassword } from '@/utils/security'
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

  const hashed = await hashPassword(password.value)
  if (hashed !== user.passwordHash) {
    alert('Invalid credentials.')
    return
  }

  loginUser(user)
  router.push({ name: 'home' })
}
</script>
