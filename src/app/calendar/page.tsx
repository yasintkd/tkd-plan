'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { getSessionsByDateRange } from '@/lib/sessions';
import type { Session } from '@/types';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, addMonths, subMonths, addWeeks, subWeeks, eachDayOfInterval, isSameMonth, isSameDay, isToday } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type ViewMode = 'month' | 'week';

export default function CalendarPage() {
  const [viewMode, setViewMode] = useState<ViewMode>('month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

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
    getSessionsByDateRange(startStr, endStr).then((data) => {
      setSessions(data);
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
  const selectedSessions = selectedDate
    ? sessions.filter((s) => s.date === selectedDate)
    : [];

  function getSessionsForDay(day: Date): Session[] {
    const dayStr = format(day, 'yyyy-MM-dd');
    return sessions.filter((s) => s.date === dayStr);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Takvim</h1>

      {/* View toggle and navigation */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant={viewMode === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('month')}
          >
            Aylık
          </Button>
          <Button
            variant={viewMode === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('week')}
          >
            Haftalık
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('prev')}>
            ←
          </Button>
          <span className="font-semibold text-sm min-w-[140px] text-center">
            {viewMode === 'month'
              ? format(currentDate, 'MMMM yyyy', { locale: tr })
              : `${format(range.start, 'd MMM', { locale: tr })} - ${format(range.end, 'd MMM yyyy', { locale: tr })}`}
          </span>
          <Button variant="outline" size="sm" onClick={() => navigate('next')}>
            →
          </Button>
        </div>
      </div>

      {/* Calendar grid */}
      <Card>
        <CardContent className="p-4">
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

              return (
                <button
                  key={dayStr}
                  onClick={() => setSelectedDate(isSelected ? null : dayStr)}
                  className={`
                    relative min-h-[60px] p-1 border border-gray-100 text-left transition-colors
                    ${isToday(day) ? 'bg-blue-50' : ''}
                    ${isSelected ? 'ring-2 ring-blue-500 ring-inset' : ''}
                    ${!isCurrentMonth ? 'text-gray-300' : 'hover:bg-gray-50'}
                  `}
                >
                  <span className={`text-xs font-medium ${isToday(day) ? 'text-blue-900' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {daySessions.length > 0 && (
                    <div className="mt-1 space-y-0.5">
                      {daySessions.slice(0, 3).map((s) => (
                        <div
                          key={s.id}
                          className="w-full h-1.5 rounded-full bg-blue-500 opacity-60"
                          title={`${s.start_time.slice(0, 5)} - ${s.program?.name || 'Programsız'}`}
                        />
                      ))}
                      {daySessions.length > 3 && (
                        <span className="text-[10px] text-gray-400">+{daySessions.length - 3}</span>
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
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {format(new Date(selectedDate + 'T12:00:00'), 'd MMMM yyyy', { locale: tr })}
            </h2>
            <Link href={`/sessions/new?date=${selectedDate}`}>
              <Button size="sm">+ Seans Ekle</Button>
            </Link>
          </div>

          {selectedSessions.length === 0 ? (
            <p className="text-gray-400 text-sm">Bu günde seans bulunmuyor.</p>
          ) : (
            selectedSessions.map((session) => (
              <Link key={session.id} href={`/sessions/${session.id}`}>
                <Card className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardContent className="py-3 flex items-center justify-between">
                    <div>
                      <p className="font-semibold">
                        {session.start_time.slice(0, 5)}
                        {session.duration_min ? ` (${session.duration_min} dk)` : ''}
                      </p>
                      <p className="text-sm text-gray-500">
                        {session.program ? session.program.name : 'Programsız'}
                      </p>
                    </div>
                    {session.notes && (
                      <span className="text-xs text-gray-400 italic max-w-[150px] truncate">
                        {session.notes}
                      </span>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))
          )}
        </div>
      )}
    </div>
  );
}