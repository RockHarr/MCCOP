<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/auth'
import { PlusIcon, TrashIcon } from '@heroicons/vue/24/outline'

const authStore = useAuthStore()

// ─── Tabs ──────────────────────────────────────────────────
const activeTab = ref<'profile' | 'keywords'>('profile')

// ─── Estado ────────────────────────────────────────────────
const loading = ref(true)
const saving = ref(false)
const successMsg = ref('')

const profile = ref<any>(null)
const keywords = ref<any[]>([])

const profileForm = ref({
  name: '',
  min_amount: 0,
  max_amount: null as number | null,
})

const newKeyword = ref({ word: '', type: 'positive', weight: 1 })

// ─── Keywords sugeridas para el rubro informático ──────────
const SUGGESTED_IT_KEYWORDS = {
  positive: [
    'software', 'desarrollo', 'aplicación', 'sistema', 'plataforma',
    'tecnología', 'informática', 'digital', 'cloud', 'nube',
    'mantenimiento', 'soporte técnico', 'infraestructura TI',
    'ciberseguridad', 'seguridad', 'datos', 'base de datos',
    'consultoría', 'integración', 'automatización', 'ERP', 'CRM',
    'redes', 'servidores', 'licencias', 'implementación', 'capacitación'
  ],
  negative: [
    'construcción', 'obras civiles', 'vialidad', 'pavimentación',
    'maquinaria pesada', 'vehículos', 'alimentos', 'insumos médicos',
    'insumos hospitalarios', 'equipos médicos', 'limpieza'
  ]
}

// ─── Calculadora de garantías ──────────────────────────────
const UTM = 88246 // Valor UTM marzo 2026 (aprox)

const garantias = computed(() => {
  const monto = profileForm.value.max_amount || 0
  const resultados = []

  if (monto >= 1000 * UTM) {
    resultados.push({
      tipo: 'Garantía de Fiel Cumplimiento',
      porcentaje: '10%',
      estimado: Math.round(monto * 0.10),
      descripcion: 'Exigible en contratos > 1.000 UTM'
    })
  }
  if (monto >= 5000 * UTM) {
    resultados.push({
      tipo: 'Garantía de Seriedad de Oferta',
      porcentaje: '3%',
      estimado: Math.round(monto * 0.03),
      descripcion: 'Exigible en contratos > 5.000 UTM'
    })
  }
  return resultados
})

// ─── Helpers ───────────────────────────────────────────────
const formatCLP = (n: number) =>
  new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP', maximumFractionDigits: 0 }).format(n)

const positiveKeywords = computed(() => keywords.value.filter(k => k.type === 'positive'))
const negativeKeywords = computed(() => keywords.value.filter(k => k.type === 'negative'))

const maxUTM = computed(() =>
  profileForm.value.max_amount ? Math.round(profileForm.value.max_amount / UTM) + ' UTM' : '—'
)

// ─── Carga inicial ─────────────────────────────────────────
async function loadProfile() {
  loading.value = true
  try {
    const userId = authStore.user?.id
    if (!userId) return

    // Traer perfil del usuario
    const { data: profiles } = await supabase
      .from('business_profiles')
      .select('*')
      .eq('user_id', userId)
      .limit(1)

    if (profiles && profiles.length > 0) {
      profile.value = profiles[0]
      profileForm.value = {
        name: profile.value.name,
        min_amount: profile.value.min_amount || 0,
        max_amount: profile.value.max_amount || null,
      }

      // Traer keywords del perfil
      const { data: kws } = await supabase
        .from('keywords')
        .select('*')
        .eq('profile_id', profile.value.id)
        .order('type')

      keywords.value = kws || []
    }
  } finally {
    loading.value = false
  }
}

// ─── Guardar perfil ────────────────────────────────────────
async function saveProfile() {
  saving.value = true
  successMsg.value = ''
  try {
    const userId = authStore.user?.id
    if (!userId) return

    if (profile.value) {
      await supabase.from('business_profiles').update({
        name: profileForm.value.name,
        min_amount: profileForm.value.min_amount,
        max_amount: profileForm.value.max_amount,
        updated_at: new Date().toISOString()
      }).eq('id', profile.value.id)
    } else {
      const { data } = await supabase.from('business_profiles').insert({
        user_id: userId,
        name: profileForm.value.name,
        min_amount: profileForm.value.min_amount,
        max_amount: profileForm.value.max_amount,
      }).select().single()
      profile.value = data
    }
    successMsg.value = '✓ Perfil guardado correctamente'
    setTimeout(() => successMsg.value = '', 3000)
  } finally {
    saving.value = false
  }
}

