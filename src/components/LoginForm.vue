<<template>
  <form @submit.prevent="handleLogin" class="mt-4">
    <h3>Login</h3>

    <div class="mb-3">
      <label class="form-label">Email</label>
      <input v-model.trim="email" type="email" class="form-control" required />
    </div>

    <div class="mb-3">
      <label class="form-label">Password</label>
      <input v-model="password" type="password" class="form-control" required />
    </div>

    <button type="submit" class="btn btn-custom">Login</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { login as loginUser } from '@/composables/useAuth'

const email = ref('')
const password = ref('')
const router = useRouter()

async function handleLogin () {
  try {
    const session = await loginUser({ email: email.value, password: password.value })
    if (!session) {
      alert('Invalid credentials.')
      return
    }
    alert(`Welcome, ${session.name || session.email}!`)
    router.push({ name: 'home' })
  } catch (e) {
    alert(e?.message || 'Login failed.')
  }
}
</script>

<style scoped>
/* keep your existing styles */
</style>
