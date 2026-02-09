<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const router = useRouter()

async function handleLogin() {
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    alert("Error logging in: " + error.message)
  } else {
    // Dupa login, mergem la Booking
    router.push('/booking')
  }
}
</script>

<template>
  <div class="login-container">
    <h1>Login Client / Staff</h1>
    
    <div class="form-group">
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />
      <button @click="handleLogin">Intră în cont</button>
    </div>

    <p class="switch-link">
      Nu ai cont? <RouterLink to="/register">Creează cont nou</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.login-container { max-width: 400px; margin: 100px auto; padding: 30px; border: 1px solid #ddd; border-radius: 8px; background: white; text-align: center; }
input { display: block; width: 100%; padding: 10px; margin-bottom: 15px; border: 1px solid #ccc; border-radius: 4px; box-sizing: border-box; }
button { width: 100%; padding: 10px; background-color: #333; color: white; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; transition: background 0.3s; }
button:hover { background-color: #d4af37; color: black; }
.switch-link { margin-top: 20px; font-size: 0.9rem; }
.switch-link a { color: #d4af37; text-decoration: none; font-weight: bold; }
</style>