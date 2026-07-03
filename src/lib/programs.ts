import { getSupabase } from './supabase';
import type { Program } from '@/types';

export async function getPrograms(): Promise<Program[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching programs:', error);
    return [];
  }

  return data || [];
}

export async function getProgram(id: string): Promise<Program | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('programs')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching program:', error);
    return null;
  }

  return data;
}

export async function createProgram(name: string, sections: { title: string; drills: string }[]): Promise<Program | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('programs')
    .insert({ name, sections })
    .select()
    .single();

  if (error) {
    console.error('Error creating program:', error);
    return null;
  }

  return data;
}

export async function updateProgram(id: string, name: string, sections: { title: string; drills: string }[]): Promise<Program | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('programs')
    .update({ name, sections, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating program:', error);
    return null;
  }

  return data;
}

export async function deleteProgram(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('programs')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting program:', error);
    return false;
  }

  return true;
}