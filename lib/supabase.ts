
import { createClient } from '@supabase/supabase-js';

// No Vite, variáveis de ambiente são expostas em import.meta.env
// Na Vercel, elas devem estar configuradas no painel do projeto com o prefixo VITE_
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || (process as any).env?.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || (process as any).env?.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || supabaseUrl.includes('placeholder')) {
  console.warn("AVISO: VITE_SUPABASE_URL não encontrada. Certifique-se de configurar as variáveis de ambiente no painel da Vercel.");
}

export const supabase = createClient(
  supabaseUrl || 'https://xkucncamqdxloljttovp.supabase.co/', // Fallback para a URL fornecida
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true
    }
  }
);
