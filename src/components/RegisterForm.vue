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

    <!-- Table header: global search + export -->
    <div class="d-flex flex-wrap align-items-center gap-2 mt-5 mb-2">
      <h3 class="m-0">Registered Users</h3>
      <div class="ms-lg-auto d-flex flex-wrap gap-2">
        <div class="input-group" style="max-width: 420px">
          <span class="input-group-text">Search all</span>
          <input
            v-model="filters['global'].value"
            type="text"
            class="form-control"
            placeholder="Search by name, email, role…"
          />
          <button class="btn btn-custom" @click="clearFilters">Clear</button>
        </div>
        <button class="btn btn-custom" @click="exportUsersCSV()">Export CSV</button>
        <button class="btn btn-custom" @click="exportUsersPDF()">Export PDF</button>
      </div>
    </div>

    <!-- Interactive DataTable (D.3) -->
    <div class="table-responsive-fluid">
      <DataTable
        :value="profiles"
        dataKey="id"
        :paginator="true"
        :rows="10"
        :rowsPerPageOptions="[10,20,50]"
        :responsiveLayout="'stack'"
        breakpoint="992px"
        class="p-datatable-sm shadow-sm"
        :filters="filters"
        :globalFilterFields="['name','email','role']"
        :sortMode="'multiple'"
      >
        <!-- Name col with inline filter -->
        <Column field="name" header="Name" sortable filter :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <input v-model="filterModel.value" type="text" class="form-control" placeholder="Search name" />
          </template>
        </Column>

        <!-- Email col with inline filter -->
        <Column field="email" header="Email" sortable filter :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <input v-model="filterModel.value" type="text" class="form-control" placeholder="Search email" />
          </template>
        </Column>

        <!-- Role col with inline filter -->
        <Column field="role" header="Role" sortable filter :showFilterMenu="false">
          <template #filter="{ filterModel }">
            <select v-model="filterModel.value" class="form-select">
              <option value="">All</option>
              <option value="youth">youth</option>
              <option value="caregiver">caregiver</option>
              <option value="admin">admin</option>
            </select>
          </template>
        </Column>
      </DataTable>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import DataTable from 'primevue/datatable'
import Column from 'primevue/column'

// Keep your composable as-is (preserving your logic)
import { useAuth } from '@/composables/useAuth'

// NOTE: you used useAuth without calling it in your snippet.
// I’m preserving that to avoid changing your existing logic,
// but if your composable is a function you normally CALL,
// change this to: const { registerUser, getProfiles } = useAuth()
const { registerUser, getProfiles } = useAuth

const name = ref('')
const email = ref('')
const role = ref('')
const password = ref('')

const profiles = ref([])

/* Load profiles from your composable (Firebase mirrored locally per your logic) */
onMounted(() => {
  profiles.value = getProfiles()
})

/* PrimeVue filters for D.3 (string match modes, no primevue/api import) */
const filters = ref({
  global: { value: null, matchMode: 'contains' },
  name:   { value: null, matchMode: 'contains' },
  email:  { value: null, matchMode: 'contains' },
  role:   { value: null, matchMode: 'contains' },
})

function clearFilters () {
  Object.keys(filters.value).forEach(k => {
    filters.value[k].value = null
  })
}

/* Registration (preserved) */
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

/* Clear local list (preserved behavior) */
function clearProfiles() {
  localStorage.setItem('userProfiles', '[]')
  profiles.value = []
}

/* ---------- BR E.4: Export (CSV & PDF) ---------- */
function exportUsersCSV () {
  const headers = ['Name','Email','Role']
  const rows = profiles.value.map(u => [safe(u.name), safe(u.email), safe(u.role)])
  const csv = [headers, ...rows].map(r =>
    r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(',')
  ).join('\r\n')

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'users.csv'
  a.click()
  URL.revokeObjectURL(url)
}

function exportUsersPDF () {
  const head = `
    <style>
      body { font-family: Arial, sans-serif; padding: 16px; }
      h1 { margin-bottom: 12px; }
      table { width: 100%; border-collapse: collapse; }
      th, td { border: 1px solid #ccc; padding: 8px; }
      th { background: #f2f2f2; text-align: left; }
    </style>
  `
  const rows = profiles.value.map(u => `
    <tr>
      <td>${escapeHtml(u.name)}</td>
      <td>${escapeHtml(u.email)}</td>
      <td>${escapeHtml(u.role)}</td>
    </tr>
  `).join('')

  // print-friendly HTML (no external libs)
  const html = `
    <!doctype html>
    <html>
      <head>${head}</head>
      <body onload="window.print()">
        <h1>Registered Users</h1>
        <table>
          <thead>
            <tr><th>Name</th><th>Email</th><th>Role</th></tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `
  const w = window.open('', '_blank')
  if (w) {
    w.document.open()
    w.document.write(html)
    w.document.close()
  }
}

/* helpers */
function escapeHtml (s = '') {
  return String(s)
    .replace(/&/g,'&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;')
}
function safe (s = '') { return String(s ?? '').trim() }
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
