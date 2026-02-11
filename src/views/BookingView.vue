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
        <p class="hint">Serviciu selectat: <strong>{{ selectedService.name }}</strong></p>
        
        <div class="calendar-wrapper">
          <VDatePicker 
            v-model="selectedDate" 
            mode="date" 
            :min-date="new Date()"
            class="custom-calendar"
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
        <p v-if="availableSlots.length === 0" class="no-slots">Nu sunt locuri libere în această zi.</p>
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

// --- 1. DATELE CORECTE (Actualizate) ---
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

// --- LOGICĂ ---

// Când dai click pe un card
const selectService = (service) => {
  console.log('Serviciu ales:', service.name) // Debug
  selectedService.value = service
  
  // Dacă schimbă serviciul, resetăm data și ora ca să nu rămână vechi
  selectedDate.value = null
  selectedTime.value = null
}

// Când alege data, generăm orele
watch(selectedDate, (newDate) => {
  if (newDate) {
    console.log('Data aleasa:', newDate) // Debug
    generateTimeSlots()
  }
})

// Generare ore simple (10:00 - 18:00)
const generateTimeSlots = () => {
  const slots = []
  for (let i = 10; i < 18; i++) {
    slots.push(`${i}:00`)
    slots.push(`${i}:30`)
  }
  availableSlots.value = slots
}

const formatDate = (d) => {
  if (!d) return ''
  return new Date(d).toLocaleDateString('ro-RO', { day: 'numeric', month: 'long', year: 'numeric' })
}

const submitBooking = async () => {
  if (!selectedService.value || !selectedDate.value || !selectedTime.value) return
  
  loading.value = true

  try {
    const { data: { user } } = await supabase.auth.getUser()
    
    // Trimitem programarea
    const { error } = await supabase.from('appointments').insert({
      client_id: user?.id || null, 
      client_email: user?.email || 'guest@barber.com',
      service_name: selectedService.value.name,
      date: selectedDate.value,
      time: selectedTime.value,
      status: 'pending'
    })

    if (error) throw error

    // AFISAM CARDUL DE SUCCES
    bookingSuccess.value = true

  } catch (e) {
    console.error(e)
    alert('Eroare conexiune: ' + e.message)
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
/* Container Principal */
.booking-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Arial', sans-serif;
  color: #333;
}

h1.page-title {
  text-align: center;
  color: #111;
  margin-bottom: 30px;
}

h3 {
  border-bottom: 2px solid #eee;
  padding-bottom: 10px;
  margin-bottom: 20px;
  color: #555;
}

section {
  margin-bottom: 40px;
}

/* Animatie simpla de aparitie */
.fade-in {
  animation: fadeIn 0.5s ease-in;
}

/* CARDURI SERVICII */
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

.service-card:hover {
  border-color: #333;
  box-shadow: 0 4px 10px rgba(0,0,0,0.1);
}

/* Stil cand e selectat */
.service-card.active {
  background-color: #f4f4f4;
  border: 2px solid #000;
}

.card-content h4 {
  margin: 0 0 10px 0;
  font-size: 1.1rem;
}

.price {
  font-weight: bold;
  font-size: 1.2rem;
  color: #000;
}

.check-mark {
  position: absolute;
  top: 10px;
  right: 10px;
  color: green;
  font-weight: bold;
}

/* CALENDAR FIX */
.calendar-wrapper {
  display: flex;
  justify-content: center;
  margin-top: 15px;
}
.hint {
  text-align: center;
  color: #666;
  margin-bottom: 10px;
}

/* Fortam culori vizibile la calendar */
:deep(.vc-container) {
  border: 1px solid #999;
  --vc-color: #000; 
}
:deep(.vc-day-content) {
  color: #000 !important; /* Text NEGRU */
}
:deep(.vc-day-content.vc-highlight-content-solid) {
  background-color: #000 !important;
  color: #fff !important;
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

.time-btn:hover {
  background: #eee;
}

.time-btn.selected {
  background: #000;
  color: white;
  border-color: #000;
}

/* BUTON FINAL */
.action-area {
  text-align: center;
  margin-top: 30px;
}

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

.btn-submit:hover {
  background: #218838;
}

/* ECRAN SUCCES */
.success-screen {
  text-align: center;
  padding: 40px;
}
.success-card {
  border: 1px solid #ddd;
  padding: 30px;
  border-radius: 10px;
  display: inline-block;
  background: #fdfdfd;
}
.icon-circle {
  font-size: 50px;
  margin-bottom: 20px;
}
.service-detail {
  background: #eee;
  padding: 10px;
  margin: 15px 0;
  border-radius: 5px;
}
.btn-primary {
  background: #000;
  color: #fff;
  border: none;
  padding: 10px 20px;
  border-radius: 5px;
  cursor: pointer;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>