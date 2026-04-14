import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import i18n from './i18n'
import { createAppVuetify } from './plugins/vuetify'
import './assets/styles/main.scss'

const savedTheme = (localStorage.getItem('asoode-theme') as 'light' | 'dark') || 'light'
const vuetify = createAppVuetify(savedTheme)

const app = createApp(App)

app.use(router)
app.use(i18n)
app.use(vuetify)

app.mount('#app')
