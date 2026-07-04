'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPrograms, deleteProgram } from '@/lib/programs';
import type { Program } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    getPrograms().then((data) => {
      setPrograms(data);
      setLoading(false);
    });
  }, []);

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Program Havuzu</h1>
        <Link href="/programs/new">
          <Button>+ Yeni Program</Button>
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
              className="hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => router.push(`/programs/${program.id}`)}
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">{program.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-500 mb-3">
                  {program.sections?.length || 0} bölüm
                </p>
                <div className="flex gap-2">
                  <Link href={`/programs/${program.id}/edit`}>
                    <Button variant="outline" size="sm">Düzenle</Button>
                  </Link>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={(e) => handleDelete(e, program.id, program.name)}
                  >
                    Sil
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
