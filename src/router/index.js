import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BookingView from '../views/BookingView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue'
import AdminView from '../views/AdminView.vue'
import { supabase } from '../supabase'

// 1. AICI CITIM EMAILUL DIN .ENV (Nu il mai scriem direct)
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: '/booking', component: BookingView, meta: { requiresAuth: true } },
    { path: '/login', component: LoginView },
    { path: '/register', component: RegisterView },
    
    // 2. Adaugam regula "requiresAdmin"
    { 
      path: '/admin', 
      component: AdminView, 
      meta: { requiresAuth: true, requiresAdmin: true } 
    }
  ]
})

// Route Guards (Paznicul)
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()

  // Verificare 1: Daca ruta cere Auth si nu esti logat
  if (to.meta.requiresAuth && !session) {
    return next('/login')
  }

  // Verificare 2: Daca ruta cere ADMIN
  if (to.meta.requiresAdmin) {
    // Daca emailul utilizatorului NU este cel din fisierul secret
    if (session?.user.email !== ADMIN_EMAIL) {
      // Il trimitem la plimbare (la booking)
      return next('/booking') 
    }
  }

  next()
})

export default router