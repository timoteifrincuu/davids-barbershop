<script setup>
</script>

<template>
  <div class="home-container">
    <div class="hero-section">
      <h1>Welcome to <span class="highlight">David's</span></h1>
      <h2>Premium Grooming & Styling</h2>
      <p>Experience the finest cut in town.</p>
      
      <RouterLink to="/booking" class="cta-btn">
        Book Appointment Now
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.home-container {
  font-family: 'Arial', sans-serif;
  height: 100%; /* Ocupa tot spatiul disponibil */
}

.hero-section {
  /* Imagine de fundal intunecata */
  background: linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.6)), url('https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=1920&q=80');
  background-size: cover;
  background-position: center;
  color: white;
  
  /* Facem sectiunea sa ocupe tot ecranul ramas (minus header si footer) */
  min-height: 80vh; 
  
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  padding: 20px;
}

h1 { font-size: 3.5rem; margin-bottom: 10px; margin-top: 0; }
h2 { font-size: 1.5rem; font-weight: normal; color: #ddd; margin-bottom: 20px; text-transform: uppercase; letter-spacing: 2px; }
.highlight { color: #d4af37; font-family: 'Georgia', serif; font-style: italic; }

p { font-size: 1.2rem; margin-bottom: 40px; color: #ccc; }

.cta-btn {
  background-color: #d4af37; color: black; padding: 18px 40px;
  text-decoration: none; font-weight: bold; font-size: 1.2rem;
  border-radius: 5px; transition: all 0.3s;
  text-transform: uppercase; letter-spacing: 1px;
}

.cta-btn:hover { transform: translateY(-3px); background-color: #f1c40f; box-shadow: 0 5px 15px rgba(212, 175, 55, 0.4); }

@media (max-width: 600px) {
  h1 { font-size: 2.5rem; }
}
</style>