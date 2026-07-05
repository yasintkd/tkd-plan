'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createSectionTemplate } from '@/lib/section-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CATEGORIES = [
  { value: 'isinma', label: 'Isınma' },
  { value: 'raket', label: 'Raket Çalışması' },
  { value: 'kuvvet', label: 'Kuvvet' },
  { value: 'teknik', label: 'Teknik' },
  { value: 'soguma', label: 'Soğuma' },
  { value: 'esneklik', label: 'Esneklik / Germe' },
  { value: 'genel', label: 'Genel' },
];

export default function NewTemplatePage() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('genel');
  const [drills, setDrills] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const template = await createSectionTemplate(title.trim(), category, drills.trim());
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
          <Label htmlFor="category">Kategori</Label>
          <Select value={category} onValueChange={(v) => { if (v !== null) setCategory(v) }}>
            <SelectTrigger>
              <SelectValue placeholder="Kategori seçin" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <Button type="submit" disabled={saving || !title.trim()}>
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