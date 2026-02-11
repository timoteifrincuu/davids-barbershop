<template>
  <div class="booking-container">
    
    <div v-if="bookingSuccess" class="success-screen">
      <div class="success-card">
        <div class="icon-circle">✅</div>
        <h2>Rezervare Confirmată!</h2>
        <p>Te așteptăm la data de <strong>{{ formatDate(selectedDate) }}</strong>, ora <strong>{{ selectedTime }}</strong>.</p>
        <p class="service-detail">{{ selectedService.name }} - {{ selectedService.price }} RON</p>
        
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
            :class="{ 'active': selectedService?.id === service.id }"
            @click="selectService(service)"
          >
            <div class="card-content">
              <h4>{{ service.name }}</h4>
              <p class="price">{{ service.price }} RON</p>
              <p class="duration">⏱ {{ service.duration }} min</p>
            </div>
            <div class="check-mark" v-if="selectedService?.id === service.id">✔</div>
          </div>
        </div>
      </section>

      <section v-if="selectedService" class="section-calendar">
        <h3>2. Alege Data</h3>
        <div class="calendar-wrapper">
          <VDatePicker 
            v-model="selectedDate" 
            mode="date" 
            :min-date="new Date()"
            class="custom-calendar"
          />
        </div>
      </section>

      <section v-if="selectedDate" class="section-time">
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
        <p v-if="availableSlots.length === 0" class="no-slots">Nu sunt locuri libere.</p>
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
import { ref, watch } from 'vue'
import { supabase } from '../supabase'

// --- DATE STATICE (Servicii) ---
const services = ref([
  { id: 1, name: 'Tuns Clasic', price: 50, duration: 45 },
  { id: 2, name: 'Tuns + Barbă', price: 80, duration: 60 },
  { id: 3, name: 'Tuns Copii', price: 40, duration: 30 }
])

// --- STATE (Variabile) ---
const selectedService = ref(null)
const selectedDate = ref(null)
const selectedTime = ref(null)
const availableSlots = ref([])
const loading = ref(false)
const bookingSuccess = ref(false)

// --- FUNCȚII ---

const selectService = (service) => {
  selectedService.value = service
  // Resetam restul daca schimba serviciul
  selectedDate.value = null
  selectedTime.value = null
}

// Generare ore (Simplificat pentru Sprint 1)
const generateTimeSlots = () => {
  if (!selectedDate.value) return
  
  const slots = []
  // Generam ore de la 10:00 la 18:00 din 30 in 30 min
  for (let i = 10; i < 18; i++) {
    slots.push(`${i}:00`)
    slots.push(`${i}:30`)
  }
  availableSlots.value = slots
}

// Urmarim cand se alege data ca sa generam orele
watch(selectedDate, generateTimeSlots)

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

const submitBooking = async () => {
  if (!selectedService.value || !selectedDate.value || !selectedTime.value) return
  
  loading.value = true

  try {
    // Luam userul curent (daca exista)
    const { data: { user } } = await supabase.auth.getUser()
    
    // Trimitem in baza de date
    const { error } = await supabase.from('appointments').insert({
      client_id: user?.id || null, 
      client_email: user?.email || 'guest@barber.com', // Fallback daca nu e logat
      service_name: selectedService.value.name,
      date: selectedDate.value,
      time: selectedTime.value,
      status: 'pending'
    })

    if (error) throw error

    // SUCCES - Activam ecranul de confirmare
    bookingSuccess.value = true

  } catch (e) {
    console.error(e)
    alert('A apărut o eroare la salvare. Încearcă din nou.')
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
/* GENERAL */
.booking-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  color: #333;
}
.page-title {
  text-align: center;
  margin-bottom: 30px;
  font-size: 2rem;
  color: #2c3e50;
}
h3 {
  margin-bottom: 15px;
  border-bottom: 2px solid #eee;
  padding-bottom: 5px;
  color: #555;
}
section {
  margin-bottom: 40px;
  animation: fadeIn 0.5s ease-in-out;
}

/* CARDURI SERVICII */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}
.service-card {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  background: white;
  transition: all 0.2s ease;
  position: relative;
  overflow: hidden;
}
.service-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 5px 15px rgba(0,0,0,0.1);
}
.service-card.active {
  border-color: #333;
  background-color: #f9f9f9;
  box-shadow: 0 0 0 1px #333;
}
.card-content h4 {
  margin: 0 0 10px 0;
  font-size: 1.2rem;
}
.price {
  font-weight: bold;
  font-size: 1.1rem;
  color: #2c3e50;
}
.duration {
  font-size: 0.9rem;
  color: #666;
}
.check-mark {
  position: absolute;
  top: 10px;
  right: 10px;
  color: #27ae60;
  font-weight: bold;
}

/* CALENDAR FIX */
.calendar-wrapper {
  display: flex;
  justify-content: center;
}
:deep(.vc-container) {
  border: 1px solid #ddd;
  border-radius: 10px;
  font-family: inherit;
  --vc-color: #333; /* Text base color */
}
/* Asta forteaza textul negru pe zile */
:deep(.vc-day-content) {
  color: #2c3e50 !important;
  font-weight: 500;
}
:deep(.vc-day-content:hover) {
  background-color: #f0f0f0;
}
/* Asta face ziua selectata neagra cu text alb */
:deep(.vc-day-content.vc-highlight-content-solid) {
  background-color: #2c3e50 !important;
  color: #ffffff !important;
}

/* ORE */
.time-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}
.time-btn {
  padding: 10px;
  border: 1px solid #ccc;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}
.time-btn:hover {
  background: #eee;
}
.time-btn.selected {
  background: #2c3e50;
  color: white;
  border-color: #2c3e50;
}

/* BUTON SUBMIT */
.action-area {
  text-align: center;
  margin-top: 20px;
}
.btn-submit {
  background: #27ae60;
  color: white;
  padding: 15px 40px;
  border: none;
  border-radius: 30px;
  font-size: 1.1rem;
  font-weight: bold;
  cursor: pointer;
  transition: background 0.2s;
}
.btn-submit:hover {
  background: #219150;
}
.btn-submit:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* ECRAN SUCCES */
.success-screen {
  text-align: center;
  padding: 50px 20px;
  animation: fadeIn 0.5s;
}
.success-card {
  background: white;
  padding: 40px;
  border-radius: 20px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
  display: inline-block;
  max-width: 500px;
}
.icon-circle {
  font-size: 4rem;
  margin-bottom: 20px;
}
.success-card h2 {
  color: #27ae60;
  margin-bottom: 15px;
}
.btn-primary {
  margin-top: 25px;
  padding: 10px 25px;
  background: #333;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>