import { getSupabase } from './supabase';
import type { Program } from '@/types';

export async function getPrograms(): Promise<Program[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('programs')
    .select('*, profiles!created_by(display_name, role)')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching programs:', error);
    return [];
  }

  return (data || []).map((p: any) => ({
    ...p,
    creator_name: p.profiles?.display_name || null,
    creator_role: p.profiles?.role || null,
  }));
}

export async function getProgram(id: string): Promise<Program | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('programs')
    .select('*, profiles!created_by(display_name, role)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching program:', error);
    return null;
  }

  return { ...data, creator_name: (data as any).profiles?.display_name || null, creator_role: (data as any).profiles?.role || null };
}

export async function createProgram(name: string, sections: { title: string; drills: string }[]): Promise<Program | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data, error } = await supabase
    .from('programs')
    .insert({ name, sections, created_by: user.id })
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
  if (!supabase) return null;

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
  if (!supabase) return false;

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

/**
 * Belirli bir template_id'ye sahip tüm programları bulup,
 * sections içindeki o şablona ait bölümlerin title/drills değerlerini günceller.
 * Eğer template silinmişse (softUpdate = false), template_id referansını kaldırır.
 */
export async function syncProgramSectionsByTemplate(
  templateId: string,
  updates: { title: string; drills: string } | null // null = template silinmiş, referansı kaldır
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  // Tüm programları çek (filtreleme istemci taraflı yapılacak çünkü JSONB içinde arama)
  const { data: programs, error } = await supabase
    .from('programs')
    .select('id, sections');

  if (error) {
    console.error('Error fetching programs for sync:', error);
    return false;
  }

  if (!programs || programs.length === 0) return true;

  const toUpdate: { id: string; sections: unknown[] }[] = [];

  for (const program of programs) {
    const sections = (program.sections || []) as { title: string; drills: string; template_id?: string }[];
    let changed = false;

    const newSections = sections.map((sec) => {
      if (sec.template_id !== templateId) return sec;
      changed = true;
      if (updates === null) {
        // Template silindiğinde template_id referansını kaldır, içeriği olduğu gibi bırak
        const { template_id, ...rest } = sec;
        return rest;
      }
      // Template güncellendiğinde title ve drills'i güncelle
      return { ...sec, title: updates.title, drills: updates.drills };
    });

    if (changed) {
      toUpdate.push({ id: program.id, sections: newSections });
    }
  }

  if (toUpdate.length === 0) return true;

  // Her programı tek tek güncelle (Supabase batch update için)
  for (const item of toUpdate) {
    const { error: updateError } = await supabase
      .from('programs')
      .update({ sections: item.sections, updated_at: new Date().toISOString() })
      .eq('id', item.id);

    if (updateError) {
      console.error(`Error syncing program ${item.id}:`, updateError);
      return false;
    }
  }

  return true;
}
