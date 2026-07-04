'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProgram } from '@/lib/programs';
import type { Program } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [program, setProgram] = useState<Program | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getProgram(id).then((data) => {
      setProgram(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return <p className="text-gray-400">Yükleniyor...</p>;
  }

  if (!program) {
    return (
      <div className="space-y-4">
        <p className="text-red-500">Program bulunamadı.</p>
        <Link href="/programs">
          <Button variant="outline">← Programlara Dön</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/programs"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Programlara Dön
          </Link>
          <h1 className="text-2xl font-bold mt-1">{program.name}</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push(`/programs/${program.id}/edit`)}
          >
            Düzenle
          </Button>
        </div>
      </div>

      {/* Sections */}
      {(!program.sections || program.sections.length === 0) ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p>Bu programda henüz bölüm bulunmuyor.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {program.sections.map((section, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-2">
                <h3 className="font-semibold text-lg border-b pb-1">
                  {section.title || `Bölüm ${index + 1}`}
                </h3>
                <div className="whitespace-pre-wrap text-sm text-gray-300 leading-relaxed">
                  {section.drills || '—'}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer info */}
      <p className="text-xs text-gray-600">
        Oluşturulma: {new Date(program.created_at).toLocaleDateString('tr-TR')}
        {program.created_at !== program.updated_at &&
          ` · Güncellenme: ${new Date(program.updated_at).toLocaleDateString('tr-TR')}`}
      </p>
    </div>
  );
}