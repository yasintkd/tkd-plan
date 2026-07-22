'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getSessionsByDateRange, updateSessionProgram } from '@/lib/sessions';
import { getYcSyncedSessions, createSessionFromYcSchedule } from '@/lib/yc-sessions';
import { getPrograms } from '@/lib/programs';
import type { Session, YcSyncedSession, Program } from '@/types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, eachDayOfInterval, isSameMonth, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/lib/auth';
import { canManage } from '@/lib/role-check';

type ViewMode = 'month' | 'week';

interface CalendarSession {
  id: string;
  date: string;
  start_time: string;
  duration_min: number | null;
  program?: Program | null;
  group_name?: string; // yc kaynağıysa grup adı
  isYcSource: boolean;
  ycScheduleId?: string;
  ycEndTime?: string;
  notes?: string;
}

export default function CalendarPage() {
  const { profile } = useAuth();
  const isAdmin = canManage(profile?.role);
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tkdSessions, setTkdSessions] = useState<Session[]>([]);
  const [ycSessions, setYcSessions] = useState<YcSyncedSession[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  // Program atama dialog state (yc -> tkd)
  const [assignDialog, setAssignDialog] = useState<{
    open: boolean;
    ycSession: YcSyncedSession | null;
    selectedProgramId: string;
    assigning: boolean;
  }>({
    open: false,
    ycSession: null,
    selectedProgramId: '',
    assigning: false,
  });

  // Program değiştirme/kaldırma dialog state (mevcut tkd session)
  const [changeDialog, setChangeDialog] = useState<{
    open: boolean;
    sessionId: string | null;
    currentProgramId: string | null;
    selectedProgramId: string;
    saving: boolean;
  }>({
    open: false,
    sessionId: null,
    currentProgramId: null,
    selectedProgramId: 'none',
    saving: false,
  });

  const getDateRange = useCallback(() => {
    if (viewMode === 'month') {
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);
      return {
        start: startOfWeek(monthStart, { weekStartsOn: 1 }),
        end: endOfWeek(monthEnd, { weekStartsOn: 1 }),
        days: eachDayOfInterval({ start: startOfWeek(monthStart, { weekStartsOn: 1 }), end: endOfWeek(monthEnd, { weekStartsOn: 1 }) }),
      };
    } else {
      const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(currentDate, { weekStartsOn: 1 });
      return {
        start: weekStart,
        end: weekEnd,
        days: eachDayOfInterval({ start: weekStart, end: weekEnd }),
      };
    }
  }, [currentDate, viewMode]);

  useEffect(() => {
    const range = getDateRange();
    const startStr = format(range.start, 'yyyy-MM-dd');
    const endStr = format(range.end, 'yyyy-MM-dd');

    setLoading(true);

    Promise.all([
      getSessionsByDateRange(startStr, endStr),
      getYcSyncedSessions(startStr, endStr),
      getPrograms(),
    ]).then(([tkdData, ycData, progData]) => {
      setTkdSessions(tkdData);
      setYcSessions(ycData);
      setPrograms(progData);
      setLoading(false);
    });
  }, [currentDate, viewMode, getDateRange]);

  function navigate(direction: 'prev' | 'next') {
    if (viewMode === 'month') {
      setCurrentDate(direction === 'prev' ? subMonths(currentDate, 1) : addMonths(currentDate, 1));
    } else {
      setCurrentDate(direction === 'prev' ? subWeeks(currentDate, 1) : addWeeks(currentDate, 1));
    }
  }

  const range = getDateRange();

  // Tüm takvim öğelerini birleştir
  function getCalendarSessionsForDay(day: Date): CalendarSession[] {
    const dayStr = format(day, 'yyyy-MM-dd');

    // tkd-plan'in kendi sessionları
    const fromTkd: CalendarSession[] = tkdSessions
      .filter((s) => s.date === dayStr)
      .map((s) => ({
        id: s.id,
        date: s.date,
        start_time: s.start_time,
        duration_min: s.duration_min,
        program: s.program,
        isYcSource: false,
        notes: s.notes,
      }));

    // yc-team-tkd'den gelen schedule'lar (program atanmamış olanlar)
    const fromYc: CalendarSession[] = ycSessions
      .filter((s) => s.date === dayStr)
      .map((s) => ({
        id: s.id,
        date: s.date,
        start_time: s.start_time,
        duration_min: s.duration_min,
        group_name: s.group_name,
        isYcSource: true,
        ycScheduleId: s.source_schedule_id,
        ycEndTime: s.end_time,
      }));

    // Saate göre sırala
    return [...fromTkd, ...fromYc].sort((a, b) => a.start_time.localeCompare(b.start_time));
  }

  const selectedDateSessions = selectedDate
    ? getCalendarSessionsForDay(new Date(selectedDate + 'T12:00:00'))
    : [];

  function getSessionsForDay(day: Date): CalendarSession[] {
    return getCalendarSessionsForDay(day);
  }

  // Program atama dialog'u aç
  function openAssignDialog(ycSession: YcSyncedSession) {
    setAssignDialog({
      open: true,
      ycSession,
      selectedProgramId: programs.length > 0 ? programs[0].id : '',
      assigning: false,
    });
  }

  // Program ata
  async function handleAssignProgram() {
    if (!assignDialog.ycSession || !assignDialog.selectedProgramId) return;

    setAssignDialog((prev) => ({ ...prev, assigning: true }));

    const result = await createSessionFromYcSchedule({
      scheduleId: assignDialog.ycSession.source_schedule_id,
      date: assignDialog.ycSession.date,
      startTime: assignDialog.ycSession.start_time,
      endTime: assignDialog.ycSession.end_time,
      programId: assignDialog.selectedProgramId,
      groupName: assignDialog.ycSession.group_name,
    });

    if (result) {
      // Başarılı: dialog'u kapat, verileri yenile
      setAssignDialog({ open: false, ycSession: null, selectedProgramId: '', assigning: false });

      // Mevcut ycSession'ı listeden çıkar ve tkdSessions'a ekle
      const range = getDateRange();
      const startStr = format(range.start, 'yyyy-MM-dd');
      const endStr = format(range.end, 'yyyy-MM-dd');

      const [tkdData, ycData] = await Promise.all([
        getSessionsByDateRange(startStr, endStr),
        getYcSyncedSessions(startStr, endStr),
      ]);
      setTkdSessions(tkdData);
      setYcSessions(ycData);
    } else {
      setAssignDialog((prev) => ({ ...prev, assigning: false }));
      alert('Program atanırken bir hata oluştu.');
    }
  }

  // Program değiştir dialog'u aç
  function openChangeDialog(session: CalendarSession) {
    setChangeDialog({
      open: true,
      sessionId: session.id,
      currentProgramId: session.program?.id ?? null,
      selectedProgramId: session.program?.id ?? 'none',
      saving: false,
    });
  }

  // Programı değiştir veya kaldır
  async function handleChangeProgram() {
    if (!changeDialog.sessionId) return;

    setChangeDialog((prev) => ({ ...prev, saving: true }));

    const programId = changeDialog.selectedProgramId === 'none' ? null : changeDialog.selectedProgramId;
    const result = await updateSessionProgram(changeDialog.sessionId, programId);

    if (result) {
      setChangeDialog({ open: false, sessionId: null, currentProgramId: null, selectedProgramId: 'none', saving: false });

      // Verileri yenile
      const range = getDateRange();
      const startStr = format(range.start, 'yyyy-MM-dd');
      const endStr = format(range.end, 'yyyy-MM-dd');

      const [tkdData, ycData] = await Promise.all([
        getSessionsByDateRange(startStr, endStr),
        getYcSyncedSessions(startStr, endStr),
      ]);
      setTkdSessions(tkdData);
      setYcSessions(ycData);
    } else {
      setChangeDialog((prev) => ({ ...prev, saving: false }));
      alert('Program güncellenirken bir hata oluştu.');
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Takvim</h1>

      {/* View toggle and navigation */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex gap-1 sm:gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
            className="text-xs sm:text-sm h-9 sm:h-auto"
          >
            Aylık
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
            className="text-xs sm:text-sm h-9 sm:h-auto"
          >
            Haftalık
          </Button>
        </div>
        <div className="flex items-center gap-1 sm:gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('prev')} className="h-9 w-9 sm:h-auto sm:w-auto p-0 sm:px-3">
            ←
          </Button>
          <span className="font-semibold text-xs sm:text-sm min-w-[120px] sm:min-w-[140px] text-center leading-tight">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy', { locale: tr })
              : `${format(range.start, 'd MMM', { locale: tr })} - ${format(range.end, 'd MMM yyyy', { locale: tr })}`}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate('next')} className="h-9 w-9 sm:h-auto sm:w-auto p-0 sm:px-3">
            →
          </Button>
        </div>
      </div>

      {/* Lejant */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-500" />
          <span>Programlı</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-amber-400" />
          <span>Programsız (yc-team-tkd)</span>
        </div>
      </div>

      {/* Calendar grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-1 sm:p-4">
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-2">
            {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {range.days.map((day) => {
              const dayStr = format(day, 'yyyy-MM-dd');
              const daySessions = getSessionsForDay(day);
              const isCurrentMonth = viewMode === 'week' || isSameMonth(day, currentDate);
              const isSelected = selectedDate === dayStr;

              // Programlı ve programsız seans sayıları
              const programliCount = daySessions.filter((s) => !s.isYcSource).length;
              const programsizCount = daySessions.filter((s) => s.isYcSource).length;

              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDate(isSelected ? null : dayStr)}
                  className={`
                    relative min-h-[52px] sm:min-h-[60px] p-0.5 sm:p-1 border border-gray-100 text-left transition-colors
                    ${isToday(day) ? 'bg-blue-50' : ''}
                    ${isSelected ? 'ring-1 sm:ring-2 ring-blue-500 ring-inset' : ''}
                    ${!isCurrentMonth ? 'text-gray-300' : 'hover:bg-gray-50'}
                  `}
                >
                  <span className={`text-[11px] sm:text-xs font-medium ${isToday(day) ? 'text-blue-900' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {daySessions.length > 0 && (
                    <div className="mt-0.5 sm:mt-1 space-y-0.5">
                      {daySessions.slice(0, 2).map((s) => (
                        <div
                          key={s.id}
                          className={`w-full h-1 sm:h-1.5 rounded-full ${s.isYcSource ? 'bg-amber-400' : 'bg-blue-500'} opacity-60`}
                          title={`${s.start_time.slice(0, 5)}${s.isYcSource ? ` - ${s.group_name} (Programsız)` : s.program ? ` - ${s.program.name}` : ''}`}
                        />
                      ))}
                      {daySessions.length > 2 && (
                        <span className="text-[9px] sm:text-[10px] text-gray-400">+{daySessions.length - 2}</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Selected day sessions */}
      {selectedDate && (
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <h2 className="text-base sm:text-lg font-semibold">
              {format(new Date(selectedDate + 'T12:00:00'), 'd MMMM yyyy', { locale: tr })}
            </h2>
            {isAdmin && (
              <Link href={`/sessions/new?date=${selectedDate}`} className="w-full sm:w-auto">
                <Button size="sm" className="w-full sm:w-auto">+ Seans Ekle</Button>
              </Link>
            )}
          </div>

          {selectedDateSessions.length === 0 ? (
            <p className="text-gray-400 text-sm">Bu günde seans bulunmuyor.</p>
          ) : (
            <div className="space-y-2">
              {selectedDateSessions.map((session) => (
                <div key={session.id}>
                  {session.isYcSource ? (
                    <Card className="border-amber-200 hover:shadow-md transition-shadow">
                      <CardContent className="py-3 px-3 sm:px-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex-1 min-w-0 w-full sm:w-auto">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="inline-block w-2 h-2 rounded-full bg-amber-400 shrink-0" />
                              <p className="font-semibold text-sm">
                                {session.start_time.slice(0, 5)}
                                {session.duration_min ? ` (${session.duration_min} dk)` : ''}
                              </p>
                              <span className="text-[11px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                                {session.group_name}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500 mt-0.5">Henüz program atanmamış</p>
                          </div>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full sm:w-auto"
                              onClick={() => {
                                const ycSession = ycSessions.find(
                                  (ys) => ys.id === session.id
                                );
                                if (ycSession) openAssignDialog(ycSession);
                              }}
                            >
                              Program Ata
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="hover:shadow-md transition-shadow">
                      <CardContent className="py-3 px-3 sm:px-4">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <Link href={`/sessions/${session.id}`} className="flex-1 min-w-0 w-full sm:w-auto">
                            <div>
                              <p className="font-semibold text-sm sm:text-base">
                                {session.start_time.slice(0, 5)}
                                {session.duration_min ? ` (${session.duration_min} dk)` : ''}
                              </p>
                              <p className="text-sm text-gray-500">
                                {session.program ? session.program.name : 'Programsız'}
                              </p>
                            </div>
                            {session.notes && (
                              <span className="text-xs text-gray-400 italic truncate block mt-0.5 max-w-full">
                                {session.notes}
                              </span>
                            )}
                          </Link>
                          {isAdmin && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.preventDefault();
                                openChangeDialog(session);
                              }}
                              className="w-full sm:w-auto shrink-0"
                            >
                              Programı Değiştir
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Program Atama Dialog */}
      <Dialog
        open={assignDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setAssignDialog({ open: false, ycSession: null, selectedProgramId: '', assigning: false });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Program Ata</DialogTitle>
            <DialogDescription>
              {assignDialog.ycSession && (
                <>
                  <span className="font-medium">{assignDialog.ycSession.group_name}</span> grubunun{' '}
                  <span className="font-medium">
                    {format(new Date(assignDialog.ycSession.date + 'T12:00:00'), 'd MMMM yyyy', { locale: tr })}
                  </span>{' '}
                  tarihindeki{' '}
                  <span className="font-medium">{assignDialog.ycSession.start_time.slice(0, 5)}</span> seansına
                  bir program atayın.
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="program-select">Antrenman Programı</Label>
            <select
              id="program-select"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={assignDialog.selectedProgramId}
              onChange={(e) =>
                setAssignDialog((prev) => ({ ...prev, selectedProgramId: e.target.value }))
              }
            >
              {programs.length === 0 && (
                <option value="" disabled>Henüz program bulunmuyor</option>
              )}
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {programs.length === 0 && (
              <p className="text-xs text-amber-600">
                Önce bir antrenman programı oluşturmalısınız.
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline">İptal</Button>} />
            <Button
              onClick={handleAssignProgram}
              disabled={assignDialog.assigning || !assignDialog.selectedProgramId || programs.length === 0}
            >
              {assignDialog.assigning ? 'Atanıyor...' : 'Programı Ata'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Program Değiştir/Kaldır Dialog */}
      <Dialog
        open={changeDialog.open}
        onOpenChange={(open) => {
          if (!open) {
            setChangeDialog({ open: false, sessionId: null, currentProgramId: null, selectedProgramId: 'none', saving: false });
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Programı Değiştir</DialogTitle>
            <DialogDescription>
              Bu seansa ait programı değiştirebilir veya tamamen kaldırabilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            <Label htmlFor="change-program-select">Antrenman Programı</Label>
            <select
              id="change-program-select"
              className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm"
              value={changeDialog.selectedProgramId}
              onChange={(e) =>
                setChangeDialog((prev) => ({ ...prev, selectedProgramId: e.target.value }))
              }
            >
              <option value="none">Programsız</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
            {changeDialog.selectedProgramId === 'none' && changeDialog.currentProgramId && (
              <p className="text-xs text-amber-600">
                Program kaldırılacak, seans programsız olarak görünecek.
              </p>
            )}
            {changeDialog.selectedProgramId !== 'none' && changeDialog.currentProgramId && changeDialog.selectedProgramId !== changeDialog.currentProgramId && (
              <p className="text-xs text-blue-600">
                Program değiştirilecek.
              </p>
            )}
          </div>

          <DialogFooter>
            <DialogClose render={<Button variant="outline">İptal</Button>} />
            <Button
              onClick={handleChangeProgram}
              disabled={changeDialog.saving}
            >
              {changeDialog.saving ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
