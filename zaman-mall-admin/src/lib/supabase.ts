import 'react-native-url-polyfill/auto';
import * as SecureStore from 'expo-secure-store';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = 'https://snbjqpuahjmigpftdwyo.supabase.co';
const supabaseAnonKey =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNuYmpxcHVhaGptaWdwZnRkd3lvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjgzMTM0NjgsImV4cCI6MjA4Mzg4OTQ2OH0.EniCQTeIJk3Ny2NIee0XEtxJgc3wFuy5vyEaSHFXRuI';

/**
 * SecureStore-based storage adapter for Supabase auth.
 * Falls back to in-memory storage on web.
 */
const SecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      if (Platform.OS === 'web') return null;
      return await SecureStore.getItemAsync(key);
    } catch {
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') return;
      await SecureStore.setItemAsync(key, value);
    } catch {
      // ignore
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      if (Platform.OS === 'web') return;
      await SecureStore.deleteItemAsync(key);
    } catch {
      // ignore
    }
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
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
