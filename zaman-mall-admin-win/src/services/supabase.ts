import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://snbjqpuahjmigpftdwyo.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuYmpxcHVhaGptaWdwZnRkd3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTM0NjgsImV4cCI6MjA4Mzg4OTQ2OH0.EniCQTeIJk3Ny2NIee0XEtxJgc3wFuy5vyEaSHFXRuI';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  global: {
    headers: { 'x-application-name': 'zaman-mall-admin' },
  },
});

export const ADMIN_EMAILS = [
  'admin@zamansons.com',
  'admin@zaman.com',
  'malikmuhammadadilzaman@gmail.com',
  'malikzaman0987@gmail.com',
  'admin@terminal.com',
  'admin@admin.com',
];
