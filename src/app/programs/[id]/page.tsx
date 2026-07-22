'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { getProgram } from '@/lib/programs';
import type { Program } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/role-check';
import { getUserColor } from '@/lib/utils';

export default function ProgramDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { profile } = useAuth();

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

  const isAdminUser = isAdmin(profile?.role);
  const manage = isAdminUser || program.created_by === profile?.id;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <Link
            href="/programs"
            className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
          >
            ← Programlara Dön
          </Link>
          <h1 className="text-xl sm:text-2xl font-bold mt-1">{program.name}</h1>
          <div className="text-xs text-gray-400 mt-0.5">
            {program.creator_name && (
              <span className="inline-flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${isAdminUser && program.created_by === profile?.id ? 'bg-blue-500' : getUserColor(program.created_by ?? '')}`} />
                {program.creator_name}
              </span>
            )}
          </div>
        </div>
        {manage && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => router.push(`/programs/${program.id}/edit`)}
              className="w-full sm:w-auto"
            >
              Düzenle
            </Button>
          </div>
        )}
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
            <Card key={index} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4 space-y-2">
                <h3 className="font-semibold text-lg text-blue-700 bg-blue-50 -mx-6 -mt-4 px-6 py-3 mb-2 border-b border-blue-100">
                  {section.title || `Bölüm ${index + 1}`}
                </h3>
                <div className="whitespace-pre-wrap break-words text-sm text-black leading-relaxed">
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