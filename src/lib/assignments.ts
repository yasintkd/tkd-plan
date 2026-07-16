import { getSupabase } from './supabase';
import type { Profile } from '@/types';

export async function getAssignments(sessionId: string): Promise<Profile[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('session_assignments')
    .select('user_id')
    .eq('session_id', sessionId);
  if (!data?.length) return [];
  const ids = data.map(a => a.user_id);
  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', ids);
  return (profiles || []) as Profile[];
}

export async function addAssignment(sessionId: string, userId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from('session_assignments')
    .insert({ session_id: sessionId, user_id: userId });
  return !error;
}

export async function removeAssignment(sessionId: string, userId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;
  const { error } = await supabase
    .from('session_assignments')
    .delete()
    .eq('session_id', sessionId)
    .eq('user_id', userId);
  return !error;
}

export async function getApprovedUsers(): Promise<Profile[]> {
  const supabase = getSupabase();
  if (!supabase) return [];
  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('status', 'approved')
    .order('display_name');
  return (data || []) as Profile[];
}