import { getYcSupabase } from './yc-supabase';
import { getSupabase } from './supabase';
import { format, eachDayOfInterval, getDay } from 'date-fns';
import type { YcTrainingGroup, YcGroupSchedule, YcSyncedSession, Session } from '@/types';

// date-fns getDay: 0=Pazar, 1=Pazartesi, ..., 6=Cumartesi
// yc-team-tkd: 1=Pazartesi ... 7=Pazar
function ycWeekdayToDateFns(ycDay: number): number {
  // yc: 1=Pzt -> date-fns: 1, 2=Sal -> 2, ... 7=Pazar -> 0
  return ycDay === 7 ? 0 : ycDay;
}

function dateFnsToYcWeekday(date: Date): number {
  const d = getDay(date); // 0=Pazar
  return d === 0 ? 7 : d;
}

/**
 * yc-team-tkd'den tüm aktif grupları ve schedule'ları çeker.
 */
export async function getYcGroupsAndSchedules(): Promise<{
  groups: YcTrainingGroup[];
  schedules: YcGroupSchedule[];
}> {
  const supabase = getYcSupabase();
  if (!supabase) {
    console.warn('yc-team-tkd Supabase bağlantısı kurulamadı.');
    return { groups: [], schedules: [] };
  }

  const [gRes, sRes] = await Promise.all([
    supabase
      .from('training_groups')
      .select('id, name, notes, is_active')
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('group_schedules')
      .select('id, group_id, day_of_week, start_time, end_time'),
  ]);

  if (gRes.error) {
    console.error('yc-team-tkd grupları çekilirken hata:', gRes.error.message);
    return { groups: [], schedules: [] };
  }
  if (sRes.error) {
    console.error('yc-team-tkd schedule çekilirken hata:', sRes.error.message);
    return { groups: gRes.data ?? [], schedules: [] };
  }

  return {
    groups: (gRes.data ?? []) as YcTrainingGroup[],
    schedules: (sRes.data ?? []) as YcGroupSchedule[],
  };
}

/**
 * Verilen tarih aralığında, yc-team-tkd'deki tekrarlanan schedule'ları
 * somut tarihlere yayarak döndürür.
 * Daha önce program atanmış (tkd-plan sessions tablosunda kayıtlı) seansları
 * exclude eder.
 */
export async function getYcSyncedSessions(
  startDate: string,
  endDate: string
): Promise<YcSyncedSession[]> {
  const { groups, schedules } = await getYcGroupsAndSchedules();

  if (schedules.length === 0) return [];

  const groupMap = new Map<string, YcTrainingGroup>();
  for (const g of groups) {
    groupMap.set(g.id, g);
  }

  // Tarih aralığındaki her günü dolaş
  const start = new Date(startDate + 'T00:00:00');
  const end = new Date(endDate + 'T23:59:59');
  const days = eachDayOfInterval({ start, end });

  // Daha önce atanmış seansları çekelim (çakışma kontrolü için)
  const existingSessions = await getExistingSessionsInRange(startDate, endDate);
  const existingKeySet = new Set(
    existingSessions.map((s) => `${s.date}_${s.start_time.slice(0, 5)}`)
  );

  const synced: YcSyncedSession[] = [];

  for (const day of days) {
    const dayStr = format(day, 'yyyy-MM-dd');
    const ycDay = dateFnsToYcWeekday(day);

    // Bu güne denk gelen schedule'ları bul
    const matchingSchedules = schedules.filter((s) => s.day_of_week === ycDay);

    for (const sched of matchingSchedules) {
      // Çakışma kontrolü: aynı tarih + aynı saatte session varsa atla
      if (existingKeySet.has(`${dayStr}_${sched.start_time.slice(0, 5)}`)) continue;

      const group = groupMap.get(sched.group_id);
      const durationMin = calculateDurationMinutes(sched.start_time, sched.end_time);

      synced.push({
        id: `yc-${sched.id}-${dayStr}`,
        source_schedule_id: sched.id,
        group_id: sched.group_id,
        group_name: group?.name ?? 'Bilinmeyen Grup',
        date: dayStr,
        start_time: sched.start_time,
        end_time: sched.end_time,
        duration_min: durationMin,
        day_of_week: sched.day_of_week,
      });
    }
  }

  return synced;
}

/**
 * tkd-plan'in kendi sessions tablosundan verilen tarih aralığındaki kayıtları çeker.
 */
async function getExistingSessionsInRange(
  startDate: string,
  endDate: string
): Promise<Session[]> {
  const supabase = getSupabase();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from('sessions')
    .select('id, date, start_time, duration_min, notes, recurrence_rule, recurrence_end_date, created_at, updated_at, program_id')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date', { ascending: true });

  if (error) {
    console.error('Mevcut sessionlar çekilirken hata:', error.message);
    return [];
  }

  return (data ?? []) as Session[];
}

/**
 * yc-team-tkd'den gelen bir schedule için tkd-plan'de session oluşturur.
 * Bu fonksiyon, takvimde "Program Ata" butonuna tıklandığında çağrılır.
 */
export async function createSessionFromYcSchedule(params: {
  scheduleId: string;
  date: string;
  startTime: string;
  endTime: string;
  programId: string;
  groupName: string;
}): Promise<Session | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const durationMin = calculateDurationMinutes(params.startTime, params.endTime);

  const { data, error } = await supabase
    .from('sessions')
    .insert({
      date: params.date,
      start_time: params.startTime,
      duration_min: durationMin,
      program_id: params.programId,
      notes: `Kaynak: ${params.groupName}`,
    })
    .select('*, program:programs(*)')
    .single();

  if (error) {
    console.error('Session oluşturma hatası:', error.message);
    return null;
  }

  return data;
}

/**
 * "HH:mm" formatındaki iki saat arasındaki dakika farkını hesaplar.
 */
function calculateDurationMinutes(start: string, end: string): number {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  return (eh * 60 + em) - (sh * 60 + sm);
}