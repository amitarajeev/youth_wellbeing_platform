// src/composables/useAuth.js
import { ref, computed } from 'vue'

const _currentUser = ref(loadUser())

function loadUser() {
  try {
    return JSON.parse(localStorage.getItem('currentUser') || 'null')
  } catch {
    return null
  }
}

export function useAuth() {
  const isLoggedIn = computed(() => !!_currentUser.value)
  const role = computed(() => _currentUser.value?.role || null)

  function loginUser(user) {
    // Never keep password in memory
    const safe = { ...user }
    delete safe.password
    localStorage.setItem('currentUser', JSON.stringify(safe))
    _currentUser.value = safe
  }

  function logoutUser() {
    localStorage.removeItem('currentUser')
    _currentUser.value = null
  }

  return { currentUser: _currentUser, isLoggedIn, role, loginUser, logoutUser }
}