// ─── Agregar keyword ───────────────────────────────────────
async function addKeyword() {
  if (!newKeyword.value.word.trim() || !profile.value) return
  try {
    const { data } = await supabase.from('keywords').insert({
      profile_id: profile.value.id,
      type: newKeyword.value.type,
      word: newKeyword.value.word.trim().toLowerCase(),
      weight: newKeyword.value.weight,
    }).select().single()

    keywords.value.push(data)
    newKeyword.value.word = ''
  } catch (e) {
    console.error('Error adding keyword:', e)
  }
}

async function addSuggested(word: string, type: 'positive' | 'negative') {
  if (!profile.value) return
  const exists = keywords.value.some(k => k.word === word && k.type === type)
  if (exists) return

  const { data } = await supabase.from('keywords').insert({
    profile_id: profile.value.id,
    type: type,
    word: word,
    weight: 1,
  }).select().single()

  keywords.value.push(data)
}

async function removeKeyword(id: string) {
  await supabase.from('keywords').delete().eq('id', id)
  keywords.value = keywords.value.filter(k => k.id !== id)
}

onMounted(() => loadProfile())
</script>

<template>
  <div class="max-w-5xl mx-auto">

    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-slate-900">Configuración</h2>
      <p class="mt-1 text-sm text-slate-500">Administra tu perfil de negocio y palabras clave para el motor de scoring.</p>
    </div>

    <!-- Tabs -->
    <div class="border-b border-slate-200 mb-6">
      <nav class="-mb-px flex space-x-8">
        <button
          @click="activeTab = 'profile'"
          :class="activeTab === 'profile' 
            ? 'border-brand-500 text-brand-600' 
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
          class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          📊 Perfil de Negocio
        </button>
        <button
          @click="activeTab = 'keywords'"
          :class="activeTab === 'keywords' 
            ? 'border-brand-500 text-brand-600' 
            : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'"
          class="whitespace-nowrap py-3 px-1 border-b-2 font-medium text-sm transition-colors"
        >
          🔑 Palabras Clave
        </button>
      </nav>
    </div>

    <div v-if="loading" class="text-center py-12 text-slate-500">Cargando configuración...</div>

    <div v-else class="space-y-6">

      <!-- ────────── TAB 1: Perfil de Negocio ────────── -->
      <div v-show="activeTab === 'profile'" class="space-y-6">

        <div class="card-base p-6">
          <h3 class="text-lg font-semibold text-slate-900 mb-4">Información de la Empresa</h3>

          <div class="space-y-4">
            <div>
              <label class="block text-sm font-medium text-slate-700 mb-2">Nombre de la Empresa</label>
              <input 
                v-model="profileForm.name" 
                type="text" 
                placeholder="Ej: Consultoría TI SpA"
                class="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20 focus:outline-none transition-colors" 
              />
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Monto Mínimo (CLP)</label>
                <input 
                  v-model.number="profileForm.min_amount" 
                  type="number" 
                  placeholder="0"
                  class="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20 focus:outline-none transition-colors" 
                />
                <p class="text-xs text-slate-400 mt-1.5">Licitaciones bajo este monto serán ignoradas</p>
              </div>

              <div>
                <label class="block text-sm font-medium text-slate-700 mb-2">Monto Máximo (CLP)</label>
                <input 
                  v-model.number="profileForm.max_amount" 
                  type="number" 
                  placeholder="Sin límite"
                  class="block w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20 focus:outline-none transition-colors" 
                />
                <p class="text-xs text-slate-400 mt-1.5">{{ maxUTM }} — Para estimar garantías</p>
              </div>
            </div>
          </div>

          <!-- Calculadora de Garantías -->
          <div v-if="garantias.length > 0" class="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <p class="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
              Garantías estimadas para licitaciones a este monto:
            </p>
            <div class="space-y-2">
              <div v-for="g in garantias" :key="g.tipo" class="flex justify-between items-center py-2 px-3 bg-white rounded border border-amber-100">
                <div class="flex-1">
                  <p class="font-medium text-sm text-slate-900">{{ g.tipo }}</p>
                  <p class="text-xs text-slate-500">{{ g.descripcion }}</p>
                </div>
                <div class="text-right">
                  <p class="font-bold text-amber-900">{{ formatCLP(g.estimado) }}</p>
                  <p class="text-xs text-amber-600">{{ g.porcentaje }}</p>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-6 flex items-center gap-3">
            <button 
              @click="saveProfile" 
              :disabled="saving"
              class="btn-primary hover:bg-brand-700 focus:ring-2 focus:ring-brand-500 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {{ saving ? 'Guardando...' : 'Guardar Cambios' }}
            </button>
            <span v-if="successMsg" class="text-sm text-green-600 font-medium flex items-center gap-1.5">
              <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
              </svg>
              {{ successMsg }}
            </span>
          </div>
        </div>

      </div>

      <!-- ────────── TAB 2: Keywords ────────── -->
      <div v-show="activeTab === 'keywords'" class="space-y-6">

        <div v-if="!profile" class="card-base p-8 text-center">
          <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
          </svg>
          <p class="mt-3 text-sm text-slate-600">Guarda el perfil primero para poder gestionar las keywords.</p>
          <button @click="activeTab = 'profile'" class="mt-4 btn-secondary">
            Ir a Perfil de Negocio
          </button>
        </div>

        <div v-else class="space-y-6">

          <!-- Agregar nueva keyword -->
          <div class="card-base p-6">
            <h3 class="text-lg font-semibold text-slate-900 mb-4">Agregar Palabra Clave</h3>
            <div class="flex gap-3">
              <input 
                v-model="newKeyword.word" 
                @keyup.enter="addKeyword" 
                type="text" 
                placeholder="Ej: blockchain, IoT, microservicios..."
                class="flex-1 rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20 focus:outline-none transition-colors" 
              />
              <select 
                v-model="newKeyword.type"
                class="rounded-lg border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:ring-2 focus:ring-brand-500 focus:ring-opacity-20 focus:outline-none transition-colors"
              >
                <option value="positive">✅ Positiva</option>
                <option value="negative">🚫 Negativa</option>
              </select>
              <button 
                @click="addKeyword" 
                class="btn-primary hover:bg-brand-700 focus:ring-2 focus:ring-brand-500 focus:outline-none flex items-center gap-2 px-5"
              >
                <PlusIcon class="h-4 w-4" /> Agregar
              </button>
            </div>
            <p class="mt-2 text-xs text-slate-500">Las <strong>positivas</strong> suman puntos. Las <strong>negativas</strong> descartan automáticamente la licitación.</p>
          </div>

          <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">

            <!-- Positivas activas -->
            <div class="card-base p-6">
              <h4 class="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span class="flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700">✅</span>
                Positivas ({{ positiveKeywords.length }})
              </h4>
              
              <div v-if="positiveKeywords.length === 0" class="text-sm text-slate-400 italic py-4 text-center">
                No hay keywords positivas aún.
              </div>
              <div v-else class="flex flex-wrap gap-2 mb-4">
                <span 
                  v-for="kw in positiveKeywords" 
                  :key="kw.id"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200"
                >
                  {{ kw.word }}
                  <button @click="removeKeyword(kw.id)" class="hover:text-red-600 transition-colors">
                    <TrashIcon class="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>

              <!-- Sugerencias positivas -->
              <div class="mt-4 pt-4 border-t border-slate-100">
                <p class="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"></path>
                  </svg>
                  Sugerencias TI
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <button 
                    v-for="s in SUGGESTED_IT_KEYWORDS.positive" 
                    :key="s"
                    @click="addSuggested(s, 'positive')"
                    :disabled="keywords.some(k => k.word === s && k.type === 'positive')"
                    class="text-xs px-2 py-1 rounded border border-dashed border-slate-300 text-slate-600 hover:bg-green-50 hover:border-green-400 hover:text-green-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    + {{ s }}
                  </button>
                </div>
              </div>
            </div>

            <!-- Negativas activas -->
            <div class="card-base p-6">
              <h4 class="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <span class="flex items-center justify-center w-8 h-8 rounded-full bg-red-100 text-red-700">🚫</span>
                Negativas ({{ negativeKeywords.length }})
              </h4>
              
              <div v-if="negativeKeywords.length === 0" class="text-sm text-slate-400 italic py-4 text-center">
                No hay keywords negativas.
              </div>
              <div v-else class="flex flex-wrap gap-2 mb-4">
                <span 
                  v-for="kw in negativeKeywords" 
                  :key="kw.id"
                  class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-red-100 text-red-800 border border-red-200"
                >
                  {{ kw.word }}
                  <button @click="removeKeyword(kw.id)" class="hover:text-red-900 transition-colors">
                    <TrashIcon class="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>

              <!-- Sugerencias negativas -->
              <div class="mt-4 pt-4 border-t border-slate-100">
                <p class="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1.5">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"></path>
                  </svg>
                  Exclusiones para TI
                </p>
                <div class="flex flex-wrap gap-1.5">
                  <button 
                    v-for="s in SUGGESTED_IT_KEYWORDS.negative" 
                    :key="s"
                    @click="addSuggested(s, 'negative')"
                    :disabled="keywords.some(k => k.word === s && k.type === 'negative')"
                    class="text-xs px-2 py-1 rounded border border-dashed border-red-200 text-red-600 hover:bg-red-50 hover:border-red-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    🚫 {{ s }}
                  </button>
                </div>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  </div>
</template>
