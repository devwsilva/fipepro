
import { createClient } from '@supabase/supabase-js';

// No Vite, variáveis VITE_ são expostas em import.meta.env
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 
                    (process as any).env?.VITE_SUPABASE_URL || 
                    'https://xkucncamqdxloljttovp.supabase.co/';

// A lib do Supabase exige uma chave não-vazia para inicializar sem travar o App.
// O valor abaixo é um placeholder caso a variável de ambiente não esteja configurada na Vercel.
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 
                        (process as any).env?.VITE_SUPABASE_ANON_KEY || 
                        'KEY_NAO_CONFIGURADA'; 

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
