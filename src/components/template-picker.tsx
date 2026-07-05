'use client';

import { useEffect, useState } from 'react';
import { getSectionTemplates } from '@/lib/section-templates';
import type { Section, SectionTemplate } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const CATEGORY_LABELS: Record<string, string> = {
  isinma: 'Isınma',
  raket: 'Raket Çalışması',
  kuvvet: 'Kuvvet',
  teknik: 'Teknik',
  soguma: 'Soğuma',
  esneklik: 'Esneklik / Germe',
  genel: 'Genel',
};

interface TemplatePickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (sections: Section[]) => void;
}

export default function TemplatePicker({ open, onOpenChange, onSelect }: TemplatePickerProps) {
  const [templates, setTemplates] = useState<SectionTemplate[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (open) {
      getSectionTemplates().then((data) => {
        setTemplates(data);
        setSelectedIds(new Set());
        setSearch('');
      });
    }
  }, [open]);

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

  const filtered = templates.filter((t) => {
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

        <Input
          placeholder="Şablon ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-4"
        />

        {filtered.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            Henüz hiç şablon bulunmuyor. Önce{' '}
            <a href="/templates/new" className="text-blue-600 underline">
              şablon oluşturmalısınız
            </a>
            .
          </p>
        ) : (
          <div className="space-y-4">
            {Object.entries(grouped).map(([category, items]) => (
              <div key={category}>
                <h3 className="text-sm font-semibold text-blue-700 mb-2">
                  {CATEGORY_LABELS[category] || category}
                </h3>
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