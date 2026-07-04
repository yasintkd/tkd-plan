import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_YC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_YC_SUPABASE_ANON_KEY || '';

let _ycSupabaseInstance: SupabaseClient | null = null;

function getYcSupabaseClient(): SupabaseClient | null {
  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'yc-team-tkd Supabase environment variables are not configured. ' +
      'Please set NEXT_PUBLIC_YC_SUPABASE_URL and NEXT_PUBLIC_YC_SUPABASE_ANON_KEY in your .env.local file.'
    );
    return null;
  }
  return createClient(supabaseUrl, supabaseAnonKey);
}

export function getYcSupabase(): SupabaseClient | null {
  if (!_ycSupabaseInstance) {
    _ycSupabaseInstance = getYcSupabaseClient();
  }
  return _ycSupabaseInstance;
}