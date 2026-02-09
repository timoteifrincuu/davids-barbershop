import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import BookingView from '../views/BookingView.vue'
import LoginView from '../views/LoginView.vue'
import RegisterView from '../views/RegisterView.vue' // <--- IMPORT NOU
import AdminView from '../views/AdminView.vue'
import { supabase } from '../supabase'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', component: HomeView },
    { path: '/booking', component: BookingView, meta: { requiresAuth: true } }, // <--- PROTEJAM RUTA
    { path: '/login', component: LoginView },
    { path: '/register', component: RegisterView }, // <--- RUTA NOUA
    { path: '/admin', component: AdminView, meta: { requiresAuth: true } }
  ]
})

// Route Guards (Paznicul)
router.beforeEach(async (to, from, next) => {
  const { data: { session } } = await supabase.auth.getSession()

  // Daca ruta cere auth si nu esti logat -> Trimite la Login
  if (to.meta.requiresAuth && !session) {
    next('/login')
  } else {
    next()
  }
})

export default router