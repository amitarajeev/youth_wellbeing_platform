import { createRouter, createWebHashHistory } from 'vue-router'

// Import pages
import Home from './pages/Home.vue'
import Programs from './pages/Programs.vue'
import Resources from './pages/Resources.vue'
import Auth from './pages/Auth.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/programs', component: Programs },
  { path: '/resources', component: Resources },
  { path: '/auth', component: Auth },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
