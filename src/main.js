import { createApp } from 'vue'
import './style.css'
import App from './App.vue'
import router from './router' // Import routerul

const app = createApp(App)

app.use(router) // Ii spun aplicatiei sa il foloseasca
app.mount('#app')