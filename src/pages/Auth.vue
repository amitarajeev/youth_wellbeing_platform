<template>
  <div class="container">
    <div class="row justify-content-center">
      <div class="col-md-6">
        <div class="card shadow-sm p-4 mt-5">
          <div class="d-flex justify-content-between mb-3">
            <button
              class="btn btn-outline-primary"
              :class="{ active: showLogin }"
              @click="showLogin = true"
            >
              Login
            </button>
            <button
              class="btn btn-outline-primary"
              :class="{ active: !showLogin }"
              @click="showLogin = false"
            >
              Register
            </button>
          </div>
          <LoginForm v-if="showLogin" />
          <RegisterForm v-else />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import LoginForm from '../components/LoginForm.vue'
import RegisterForm from '../components/RegisterForm.vue'

const showLogin = ref(true)
</script>

<style scoped>
button.active {
  background-color: #0d6efd;
  color: white;
}
</style>
