'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSectionTemplate, getCategories } from '@/lib/section-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function NewTemplatePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [drills, setDrills] = useState('');
  const [saving, setSaving] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');

  useEffect(() => {
    getCategories().then(setCategories);
  }, []);

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
      const template = await createSectionTemplate(title.trim(), finalCategory, drills.trim());
      if (template) {
        router.push('/templates');
      } else {
        alert('Şablon kaydedilirken bir hata oluştu.');
      }
    } catch (err) {
      console.error('Şablon kaydedilirken hata:', err);
      alert('Şablon kaydedilirken bir hata oluştu.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yeni Drill Şablonu</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Şablon Adı</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Örn: Temel Isınma 1, Raket Çalışması A, ..."
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
            {!category && !newCategory && !showNewCategory && (
              <p className="text-xs text-gray-400">Bir kategori seçin veya + Yeni ile ekleyin</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="drills">Drill'ler</Label>
          <Textarea
            id="drills"
            value={drills}
            onChange={(e) => setDrills(e.target.value)}
            placeholder="Her satıra bir drill yazın:&#10;10x ap chagi&#10;3 dk ip atlama&#10;5x3 bench press"
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