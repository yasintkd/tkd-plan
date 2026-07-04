import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Supabase environment variables are not configured. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabase(): SupabaseClient | null {
  if (!_supabaseInstance) {
    _supabaseInstance = getSupabaseClient();
  }
  return _supabaseInstance;
}
