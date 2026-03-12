import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
      meta: { requiresGuest: true }
    },
    {
      path: '/',
      component: () => import('../components/layout/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue')
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('../views/SettingsView.vue')
        }
      ]
    }
  ]
})

// Navigation Guard
router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()
  
  // Si no hemos revisado la sesión todavía, lo hacemos
  if (authStore.user === null && !authStore.loading) {
     await authStore.checkSession()
  }

  const isAuth = !!authStore.user

  if (to.meta.requiresAuth && !isAuth) {
    next({ name: 'login' })
  } else if (to.meta.requiresGuest && isAuth) {
    next({ name: 'dashboard' })
  } else {
    next()
  }
})

export default router
