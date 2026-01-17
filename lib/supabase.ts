
import { createClient } from '@supabase/supabase-js';

// Configuração oficial do projeto fornecido pelo usuário
const supabaseUrl = 'https://lprncseqecfykeqjerpj.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxwcm5jc2VxZWNmeWtlcWplcnBqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg1Mjg3MzEsImV4cCI6MjA4NDEwNDczMX0.pRdVLffmWBK3bqcGI3lrydtK2NRGL2UnIU5EmeH0T98';

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
