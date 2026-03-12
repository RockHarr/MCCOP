<script setup lang="ts">
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const email = ref('')
const password = ref('')
const errorMsg = ref('')
const loading = ref(false)

const router = useRouter()
const authStore = useAuthStore()

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.value,
      password: password.value,
    })

    if (error) throw error
    
    // Forzamos actualización del store y navegamos
    await authStore.checkSession()
    router.push('/')
    
  } catch (error: any) {
    errorMsg.value = error.message || 'Error al iniciar sesión'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-bold tracking-tight text-slate-900">MCCOP</h2>
      <p class="mt-2 text-center text-sm text-slate-600">
        Mesa de Control Comercial de Oportunidades Públicas
      </p>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <div class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
        <form class="space-y-6" @submit.prevent="handleLogin">
          <div>
            <label for="email" class="block text-sm font-medium text-slate-700">Correo Electrónico</label>
            <div class="mt-1">
              <input 
                id="email" 
                v-model="email" 
                name="email" 
                type="email" 
                autocomplete="email" 
                required 
                class="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm" 
              />
            </div>
          </div>

          <div>
            <label for="password" class="block text-sm font-medium text-slate-700">Contraseña</label>
            <div class="mt-1">
              <input 
                id="password" 
                v-model="password" 
                name="password" 
                type="password" 
                autocomplete="current-password" 
                required 
                class="block w-full appearance-none rounded-md border border-slate-300 px-3 py-2 placeholder-slate-400 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-brand-500 sm:text-sm" 
              />
            </div>
          </div>

          <div v-if="errorMsg" class="rounded-md bg-red-50 p-4">
            <div class="text-sm text-red-700">{{ errorMsg }}</div>
          </div>

          <div>
            <button 
              type="submit" 
              :disabled="loading"
              class="flex w-full justify-center rounded-md border border-transparent bg-brand-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-brand-700 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 disabled:opacity-50 transition-colors"
            >
              {{ loading ? 'Iniciando...' : 'Ingresar' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </div>
</template>
