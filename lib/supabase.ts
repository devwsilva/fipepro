
import { createClient } from '@supabase/supabase-js';

// Função auxiliar para garantir que pegamos a variável independente do bundler
const getEnvVar = (key: string): string => {
  try {
    // @ts-ignore - Tentativa via Vite
    if (import.meta.env && import.meta.env[key]) return import.meta.env[key];
    // @ts-ignore - Tentativa via Process (Vercel/Node)
    if (typeof process !== 'undefined' && process.env && process.env[key]) return process.env[key];
  } catch (e) {}
  return '';
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnvVar('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.error("CRÍTICO: VITE_SUPABASE_URL não encontrada. O sistema de favoritos e login não funcionará.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
