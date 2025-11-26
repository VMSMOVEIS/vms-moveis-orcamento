import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
const supabaseAnonKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';

let supabase: any = null;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey);
    console.log('✅ Supabase inicializado');
  } else {
    console.warn('⚠️ Variáveis Supabase não configuradas');
  }
} catch (error) {
  console.error('❌ Erro ao inicializar Supabase:', error);
}

export { supabase };
