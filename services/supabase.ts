
import { createClient } from '@supabase/supabase-js';

// These are typically provided by the user or the environment.
// For the purpose of this template, we assume these might be placeholder values.
const supabaseUrl = 'https://snbjqpuahjmigpftdwyo.supabase.co';
// The key provided appears to be a placeholder or from a different service.
// Supabase keys typically start with 'eyJ'.
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuYmpxcHVhaGptaWdwZnRkd3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTM0NjgsImV4cCI6MjA4Mzg4OTQ2OH0.EniCQTeIJk3Ny2NIee0XEtxJgc3wFuy5vyEaSHFXRuI';

// Standard Supabase Anon keys are JWTs (Long strings starting with eyJ).
// sb_publishable keys are for specific Supabase services (like Auth-only or newer project types).
// If the fetch is failing, it's likely a CORS or Project Status issue.
export const isSupabaseEnabled = 
  !!supabaseUrl && 
  supabaseUrl.startsWith('https://') && 
  !!supabaseKey && 
  supabaseKey.length > 20;

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: { 'x-application-name': 'zaman-sons-mall' }
  }
});
