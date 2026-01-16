
import { createClient } from '@supabase/supabase-js';

const getEnv = (key: string): string => {
  // Prioriza import.meta.env (Vite) depois process.env (Vercel/Node)
  // @ts-ignore
  const env = (typeof import.meta !== 'undefined' && import.meta.env?.[key]) || 
              (typeof process !== 'undefined' ? process.env[key] : '');
  return env || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("ERRO CRÍTICO: Credenciais do Supabase não configuradas nas variáveis de ambiente da Vercel.");
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
