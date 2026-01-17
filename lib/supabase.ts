
import { createClient } from '@supabase/supabase-js';

// URL extraída do projeto xkucncampqdxlonjttovp
const supabaseUrl = 'https://xkucncampqdxlonjttovp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrdWNuY2FtcWR4bG9sanR0b3ZwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY2MDA3ODIsImV4cCI6MjA4MjE3Njc4Mn0.gjT11X0OGVMVLBA3zyVm5JUjYLSk9dlMNnYcB9K1NdI';

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
