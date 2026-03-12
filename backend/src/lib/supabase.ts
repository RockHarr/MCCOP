import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Supabase URL or Service Role Key are missing in environment variables.');
}

// Usamos el Service Role Key para hacer operaciones administrativas (bypassing RLS)
// en nuestro cronjob backend. NO exponer esta key en el cliente Frontend.
export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
