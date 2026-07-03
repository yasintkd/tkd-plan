'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createSession } from '@/lib/sessions';
import { getPrograms } from '@/lib/programs';
import type { Program, RecurrenceFrequency } from '@/types';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

function NewSessionForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');

  const [date, setDate] = useState(initialDate);
  const [startTime, setStartTime] = useState('09:00');
  const [durationMin, setDurationMin] = useState<string>('');
  const [programId, setProgramId] = useState<string>('none');
  const [notes, setNotes] = useState('');
  const [recurrence, setRecurrence] = useState<RecurrenceFrequency>('none');
  const [recurrenceEndDate, setRecurrenceEndDate] = useState<string>('');
  const [programs, setPrograms] = useState<Program[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getPrograms().then(setPrograms);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);

    const sessionData = {
      date,
      start_time: startTime,
      duration_min: durationMin ? parseInt(durationMin) : null,
      program_id: programId === 'none' ? null : programId,
      notes,
      recurrence,
      recurrence_end_date: recurrence !== 'none' ? recurrenceEndDate : null,
    };

    const session = await createSession(sessionData);
    setSaving(false);

    if (session) {
      router.push('/calendar');
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Yeni Seans</h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Tarih</Label>
                <Input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="start_time">Başlangıç Saati</Label>
                <Input
                  id="start_time"
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="duration">Süre (dakika, opsiyonel)</Label>
              <Input
                id="duration"
                type="number"
                min="1"
                placeholder="60"
                value={durationMin}
                onChange={(e) => setDurationMin(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="program">Program</Label>
              <Select value={programId} onValueChange={(v) => { if (v !== null) setProgramId(v) }}>
                <SelectTrigger>
                  <SelectValue placeholder="Program seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sonra seç</SelectItem>
                  {programs.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Recurrence */}
        <Card>
          <CardContent className="pt-4 space-y-4">
            <div className="space-y-2">
              <Label>Tekrarlama</Label>
              <Select
                value={recurrence}
                onValueChange={(v) => { if (v !== null) setRecurrence(v as RecurrenceFrequency) }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Tekrarlama yok</SelectItem>
                  <SelectItem value="weekly">Haftalık</SelectItem>
                  <SelectItem value="biweekly">2 Haftada Bir</SelectItem>
                  <SelectItem value="monthly">Aylık</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {recurrence !== 'none' && (
              <div className="space-y-2">
                <Label htmlFor="recurrence_end">Bitiş Tarihi</Label>
                <Input
                  id="recurrence_end"
                  type="date"
                  value={recurrenceEndDate}
                  onChange={(e) => setRecurrenceEndDate(e.target.value)}
                  required
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-4 space-y-2">
            <Label htmlFor="notes">Not (opsiyonel)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Antrenman notları..."
              rows={3}
            />
          </CardContent>
        </Card>

        <div className="flex gap-3">
          <Button type="submit" disabled={saving}>
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

export default function NewSessionPage() {
  return (
    <Suspense fallback={<p className="text-gray-400">Yükleniyor...</p>}>
      <NewSessionForm />
    </Suspense>
  );
}

