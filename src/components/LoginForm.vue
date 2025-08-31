<template>
  <div>
    <form id="login-form" class="form mt-4" @submit.prevent="handleLogin">
      <h2>Login</h2>

      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input v-model="email" type="email" id="email" class="form-control" required />
      </div>

      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input v-model="password" type="password" id="password" class="form-control" required />
      </div>

      <button type="submit" class="btn btn-custom">Login</button>
    </form>

    <!-- Feedback message -->
    <div v-if="message" class="alert mt-3" :class="messageClass">
      {{ message }}
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// ✅ Get registered users from Auth.vue
const props = defineProps({
  users: { type: Array, required: true }
})

const email = ref('')
const password = ref('')
const message = ref('')
const messageClass = ref('')

function handleLogin() {
  // Always read the latest registered users from localStorage
  const stored = localStorage.getItem('users')
  const users = stored ? JSON.parse(stored) : []

  const found = users.find(
    (u) => u.email === email.value && u.password === password.value
  )

  if (found) {
    // use your preferred feedback (alert keeps template unchanged)
    alert(`🎉 Welcome back, ${found.name}!`)
  } else {
    alert('❌ Invalid email or password.')
  }

  // Reset fields (keep your existing resets if you already have them)
  email.value = ''
  password.value = ''
}
</script>


