'use client';

import { useAuth } from '@/lib/auth';
import { useEffect, useState, useCallback } from 'react';
import { getSupabase } from '@/lib/supabase';
import type { Profile, Role } from '@/types';

export default function AdminPage() {
  const { user, profile, loading } = useAuth();
  const [pendingUsers, setPendingUsers] = useState<Profile[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<Profile[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const loadUsers = useCallback(() => {
    if (profile?.role !== 'admin') return;
    const supabase = getSupabase();
    if (!supabase) return;

    supabase.from('profiles').select('*').order('created_at', { ascending: false }).then(({ data }) => {
      if (data) {
        setPendingUsers(data.filter(p => p.status === 'pending'));
        setApprovedUsers(data.filter(p => p.status === 'approved'));
      }
      setLoadingUsers(false);
    });
  }, [profile]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const updateStatus = async (userId: string, status: 'approved' | 'rejected') => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from('profiles').update({ status }).eq('id', userId);
    loadUsers();
  };

  const updateRole = async (userId: string, role: Role) => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from('profiles').update({ role }).eq('id', userId);
    setApprovedUsers(prev => prev.map(p => p.id === userId ? { ...p, role } : p));
  };

  if (loading) return <div className="flex justify-center p-8"><div className="w-6 h-6 rounded-full border-2 border-blue-900/30 border-t-blue-900 animate-spin" /></div>;

  if (!user || profile?.role !== 'admin') return <div className="text-center p-8 text-gray-500">Yetkisiz erişim.</div>;

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Admin Paneli</h1>

      <section>
        <h2 className="text-lg font-semibold mb-3">Onay Bekleyen Kullanıcılar ({pendingUsers.length})</h2>
        {loadingUsers ? (
          <p className="text-gray-500">Yükleniyor...</p>
        ) : pendingUsers.length === 0 ? (
          <p className="text-gray-500">Onay bekleyen kullanıcı yok.</p>
        ) : (
          <div className="space-y-2">
            {pendingUsers.map(p => (
              <div key={p.id} className="flex items-center justify-between bg-white border rounded-lg p-3">
                <div>
                  <p className="font-medium">{p.display_name || 'İsimsiz'}</p>
                  <p className="text-sm text-gray-500">{p.email}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => updateStatus(p.id, 'approved')} className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700">
                    Onayla
                  </button>
                  <button onClick={() => updateStatus(p.id, 'rejected')} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Onaylı Kullanıcılar ({approvedUsers.length})</h2>
        {approvedUsers.length === 0 ? (
          <p className="text-gray-500">Henüz onaylı kullanıcı yok.</p>
        ) : (
          <div className="space-y-2">
              {approvedUsers.map(p => (
                <div key={p.id} className="flex items-center justify-between bg-white border rounded-lg p-3">
                  <div>
                    <p className="font-medium">{p.display_name || 'İsimsiz'}</p>
                    <p className="text-sm text-gray-500">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <select
                      value={p.role}
                      onChange={e => updateRole(p.id, e.target.value as Role)}
                      className="text-xs border rounded px-2 py-1 bg-white"
                    >
                      <option value="guest">Misafir</option>
                      <option value="assistant">Yardımcı</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}