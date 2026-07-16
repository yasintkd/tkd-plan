'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSectionTemplates, deleteSectionTemplate, getCategories } from '@/lib/section-templates';
import type { SectionTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function TemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<SectionTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([getSectionTemplates(), getCategories()]).then(([data, cats]) => {
      setTemplates(data);
      setCategories(cats);
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

  const filtered = templates.filter((t) => {
    // kategori filtresi
    if (selectedCategory && t.category !== selectedCategory) return false;
    // arama filtresi
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(q) ||
      t.drills.toLowerCase().includes(q) ||
      t.category.toLowerCase().includes(q)
    );
  });

  // Group by category
  const grouped = filtered.reduce<Record<string, SectionTemplate[]>>((acc, t) => {
    if (!acc[t.category]) acc[t.category] = [];
    acc[t.category].push(t);
    return acc;
  }, {});

  if (loading) return <p className="text-gray-400">Yükleniyor...</p>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">Şablonlar</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drill şablonlarını yönetin, program oluştururken hızlıca ekleyin
          </p>
        </div>
        <Button onClick={() => router.push('/templates/new')} className="w-full sm:w-auto">
          + Yeni Şablon
        </Button>
      </div>

      {/* Category Filters */}
      <div className="flex gap-1.5 overflow-x-auto scroll-snap-x pb-1 -mx-3 px-3">
        <button
          type="button"
          onClick={() => setSelectedCategory(null)}
          className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
            !selectedCategory
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
          }`}
        >
          Tümü
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
            className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
              selectedCategory === cat
                ? 'bg-blue-600 text-white border-blue-600'
                : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Search */}
      <Input
        placeholder="Şablon ara..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full"
      />

      {/* Template List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-gray-500">
            {search.trim() ? (
              <p>Aramanızla eşleşen şablon bulunamadı.</p>
            ) : (
              <>
                <p>Henüz hiç şablon oluşturmadınız.</p>
                <p className="text-sm mt-1">
                  Isınma, raket, kuvvet gibi mikro parçalar oluşturup programlarınızda kullanabilirsiniz.
                </p>
                <Button variant="outline" className="mt-4" onClick={() => router.push('/templates/new')}>
                  İlk Şablonu Oluştur
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h2 className="text-base font-semibold text-blue-700 mb-2 flex items-center gap-2">
              <span className="w-1.5 h-5 bg-blue-600 rounded-full inline-block" />
              {category}
              <span className="text-xs text-gray-400 font-normal">({items.length})</span>
            </h2>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
               {items.map((template) => (
                <div
                  key={template.id}
                  className="relative bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-colors overflow-hidden cursor-pointer group"
                  onClick={() => router.push(`/templates/${template.id}`)}
                >
                  {/* Sol mavi aksan çizgisi */}
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500" />
                  <div className="pl-4 p-3 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-medium text-sm leading-snug text-gray-900">
                        {template.title}
                      </h3>
                      <div className="flex gap-0.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          className="text-xs text-gray-400 hover:text-blue-600 px-1.5 py-0.5 rounded hover:bg-blue-50 transition-colors"
                          onClick={() => router.push(`/templates/${template.id}/edit`)}
                          title="Düzenle"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                          </svg>
                        </button>
                        <button
                          className="text-xs text-gray-400 hover:text-red-500 px-1.5 py-0.5 rounded hover:bg-red-50 transition-colors"
                          onClick={() => handleDelete(template.id, template.title)}
                          title="Sil"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M3 6h18" />
                            <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                            <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-wrap">
                      {template.drills}
                    </p>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 uppercase tracking-wider pt-0.5">
                      <span className="bg-gray-100 px-1.5 py-0.5 rounded">{category}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}