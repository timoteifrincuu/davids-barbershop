<script setup>
import { ref, onMounted } from 'vue'
import { supabase } from '../supabase'
import { useRouter } from 'vue-router'

const router = useRouter()

// --- STATE ---
const services = ref([])
const loading = ref(true)
const step = ref(1) 

const selectedService = ref(null)
const selectedDate = ref(null)
const selectedTime = ref(null)
const takenTimes = ref([]) // <--- AICI TINEM ORELE OCUPATE
const loadingTimes = ref(false) // <--- Sa aratam ca se incarca orele

const clientName = ref('')
const clientPhone = ref('')

// --- GENERATE DATES ---
const dates = ref([])
const timeSlots = [
  '09:00', '10:00', '11:00', '12:00', '13:00', 
  '14:00', '15:00', '16:00', '17:00'
]

function generateDates() {
  const days = []
  const today = new Date()
  
  for (let i = 0; i < 7; i++) { // Aratam urmatoarele 7 zile
    const d = new Date(today)
    d.setDate(today.getDate() + i + 1)
    
    // English Date Format
    const dayName = d.toLocaleDateString('en-US', { weekday: 'long' }) 
    const dayNumber = d.toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) 
    
    // Format YYYY-MM-DD corect (pentru baza de date)
    // Folosim o metoda care nu depinde de fusul orar local in mod gresit
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const fullDate = `${year}-${month}-${day}`;

    days.push({
      fullDate: fullDate,
      name: dayName,
      number: dayNumber
    })
  }
  dates.value = days
}

// --- SUPABASE ---
// Inlocuieste onMounted existent cu acesta:
onMounted(async () => {
  // 1. Verificam daca e logat
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) {
    // Daca nu e user, il trimitem la login (de siguranta)
    router.push('/login')
    return
  }

  // 2. Daca e logat, incercam sa-i pre-completam emailul (optional)
  // Putem salva emailul in clientName temporar sau doar il tinem minte
  // clientName.value = user.email (optional)

  await getServices()
  generateDates()
})

async function getServices() {
  loading.value = true
  const { data, error } = await supabase
    .from('services')
    .select('*')
    .order('price', { ascending: true }) 

  if (error) console.error(error)
  else services.value = data
  loading.value = false
}

// --- VERIFICARE DISPONIBILITATE (NOU) ---
async function checkAvailability(dateStr) {
  loadingTimes.value = true
  takenTimes.value = [] // Resetam lista
  selectedTime.value = null // Resetam selectia anterioara

  // Cerem programarile de la Supabase pentru ziua respectiva
  const { data, error } = await supabase
    .from('appointments')
    .select('time')
    .eq('date', dateStr) // Cautam doar in ziua selectata

  if (error) {
    console.error('Error fetching slots:', error)
  } else {
    // Transformam rezultatul [{time: "10:00"}, {time: "12:00"}] -> ["10:00", "12:00"]
    takenTimes.value = data.map(item => item.time)
  }
  loadingTimes.value = false
}

// --- NAVIGATION ---
function selectService(service) {
  selectedService.value = service
  step.value = 2
}

// Cand selectam o data, declansam verificarea
function selectDate(date) {
  selectedDate.value = date
  checkAvailability(date.fullDate)
}

function selectDateTime() {
  if (selectedDate.value && selectedTime.value) {
    step.value = 3
  }
}

function goBack() {
  if (step.value === 3) step.value = 2
  else if (step.value === 2) step.value = 1
}

// --- SUBMIT ---
async function submitBooking() {
  if (!clientName.value || !clientPhone.value) {
    alert("Please enter your name and phone number!")
    return
  }

  const appointmentData = {
    service_id: selectedService.value.id,
    service_name: selectedService.value.name,
    price: selectedService.value.price,
    date: selectedDate.value.fullDate,
    time: selectedTime.value,
    status: 'pending',
    client_name: clientName.value,
    client_phone: clientPhone.value
  }

  const { error } = await supabase.from('appointments').insert([appointmentData])

  if (error) {
    alert('Error saving booking: ' + error.message)
  } else {
    step.value = 4
  }
}

