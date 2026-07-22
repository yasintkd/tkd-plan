'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getProgram, updateProgram } from '@/lib/programs';
import type { Section } from '@/types';
import { useAuth } from '@/lib/auth';
import { canManage } from '@/lib/role-check';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import TemplatePicker from '@/components/template-picker';

export default function EditProgramPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const { profile, loading: authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (!canManage(profile?.role)) { router.replace('/dashboard'); }
  }, [profile, authLoading, router]);

  const [name, setName] = useState('');
  const [sections, setSections] = useState<Section[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);

  useEffect(() => {
    getProgram(id).then((program) => {
      if (program) {
        setName(program.name);
        setSections(program.sections?.length ? program.sections : [{ title: '', drills: '' }]);
      }
      setLoading(false);
    });
  }, [id]);

  function handleTemplateSelect(newSections: Section[]) {
    setSections([...sections, ...newSections]);
  }

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
    try {
      const validSections = sections.filter((s) => s.title.trim());
      const program = await updateProgram(id, name.trim(), validSections);

      if (program) {
        router.push('/programs');
      } else {
        alert('Program güncellenirken bir hata oluştu. Lütfen Supabase bağlantınızı kontrol edin ve tekrar deneyin.');
      }
    } catch (err) {
      console.error('Program güncellenirken hata:', err);
      alert('Program güncellenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p className="text-gray-400">Yükleniyor...</p>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">Programı Düzenle</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label htmlFor="name">Program Adı</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Program adı"
            required
          />
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <Label className="text-base sm:text-lg font-semibold">Bölümler</Label>
            <div className="flex gap-2 w-full sm:w-auto">
              <Button type="button" variant="outline" size="sm" onClick={() => setTemplatePickerOpen(true)} className="flex-1 sm:flex-none">
                + Şablon
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={addSection} className="flex-1 sm:flex-none">
                + Boş
              </Button>
            </div>
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
                  placeholder="Drill'leri yazın"
                  rows={4}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button type="submit" disabled={saving || !name.trim()}>
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            İptal
          </Button>
        </div>
      </form>

      <TemplatePicker
        open={templatePickerOpen}
        onOpenChange={setTemplatePickerOpen}
        onSelect={handleTemplateSelect}
      />
    </div>
  );
}