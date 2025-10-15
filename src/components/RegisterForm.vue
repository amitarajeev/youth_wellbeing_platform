<template>
  <div>
    <form id="register-form" class="form mt-4" @submit.prevent="handleRegister">
      <h2>Register</h2>

      <div class="mb-3">
        <label for="name" class="form-label">Full Name</label>
        <input v-model="name" type="text" id="name" class="form-control" required />
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
          <option value="admin">Admin</option>
        </select>
      </div>

      <div class="mb-3">
        <label for="password" class="form-label">Password</label>
        <input v-model="password" type="password" id="password" class="form-control" required />
      </div>

      <button type="submit" class="btn btn-custom">Register</button>
      <button type="button" class="btn btn-custom ms-2" @click="clearProfiles">Clear Users</button>
    </form>

    <h3 class="mt-5">Registered Users</h3>
    <DataTable
      :value="profiles"
      paginator
      :rows="5"
      responsiveLayout="scroll"
      class="p-datatable-sm shadow-sm table-responsive"
    >
      <Column field="name"  header="Name"  sortable />
      <Column field="email" header="Email" sortable />
      <Column field="role"  header="Role"  sortable />
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

import { useAuth } from '@/composables/useAuth'

// local profiles helper from composable
const { registerUser, getProfiles } = useAuth

const name = ref('')
const email = ref('')
const role = ref('')
const password = ref('')

const profiles = ref([])

onMounted(() => {
  profiles.value = getProfiles()
})

async function handleRegister() {
  try {
    if (!password.value || password.value.length < 6) {
      alert('Password must be at least 6 characters.')
      return
    }

    await registerUser({
      name: name.value,
      email: email.value,
      role: role.value,
      password: password.value
    })

    // refresh local profiles table
    profiles.value = getProfiles()

    // reset form
    name.value = ''
    email.value = ''
    role.value = ''
    password.value = ''

    alert('✅ Registered successfully (via Firebase)!')
  } catch (e) {
    alert(e?.message || 'Registration failed.')
  }
}

function clearProfiles() {
  // purely local: remove the profiles list, not Firebase accounts
  localStorage.setItem('userProfiles', '[]')
  profiles.value = []
}
</script>

<style scoped>
/* (kept exactly as you asked) */
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
