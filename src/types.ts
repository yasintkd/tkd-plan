export interface Section {
  title: string;
  drills: string;
}

export interface Program {
  id: string;
  name: string;
  sections: Section[];
  created_at: string;
  updated_at: string;
}

export interface Session {
  id: string;
  program_id: string | null;
  date: string;
  start_time: string;
  duration_min: number | null;
  notes: string;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  program?: Program | null;
}

export type RecurrenceFrequency = 'none' | 'weekly' | 'biweekly' | 'monthly';

export interface SessionFormData {
  date: string;
  start_time: string;
  duration_min: number | null;
  program_id: string | null;
  notes: string;
  recurrence: RecurrenceFrequency;
  recurrence_end_date: string | null;
}