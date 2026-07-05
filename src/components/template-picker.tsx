'use client';

import { useEffect, useState } from 'react';
import { getSectionTemplates, getCategories, createSectionTemplate } from '@/lib/section-templates';
import type { Section, SectionTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (sections: Section[]) => void;
}

export default function TemplatePicker({ open, onOpenChange, onSelect }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<SectionTemplate[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Hızlı ekleme formu
  const [showQuickForm, setShowQuickForm] = useState(false);
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState('');
  const [quickNewCategory, setQuickNewCategory] = useState('');
  const [quickDrills, setQuickDrills] = useState('');
  const [quickSaving, setQuickSaving] = useState(false);

  useEffect(() => {
    if (open) {
      Promise.all([getSectionTemplates(), getCategories()]).then(([tpls, cats]) => {
        setTemplates(tpls);
        setCategories(cats);
        setSelectedIds(new Set());
        setSearch('');
        setSelectedCategory(null);
        setShowQuickForm(false);
        resetQuickForm();
      });
    }
  }, [open]);

  function resetQuickForm() {
    setQuickTitle('');
    setQuickCategory('');
    setQuickNewCategory('');
    setQuickDrills('');
    setQuickSaving(false);
  }

  function toggleSelect(id: string) {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  }

  function handleAdd() {
    const selected = templates.filter((t) => selectedIds.has(t.id));
    const sections: Section[] = selected.map((t) => ({
      title: t.title,
      drills: t.drills,
    }));
    onSelect(sections);
    onOpenChange(false);
  }

  async function handleQuickAdd() {
    const title = quickTitle.trim();
    if (!title) return;

    const category = quickNewCategory.trim() || quickCategory.trim();
    if (!category) return;

    setQuickSaving(true);
    try {
      const created = await createSectionTemplate(title, category, quickDrills.trim());
      if (created) {
        // Şablonu listeye ekle ve otomatik seç
        setTemplates((prev) => [...prev, created]);
        setSelectedIds((prev) => new Set(prev).add(created.id));
        // Kategorileri güncelle
        if (!categories.includes(category)) {
          setCategories((prev) => [...prev, category].sort());
        }
        resetQuickForm();
        setShowQuickForm(false);
      } else {
        alert('Şablon kaydedilirken hata oluştu.');
      }
    } catch (err) {
      console.error('Hızlı ekleme hatası:', err);
      alert('Şablon kaydedilirken hata oluştu.');
    } finally {
      setQuickSaving(false);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Şablon Ekle</DialogTitle>
        </DialogHeader>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            type="button"
            onClick={() => setSelectedCategory(null)}
            className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
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
              className={`px-2.5 py-1 rounded-full text-xs border transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-blue-300'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <Input
          placeholder="Şablon ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        {/* Mevcut Şablon Listesi */}
        {filtered.length === 0 && !showQuickForm ? (
          <div className="text-gray-500 text-center py-4 space-y-2">
            <p>Henüz hiç şablon bulunmuyor.</p>
            <p className="text-sm">Hemen aşağıdan yeni bir şablon oluşturabilirsiniz.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-blue-700 mb-2">{category}</h3>
                <div className="space-y-2">
                  {items.map((t) => (
                    <label
                      key={t.id}
                      className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedIds.has(t.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedIds.has(t.id)}
                        onChange={() => toggleSelect(t.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm">{t.title}</p>
                        <p className="text-xs text-gray-500 line-clamp-2 whitespace-pre-wrap mt-1">
                          {t.drills}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Ayırıcı + Hızlı Ekleme Butonu */}
        <div className="border-t pt-4 mt-2">
          {!showQuickForm ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-full"
              onClick={() => setShowQuickForm(true)}
            >
              + Yeni Şablon Oluştur
            </Button>
          ) : (
            <div className="space-y-3 p-3 bg-gray-50 rounded-lg border">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Hızlı Şablon Ekle</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => { resetQuickForm(); setShowQuickForm(false); }}
                >
                  Gizle
                </Button>
              </div>

              {/* Başlık */}
              <div className="space-y-1">
                <Label className="text-xs">Başlık</Label>
                <Input
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Örn: Temel Isınma 1"
                  className="text-sm"
                />
              </div>

              {/* Kategori seçimi */}
              <div className="space-y-1">
                <Label className="text-xs">Kategori</Label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-1.5 text-sm"
                  value={quickCategory}
                  onChange={(e) => { setQuickCategory(e.target.value); setQuickNewCategory(''); }}
                >
                  <option value="">Kategori seçin...</option>
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="__new__">+ Yeni Kategori Ekle</option>
                </select>
              </div>

              {/* Yeni kategori input */}
              {quickCategory === '__new__' && (
                <div className="space-y-1">
                  <Label className="text-xs">Yeni Kategori Adı</Label>
                  <Input
                    value={quickNewCategory}
                    onChange={(e) => setQuickNewCategory(e.target.value)}
                    placeholder="Örn: Dayanıklılık"
                    className="text-sm"
                  />
                </div>
              )}

              {/* Drill'ler */}
              <div className="space-y-1">
                <Label className="text-xs">Drill'ler</Label>
                <Textarea
                  value={quickDrills}
                  onChange={(e) => setQuickDrills(e.target.value)}
                  placeholder="Her satıra bir drill"
                  rows={3}
                  className="text-sm"
                />
              </div>

              <Button
                type="button"
                size="sm"
                className="w-full"
                disabled={
                  quickSaving ||
                  !quickTitle.trim() ||
                  (!quickCategory.trim() && !quickNewCategory.trim())
                }
                onClick={handleQuickAdd}
              >
                {quickSaving ? 'Kaydediliyor...' : 'Oluştur ve Listeye Ekle'}
              </Button>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleAdd} disabled={selectedIds.size === 0}>
            {selectedIds.size > 0
              ? `Seçilenleri Ekle (${selectedIds.size})`
              : 'Seçin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}