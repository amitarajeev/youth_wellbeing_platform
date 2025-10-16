import { createRouter, createWebHashHistory } from 'vue-router'

// Pages
import Home from './pages/Home.vue'
import Programs from './pages/Programs.vue'
import Resources from './pages/Resources.vue'
import Auth from './pages/Auth.vue'
import Reviews from './pages/Reviews.vue'
import Email from './pages/Email.vue'

const routes = [
  { path: '/', name: 'home', component: Home },
  { path: '/programs', name: 'programs', component: Programs },
  { path: '/resources', name: 'resources', component: Resources },

  
  { path: '/reviews', name: 'reviews', component: Reviews},

  { path: '/auth', name: 'auth', component: Auth },
  { path: '/email', name: 'email', component: Email },

  // Catch-all redirects to Home
  { path: '/:pathMatch(.*)*', redirect: { name: 'home' } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

// Simple auth guard using what's stored client-side
router.beforeEach((to) => {
  const currentUser =
    JSON.parse(localStorage.getItem('session') || 'null') ?? // preferred new key
    JSON.parse(localStorage.getItem('currentUser') || 'null') // backward compat

  if (to.meta?.requiresAuth && !currentUser) {
    // keep intended destination for post-login redirect
    return { name: 'auth', query: { redirect: to.fullPath } }
  }

  // Optional role guard (add meta: { requiresRole: 'caregiver' } on any route if needed)
  if (to.meta?.requiresRole && currentUser?.role !== to.meta.requiresRole) {
    return { name: 'home' }
  }
})

export default router
