'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession, updateSessionNotes, deleteSession, updateSessionProgram } from '@/lib/sessions';
import { getPrograms } from '@/lib/programs';
import type { Session, Program } from '@/types';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [session, setSession] = useState<Session | null>(null);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [notes, setNotes] = useState('');
  const [selectedProgramId, setSelectedProgramId] = useState<string>('none');
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);

  useEffect(() => {
    Promise.all([getSession(id), getPrograms()]).then(([sessionData, programsData]) => {
      if (sessionData) {
        setSession(sessionData);
        setNotes(sessionData.notes || '');
        setSelectedProgramId(sessionData.program_id || 'none');
      }
      setPrograms(programsData);
      setLoading(false);
    });
  }, [id]);

  async function handleSaveNotes() {
    setSavingNotes(true);
    await updateSessionNotes(id, notes);
    setSavingNotes(false);
  }

  async function handleProgramChange(value: string) {
    setSelectedProgramId(value);
    setSavingProgram(true);
    const programId = value === 'none' ? null : value;
    const updated = await updateSessionProgram(id, programId);
    if (updated) {
      setSession(updated);
    }
    setSavingProgram(false);
  }

  async function handleDelete() {
    if (!confirm('Bu seansı silmek istediğinize emin misiniz?')) return;
    await deleteSession(id);
    router.push('/calendar');
  }

  if (loading) return <p className="text-gray-400">Yükleniyor...</p>;
  if (!session) return <p className="text-gray-400">Seans bulunamadı.</p>;

  const sessionDate = new Date(session.date + 'T12:00:00');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Seans Detayı</h1>
        <Button variant="destructive" size="sm" onClick={handleDelete}>
          Sil
        </Button>
      </div>

      {/* Session info */}
      <Card>
        <CardContent className="pt-4 space-y-2">
          <p>
            <span className="font-semibold">Tarih:</span>{' '}
            {format(sessionDate, 'd MMMM yyyy', { locale: tr })}
          </p>
          <p>
            <span className="font-semibold">Saat:</span>{' '}
            {session.start_time.slice(0, 5)}
          </p>
          {session.duration_min && (
            <p>
              <span className="font-semibold">Süre:</span> {session.duration_min} dk
            </p>
          )}
        </CardContent>
      </Card>

      {/* Program assignment */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Label>Program</Label>
          <Select value={selectedProgramId} onValueChange={(v) => { if (v !== null) handleProgramChange(v) }}>
            <SelectTrigger>
              <SelectValue placeholder="Program seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Programsız</SelectItem>
              {programs.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {savingProgram && <p className="text-xs text-gray-400">Kaydediliyor...</p>}
        </CardContent>
      </Card>

      {/* Program drill list */}
      {session.program && session.program.sections && session.program.sections.length > 0 && (
        <Card>
          <CardContent className="pt-4 space-y-4">
            <h2 className="text-lg font-semibold">{session.program.name}</h2>
            {session.program.sections.map((section, idx) => (
              <div key={idx}>
                <h3 className="font-medium text-sm text-blue-700 mb-1">{section.title}</h3>
                <p className="text-sm whitespace-pre-line text-gray-700">{section.drills}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Notes */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Label htmlFor="notes">Antrenman Notları</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Antrenman sonrası notlarınız..."
            rows={5}
          />
          <Button onClick={handleSaveNotes} disabled={savingNotes} size="sm">
            {savingNotes ? 'Kaydediliyor...' : 'Notları Kaydet'}
          </Button>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button variant="outline" onClick={() => router.back()}>
          Geri
        </Button>
      </div>
    </div>
  );
}