function finish() {
  router.push('/') 
}
</script>

<template>
  <div class="booking-container">
    
    <div class="header" v-if="step < 4">
      <button v-if="step > 1" @click="goBack" class="back-btn">← Back</button>
      <h2>
        <span v-if="step === 1">Select Service</span>
        <span v-if="step === 2">Select Date & Time</span>
        <span v-if="step === 3">Your Details</span>
      </h2>
      <p>Step {{ step }} of 3</p>
    </div>

    <div v-if="step === 1">
      <div v-if="loading" class="loading">Loading services...</div>
      <div v-else class="services-grid">
        <div 
          v-for="service in services" 
          :key="service.id" 
          class="service-card"
          @click="selectService(service)"
        >
          <div class="card-content">
            <h3>{{ service.name }}</h3>
            <span class="price">{{ service.price }} RON</span>
          </div>
          <p class="duration">⏱ {{ service.duration_minutes }} min</p>
        </div>
      </div>
    </div>

    <div v-if="step === 2" class="step-two">
      <h3>1. Select Day</h3>
      <div class="dates-grid">
        <div 
          v-for="date in dates" 
          :key="date.fullDate"
          class="date-card"
          :class="{ 'selected': selectedDate?.fullDate === date.fullDate }"
          @click="selectDate(date)"
        >
          <span class="day-name">{{ date.name }}</span>
          <span class="day-number">{{ date.number }}</span>
        </div>
      </div>

      <div v-if="selectedDate" class="time-section">
        <h3>2. Select Time</h3>
        
        <div v-if="loadingTimes" class="loading-text">Checking availability... ⏳</div>
        
        <div v-else class="times-grid">
          <button 
            v-for="time in timeSlots" 
            :key="time"
            class="time-btn"
            :class="{ 
              'selected': selectedTime === time,
              'disabled': takenTimes.includes(time) 
            }"
            :disabled="takenTimes.includes(time)"
            @click="selectedTime = time"
          >
            {{ time }}
            <span v-if="takenTimes.includes(time)" class="booked-label">BUSY</span>
          </button>
        </div>
      </div>

      <div v-if="selectedDate && selectedTime" class="footer-actions">
        <button @click="selectDateTime" class="next-btn">
          Continue →
        </button>
      </div>
    </div>

    <div v-if="step === 3" class="step-three">
      <div class="summary-card">
        <h3>Booking Summary</h3>
        <p><strong>Service:</strong> {{ selectedService.name }}</p>
        <p><strong>Date:</strong> {{ selectedDate.name }}, {{ selectedDate.number }}</p>
        <p><strong>Time:</strong> {{ selectedTime }}</p>
        <p><strong>Price:</strong> {{ selectedService.price }} RON</p>
      </div>

      <div class="form-group">
        <label>Your Name:</label>
        <input v-model="clientName" type="text" placeholder="e.g. John Doe" />
      </div>

      <div class="form-group">
        <label>Phone Number:</label>
        <input v-model="clientPhone" type="tel" placeholder="e.g. 07xx xxx xxx" />
      </div>

      <button @click="submitBooking" class="next-btn confirm-btn">
        Confirm Booking
      </button>
    </div>

    <div v-if="step === 4" class="success-step">
      <div class="success-icon">✅</div>
      <h2>Booking Confirmed!</h2>
      <p>Thank you, <strong>{{ clientName }}</strong>.</p>
      <p>Your appointment is set for:</p>
      
      <div class="final-details">
        <p>📅 {{ selectedDate.number }}</p>
        <p>⏰ {{ selectedTime }}</p>
      </div>

      <p class="note">See you at David's!</p>

      <button @click="finish" class="next-btn home-btn">
        Back to Home
      </button>
    </div>

  </div>
</template>

