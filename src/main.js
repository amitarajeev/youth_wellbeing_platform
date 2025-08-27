import { createApp } from 'vue'
import App from './App.vue'

// Bootstrap
import 'bootstrap/dist/css/bootstrap.min.css'

// PrimeVue
import PrimeVue from 'primevue/config'
import Aura from '@primeuix/themes/aura'
import 'primeicons/primeicons.css'

// Global Styles
import './style.css'

const app = createApp(App)

app.use(PrimeVue, {
  theme: {
    preset: Aura,
  },
})

app.mount('#app')
