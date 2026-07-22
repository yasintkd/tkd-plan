'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPrograms, deleteProgram } from '@/lib/programs';
import type { Program } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { isAdmin, canCreate } from '@/lib/role-check';
import { getUserColor } from '@/lib/utils';

export default function ProgramsPage() {
  const { profile, loading: authLoading } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (authLoading) return;
    if (!canCreate(profile?.role)) { router.replace('/dashboard'); return; }
  }, [profile, authLoading, router]);

  const isAdminUser = isAdmin(profile?.role);
  const showActions = (p: Program) => isAdminUser || p.created_by === profile?.id;

  useEffect(() => {
    getPrograms().then((data) => {
      if (!isAdminUser) {
        data = data.filter((p) => p.created_by === profile?.id);
      }
      setPrograms(data);
      setLoading(false);
    });
  }, [isAdminUser, profile?.id]);

  async function handleDelete(e: React.MouseEvent, id: string, name: string) {
    e.stopPropagation();
    if (!confirm(`"${name}" programını silmek istediğinize emin misiniz?`)) return;
    const success = await deleteProgram(id);
    if (success) {
      setPrograms((prev) => prev.filter((p) => p.id !== id));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <h1 className="text-xl sm:text-2xl font-bold">Program Havuzu</h1>
        <Link href="/programs/new" className="w-full sm:w-auto">
          <Button className="w-full sm:w-auto">+ Yeni Program</Button>
        </Link>
      </div>

      {loading ? (
        <p className="text-gray-400">Yükleniyor...</p>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p>Henüz hiç program oluşturmadınız.</p>
            <Link href="/programs/new">
              <Button variant="link" className="mt-2">İlk Programı Oluştur</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {programs.map((program) => (
            <Card
              key={program.id}
              className="relative hover:shadow-md transition-shadow cursor-pointer overflow-hidden"
              onClick={() => router.push(`/programs/${program.id}`)}
            >
              <div className={`absolute left-0 top-0 bottom-0 w-1 ${getUserColor(program.created_by ?? '') || 'bg-blue-500'}`} />
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{program.name}</CardTitle>
                {isAdminUser && program.creator_name && (
                  <span className="inline-flex items-center gap-1.5 text-xs mt-1">
                    <span className={`inline-block w-2.5 h-2.5 rounded-full ${getUserColor(program.created_by ?? '')}`} />
                    {program.creator_name}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-3">
                  {program.sections?.length || 0} bölüm
                </p>
                {showActions(program) && (
                  <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                    <Link href={`/programs/${program.id}/edit`} className="flex-1 sm:flex-initial">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto min-h-[44px] sm:min-h-0">Düzenle</Button>
                    </Link>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={(e) => handleDelete(e, program.id, program.name)}
                      className="flex-1 sm:flex-initial min-h-[44px] sm:min-h-0"
                    >
                      Sil
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}