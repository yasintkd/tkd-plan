import { getSupabase } from './supabase';
import type { Session, SessionFormData } from '@/types';
import { RRule } from 'rrule';
import { format } from 'date-fns';

export async function getSessions(): Promise<Session[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('sessions')
    .select('*, program:programs(*)')
    .order('date', { ascending: false });

  if (error) {
    console.error('Error fetching sessions:', error);
    return [];
  }

  return data || [];
}

export async function getSessionsByDateRange(startDate: string, endDate: string): Promise<Session[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('sessions')
    .select('*, program:programs(*)')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Error fetching sessions by date range:', error);
    return [];
  }

  return data || [];
}

export async function getSessionsByDate(date: string): Promise<Session[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('sessions')
    .select('*, program:programs(*)')
    .eq('date', date)
    .order('start_time', { ascending: true });

  if (error) {
    console.error('Error fetching sessions by date:', error);
    return [];
  }

  return data || [];
}

export async function getSession(id: string): Promise<Session | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('sessions')
    .select('*, program:programs(*)')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching session:', error);
    return null;
  }

  return data;
}

export async function createSession(sessionData: SessionFormData): Promise<Session | null> {
  const supabase = getSupabase();
  const sessionsToCreate: any[] = [];

  const baseSession = {
    date: sessionData.date,
    start_time: sessionData.start_time,
    duration_min: sessionData.duration_min,
    program_id: sessionData.program_id,
    notes: sessionData.notes,
  };

  if (sessionData.recurrence === 'none' || !sessionData.recurrence_end_date) {
    // Single session
    const { data, error } = await supabase
      .from('sessions')
      .insert(baseSession)
      .select('*, program:programs(*)')
      .single();

    if (error) {
      console.error('Error creating session:', error);
      return null;
    }

    return data;
  }

  // Recurring sessions - generate dates using RRULE
  let freq: any;
  let interval = 1;

  switch (sessionData.recurrence) {
    case 'weekly':
      freq = RRule.WEEKLY;
      break;
    case 'biweekly':
      freq = RRule.WEEKLY;
      interval = 2;
      break;
    case 'monthly':
      freq = RRule.MONTHLY;
      break;
  }

  const startDate = new Date(sessionData.date + 'T' + sessionData.start_time);
  const untilDate = new Date(sessionData.recurrence_end_date + 'T23:59:59');

  const rule = new RRule({
    freq,
    interval,
    dtstart: startDate,
    until: untilDate,
  });

  const allDates = rule.all();
  const inserts = allDates.map((dt) => ({
    ...baseSession,
    date: format(dt, 'yyyy-MM-dd'),
    start_time: sessionData.start_time,
    recurrence_rule: rule.toString(),
    recurrence_end_date: sessionData.recurrence_end_date,
  }));

  // Batch insert all recurring sessions
  const { data, error } = await supabase
    .from('sessions')
    .insert(inserts)
    .select('*, program:programs(*)');

  if (error) {
    console.error('Error creating recurring sessions:', error);
    return null;
  }

  return data?.[0] || null;
}

export async function updateSession(id: string, updates: Partial<Session>): Promise<Session | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('sessions')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*, program:programs(*)')
    .single();

  if (error) {
    console.error('Error updating session:', error);
    return null;
  }

  return data;
}

export async function updateSessionNotes(id: string, notes: string): Promise<Session | null> {
  return updateSession(id, { notes } as Partial<Session>);
}

export async function updateSessionProgram(id: string, programId: string | null): Promise<Session | null> {
  return updateSession(id, { program_id: programId } as Partial<Session>);
}

export async function deleteSession(id: string): Promise<boolean> {
  const supabase = getSupabase();
  const { error } = await supabase
    .from('sessions')
    .delete()
    .eq('id', id);

  if (error) {
    console.error('Error deleting session:', error);
    return false;
  }

  return true;
}