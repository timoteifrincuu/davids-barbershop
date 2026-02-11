<script setup>
import { ref, onMounted, computed } from 'vue'
import { RouterLink, RouterView, useRouter } from 'vue-router'
import { supabase } from './supabase'

const router = useRouter()
const session = ref(null)

// 1. Citim emailul de admin din .env
const ADMIN_EMAIL = import.meta.env.VITE_ADMIN_EMAIL

// 2. Calculam daca userul curent este Admin
const isAdmin = computed(() => {
  return session.value?.user?.email === ADMIN_EMAIL
})

onMounted(() => {
  supabase.auth.getSession().then(({ data }) => {
    session.value = data.session
  })

  supabase.auth.onAuthStateChange((_, _session) => {
    session.value = _session
  })
})

const handleLogout = async () => {
  await supabase.auth.signOut()
  router.push('/login')
}
</script>
<template>
  <div class="app-wrapper">
    
    <header>
      <div class="nav-content">
        <RouterLink to="/" class="logo">💈 David's Barbershop</RouterLink>

        <nav>
          <RouterLink to="/booking" class="nav-link">📅 Book Now</RouterLink>

          <template v-if="isLoggedIn">
            <RouterLink v-if="isAdmin" to="/admin" class="nav-link admin-link">Admin</RouterLink>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </template>

          <template v-else>
            <RouterLink to="/login" class="login-btn-nav">Login / Sign Up</RouterLink>
          </template>
        </nav>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="app-footer">
      <div class="footer-content">
        
        <div class="footer-section">
          <h3>David's Barbershop</h3>
          <p>Premium cuts & styling.</p>
        </div>

        <div class="footer-section">
          <h3>Contact</h3>
          <p>📞 +40 7xx xxx xxx</p>
          <p>📍 Disponibil în Oradea & Arad</p> 
        </div>

        <div class="footer-section">
          <h3>Follow Us</h3>
          <a href="https://www.instagram.com/eusuntthebarber" target="_blank" class="social-link">
            📸 @eusuntthebarber
          </a>
        </div>

      </div>
      <div class="copyright">
        &copy; 2024 David's Barbershop. All rights reserved.
      </div>
    </footer>

  </div>
</template>

<style scoped>
/* Aici definim stilul DOAR pentru Bara de Navigare și Footer */

header {
  background-color: #111; /* Fundal Negru */
  padding: 1rem 2rem;
  border-bottom: 3px solid #f1c40f; /* Linie Galbenă */
}

nav {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  color: #f1c40f !important; /* Logo Galben */
  font-size: 1.5rem;
  font-weight: bold;
  text-decoration: none;
}

.nav-links {
  display: flex;
  gap: 20px;
}

/* Link-urile din meniu - Text Alb */
.nav-link {
  color: #ffffff !important; 
  text-decoration: none;
  font-weight: 500;
  transition: color 0.3s;
}

.nav-link:hover {
  color: #f1c40f !important; /* Hover Galben */
}

/* Footer (daca exista) */
footer {
  background-color: #111;
  color: #f1c40f !important;
  text-align: center;
  padding: 20px;
  margin-top: 50px;
}
</style>