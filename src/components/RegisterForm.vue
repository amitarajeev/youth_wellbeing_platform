<template>
  <div>
    <form id="register-form" class="form mt-4" @submit.prevent="handleRegister" novalidate>
      <h2>Register</h2>

      <!-- Name -->
      <div class="mb-3">
        <label for="name" class="form-label">Full Name</label>
        <input v-model.trim="name" type="text" id="name" class="form-control" required />
      </div>

      <!-- Email -->
      <div class="mb-3">
        <label for="email" class="form-label">Email</label>
        <input
          v-model.trim="email"
          type="email"
          id="email"
          class="form-control"
          :class="{'is-invalid': submitAttempted && !emailValid}"
          required
        />
        <!-- Email invalid messages -->
        <div class="invalid-feedback" v-if="submitAttempted && !emailFormatValid">
          Please enter a valid email address (e.g., name@example.com).
        </div>
        <div class="invalid-feedback" v-else-if="submitAttempted && !emailUnique">
          An account with this email already exists. Please use a different email or log in.
        </div>
      </div>

      <!-- Role -->
      <div class="mb-3">
        <label class="form-label">Role</label>
        <select v-model="role" class="form-select" required>
          <option disabled value="">Select role</option>
          <option value="youth">Youth (13–25)</option>
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
          :class="{'is-invalid': submitAttempted && !passwordValid}"
          required
        />
        <!-- Password invalid messages (Bootstrap invalid-feedback) -->
        <div class="invalid-feedback" v-if="submitAttempted && !passwordValid">
          <ul class="mb-0 ps-3">
            <li v-if="!hasMinLen">At least 8 characters</li>
            <li v-if="!hasUpper">At least one uppercase letter (A–Z)</li>
            <li v-if="!hasLower">At least one lowercase letter (a–z)</li>
            <li v-if="!hasDigit">At least one digit (0–9)</li>
            <li v-if="!hasSpecial">At least one special character (!@#$%^&* etc.)</li>
            <li v-if="!noSpaces">Must not contain spaces</li>
          </ul>
        </div>
      </div>

      <button type="submit" class="btn btn-custom">Register</button>
      <button type="button" class="btn btn-custom ms-2" @click="clearUsers">Clear Users</button>
    </form>

    <!-- Registration Table -->
    <h3 class="mt-5">Registered Users</h3>
    <div class="table-responsive-fluid">
      <DataTable
        :value="users"
        paginator
        :rows="5"
        responsiveLayout="stack"
        breakpoint="992px"
        class="p-datatable-sm shadow-sm"
      >
        <Column field="name" header="Name" sortable />
        <Column field="email" header="Email" sortable />
        <Column field="role" header="Role" sortable />
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue'
import DataTable from 'primevue/datatable'
import Column  from 'primevue/column'

const name = ref('')
const email = ref('')
const role = ref('')
const password = ref('')

const users = ref([])

/* ---------- Load & persist users (source of truth = localStorage) ---------- */
onMounted(() => {
  const stored = localStorage.getItem('users')
  users.value = stored ? JSON.parse(stored) : []
})

watch(users, (val) => {
  localStorage.setItem('users', JSON.stringify(val))
}, { deep: true })

/* --------------------- Validation state & rules --------------------- */
const submitAttempted = ref(false)

// Email: format + uniqueness
const emailFormatValid = computed(() =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.value || '')
)

const emailUnique = computed(() => {
  const normalized = (email.value || '').trim().toLowerCase()
  return !users.value.some(
    u => (u.email || '').trim().toLowerCase() === normalized
  )
})

const emailValid = computed(() => emailFormatValid.value && emailUnique.value)

// Password rules
const hasMinLen  = computed(() => (password.value || '').length >= 8)
const hasUpper   = computed(() => /[A-Z]/.test(password.value || ''))
const hasLower   = computed(() => /[a-z]/.test(password.value || ''))
const hasDigit   = computed(() => /\d/.test(password.value || ''))
const hasSpecial = computed(() => /[^A-Za-z0-9\s]/.test(password.value || ''))
const noSpaces   = computed(() => !/\s/.test(password.value || ''))

const passwordValid = computed(() =>
  hasMinLen.value && hasUpper.value && hasLower.value &&
  hasDigit.value && hasSpecial.value && noSpaces.value
)

/* --------------------- Submit handler --------------------- */
function handleRegister() {
  submitAttempted.value = true

  // Let browser required fields also participate, but block submit when our rules fail
  if (!emailValid.value || !passwordValid.value || !name.value.trim() || !role.value) {
    // keep the invalid feedbacks visible
    return
  }

  // Add the new user
  const newUser = {
    id: Date.now(),
    name: name.value.trim(),
    email: email.value.trim(),
    role: role.value,
    password: password.value, // stored for login check
  }

  users.value = [...users.value, newUser]

  // Reset form
  name.value = ''
  email.value = ''
  role.value = ''
  password.value = ''
  submitAttempted.value = false
}

function clearUsers() {
  users.value = []
  localStorage.removeItem('users')
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
