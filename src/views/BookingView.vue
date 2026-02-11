<template>
  <div class="booking-container">
    
    <div v-if="bookingSuccess" class="success-screen">
      <div class="success-card">
        <div class="icon-circle">✅</div>
        <h2>Rezervare Confirmată!</h2>
        <p>Te așteptăm <strong>{{ formatDateLong(selectedDate) }}</strong> la ora <strong>{{ selectedTime }}</strong>.</p>
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
        <h3>2. Alege Ziua</h3>
        
        <div class="days-scroller">
          <div 
            v-for="day in nextDays" 
            :key="day.fullDate"
            class="day-card"
            :class="{ 'selected': selectedDate === day.fullDate }"
            @click="selectDate(day.fullDate)"
          >
            <span class="day-name">{{ day.name }}</span>
            <span class="day-number">{{ day.number }}</span>
          </div>
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
import { ref, onMounted } from 'vue'
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
const nextDays = ref([]) // Lista celor 14 zile
const loading = ref(false)
const bookingSuccess = ref(false)

// --- GENERARE ZILE (Urmatoarele 14 zile) ---
const generateNext14Days = () => {
  const list = []
  const today = new Date()
  const daysMap = ['Dum', 'Lun', 'Mar', 'Mie', 'Joi', 'Vin', 'Sâm']

  for (let i = 0; i < 14; i++) {
    const d = new Date(today)
    d.setDate(today.getDate() + i)
    
    list.push({
      fullDate: d.toISOString().split('T')[0], // format YYYY-MM-DD pentru baza de date
      name: daysMap[d.getDay()], // Lun, Mar etc.
      number: d.getDate() // 12, 13 etc.
    })
  }
  nextDays.value = list
}

// --- LOGICĂ ---
onMounted(() => {
  generateNext14Days()
})

const selectService = (service) => {
  selectedService.value = service
  selectedDate.value = null
  selectedTime.value = null
}

const selectDate = (dateStr) => {
  selectedDate.value = dateStr
  selectedTime.value = null
  generateTimeSlots()
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

const formatDateLong = (dateStr) => {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('ro-RO', { weekday: 'long', day: 'numeric', month: 'long' })
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
.fade-in { animation: fadeIn 0.5s ease-in; }

/* CARDURI SERVICII */
.services-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
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
.service-card:hover { border-color: #333; }
.service-card.active { background-color: #333; color: white; border-color: #333; }
.service-card.active .price { color: white; } /* Pretul devine alb pe fundal negru */

.price { font-weight: bold; font-size: 1.1rem; color: #000; margin-top: 5px;}
.check-mark { position: absolute; top: 10px; right: 10px; color: #4CAF50; font-weight: bold; }

/* ZILE (SCROLL ORIZONTAL) */
.days-scroller {
  display: flex;
  overflow-x: auto;
  gap: 10px;
  padding-bottom: 10px;
  scrollbar-width: thin; /* Pentru Firefox */
}
/* Scrollbar custom dragut */
.days-scroller::-webkit-scrollbar { height: 6px; }
.days-scroller::-webkit-scrollbar-thumb { background: #ccc; border-radius: 3px; }

.day-card {
  min-width: 70px;
  height: 80px;
  border: 1px solid #ddd;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  background: white;
  transition: all 0.2s;
}
.day-card:hover { border-color: #333; }
.day-card.selected { background: #333; color: white; border-color: #333; }

.day-name { font-size: 0.9rem; margin-bottom: 5px; text-transform: uppercase; }
.day-number { font-size: 1.4rem; font-weight: bold; }

/* ORE */
.time-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: 10px;
}

.time-btn {
  padding: 10px;
  border: 1px solid #ddd;
  background: white;
  cursor: pointer;
  border-radius: 4px;
  
  /* FORTARE TEXT NEGRU */
  color: #000000 !important; 
  font-weight: bold;
}

.time-btn:hover {
  background: #eee;
}

/* Cand e selectat devine negru cu text alb */
.time-btn.selected {
  background: #333;
  color: white !important;
  border-color: #333;
}

/* BUTON FINAL */
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
.btn-primary { background: #333; color: #fff; border: none; padding: 10px 20px; border-radius: 5px; cursor: pointer; }

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>