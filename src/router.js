import { createRouter, createWebHashHistory } from 'vue-router'

// Pages
import Home from './pages/Home.vue'
import Programs from './pages/Programs.vue'
import Resources from './pages/Resources.vue'
import Auth from './pages/Auth.vue'
import Reviews from './pages/Reviews.vue' // NEW

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/programs', name: 'programs', component: Programs },
  { path: '/resources', name: 'resources', component: Resources },
  { path: '/auth', name: 'auth', component: Auth },
  // Users must be logged in to write reviews
  { path: '/reviews', name: 'reviews', component: Reviews, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() { return { top: 0 } },
})

// Simple auth guard
router.beforeEach((to) => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null')
  if (to.meta?.requiresAuth && !currentUser) {
    return { name: 'auth' }
  }
  if (to.meta?.requiresRole && currentUser?.role !== to.meta.requiresRole) {
    return { name: 'home' }
  }
})

export default router
