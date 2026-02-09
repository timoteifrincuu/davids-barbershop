<template>
  <div class="admin-container">
    <h1>Panou Administrare</h1>
    <p>Bine ai venit, David!</p>

    <div class="appointments-section">
      <h2>📅 Programări Confirmate</h2>
      
      <div v-if="loading" class="loading">Se încarcă programările...</div>
      
      <div v-else-if="appointments.length === 0" class="no-data">
        Nu există programări viitoare.
      </div>

      <table v-else class="appointments-table">
        <thead>
          <tr>
            <th>Data</th>
            <th>Ora</th>
            <th>Client</th>
            <th>Serviciu</th>
            <th>Telefon</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="app in appointments" :key="app.id">
            <td>{{ formatDate(app.date) }}</td>
            <td>{{ app.time }}</td>
            <td>{{ app.client_name }}</td>
            <td>{{ app.service_name }}</td>
            <td>{{ app.client_phone || '-' }}</td>
          </tr>
        </tbody>
      </table>
    </div>

    <hr class="divider">

    <div class="schedule-section">
      <h2>⚙️ Configurare Orar & Zile Libere</h2>
      <p class="hint">Debifează o zi pentru a o seta ca "ÎNCHIS" sau modifică orele.</p>
      
      <div class="schedule-grid">
        <div v-for="day in days" :key="day.date" class="day-card" :class="{ 'closed': !day.is_open }">
          <div class="day-header">
            <span class="day-name">{{ getDayName(day.date) }}</span>
            <span class="day-date">{{ formatDate(day.date) }}</span>
          </div>

          <label class="toggle-open">
            <input type="checkbox" v-model="day.is_open">
            <span v-if="day.is_open">Deschis ✅</span>
            <span v-else>Închis ❌</span>
          </label>

          <div v-if="day.is_open" class="time-inputs">
            <div class="input-group">
              <label>Start</label>
              <input type="time" v-model="day.start_time">
            </div>
            <div class="input-group">
              <label>Stop</label>
              <input type="time" v-model="day.end_time">
            </div>
          </div>

          <button @click="saveDay(day)" class="save-btn">Salvează Modificare</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

// --- LOGICA PENTRU PROGRAMĂRI ---
const appointments = ref([])
const loading = ref(true)

const fetchAppointments = async () => {
  try {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .gte('date', new Date().toISOString().split('T')[0]) // Doar programari viitoare sau de azi
      .order('date', { ascending: true })
      .order('time', { ascending: true })

    if (error) throw error
    appointments.value = data
  } catch (e) {
    console.error('Eroare la încărcarea programărilor:', e)
    alert('Nu am putut încărca programările.')
  } finally {
    loading.value = false
  }
}

// --- LOGICA PENTRU ORAR (Cea veche) ---
const days = ref([])

const getNextDays = () => {
  const list = []
  const today = new Date()
  
  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    
    list.push({
      date: dateStr,
      is_open: true, // Default
      start_time: '09:00',
      end_time: '18:00'
    })
  }
  return list
}

const loadScheduleOverrides = async () => {
  const { data } = await supabase.from('schedule_overrides').select('*')
  if (data) {
    data.forEach(override => {
      const day = days.value.find(d => d.date === override.date)
      if (day) {
        day.is_open = override.is_open
        day.start_time = override.start_time
        day.end_time = override.end_time
      }
    })
  }
}

const saveDay = async (day) => {
  const { error } = await supabase
    .from('schedule_overrides')
    .upsert({ 
      date: day.date, 
      is_open: day.is_open, 
      start_time: day.start_time, 
      end_time: day.end_time 
    }, { onConflict: 'date' })

  if (error) alert('Eroare la salvare!')
  else alert(`Orar salvat pentru ${day.date}`)
}

// Utilitare
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long' })
}

const getDayName = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('ro-RO', { weekday: 'long' })
}

onMounted(async () => {
  days.value = getNextDays()
  await loadScheduleOverrides() // Incarca orarul
  await fetchAppointments()     // Incarca programarile
})
</script>

<style scoped>
.admin-container {
  max-width: 1000px;
  margin: 0 auto;
  padding: 20px;
  background: #fff;
  color: #333;
}

h1, h2 { text-align: center; color: #2c3e50; }
.divider { margin: 40px 0; border: 1px solid #eee; }

/* Tabel Programari */
.appointments-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.appointments-table th, .appointments-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #ddd;
}

.appointments-table th {
  background-color: #f4f4f4;
  font-weight: bold;
}

.no-data { text-align: center; color: #888; padding: 20px; }

/* Grid Orar */
.schedule-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
  margin-top: 20px;
}

.day-card {
  border: 1px solid #ddd;
  padding: 15px;
  border-radius: 8px;
  background: #f9f9f9;
}

.day-card.closed {
  background: #ffecec;
  border-color: #ffcccc;
}

.day-header {
  font-weight: bold;
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.toggle-open {
  display: block;
  margin-bottom: 10px;
  cursor: pointer;
}

.input-group {
  margin-bottom: 5px;
}

.save-btn {
  width: 100%;
  padding: 8px;
  background: #333;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 10px;
}

.save-btn:hover { background: #555; }
</style>