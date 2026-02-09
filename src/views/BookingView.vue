<script setup>
import { ref, onMounted, computed } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '../supabase'

const router = useRouter()
const step = ref(1)
const loading = ref(false)
const selectedService = ref(null)
const selectedDate = ref(null)
const selectedTime = ref(null)
const availableSlots = ref([])
const services = ref([])
const userName = ref('')

// 1. Incarcam serviciile si userul la inceput
onMounted(async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    router.push('/login')
    return
  }
  userName.value = user.email // Sau nume daca il ai salvat

  // Luam serviciile din baza de date
  const { data: servicesData } = await supabase.from('services').select('*').order('price')
  services.value = servicesData || []
})

// 2. Generam datele pentru calendar (urmatoarele 14 zile)
const calendarDays = computed(() => {
  const days = []
  const today = new Date()
  
  for (let i = 1; i <= 14; i++) { // Incepem de maine (i=1) sau azi (i=0)
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    days.push({
      dateStr: d.toISOString().split('T')[0], // YYYY-MM-DD
      display: d.toLocaleDateString('ro-RO', { weekday: 'short', day: 'numeric', month: 'short' }),
      obj: d
    })
  }
  return days
})

// 3. Functia care calculeaza orele libere pentru o zi aleasa
async function fetchSlots(dateStr) {
  loading.value = true
  selectedDate.value = dateStr
  selectedTime.value = null
  availableSlots.value = []

  try {
    // A. Verificam orarul lui David pentru ziua aia
    const { data: schedule } = await supabase
      .from('work_schedule')
      .select('*')
      .eq('date', dateStr)
      .single()

    // Defaulturi daca nu a setat nimic in Admin
    let startHour = 9
    let endHour = 17
    let isWorking = true

    if (schedule) {
      if (!schedule.is_working) {
        isWorking = false // E libera ziua
      } else {
        // Parsam ora "09:00:00" -> 9
        startHour = parseInt(schedule.start_time.split(':')[0])
        endHour = parseInt(schedule.end_time.split(':')[0])
      }
    }

    if (!isWorking) {
      availableSlots.value = [] // Niciun loc liber
      loading.value = false
      return
    }

    // B. Vedem ce programari exista deja
    const { data: appointments } = await supabase
      .from('appointments')
      .select('time')
      .eq('date', dateStr)

    const takenTimes = appointments?.map(a => a.time.slice(0, 5)) || [] // ["10:00", "14:00"]

    // C. Generam sloturile (din ora in ora)
    const slots = []
    for (let h = startHour; h < endHour; h++) {
      const timeString = `${h < 10 ? '0' + h : h}:00`
      
      // Daca nu e luat, il adaugam
      if (!takenTimes.includes(timeString)) {
        slots.push(timeString)
      }
    }
    availableSlots.value = slots

  } catch (e) {
    console.error(e)
  } finally {
    loading.value = false
  }
}

// 4. Finalizarea programarii
async function confirmBooking() {
  if (!selectedTime.value || !selectedDate.value || !selectedService.value) return

  loading.value = true
  
  const { error } = await supabase.from('appointments').insert([{
    date: selectedDate.value,
    time: selectedTime.value,
    service_id: selectedService.value.id,
    client_name: userName.value // Folosim emailul ca nume momentan
  }])

  if (error) {
    alert('Eroare: ' + error.message)
  } else {
    alert('Programare confirmată! Te așteptăm.')
    router.push('/')
  }
  loading.value = false
}
</script>

<template>
  <div class="booking-container">
    <h1>📅 Programare Nouă</h1>

    <div v-if="step === 1" class="step-content">
      <h3>Ce facem azi?</h3>
      <div class="services-grid">
        <div 
          v-for="service in services" 
          :key="service.id" 
          class="service-card"
          @click="selectedService = service; step = 2"
        >
          <h4>{{ service.name }}</h4>
          <p>{{ service.duration_minutes }} min • {{ service.price }} RON</p>
        </div>
      </div>
    </div>

    <div v-if="step === 2" class="step-content">
      <button class="back-btn" @click="step = 1">← Înapoi la servicii</button>
      
      <h3>Alege o dată</h3>
      <div class="dates-scroller">
        <button 
          v-for="day in calendarDays" 
          :key="day.dateStr"
          :class="{ active: selectedDate === day.dateStr }"
          @click="fetchSlots(day.dateStr)"
        >
          {{ day.display }}
        </button>
      </div>

      <div v-if="selectedDate" class="slots-section">
        <h3 v-if="loading">Caut locuri libere...</h3>
        <h3 v-else-if="availableSlots.length === 0">Niciun loc liber azi. 😔</h3>
        <h3 v-else>Ore disponibile:</h3>

        <div class="slots-grid">
          <button 
            v-for="time in availableSlots" 
            :key="time"
            :class="{ active: selectedTime === time }"
            @click="selectedTime = time"
          >
            {{ time }}
          </button>
        </div>
      </div>

      <button 
        v-if="selectedTime" 
        class="confirm-btn" 
        @click="confirmBooking"
        :disabled="loading"
      >
        Confirmă Programarea
      </button>
    </div>
  </div>
</template>

<style scoped>
.booking-container { max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
.services-grid { display: grid; gap: 15px; margin-top: 20px; }
.service-card { border: 1px solid #ddd; padding: 15px; border-radius: 8px; cursor: pointer; transition: 0.3s; background: white; }
.service-card:hover { border-color: #d4af37; background: #fffcf5; }

.dates-scroller { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 20px; }
.dates-scroller button { min-width: 100px; padding: 10px; border: 1px solid #ccc; background: white; border-radius: 6px; cursor: pointer; }
.dates-scroller button.active { background: #333; color: white; border-color: #333; }

.slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr)); gap: 10px; margin-bottom: 30px; }
.slots-grid button { padding: 10px; border: 1px solid #d4af37; background: white; color: #333; border-radius: 4px; cursor: pointer; }
.slots-grid button.active { background: #d4af37; color: white; font-weight: bold; }
.slots-grid button:hover { background: #f0e6c8; }

.confirm-btn { background: #28a745; color: white; border: none; padding: 15px 30px; font-size: 1.1rem; border-radius: 50px; cursor: pointer; width: 100%; font-weight: bold; }
.back-btn { background: none; border: none; color: #666; cursor: pointer; margin-bottom: 15px; text-decoration: underline; }
</style>