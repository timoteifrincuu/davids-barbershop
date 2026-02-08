<script setup>
import { RouterView, RouterLink, useRouter } from 'vue-router'
import { ref, onMounted } from 'vue'
import { supabase } from './supabase'

const router = useRouter()
const isLoggedIn = ref(false)

onMounted(() => {
  supabase.auth.getSession().then(({ data: { session } }) => {
    isLoggedIn.value = !!session
  })

  supabase.auth.onAuthStateChange((_, session) => {
    isLoggedIn.value = !!session
  })
})

async function handleLogout() {
  await supabase.auth.signOut()
  router.push('/')
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
            <RouterLink to="/admin" class="nav-link admin-link">Admin</RouterLink>
            <button @click="handleLogout" class="logout-btn">Logout</button>
          </template>

          <template v-else>
            <RouterLink to="/login" class="login-btn-nav">Staff Login</RouterLink>
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
          <p>Premium cuts & styling since 2014.</p>
        </div>

        <div class="footer-section">
          <h3>Contact</h3>
          <p>📞 +40 7xx xxx xxx</p>
          <p>📍 Cluj-Napoca, Romania</p>
          <p>🕒 Mon - Fri: 09:00 - 18:00</p>
        </div>

        <div class="footer-section">
          <h3>Follow Us</h3>
          <a href="https://instagram.com" target="_blank" class="social-link">
            📸 Instagram
          </a>
        </div>

      </div>
      <div class="copyright">
        &copy; 2024 David's Barbershop. All rights reserved.
      </div>
    </footer>

  </div>
</template>

<style>
/* --- GLOBAL --- */
body { margin: 0; font-family: 'Arial', sans-serif; background-color: #f5f5f5; }
.app-wrapper { display: flex; flex-direction: column; min-height: 100vh; }

/* --- HEADER --- */
header {
  background-color: #000;
  padding: 15px 0;
  color: white;
  position: sticky; top: 0; z-index: 100;
  box-shadow: 0 2px 10px rgba(0,0,0,0.3);
}

.nav-content {
  max-width: 900px; margin: 0 auto; padding: 0 20px;
  display: flex; justify-content: space-between; align-items: center;
}

.logo { font-size: 1.5rem; font-weight: bold; color: white; text-decoration: none; }
nav { display: flex; gap: 15px; align-items: center; }

.nav-link { color: #ccc; text-decoration: none; font-weight: bold; transition: color 0.3s; }
.nav-link:hover { color: #d4af37; }
.router-link-active { color: #d4af37; }
.admin-link { color: #ff6b6b; }

.logout-btn {
  background: none; border: 1px solid #666; color: white;
  padding: 5px 10px; border-radius: 4px; cursor: pointer;
}
.logout-btn:hover { background: white; color: black; }

.login-btn-nav {
  text-decoration: none; color: #666; font-size: 0.8rem;
  padding: 5px; transition: color 0.3s;
}
.login-btn-nav:hover { color: #fff; }

/* --- MAIN --- */
main { flex: 1; }

/* --- FOOTER (DESIGN NOU) --- */
.app-footer {
  background-color: #000;
  color: white;
  padding: 40px 20px 20px;
  border-top: 3px solid #d4af37; /* Linie aurie eleganta sus */
}

.footer-content {
  max-width: 900px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 30px;
}

.footer-section h3 { color: #d4af37; margin-bottom: 15px; }
.footer-section p { color: #ccc; margin: 5px 0; font-size: 0.9rem; }

.social-link {
  color: white; text-decoration: none; font-weight: bold; display: block; margin-top: 5px;
}
.social-link:hover { color: #d4af37; }

.copyright {
  text-align: center; border-top: 1px solid #333; padding-top: 20px; color: #666; font-size: 0.8rem;
}

@media (max-width: 600px) {
  .footer-content { flex-direction: column; text-align: center; }
}
</style>