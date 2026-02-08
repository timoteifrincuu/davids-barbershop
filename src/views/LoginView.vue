<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter() // Ne ajuta sa schimbam pagina

async function handleLogin() {
  loading.value = true
  
  // Cerem la Supabase sa ne logheze
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value
  })

  if (error) {
    alert('Error: ' + error.message)
  } else {
    // Daca e succes, ne duce direct in Admin
    router.push('/admin')
  }
  loading.value = false
}
</script>

<template>
  <div class="login-container">
    <div class="login-card">
      <h1>🔐 Admin Access</h1>
    <p>For authorized personnel only</p>

      <div class="form-group">
        <label>Email</label>
        <input v-model="email" type="email" placeholder="admin@barber.com">
      </div>

      <div class="form-group">
        <label>Parolă</label>
        <input v-model="password" type="password" placeholder="******">
      </div>

      <button @click="handleLogin" :disabled="loading" class="login-btn">
        {{ loading ? 'Verifying...' : 'Enter into account' }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 80vh; /* Centrat pe mijlocul ecranului */
  font-family: Arial, sans-serif;
}

.login-card {
  background: white;
  padding: 40px;
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0,0,0,0.1);
  width: 100%;
  max-width: 400px;
  text-align: center;
  border: 1px solid #eee;
}

h1 { margin-bottom: 10px; color: #333; }
p { color: #888; margin-bottom: 30px; font-size: 0.9rem; }

.form-group { margin-bottom: 20px; text-align: left; }
label { display: block; margin-bottom: 5px; font-weight: bold; font-size: 0.9rem; }
input {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 8px;
  font-size: 1rem;
}

.login-btn {
  width: 100%;
  background-color: #000;
  color: #d4af37;
  padding: 15px;
  border: none;
  border-radius: 8px;
  font-weight: bold;
  cursor: pointer;
  margin-top: 10px;
}
.login-btn:hover { background-color: #333; }
.login-btn:disabled { opacity: 0.7; cursor: not-allowed; }
</style>