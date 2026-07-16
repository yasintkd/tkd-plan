'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { getSessionsByDate } from '@/lib/sessions';
import { getPrograms } from '@/lib/programs';
import type { Session } from '@/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/auth';

export default function DashboardPage() {
  const router = useRouter();
  const { user, profile, loading: authLoading } = useAuth();
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [programCount, setProgramCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const today = format(new Date(), 'yyyy-MM-dd');
  const todayDisplay = format(new Date(), 'dd MMMM yyyy', { locale: tr });

  useEffect(() => {
    if (authLoading) return;
    if (!user) { router.push('/'); return; }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function loadData() {
      try {
        const [sessions, programs] = await Promise.all([
          getSessionsByDate(today),
          getPrograms(),
        ]);
        setTodaySessions(sessions);
        setProgramCount(programs.length);
      } catch (err) {
        console.error('Dashboard verileri yüklenirken hata:', err);
      } finally {
        setLoading(false);
      }
    }
    if (user) loadData();
  }, [today, user]);

  if (authLoading || !user) return null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Bugünün Antrenmanları</h1>
          <p className="text-gray-500 text-sm">{todayDisplay}</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Link href="/programs/new" className="flex-1 sm:flex-initial">
            <Button variant="outline" className="w-full sm:w-auto">Yeni Program</Button>
          </Link>
          <Link href="/calendar" className="flex-1 sm:flex-initial">
            <Button className="w-full sm:w-auto">Takvime Git</Button>
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
            <div
              key={session.id}
              onClick={() => router.push(`/sessions/${session.id}`)}
              className="cursor-pointer"
            >
              <Card className="hover:shadow-md transition-shadow">
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
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div
          onClick={() => router.push('/programs')}
          className="cursor-pointer"
        >
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Program Havuzu</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-900">{programCount}</p>
              <p className="text-sm text-gray-500">kayıtlı program</p>
            </CardContent>
          </Card>
        </div>
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