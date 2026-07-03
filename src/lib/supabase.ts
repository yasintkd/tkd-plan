import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let _supabaseInstance: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Supabase environment variables are not configured. ' +
      'Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your .env.local file.'
    );
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getSupabase(): SupabaseClient {
  if (!_supabaseInstance) {
    _supabaseInstance = getSupabaseClient();
  }
  return _supabaseInstance;
}

// Lazy-initialized supabase client for convenience.
// Only throws when first used if env vars are missing (not at import time).
export function getSupabaseClientOrThrow(): SupabaseClient {
  return getSupabase();
}