'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getSessionsByDate } from '@/lib/sessions';
import { getPrograms } from '@/lib/programs';
import type { Session } from '@/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [programCount, setProgramCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDisplay = format(new Date(), 'dd MMMM yyyy', { locale: tr });

  useEffect(() => {
    async function loadData() {
      const [sessions, programs] = await Promise.all([
        getSessionsByDate(today),
        getPrograms(),
      ]);
      setTodaySessions(sessions);
      setProgramCount(programs.length);
      setLoading(false);
    }
    loadData();
  }, [today]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Bugünün Antrenmanları</h1>
          <p className="text-gray-500 text-sm">{todayDisplay}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/programs/new">
            <Button variant="outline">Yeni Program</Button>
          </Link>
          <Link href="/calendar">
            <Button>Takvime Git</Button>
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400">Yükleniyor...</p>
      ) : todaySessions.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p>Bugün için planlanmış antrenman yok.</p>
            <Link href={`/sessions/new?date=${today}`}>
              <Button variant="link" className="mt-2">Yeni Seans Oluştur</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {todaySessions.map((session) => (
            <Link key={session.id} href={`/sessions/${session.id}`}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer">
                <CardContent className="py-4 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">
                      {session.start_time.slice(0, 5)}
                      {session.duration_min ? ` (${session.duration_min} dk)` : ''}
                    </p>
                    <p className="text-sm text-gray-500">
                      {session.program ? session.program.name : 'Programsız'}
                    </p>
                  </div>
                  {session.notes && (
                    <span className="text-xs text-gray-400 italic max-w-[200px] truncate">
                      {session.notes}
                    </span>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Program Havuzu</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{programCount}</p>
            <p className="text-sm text-gray-500">kayıtlı program</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Bugünkü Seans</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-blue-900">{todaySessions.length}</p>
            <p className="text-sm text-gray-500">planlanmış antrenman</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}