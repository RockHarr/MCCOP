import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// En el frontend SOLO se usa la Anon Key por seguridad (RLS protege los datos)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)
