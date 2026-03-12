<script setup lang="ts">
import { RouterView } from 'vue-router'
import { onMounted } from 'vue'
import { useAuthStore } from './stores/auth'

const authStore = useAuthStore()

onMounted(() => {
  authStore.checkSession()
})
</script>

<template>
  <!-- Renderizamos la UI solo cuando sepamos el estado de sesión -->
  <div v-if="!authStore.loading" class="min-h-screen">
    <RouterView />
  </div>
  
  <div v-else class="min-h-screen flex items-center justify-center bg-slate-50">
    <div class="animate-pulse flex flex-col items-center">
      <div class="h-12 w-12 rounded-full border-4 border-t-brand-500 border-slate-200 animate-spin mb-4"></div>
      <p class="text-slate-500 font-medium">Iniciando MCCOP...</p>
    </div>
  </div>
</template>
