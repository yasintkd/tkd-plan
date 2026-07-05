'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSectionTemplates, deleteSectionTemplate } from '@/lib/section-templates';
import type { SectionTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const CATEGORY_LABELS: Record<string, string> = {
  isinma: 'Isınma',
  raket: 'Raket Çalışması',
  kuvvet: 'Kuvvet',
  teknik: 'Teknik',
  soguma: 'Soğuma',
  esneklik: 'Esneklik / Germe',
  genel: 'Genel',
};

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<SectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getSectionTemplates().then((data) => {
      setTemplates(data);
      setLoading(false);
    });
  }, []);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`"${title}" şablonunu silmek istediğinize emin misiniz?`)) return;
    const deleted = await deleteSectionTemplate(id);
    if (deleted) {
      setTemplates(templates.filter((t) => t.id !== id));
    } else {
      alert('Silme işlemi başarısız oldu.');
    }
  }

  // Group templates by category
  const grouped = templates.reduce<Record<string, SectionTemplate[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  if (loading) return <p className="text-gray-400">Yükleniyor...</p>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Drill Şablonları</h1>
        <Button onClick={() => router.push('/templates/new')}>+ Yeni Şablon</Button>
      </div>

      {templates.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            <p>Henüz hiç şablon oluşturmadınız.</p>
            <p className="text-sm mt-1">
              Isınma, raket, kuvvet gibi mikro parçalar oluşturup programlarınızda kullanabilirsiniz.
            </p>
            <Button variant="outline" className="mt-4" onClick={() => router.push('/templates/new')}>
              İlk Şablonu Oluştur
            </Button>
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category} className="space-y-3">
            <h2 className="text-lg font-semibold text-blue-700">
              {CATEGORY_LABELS[category] || category}
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((template) => (
                <Card key={template.id}>
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm leading-snug">{template.title}</h3>
                      <div className="flex gap-1 shrink-0">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs"
                          onClick={() => router.push(`/templates/${template.id}/edit`)}
                        >
                          Düzenle
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 px-2 text-xs text-red-500"
                          onClick={() => handleDelete(template.id, template.title)}
                        >
                          Sil
                        </Button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-wrap">
                      {template.drills}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ))
      )}

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.push('/programs')}>
          ← Programlara Dön
        </Button>
      </div>
    </div>
  );
}