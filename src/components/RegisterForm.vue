<template>
  <form id="register-form" class="form mt-4" @submit.prevent="handleRegister">
    <h2>Register</h2>

    <!-- Name -->
    <div class="mb-3">
      <label for="name" class="form-label">Full Name</label>
      <input v-model="name" type="text" id="name" class="form-control" required />
    </div>

    <!-- Email -->
    <div class="mb-3">
      <label for="email" class="form-label">Email</label>
      <input v-model="email" type="email" id="email" class="form-control" required />
    </div>

    <!-- Role Selection -->
    <div class="mb-3">
      <label class="form-label">Role</label>
      <select v-model="role" class="form-select" required>
        <option disabled value="">Select role</option>
        <option value="youth">Youth (13-25)</option>
        <option value="caregiver">Caregiver / Parent</option>
      </select>
    </div>

    <!-- Password -->
    <div class="mb-3">
      <label for="password" class="form-label">Password</label>
      <input
        v-model="password"
        type="password"
        id="password"
        class="form-control"
        required
      />
    </div>

    <!-- Submit -->
    <button type="submit" class="btn btn-custom">Register</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'

const name = ref('')
const email = ref('')
const role = ref('')
const password = ref('')

function handleRegister() {
  if (!name.value || !email.value || !role.value || !password.value) {
    alert('All fields are required!')
    return
  }

  if (password.value.length < 6) {
    alert('Password must be at least 6 characters.')
    return
  }

  alert(`Registration successful: ${name.value} (${role.value})`)
}
</script>
