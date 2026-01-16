
import { createClient } from '@supabase/supabase-js';

// No Vite, variáveis de ambiente são acessadas via import.meta.env
// mas mantemos o fallback para process.env para compatibilidade máxima na Vercel
const getEnv = (key: string): string => {
  // @ts-ignore
  const env = import.meta.env?.[key] || (typeof process !== 'undefined' ? process.env[key] : '');
  return env || '';
};

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("Aviso: Variáveis do Supabase não configuradas.");
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);
