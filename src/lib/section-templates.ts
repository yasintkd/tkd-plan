import { getSupabase } from './supabase';
import type { SectionTemplate } from '@/types';

export async function getCategories(): Promise<string[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('section_templates')
    .select('category')
    .order('category', { ascending: true });

  if (error) {
    console.error('Error fetching categories:', error);
    return [];
  }

  const unique = [...new Set<string>((data || []).map((r) => r.category))];
  return unique;
}

export async function getSectionTemplates(): Promise<SectionTemplate[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('section_templates')
    .select('*')
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  if (error) {
    console.error('Error fetching section templates:', error);
    return [];
  }

  return data || [];
}

export async function getSectionTemplate(id: string): Promise<SectionTemplate | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('section_templates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching section template:', error);
    return null;
  }

  return data;
}

export async function createSectionTemplate(title: string, category: string, drills: string): Promise<SectionTemplate | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('section_templates')
    .insert({ title, category, drills })
    .select()
    .single();

  if (error) {
    console.error('Error creating section template:', error);
    return null;
  }

  return data;
}

export async function updateSectionTemplate(id: string, title: string, category: string, drills: string): Promise<SectionTemplate | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('section_templates')
    .update({ title, category, drills, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating section template:', error);
    return null;
  }

  return data;
}

export async function deleteSectionTemplate(id: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase
    .from('section_templates')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting section template:', error);
    return false;
  }

  return true;
}

export async function deleteCategory(category: string): Promise<{ success: boolean; count: number }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, count: 0 };

  // Önce kaç şablon silineceğini bul
  const { count, error: countError } = await supabase
    .from('section_templates')
    .select('*', { count: 'exact', head: true })
    .eq('category', category);

  if (countError) {
    console.error('Error counting templates in category:', countError);
    return { success: false, count: 0 };
  }

  // Tüm şablonları sil
  const { error } = await supabase
    .from('section_templates')
    .delete()
    .eq('category', category);

  if (error) {
    console.error('Error deleting category:', error);
    return { success: false, count: count || 0 };
  }

  return { success: true, count: count || 0 };
}
