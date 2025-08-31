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
        <input v-model="email" type="email" id="email" class="form-control" required />
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
      <button type="button" class="btn btn-danger ms-2" @click="clearUsers">Clear Users</button>
    </form>

    <!-- Registration Table -->
    <h3 class="mt-5">Registered Users</h3>
    <DataTable :value="users" paginator :rows="5" responsiveLayout="scroll">
      <Column field="name" header="Name" sortable />
      <Column field="email" header="Email" sortable />
      <Column field="role" header="Role" sortable />
    </DataTable>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue'
import { DataTable } from 'primevue/datatable'
import { Column } from 'primevue/column'

const name = ref('')
const email = ref('')
const role = ref('')
const password = ref('')

const users = ref([])

// Load from localStorage
onMounted(() => {
  const stored = localStorage.getItem('users')
  users.value = stored ? JSON.parse(stored) : []
})

// Persist to localStorage
watch(users, (val) => {
  localStorage.setItem('users', JSON.stringify(val))
}, { deep: true })

function handleRegister() {
  if (password.value.length < 6) {
    alert('Password must be at least 6 characters.')
    return
  }

  users.value.push({
    id: Date.now(),
    name: name.value,
    email: email.value,
    role: role.value,
    password: password.value // 
  })

  // Reset form
  name.value = ''
  email.value = ''
  role.value = ''
  password.value = ''
}

function clearUsers() {
  users.value = []
  localStorage.removeItem('users') // 
}
</script>

<style scoped>
form {
  background: #f8f9fa;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.1);
}

h2 {
  font-weight: 600;
  margin-bottom: 15px;
}

h3 {
  margin-top: 30px;
  font-weight: 600;
}

button {
  margin-top: 10px;
}
</style>