<style scoped>
/* GENERAL STYLES */
.booking-container { max-width: 600px; margin: 0 auto; padding: 40px 20px; font-family: 'Arial', sans-serif; }
.header { position: relative; text-align: center; margin-bottom: 30px; }
.back-btn { position: absolute; left: 0; top: 0; border: none; background: none; font-size: 1rem; cursor: pointer; color: #666; }
.header h2 { margin: 0; color: #333; }
.header p { color: #888; margin-top: 5px; }

/* SERVICES */
.services-grid { display: flex; flex-direction: column; gap: 15px; }
.service-card { background: white; border: 1px solid #ddd; padding: 20px; border-radius: 12px; cursor: pointer; transition: all 0.2s; }
.service-card:hover { transform: translateY(-2px); border-color: #d4af37; }
.card-content { display: flex; justify-content: space-between; font-weight: bold; }
.duration { color: #666; font-size: 0.9rem; margin-top: 5px; }

/* CALENDAR */
.dates-grid { display: flex; gap: 10px; overflow-x: auto; padding-bottom: 10px; margin-bottom: 30px; }
.date-card { min-width: 80px; background: white; border: 1px solid #ddd; border-radius: 10px; padding: 15px 10px; text-align: center; cursor: pointer; display: flex; flex-direction: column; }
.date-card.selected { background-color: #333; color: #d4af37; border-color: #333; }
.day-name { font-size: 0.8rem; text-transform: uppercase; margin-bottom: 5px; }
.day-number { font-weight: bold; font-size: 1.1rem; }

/* TIME SLOTS (UPDATED FOR BUSY STATUS) */
.loading-text { text-align: center; color: #888; margin: 20px 0; font-style: italic; }

.times-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }

.time-btn { 
  background: white; color: #333; border: 1px solid #ddd; 
  padding: 15px 10px; border-radius: 8px; cursor: pointer; 
  font-weight: bold; transition: all 0.2s; position: relative;
  display: flex; flex-direction: column; align-items: center; justify-content: center;
}

.time-btn:hover:not(:disabled) { border-color: #d4af37; background-color: #fafafa; }
.time-btn.selected { background-color: #d4af37; color: black; border-color: #d4af37; }

/* STIL PENTRU ORE OCUPATE */
.time-btn:disabled {
  background-color: #f0f0f0;
  color: #ccc;
  cursor: not-allowed;
  border-color: #eee;
}

.booked-label {
  font-size: 0.6rem;
  color: #ff6b6b;
  margin-top: 2px;
  font-weight: bold;
}

/* FORM & BUTTONS */
.summary-card { background: #fffdf5; border: 1px solid #d4af37; padding: 20px; border-radius: 12px; margin-bottom: 25px; }
.form-group { margin-bottom: 20px; text-align: left; }
.form-group label { display: block; margin-bottom: 8px; font-weight: bold; }
.form-group input { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; box-sizing: border-box; }

.next-btn { background-color: #000; color: white; padding: 15px 40px; border-radius: 30px; border: none; font-size: 1rem; font-weight: bold; cursor: pointer; margin-top: 15px; width: 100%; transition: background 0.3s; }
.confirm-btn { background-color: #d4af37; color: black; }
.confirm-btn:hover { background-color: #f1c40f; }

/* SUCCESS STEP */
.success-step { text-align: center; padding: 40px 20px; animation: fadeIn 0.5s ease-in; }
.success-icon { font-size: 4rem; margin-bottom: 20px; }
.success-step h2 { color: #d4af37; font-size: 2rem; margin-bottom: 10px; }
.final-details { background-color: #f9f9f9; border-radius: 10px; padding: 20px; margin: 30px 0; display: inline-block; width: 100%; max-width: 300px; border-left: 5px solid #d4af37; }
.final-details p { margin: 5px 0; font-weight: bold; font-size: 1.2rem; color: #333; }
.note { font-style: italic; color: #888; margin-bottom: 30px; }
.home-btn { background-color: #333; }

@keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
</style>