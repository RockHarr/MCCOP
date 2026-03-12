<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../../stores/auth'
import {
  HomeIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon
} from '@heroicons/vue/24/outline'

const router = useRouter()
const authStore = useAuthStore()
const showUserMenu = ref(false)

const handleLogout = async () => {
  await authStore.signOut()
  router.push('/login')
}

// Obtener iniciales del email
const userInitials = computed(() => {
  const email = authStore.user?.email || ''
  if (!email) return 'U'
  const parts = email.split('@')[0].split('.')
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return email.substring(0, 2).toUpperCase()
})

const userEmail = computed(() => authStore.user?.email || 'Usuario')
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex">

    <!-- Sidebar -->
    <aside class="w-64 bg-slate-900 flex-shrink-0 hidden md:flex flex-col">
      <div class="h-16 flex items-center px-6 bg-slate-950">
        <h1 class="text-white text-lg font-bold tracking-wider">MCCOP</h1>
      </div>

      <nav class="flex-1 px-4 py-6 space-y-2">
        <router-link
          to="/"
          class="flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
          :class="$route.name === 'dashboard' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
        >
          <HomeIcon class="h-5 w-5" />
          Bandeja
        </router-link>

        <router-link
          to="/settings"
          class="flex items-center gap-3 px-3 py-2 rounded-md transition-colors"
          :class="$route.name === 'settings' ? 'bg-brand-600 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'"
        >
          <Cog6ToothIcon class="h-5 w-5" />
          Configuración
        </router-link>
      </nav>
    </aside>

    <!-- Main Content -->
    <main class="flex-1 flex flex-col min-w-0 overflow-hidden">

      <!-- Top Header -->
      <header class="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
        <!-- Logo/Title (mobile) -->
        <h1 class="md:hidden text-slate-900 text-lg font-bold">MCCOP</h1>
        <div class="hidden md:block"></div>

        <!-- Right section: Settings button + User avatar -->
        <div class="flex items-center gap-3">
          <!-- Settings button (solo desktop) -->
          <router-link
            to="/settings"
            class="hidden md:flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 hover:text-brand-600 hover:bg-slate-50 rounded-lg transition-colors"
            :class="$route.name === 'settings' ? 'bg-brand-50 text-brand-600' : ''"
          >
            <Cog6ToothIcon class="h-5 w-5" />
            <span>Configuración</span>
          </router-link>

          <!-- User avatar + menu -->
          <div class="relative">
            <button
              @click="showUserMenu = !showUserMenu"
              class="flex items-center gap-2 hover:bg-slate-50 rounded-lg p-1.5 transition-colors"
            >
              <!-- Avatar circle -->
              <div class="h-9 w-9 rounded-full bg-gradient-to-br from-brand-500 to-brand-700 flex items-center justify-center text-white text-sm font-semibold shadow-sm">
                {{ userInitials }}
              </div>
              <!-- Email (solo desktop) -->
              <span class="hidden md:block text-sm font-medium text-slate-700 max-w-[150px] truncate">
                {{ userEmail }}
              </span>
            </button>

            <!-- Dropdown menu -->
            <div
              v-show="showUserMenu"
              @click="showUserMenu = false"
              class="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-50"
            >
              <div class="px-4 py-3 border-b border-slate-100">
                <p class="text-sm font-medium text-slate-900">{{ userEmail }}</p>
                <p class="text-xs text-slate-500 mt-0.5">Cuenta activa</p>
              </div>

              <router-link
                to="/settings"
                class="flex items-center gap-3 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Cog6ToothIcon class="h-4 w-4" />
                Configuración
              </router-link>

              <button
                @click="handleLogout"
                class="flex w-full items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                <ArrowRightOnRectangleIcon class="h-4 w-4" />
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      <div class="flex-1 overflow-y-auto p-4 md:p-8">
        <router-view />
      </div>
    </main>

  </div>
</template>
