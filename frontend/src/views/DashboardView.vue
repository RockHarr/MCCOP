<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { supabase } from '../lib/supabase'

interface OpportunityMatch {
  id: string
  score: number
  matched_keywords: string[]
  is_dismissed_by_engine: boolean
  opportunities: {
    id: string
    title: string
    description: string
    estimated_amount: number
    currency: string
    org_name: string
    closed_at: string
    external_code: string
  }
  user_decisions?: {
    status: string
  }[]
}

const matches = ref<OpportunityMatch[]>([])
const loading = ref(true)

async function fetchOpportunities() {
  loading.value = true
  try {
    // Para la V1, traemos los matches (que cruzan el perfil con la licitación)
    // Ordenamos por score descendente para ver lo mejor primero
    const { data, error } = await supabase
      .from('opportunity_matches')
      .select(`
        id, score, matched_keywords, is_dismissed_by_engine,
        opportunities (
          id, title, description, estimated_amount, currency, org_name, closed_at, external_code
        ),
        user_decisions ( status )
      `)
      .eq('is_dismissed_by_engine', false)
      .order('score', { ascending: false })
      .limit(50)

    if (error) throw error
    
    // Filtrar aquellas que ya descartó o postuló el usuario
    matches.value = (data as any[]).filter(m => {
      const decision = m.user_decisions?.[0]?.status
      return decision !== 'descartar' && decision !== 'postular' && decision !== 'archivada'
    })
    
  } catch (err) {
    console.error('Error fetching opportunities:', err)
  } finally {
    loading.value = false
  }
}

async function markDecision(matchId: string, status: string) {
  try {
    const { data: userData } = await supabase.auth.getUser()
    if (!userData.user) return

    await supabase
      .from('user_decisions')
      .upsert({
        opportunity_match_id: matchId,
        user_id: userData.user.id,
        status: status
      }, { onConflict: 'opportunity_match_id, user_id' })
      
    // Refrescar lista
    matches.value = matches.value.filter((m: OpportunityMatch) => m.id !== matchId)
  } catch (error) {
    console.error('Error marcando decisión:', error)
  }
}

onMounted(() => {
  fetchOpportunities()
})

const formatCurrency = (amount: number, currency: string) => {
  if (!amount) return 'No especificado'
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: currency === 'CLP' || currency === 'CL$' ? 'CLP' : 'USD'
  }).format(amount)
}
</script>

