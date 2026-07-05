'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSectionTemplate, updateSectionTemplate, getCategories } from '@/lib/section-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [drills, setDrills] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    Promise.all([getSectionTemplate(id), getCategories()]).then(([template, cats]) => {
      if (template) {
        setTitle(template.title);
        setCategory(template.category);
        setDrills(template.drills);
      }
      setCategories(cats);
      setLoading(false);
    });
  }, [id]);

  function handleCategorySelect(cat: string) {
    if (cat === '__new__') {
      setShowNewCategory(true);
      setCategory('');
    } else {
      setShowNewCategory(false);
      setCategory(cat);
      setNewCategory('');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const finalCategory = newCategory.trim() || category.trim();
    if (!title.trim() || !finalCategory) return;

    setSaving(true);
    try {
      const template = await updateSectionTemplate(id, title.trim(), finalCategory, drills.trim());
      if (template) {
        router.push('/templates');
      } else {
        alert('Şablon güncellenirken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Şablon güncellenirken hata:', err);
      alert('Şablon güncellenirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-400">Yükleniyor...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Şablonu Düzenle</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Şablon Adı</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Şablon adı"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Kategori</Label>
          <div className="space-y-2">
            <div className="flex flex-wrap gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => handleCategorySelect(cat)}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                    category === cat && !showNewCategory
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <button
                type="button"
                onClick={() => handleCategorySelect('__new__')}
                className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                  showNewCategory
                    ? 'bg-blue-600 text-white border-blue-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
                }`}
              >
                + Yeni
              </button>
            </div>
            {showNewCategory && (
              <Input
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                placeholder="Yeni kategori adı (örn: Dayanıklılık)"
                autoFocus
              />
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="drills">Drill'ler</Label>
          <Textarea
            id="drills"
            value={drills}
            onChange={(e) => setDrills(e.target.value)}
            placeholder="Her satıra bir drill yazın"
            rows={8}
          />
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || !title.trim() || (!category && !newCategory)}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            İptal
          </Button>
        </div>
      </form>
    </div>
  );
}