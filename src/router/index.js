import { createRouter, createWebHistory } from 'vue-router'
import { supabase } from '../supabase' // <--- Importam Supabase ca sa verificam userul

import HomeView from '../views/HomeView.vue'
import BookingView from '../views/BookingView.vue'
import AdminView from '../views/AdminView.vue'
import LoginView from '../views/LoginView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { 
      path: '/', 
      name: 'home', 
      component: HomeView 
    },
    { 
      path: '/booking', 
      name: 'booking', 
      component: BookingView 
    },
    { 
      path: '/login', 
      name: 'login', 
      component: LoginView 
    },
    { 
      path: '/admin', 
      name: 'admin', 
      component: AdminView,
      // Aici punem eticheta "PRIVAT"
      meta: { requiresAuth: true } 
    }
  ]
})

// --- PORTARUL (Navigation Guard) ---
router.beforeEach(async (to, from, next) => {
  // 1. Verificam daca utilizatorul e logat
  const { data: { session } } = await supabase.auth.getSession()

  // 2. Daca pagina cere autentificare (requiresAuth) SI nu avem sesiune (nu e logat)
  if (to.meta.requiresAuth && !session) {
    next('/login') // Il trimitem la login
  } else {
    next() // Il lasam sa treaca
  }
})

export default router