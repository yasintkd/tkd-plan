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

// ─── yc-team-tkd types (salon yönetimi) ────────────────────────────────────

export interface YcTrainingGroup {
  id: string;
  name: string;
  notes: string | null;
  is_active: boolean;
}

export interface YcGroupSchedule {
  id: string;
  group_id: string;
  day_of_week: number; // 1=Pazartesi … 7=Pazar
  start_time: string;  // HH:mm
  end_time: string;    // HH:mm
}

/**
 * yc-team-tkd'den gelen schedule'ların belirli bir tarih için somutlaştırılmış hali.
 * Henüz program atanmamış, yani bir Session'a dönüştürülmemiş.
 */
export interface YcSyncedSession {
  id: string;           // schedule_id + date'den türetilmiş unique id
  source_schedule_id: string;
  group_id: string;
  group_name: string;
  date: string;
  start_time: string;
  end_time: string;
  duration_min: number;
  day_of_week: number;
}
