import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Use placeholder values to prevent createClient from throwing an error during startup
// if environment variables are not yet configured.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-project.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials missing. Supabase features will not work until VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}