<template>
  <div class="space-y-6 max-w-5xl mx-auto">
    
    <div class="flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold leading-7 text-slate-900 sm:truncate sm:text-3xl sm:tracking-tight">
          Bandeja de Oportunidades
        </h2>
        <p class="mt-1 text-sm text-slate-500">
          Mostrando las mejores licitaciones sugeridas por tu perfil comercial.
        </p>
        <div class="mt-2 inline-flex items-center gap-2 px-3 py-1.5 bg-brand-50 border border-brand-200 rounded-lg text-xs text-brand-700">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          <span><strong>Score:</strong> Suma de pesos de tus keywords que coinciden con la licitación (mayor = más relevante)</span>
        </div>
      </div>
      
      <button @click="fetchOpportunities" class="btn-secondary">
        Refrescar
      </button>
    </div>

    <!-- Skeletons Loading -->
    <div v-if="loading" class="space-y-4">
      <div v-for="i in 3" :key="i" class="card-base p-6 animate-pulse flex space-x-4">
        <div class="flex-1 space-y-4 py-1">
          <div class="h-4 bg-slate-200 rounded w-3/4"></div>
          <div class="space-y-2">
            <div class="h-4 bg-slate-200 rounded"></div>
            <div class="h-4 bg-slate-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div v-else-if="matches.length === 0" class="text-center py-16 card-base bg-slate-50 border-dashed">
      <svg class="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
      <h3 class="mt-2 text-sm font-semibold text-slate-900">Bandeja al día</h3>
      <p class="mt-1 text-sm text-slate-500">No hay oportunidades nuevas que cumplan con los criterios exactos de tu perfil.</p>
    </div>

    <!-- Listado de Oportunidades -->
    <div v-else class="space-y-4">
      <div v-for="match in matches" :key="match.id" class="card-base hover:border-brand-300 transition-colors">
        <div class="flex flex-col sm:flex-row">
          
          <!-- Contenido Principal -->
          <div class="p-6 flex-1">
            <div class="flex items-center gap-3 mb-2">
              <span
                class="badge bg-brand-100 text-brand-800 border border-brand-200 cursor-help relative group"
                :title="`Puntaje: ${match.score} puntos\nCalculado por las keywords que coinciden: ${match.matched_keywords.filter(k => k.startsWith('+')).map(k => k.replace('+', '')).join(', ')}`"
              >
                <span class="flex items-center gap-1.5">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  Score: {{ match.score }}
                </span>
                <!-- Tooltip hover -->
                <span class="invisible group-hover:visible absolute left-0 top-full mt-2 w-64 px-3 py-2 bg-slate-900 text-white text-xs rounded-lg shadow-lg z-10">
                  <strong class="block mb-1">Puntaje de Relevancia</strong>
                  Suma de pesos de keywords que coinciden. Mientras mayor, más relevante es la licitación para tu perfil.
                  <span v-if="match.matched_keywords.filter(k => k.startsWith('+')).length > 0" class="block mt-1 text-brand-300">
                    {{ match.matched_keywords.filter(k => k.startsWith('+')).map(k => k.replace('+', '')).join(', ') }}
                  </span>
                </span>
              </span>
              <span class="text-xs text-slate-500 font-medium font-mono">
                {{ match.opportunities.external_code }}
              </span>
            </div>
            
            <h3 class="text-lg font-bold text-slate-900 leading-tight mb-2">
              {{ match.opportunities.title }}
            </h3>
            
            <p class="text-sm text-slate-600 line-clamp-2 mb-4">
              {{ match.opportunities.description || 'Sin descripción disponible en la API.' }}
            </p>
            
            <dl class="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4 text-sm">
              <div>
                <dt class="font-medium text-slate-500 text-xs uppercase tracking-wider">Organismo</dt>
                <dd class="mt-1 text-slate-900 font-medium">{{ match.opportunities.org_name || 'Desconocido' }}</dd>
              </div>
              <div>
                <dt class="font-medium text-slate-500 text-xs uppercase tracking-wider">Monto Estimado</dt>
                <dd class="mt-1 text-slate-900 font-medium">
                  {{ formatCurrency(match.opportunities.estimated_amount, match.opportunities.currency) }}
                </dd>
              </div>
            </dl>
            
            <div v-if="match.matched_keywords && match.matched_keywords.filter(k => k.startsWith('+')).length > 0" class="mt-4 pt-4 border-t border-slate-100">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-4 h-4 text-brand-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"></path>
                </svg>
                <span class="text-xs text-slate-600 font-semibold">Coincidencias encontradas:</span>
              </div>
              <div class="flex flex-wrap gap-2">
                <span
                  v-for="kw in match.matched_keywords.filter(k => k.startsWith('+'))"
                  :key="kw"
                  class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-brand-100 text-brand-800 border border-brand-200"
                  :title="`Esta keyword está en tu perfil y coincide con el contenido de la licitación`"
                >
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
                  </svg>
                  {{ kw.replace('+', '') }}
                </span>
              </div>
            </div>
          </div>
          
          <!-- Actions Panel (Lateral) -->
          <div class="bg-slate-50 border-t sm:border-t-0 sm:border-l border-slate-200 p-6 sm:w-48 flex flex-row sm:flex-col justify-center sm:justify-start gap-3">
            <button @click="markDecision(match.id, 'mirar')" class="btn-secondary w-full">
              👀 Mirar luego
            </button>
            <button @click="markDecision(match.id, 'postular')" class="btn-primary w-full bg-slate-900 hover:bg-slate-800">
              ✅ Postular
            </button>
            <button @click="markDecision(match.id, 'descartar')" class="btn-secondary w-full text-red-600 hover:bg-red-50 hover:text-red-700 hover:border-red-200">
              🗑️ Descartar
            </button>
          </div>
          
        </div>
      </div>
    </div>

  </div>
</template>
