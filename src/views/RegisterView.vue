<script setup>
import { ref } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const email = ref('')
const password = ref('')
const loading = ref(false)
const router = useRouter()

async function handleRegister() {
  loading.value = true
  // Functia de sign-up din Supabase
  const { data, error } = await supabase.auth.signUp({
    email: email.value,
    password: password.value,
  })

  if (error) {
    alert('Error: ' + error.message)
  } else {
    alert('Cont creat cu succes! Te poți loga acum.')
    router.push('/login')
  }
  loading.value = false
}
</script>

<template>
  <div class="auth-container">
    <h1>Creează Cont Client</h1>
    <p>Ai nevoie de cont pentru a te programa.</p>
    
    <div class="form-group">
      <input v-model="email" type="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Parolă (min 6 caractere)" />
      
      <button @click="handleRegister" :disabled="loading">
        {{ loading ? 'Se creează...' : 'Înregistrează-te' }}
      </button>
    </div>

    <p class="switch-link">
      Ai deja cont? <RouterLink to="/login">Loghează-te aici</RouterLink>
    </p>
  </div>
</template>

<style scoped>
.auth-container { max-width: 400px; margin: 50px auto; padding: 20px; text-align: center; background: white; border-radius: 10px; border: 1px solid #eee; }
input { display: block; width: 100%; margin: 10px 0; padding: 10px; box-sizing: border-box; border: 1px solid #ccc; border-radius: 5px; }
button { width: 100%; padding: 10px; background-color: #d4af37; color: white; border: none; cursor: pointer; font-weight: bold; border-radius: 5px; margin-top: 10px; }
button:disabled { background-color: #ccc; }
.switch-link { margin-top: 20px; font-size: 0.9rem; }
.switch-link a { color: #d4af37; text-decoration: none; font-weight: bold; }
</style>