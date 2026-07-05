'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSectionTemplate, updateSectionTemplate } from '@/lib/section-templates';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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

export default function EditTemplatePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('genel');
  const [drills, setDrills] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getSectionTemplate(id).then((template) => {
      if (template) {
        setTitle(template.title);
        setCategory(template.category);
        setDrills(template.drills);
      }
      setLoading(false);
    });
  }, [id]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;

    setSaving(true);
    try {
      const template = await updateSectionTemplate(id, title.trim(), category, drills.trim());
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
            placeholder="Her satıra bir drill yazın"
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