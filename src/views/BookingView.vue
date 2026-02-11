<template>
  <div class="booking-container">
    
    <div v-if="bookingSuccess" class="success-screen">
      <div class="success-card">
        <div class="icon-circle">✅</div>
        <h2>Rezervare Confirmată!</h2>
        <p>Te așteptăm la data de <strong>{{ selectedDate }}</strong>, ora <strong>{{ selectedTime }}</strong>.</p>
        <p class="service-detail">{{ selectedService.name }} - {{ selectedService.price }} Lei</p>
        <button @click="resetBooking" class="btn-primary">Înapoi la meniu</button>
      </div>
    </div>

    <div v-else class="booking-content">
      <h1 class="page-title">Programează o vizită</h1>

      <section class="section-services">
        <h3>1. Alege Serviciul</h3>
        <div class="services-grid">
          <div 
            v-for="service in services" 
            :key="service.id" 
            class="service-card"
            :class="{ 'active': selectedService && selectedService.id === service.id }"
            @click="selectService(service)"
          >
            <div class="card-content">
              <h4>{{ service.name }}</h4>
              <p class="price">{{ service.price }} Lei</p>
            </div>
            <div class="check-mark" v-if="selectedService && selectedService.id === service.id">✔</div>
          </div>
        </div>
      </section>

      <section v-if="selectedService" class="section-calendar fade-in">
        <h3>2. Alege Data</h3>
        <div class="input-wrapper">
          <label>Selectează ziua dorită:</label>
          <input 
            type="date" 
            v-model="selectedDate" 
            :min="minDate"
            @change="handleDateChange"
            class="native-date-input"
          />
        </div>
      </section>

      <section v-if="selectedDate" class="section-time fade-in">
        <h3>3. Alege Ora</h3>
        <div class="time-grid">
          <button 
            v-for="time in availableSlots" 
            :key="time" 
            @click="selectedTime = time"
            class="time-btn"
            :class="{ 'selected': selectedTime === time }"
          >
            {{ time }}
          </button>
        </div>
        <p v-if="availableSlots.length === 0" class="no-slots">Selectează o dată pentru a vedea orele.</p>
      </section>

      <div class="action-area" v-if="selectedTime">
        <button 
          @click="submitBooking" 
          class="btn-submit" 
          :disabled="loading"
        >
          {{ loading ? 'Se procesează...' : 'Confirmă Programarea' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { supabase } from '../supabase'

// --- DATE SERVICII ---
const services = ref([
  { id: 1, name: 'Tuns', price: 50 },
  { id: 2, name: 'Tuns + Barbă', price: 60 },
  { id: 3, name: 'Aranjat Barbă', price: 10 }
])

// --- STATE ---
const selectedService = ref(null)
const selectedDate = ref(null)
const selectedTime = ref(null)
const availableSlots = ref([])
const loading = ref(false)
const bookingSuccess = ref(false)

// Data minimă (azi)
const minDate = computed(() => {
  const today = new Date()
  return today.toISOString().split('T')[0]
})

// --- LOGICĂ ---

const selectService = (service) => {
  selectedService.value = service
  // Reset la restul pentru a forța utilizatorul să aleagă din nou
  selectedDate.value = null
  selectedTime.value = null
  availableSlots.value = []
}

// Cand se alege data din inputul nativ
const handleDateChange = () => {
  if (selectedDate.value) {
    generateTimeSlots()
  }
}

const generateTimeSlots = () => {
  // Generam ore simple 10:00 - 18:00
  const slots = []
  for (let i = 10; i < 18; i++) {
    slots.push(`${i}:00`)
    slots.push(`${i}:30`)
  }
  availableSlots.value = slots
}

const submitBooking = async () => {
  if (!selectedService.value || !selectedDate.value || !selectedTime.value) return
  
  loading.value = true

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    const { error } = await supabase.from('appointments').insert({
      client_id: user?.id || null, 
      client_email: user?.email || 'guest@barber.com',
      service_name: selectedService.value.name,
      date: selectedDate.value,
      time: selectedTime.value,
      status: 'pending'
    })

    if (error) throw error

    bookingSuccess.value = true

  } catch (e) {
    alert('Eroare: ' + e.message)
  } finally {
    loading.value = false
  }
}

const resetBooking = () => {
  bookingSuccess.value = false
  selectedService.value = null
  selectedDate.value = null
  selectedTime.value = null
}
</script>

<style scoped>
.booking-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  color: #333;
}
.page-title { text-align: center; margin-bottom: 30px; }
h3 { border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; color: #555; }
section { margin-bottom: 40px; }

/* Animatie */
.fade-in { animation: fadeIn 0.5s ease-in; }

/* CARDURI */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
}
.service-card {
  border: 1px solid #ccc;
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
  position: relative;
  text-align: center;
}
.service-card:hover { border-color: #333; box-shadow: 0 4px 10px rgba(0,0,0,0.1); }
.service-card.active { background-color: #f4f4f4; border: 2px solid #000; }
.price { font-weight: bold; font-size: 1.2rem; color: #000; }
.check-mark { position: absolute; top: 10px; right: 10px; color: green; font-weight: bold; }

/* CALENDAR NATIV (Input) */
.input-wrapper {
  text-align: center;
}
.native-date-input {
  padding: 15px;
  font-size: 18px;
  border: 2px solid #333;
  border-radius: 8px;
  cursor: pointer;
  width: 100%;
  max-width: 300px;
  font-family: inherit;
}

/* ORE */
.time-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}
.time-btn {
  padding: 10px;
  border: 1px solid #999;
  background: white;
  cursor: pointer;
  border-radius: 4px;
}
.time-btn:hover { background: #eee; }
.time-btn.selected { background: #000; color: white; border-color: #000; }

/* BUTON */
.action-area { text-align: center; margin-top: 30px; }
.btn-submit {
  background: #28a745;
  color: white;
  border: none;
  padding: 15px 40px;
  font-size: 18px;
  border-radius: 30px;
  cursor: pointer;
  font-weight: bold;
}

/* SUCCES */
.success-screen { text-align: center; padding: 40px; }
.success-card { border: 1px solid #ddd; padding: 30px; border-radius: 10px; display: inline-block; background: #fdfdfd; }
.icon-circle { font-size: 50px; margin-bottom: 20px; }
.btn-primary { background: #000; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>