<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'

const schedule = ref([])
const loading = ref(true)
const feedback = ref('')

// Generam urmatoarele 14 zile
function getNextDays(days = 14) {
  const list = []
  const today = new Date()
  
  for (let i = 0; i < days; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    // Format YYYY-MM-DD pentru baza de date
    const dateStr = d.toISOString().split('T')[0]
    
    list.push({
      date: dateStr,
      displayDate: d.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' }),
      is_working: true,
      start_time: '09:00',
      end_time: '17:00',
      existsInDb: false // Sa stim daca dam INSERT sau UPDATE
    })
  }
  return list
}

// Incarcam orarul existent din baza de date
async function loadSchedule() {
  loading.value = true
  const days = getNextDays()
  
  // Luam datele salvate deja
  const { data, error } = await supabase
    .from('work_schedule')
    .select('*')
    .in('date', days.map(d => d.date))

  if (error) console.error(error)

  // Combinam zilele generate cu cele din DB
  if (data) {
    days.forEach(day => {
      const saved = data.find(item => item.date === day.date)
      if (saved) {
        day.is_working = saved.is_working
        day.start_time = saved.start_time.slice(0, 5) // Taiem secundele
        day.end_time = saved.end_time.slice(0, 5)
        day.existsInDb = true
        day.id = saved.id
      }
    })
  }
  
  schedule.value = days
  loading.value = false
}

// Salvam o zi specifica
async function saveDay(day) {
  const payload = {
    date: day.date,
    is_working: day.is_working,
    start_time: day.start_time,
    end_time: day.end_time
  }

  let error = null

  if (day.existsInDb) {
    // UPDATE
    const res = await supabase
      .from('work_schedule')
      .update(payload)
      .eq('date', day.date)
    error = res.error
  } else {
    // INSERT (Prima data cand modificam ziua)
    const res = await supabase
      .from('work_schedule')
      .insert([payload])
    // Marcam ca salvat ca sa stim pe viitor
    if (!res.error) day.existsInDb = true
    error = res.error
  }

  if (error) {
    alert('Eroare la salvare!')
    console.error(error)
  } else {
    feedback.value = `Salvat: ${day.displayDate}`
    setTimeout(() => feedback.value = '', 2000)
  }
}

onMounted(() => {
  loadSchedule()
})
</script>

<template>
  <div class="admin-container">
    <h1>⚙️ Admin Panel - Orar</h1>
    <p>Setează programul pentru următoarele 2 săptămâni.</p>

    <div v-if="feedback" class="feedback-msg">{{ feedback }}</div>

    <div v-if="loading">Se încarcă orarul...</div>

    <div v-else class="schedule-grid">
      <div v-for="day in schedule" :key="day.date" class="day-card" :class="{ 'day-off': !day.is_working }">
        <div class="day-header">
          <h3>{{ day.displayDate }}</h3>
          <label class="toggle">
            <input type="checkbox" v-model="day.is_working" @change="saveDay(day)">
            <span class="slider"></span>
            {{ day.is_working ? 'Deschis' : 'Închis' }}
          </label>
        </div>

        <div v-if="day.is_working" class="time-inputs">
          <label>
            Start:
            <input type="time" v-model="day.start_time" @change="saveDay(day)">
          </label>
          <label>
            End:
            <input type="time" v-model="day.end_time" @change="saveDay(day)">
          </label>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.admin-container { max-width: 800px; margin: 40px auto; padding: 20px; }
.feedback-msg { background: #d4edda; color: #155724; padding: 10px; margin-bottom: 20px; border-radius: 5px; text-align: center; }

.schedule-grid { display: grid; gap: 15px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }

.day-card { background: white; padding: 15px; border-radius: 8px; border: 1px solid #ddd; box-shadow: 0 2px 5px rgba(0,0,0,0.05); transition: all 0.3s; }
.day-card.day-off { background: #f8f9fa; border-color: #eee; opacity: 0.7; }
.day-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; text-transform: capitalize; }
.day-header h3 { margin: 0; font-size: 1.1rem; }

.time-inputs { display: flex; gap: 15px; }
.time-inputs label { display: flex; flex-direction: column; font-size: 0.8rem; font-weight: bold; color: #666; }
.time-inputs input { margin-top: 5px; padding: 5px; border: 1px solid #ccc; border-radius: 4px; }

/* Toggle Switch CSS */
.toggle { position: relative; display: inline-block; width: 90px; height: 24px; }
.toggle input { opacity: 0; width: 0; height: 0; }
.slider { position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0; background-color: #ccc; transition: .4s; border-radius: 24px; }
.slider:before { position: absolute; content: ""; height: 16px; width: 16px; left: 4px; bottom: 4px; background-color: white; transition: .4s; border-radius: 50%; }
input:checked + .slider { background-color: #2196F3; }
input:checked + .slider:before { transform: translateX(66px); } /* Misca bila */
</style>