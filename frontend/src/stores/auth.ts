import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '../lib/supabase'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(true)

  async function checkSession() {
    loading.value = true
    try {
      const { data: { session } } = await supabase.auth.getSession()
      user.value = session?.user ?? null
    } catch (error) {
      console.error('Error fetching session:', error)
      user.value = null
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
  }

  return {
    user,
    loading,
    checkSession,
    signOut
  }
})
