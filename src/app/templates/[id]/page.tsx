'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '@/lib/auth';
import { isAdmin } from '@/lib/role-check';
import { getSectionTemplate, deleteSectionTemplate } from '@/lib/section-templates';
import type { SectionTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getUserColor } from '@/lib/utils';

export default function TemplateDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { profile } = useAuth();

  const [template, setTemplate] = useState<SectionTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    getSectionTemplate(id).then((data) => {
      setTemplate(data);
      setLoading(false);
    });
  }, [id]);

  async function handleDelete() {
    if (!template) return;
    if (!confirm(`"${template.title}" şablonunu silmek istediğinize emin misiniz?`)) return;

    setDeleting(true);
    const deleted = await deleteSectionTemplate(template.id);
    if (deleted) {
      router.push('/templates');
    } else {
      alert('Silme işlemi başarısız oldu.');
      setDeleting(false);
    }
  }

  if (!profile) return null;

  const manage = isAdmin(profile?.role) || template?.created_by === profile?.id;

  if (loading) return <p className="text-gray-400">Yükleniyor...</p>;

  if (!template) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl sm:text-2xl font-bold">Şablon Bulunamadı</h1>
        <p className="text-gray-500">Bu ID ile bir şablon bulunamadı.</p>
        <Button variant="outline" onClick={() => router.push('/templates')}>
          Şablonlara Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Üst kısım: başlık + aksiyon butonları */}
      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{template.title}</h1>
          <span className="inline-block mt-1 text-xs bg-blue-100 text-blue-700 px-2.5 py-1 rounded-full font-medium">
            {template.category}
          </span>
          {template.creator_name && (
            <div className="text-xs text-gray-400 mt-1">
              <span className="inline-flex items-center gap-1">
                <span className={`inline-block w-2 h-2 rounded-full ${getUserColor(template.created_by ?? '')}`} />
                {template.creator_name}
              </span>
            </div>
          )}
        </div>
        {manage && (
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              onClick={() => router.push(`/templates/${template.id}/edit`)}
              className="flex-1 sm:flex-none"
            >
              Düzenle
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={deleting}
              className="flex-1 sm:flex-none"
            >
              {deleting ? 'Siliniyor...' : 'Sil'}
            </Button>
          </div>
        )}
      </div>

      <Separator />

      {/* Drill içeriği */}
      <div>
        <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">
          Drill'ler
        </h2>
        <Card>
          <CardContent className="py-4">
            {template.drills.split('\n').filter(Boolean).length > 0 ? (
              <ul className="space-y-1.5">
                {template.drills.split('\n').filter(Boolean).map((drill, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                    <span className="text-gray-300 font-mono text-xs mt-0.5">
                      {String(i + 1).padStart(2, '0')}.
                    </span>
                    <span>{drill}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-gray-400 italic">Henüz drill eklenmemiş.</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Alt kısım: geri butonu */}
      <Button variant="ghost" onClick={() => router.push('/templates')}>
        ← Şablonlara Dön
      </Button>
    </div>
  );
}