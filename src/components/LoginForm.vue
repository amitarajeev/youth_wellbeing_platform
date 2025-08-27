<template>
  <form id="login-form" class="form mt-4" @submit.prevent="handleLogin">
    <h2>Login</h2>

    <!-- Email -->
    <div class="mb-3">
      <label for="email" class="form-label">Email address</label>
      <input
        v-model="email"
        type="email"
        id="email"
        class="form-control"
        placeholder="Enter your email"
        required
      />
      <div v-if="emailError" class="text-danger small">{{ emailError }}</div>
    </div>

    <!-- Password -->
    <div class="mb-3">
      <label for="password" class="form-label">Password</label>
      <input
        v-model="password"
        type="password"
        id="password"
        class="form-control"
        placeholder="Enter your password"
        required
      />
      <div v-if="passwordError" class="text-danger small">{{ passwordError }}</div>
    </div>

    <!-- Submit -->
    <button type="submit" class="btn btn-custom">Login</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const email = ref('')
const password = ref('')
const emailError = ref('')
const passwordError = ref('')

function handleLogin() {
  emailError.value = ''
  passwordError.value = ''

  // Validation 1: Email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email.value)) {
    emailError.value = 'Please enter a valid email address.'
  }

  // Validation 2: Password length
  if (password.value.length < 6) {
    passwordError.value = 'Password must be at least 6 characters.'
  }

  if (!emailError.value && !passwordError.value) {
    alert(`Login successful for ${email.value}`)
  }
}
</script>
