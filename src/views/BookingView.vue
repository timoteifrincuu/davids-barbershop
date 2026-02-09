<template>
  <div class="booking-container">
    
    <div v-if="bookingSuccess" class="success-screen">
      <div class="success-card">
        <div class="check-icon">✅</div>
        <h2>Programare Confirmată!</h2>
        <p>Te așteptăm pe <strong>{{ formatDate(selectedDate) }}</strong> la ora <strong>{{ selectedTime }}</strong>.</p>
        <p>Frizer: {{ selectedBarber?.name }}</p>
        <button @click="resetBooking" class="btn-primary">Fă o nouă programare</button>
      </div>
    </div>

    <div v-else class="booking-form">
      <h1>Programează-te</h1>

      <div class="form-group">
        <label>Alege Serviciul:</label>
        <select v-model="selectedService">
          <option v-for="service in services" :key="service.id" :value="service">
            {{ service.name }} - {{ service.price }} RON
          </option>
        </select>
      </div>

      <div class="form-group" v-if="selectedService">
        <label>Alege Frizerul:</label>
        <select v-model="selectedBarber">
          <option v-for="barber in barbers" :key="barber.id" :value="barber">
            {{ barber.name }}
          </option>
        </select>
      </div>

      <div class="form-group" v-if="selectedBarber">
        <label>Alege Data:</label>
        <VDatePicker 
          v-model="selectedDate" 
          mode="date" 
          :min-date="new Date()"
          class="custom-calendar"
        />
      </div>

      <div class="form-group" v-if="selectedDate">
        <label>Ore Disponibile:</label>
        <div class="time-slots">
          <button 
            v-for="time in availableSlots" 
            :key="time" 
            @click="selectedTime = time"
            :class="{ 'selected': selectedTime === time }"
            class="time-btn"
          >
            {{ time }}
          </button>
        </div>
        <p v-if="availableSlots.length === 0" class="error-text">
          Nu sunt locuri libere în această zi.
        </p>
      </div>

      <button 
        v-if="selectedTime" 
        @click="submitBooking" 
        class="btn-submit"
        :disabled="loading"
      >
        {{ loading ? 'Se trimite...' : 'Confirmă Programarea' }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, watch, onMounted } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const router = useRouter()

// State
const services = ref([
  { id: 1, name: 'Tuns Clasic', price: 50, duration: 45 },
  { id: 2, name: 'Tuns + Barbă', price: 80, duration: 60 },
  { id: 3, name: 'Tuns Copii', price: 40, duration: 30 }
])
const barbers = ref([
  { id: 1, name: 'David' },
  { id: 2, name: 'Alex' }
])

const selectedService = ref(null)
const selectedBarber = ref(null)
const selectedDate = ref(null)
const selectedTime = ref(null)
const availableSlots = ref([])
const loading = ref(false)
const bookingSuccess = ref(false) // Variabila care controleaza ecranul de succes

// Generare ore
const generateTimeSlots = () => {
  if (!selectedDate.value) return
  
  // Aici ar trebui sa verificam in baza de date ce e ocupat
  // Momentan generam static pentru a repara UI-ul
  const slots = []
  let start = 9 // 09:00
  let end = 18  // 18:00
  
  for (let i = start; i < end; i++) {
    slots.push(`${i}:00`)
    slots.push(`${i}:30`)
  }
  availableSlots.value = slots
}

// Cand se schimba data, regeneram orele
watch(selectedDate, generateTimeSlots)

const formatDate = (date) => {
  if(!date) return ''
  return new Date(date).toLocaleDateString('ro-RO')
}

const submitBooking = async () => {
  if (!selectedService.value || !selectedBarber.value || !selectedDate.value || !selectedTime.value) return
  
  loading.value = true
  
  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Salvam in baza de date
    const { error } = await supabase.from('appointments').insert({
      client_id: user?.id,
      client_email: user?.email,
      service_name: selectedService.value.name,
      barber_name: selectedBarber.value.name,
      date: selectedDate.value,
      time: selectedTime.value,
      status: 'pending'
    })

    if (error) throw error

    // Aici e cheia: NU mai dam alert, ci activam ecranul de succes
    bookingSuccess.value = true 
    
  } catch (e) {
    alert('Eroare: ' + e.message)
  } finally {
    loading.value = false
  }
}

const resetBooking = () => {
  bookingSuccess.value = false
  selectedDate.value = null
  selectedTime.value = null
  // Pastram serviciul si frizerul selectat pentru rapiditate
}
</script>

<style scoped>
/* Container principal */
.booking-container {
  max-width: 600px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
}

/* Stiluri pentru Calendar (FORTATE) */
:deep(.vc-container) {
  --vc-color: #333333; /* Culoare text default */
  --vc-bg: #ffffff;
  border: 1px solid #ccc;
  border-radius: 8px;
}
:deep(.vc-day-content) {
  color: #000000 !important; /* Text NEGRU fortat */
  font-weight: 500;
}
:deep(.vc-day-content:hover) {
  background-color: #f0f0f0;
}
:deep(.vc-day-content.vc-highlight-content-solid) {
  color: #ffffff !important; /* Text ALB doar cand e selectat */
  background-color: #000000 !important;
}

/* Formular */
.form-group {
  margin-bottom: 20px;
}
label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}
select, input {
  width: 100%;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 5px;
  font-size: 16px;
}

/* Butoane Ore */
.time-slots {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}
.time-btn {
  padding: 10px;
  background: #fff;
  border: 1px solid #333;
  cursor: pointer;
  border-radius: 5px;
  transition: all 0.2s;
  color: #333;
}
.time-btn:hover {
  background: #eee;
}
.time-btn.selected {
  background: #333;
  color: #fff;
}

/* Ecran Succes */
.success-screen {
  text-align: center;
  padding: 40px;
  background: #f9fff9;
  border: 2px solid #4CAF50;
  border-radius: 10px;
  animation: fadeIn 0.5s;
}
.check-icon {
  font-size: 50px;
  margin-bottom: 20px;
}
.btn-primary, .btn-submit {
  background: #333;
  color: white;
  border: none;
  padding: 12px 24px;
  border-radius: 5px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 20px;
  width: 100%;
}
.btn-submit:disabled {
  background: #999;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>