<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const appointments = ref([])
const loading = ref(true)

// 1. Functia care aduce programarile din baza de date
async function fetchAppointments() {
  loading.value = true
  
  // Luam tot din tabelul 'appointments' si le ordonam dupa data
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .order('date', { ascending: true }) // Cele mai apropiate primele

  if (error) {
    console.error('Eroare:', error)
  } else {
    appointments.value = data
  }
  loading.value = false
}

// 2. Functia de stergere (Anulare)
async function deleteAppointment(id) {
if (!confirm('Are you sure you want to delete this appointment?')) return

  const { error } = await supabase
    .from('appointments')
    .delete()
    .eq('id', id)

  if (error) {
    alert('Eroare la ștergere!')
  } else {
    // Daca s-a sters cu succes, reincarcam lista ca sa dispara de pe ecran
    fetchAppointments() 
  }
}

// Cand intram pe pagina, incarcam datele
onMounted(() => {
  fetchAppointments()
})
</script>

<template>
  <div class="admin-container">
    <h1>👨‍✈️ Panou Administrare</h1>
    
    <div v-if="loading" class="loading">Se încarcă programările...</div>
    
    <div v-else-if="appointments.length === 0" class="empty-state">
      Nu există programări momentan.
    </div>

    <div v-else class="appointments-list">
      <div v-for="app in appointments" :key="app.id" class="app-card">
        
        <div class="app-info">
          <div class="app-date">
            📅 {{ app.date }} <br> 
            ⏰ {{ app.time }}
          </div>
          
          <div class="app-details">
            <h3>{{ app.client_name || 'Anonymous Client' }}</h3>
            <p>📞 {{ app.client_phone || 'No phone' }}</p>
            <p class="service-tag">✂️ {{ app.service_name }} ({{ app.price }} RON)</p>
          </div>
        </div>

        <button @click="deleteAppointment(app.id)" class="delete-btn">
          🗑️ Delete
        </button>

      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: Arial, sans-serif;
}

h1 { text-align: center; margin-bottom: 30px; }

.app-card {
  background: white;
  border: 1px solid #eee;
  border-left: 5px solid #d4af37; /* Linie aurie in stanga */
  padding: 15px;
  margin-bottom: 15px;
  border-radius: 8px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 5px rgba(0,0,0,0.05);
}

.app-info { display: flex; gap: 20px; align-items: center; }

.app-date {
  background: #f9f9f9;
  padding: 10px;
  border-radius: 6px;
  text-align: center;
  font-weight: bold;
  min-width: 100px;
}

.app-details h3 { margin: 0 0 5px 0; font-size: 1.1rem; }
.app-details p { margin: 0; color: #666; font-size: 0.9rem; }
.service-tag { color: #d4af37; font-weight: bold; margin-top: 5px; }

.delete-btn {
  background: #ff4d4d;
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 5px;
  cursor: pointer;
}
.delete-btn:hover { background: #cc0000; }

@media (max-width: 600px) {
  .app-card { flex-direction: column; align-items: flex-start; gap: 15px; }
  .delete-btn { width: 100%; }
}
</style>