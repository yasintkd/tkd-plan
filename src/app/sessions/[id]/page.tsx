'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getSession, updateSessionNotes, deleteSession, updateSessionProgram } from '@/lib/sessions';
import { getPrograms } from '@/lib/programs';
import { useAuth } from '@/lib/auth';
import { getAssignments, addAssignment, removeAssignment, getApprovedUsers } from '@/lib/assignments';
import type { Session, Program, Profile } from '@/types';
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
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const canView = !isAdmin;
  const [assignedUsers, setAssignedUsers] = useState<Profile[]>([]);
  const [availableUsers, setAvailableUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingNotes, setSavingNotes] = useState(false);
  const [savingProgram, setSavingProgram] = useState(false);

  const loadAssignments = useCallback(async () => {
    if (!isAdmin) return;
    const [assigned, allUsers] = await Promise.all([getAssignments(id), getApprovedUsers()]);
    setAssignedUsers(assigned);
    const assignedIds = new Set(assigned.map(u => u.id));
    setAvailableUsers(allUsers.filter(u => !assignedIds.has(u.id) && u.role !== 'admin'));
  }, [id, isAdmin]);

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

  useEffect(() => { loadAssignments(); }, [loadAssignments]);

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
      <div className="flex items-start sm:items-center justify-between gap-2 flex-col sm:flex-row">
        <h1 className="text-xl sm:text-2xl font-bold">Seans Detayı</h1>
        {isAdmin && (
          <Button variant="destructive" size="sm" onClick={handleDelete} className="w-full sm:w-auto">
            Sil
          </Button>
        )}
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

      {/* Program assignment (admin only) */}
      {isAdmin && (
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
      )}

      {/* User assignments (admin only) */}
      {isAdmin && (
        <Card>
          <CardContent className="pt-4 space-y-3">
            <Label>Atanan Kullanıcılar</Label>
            {assignedUsers.length === 0 && <p className="text-sm text-gray-500">Henüz kimse atanmamış.</p>}
            <div className="flex flex-wrap gap-2">
              {assignedUsers.map(u => (
                <span key={u.id} className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                  {u.display_name || u.email}
                  <button onClick={async () => { await removeAssignment(id, u.id); loadAssignments(); }} className="hover:text-red-600 ml-1 min-w-[24px] min-h-[24px] flex items-center justify-center">&times;</button>
                </span>
              ))}
            </div>
            {availableUsers.length > 0 && (
              <div className="flex flex-wrap gap-2">
                    {availableUsers.map(u => (
                  <button
                    key={u.id}
                    onClick={async () => { await addAssignment(id, u.id); loadAssignments(); }}
                    className="text-xs border border-dashed border-gray-300 px-3 py-2 rounded-full hover:bg-gray-100 min-h-[36px]"
                  >
                    + {u.display_name || u.email}
                  </button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Program drill list */}
      {session.program && session.program.sections && session.program.sections.length > 0 && (
        <div className="space-y-4">
          {session.program.sections.map((section, idx) => (
            <Card key={idx} className="border-l-4 border-l-blue-500">
              <CardContent className="pt-4 space-y-2">
                <h3 className="font-semibold text-lg text-blue-700 bg-blue-50 -mx-6 -mt-4 px-6 py-3 mb-2 border-b border-blue-100">
                  {section.title}
                </h3>
                <div className="whitespace-pre-wrap break-words text-sm text-black leading-relaxed">
                  {section.drills}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Notes */}
      <Card>
        <CardContent className="pt-4 space-y-3">
          <Label htmlFor="notes">Antrenman Notları</Label>
          {isAdmin ? (
            <>
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
            </>
          ) : (
            <div className="whitespace-pre-wrap break-words text-sm text-gray-700 leading-relaxed">
              {session.notes || 'Not eklenmemiş.'}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button variant="outline" onClick={() => router.back()} className="w-full sm:w-auto">
          Geri
        </Button>
      </div>
    </div>
  );
}