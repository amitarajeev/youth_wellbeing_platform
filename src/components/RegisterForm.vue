<template>
  <div>
    <form id="register-form" class="form mt-4" @submit.prevent="handleRegister" novalidate>
      <h2>Register</h2>

      <div class="mb-3">
        <label for="name" class="form-label">Full Name</label>
        <input v-model.trim="name" type="text" id="name" class="form-control" required />
      </div>

      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input v-model.trim="email" type="email" id="email" class="form-control" required />
      </div>

      <div class="mb-3">
        <label class="form-label">Role</label>
        <select v-model="role" class="form-select" required>
          <option disabled value="">Select role</option>
          <option value="youth">Youth (13–25)</option>
          <option value="caregiver">Caregiver / Parent</option>
        </select>
      </div>

      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input v-model="password" type="password" id="password" class="form-control" required />
      </div>

      <button type="submit" class="btn btn-custom">Register</button>
      <button type="button" class="btn btn-custom ms-2" @click="clearUsers">Clear Users</button>
    </form>

    <!-- Registration Table -->
    <h3 class="mt-5">Registered Users</h3>
    <DataTable 
      :value="users" 
      paginator 
      :rows="5" 
      responsiveLayout="scroll" 
      class="p-datatable-sm shadow-sm table-responsive"
    >
      <Column field="name" header="Name" sortable />
      <Column field="email" header="Email" sortable />
      <Column field="role" header="Role" sortable />
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column  from 'primevue/column'

import { registerUser, getUsers, logout } from '../composables/useAuth'     // ← secure helpers
import { sanitize } from '../utils/security'                           // ← for any free text you persist

const name = ref('')
const email = ref('')
const role = ref('')
const password = ref('')

const users = ref([])

onMounted(() => {
  users.value = getUsers()
})

function strongPassword(pw) {
  // ≥8 chars, at least one upper, lower, digit, special, and no spaces
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\w\s]).{8,}$/.test(pw) && !/\s/.test(pw)
}

async function handleRegister() {
  // Optional UX check (useAuth also validates/normalises)
  if (!strongPassword(password.value)) {
    alert('Password must be 8+ chars, include upper/lower, a digit, a special character, and no spaces.')
    return
  }

  try {
    await registerUser({
      name: name.value,       // useAuth sanitises before persisting
      email: email.value,
      role: role.value,       // must be one of: youth | caregiver | admin (if you use admin)
      password: password.value
    })

    // Refresh table from canonical storage
    users.value = getUsers()

    // Reset fields
    name.value = ''
    email.value = ''
    role.value = ''
    password.value = ''

    alert('✅ Registered successfully!')
  } catch (err) {
    alert(err?.message || 'Registration failed.')
  }
}

function clearUsers() {
  // Clear users and any logged-in session
  localStorage.removeItem('users')
  users.value = []
  logout()
}
</script>

<style scoped>
form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}
h2 { font-weight: 600; margin-bottom: 15px; }
h3 { margin-top: 30px; font-weight: 600; }
button { margin-top: 10px; }
</style>
