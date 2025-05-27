import { createRouter, createWebHistory } from 'vue-router';
import LoginPage from '../pages/LoginPage.vue'
import App from '../pages/ChatPage.vue'

const routes = [
  { path: '/login', component: LoginPage },
  { path: '/', component: App }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
