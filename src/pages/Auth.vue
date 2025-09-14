<template>
  <div class="container py-5">
    <h1 class="text-center">User Authentication</h1>
      <div class="row">
      <!-- Register -->
      <div class="col-md-6">
        <RegisterForm 
          :users="users" 
          @update-users="updateUsers" 
          @clear-users="clearUsers" 
        />
      </div>

      <!-- Login -->
      <div class="col-md-6">
        <LoginForm :users="users" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import RegisterForm from '../components/RegisterForm.vue'
import LoginForm from '../components/LoginForm.vue'

const users = ref([])

// Update user list when RegisterForm emits
function updateUsers(updated) {
  users.value = updated
}

// Clear all users
function clearUsers() {
  users.value = []
}
</script>


<style scoped>
.page-section {
  min-height: calc(100vh - 140px);
  display: flex;
  align-items: center;
  background: var(--page-bg);
  padding: 3rem 1rem;
}

.page-title {
  text-align: center;
  margin-bottom: 2rem;
  font-weight: 700;
  color: #2c1aff;
  text-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.auth-card {
  background: white;
  border-radius: 12px;
}
</style>
