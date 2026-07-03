'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createProgram } from '@/lib/programs';
import type { Section } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';

export default function NewProgramPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [sections, setSections] = useState<Section[]>([
    { title: '', drills: '' },
  ]);
  const [saving, setSaving] = useState(false);

  function addSection() {
    setSections([...sections, { title: '', drills: '' }]);
  }

  function removeSection(index: number) {
    if (sections.length === 1) return;
    setSections(sections.filter((_, i) => i !== index));
  }

  function updateSection(index: number, field: keyof Section, value: string) {
    const updated = sections.map((s, i) =>
      i === index ? { ...s, [field]: value } : s
    );
    setSections(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;

    setSaving(true);
    const validSections = sections.filter((s) => s.title.trim());
    const program = await createProgram(name.trim(), validSections);
    setSaving(false);

    if (program) {
      router.push('/programs');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yeni Program</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Program Adı</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Örn: Pazartesi Temel Teknik"
            required
          />
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-semibold">Bölümler</Label>
            <Button type="button" variant="outline" size="sm" onClick={addSection}>
              + Bölüm Ekle
            </Button>
          </div>

          {sections.map((section, index) => (
            <Card key={index}>
              <CardContent className="pt-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <Input
                    value={section.title}
                    onChange={(e) => updateSection(index, 'title', e.target.value)}
                    placeholder="Bölüm adı (örn: Isınma)"
                    className="font-medium"
                  />
                  {sections.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSection(index)}
                      className="text-red-500"
                    >
                      Sil
                    </Button>
                  )}
                </div>
                <Textarea
                  value={section.drills}
                  onChange={(e) => updateSection(index, 'drills', e.target.value)}
                  placeholder="Drill'leri yazın (her satıra bir drill):&#10;10x ap chagi&#10;3 dk ip atlama&#10;5x3 bench press"
                  rows={4}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving || !name.trim()}>
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