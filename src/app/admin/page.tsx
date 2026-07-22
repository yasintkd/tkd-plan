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

  const deleteUser = async (userId: string) => {
    if (!confirm('Bu kullanıcıyı silmek istediğine emin misin?')) return;
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.from('profiles').delete().eq('id', userId);
    loadUsers();
  };

  if (loading) return <div className="flex justify-center p-8"><div className="w-6 h-6 rounded-full border-2 border-blue-900/30 border-t-blue-900 animate-spin" /></div>;

  if (!user || profile?.role !== 'admin') return <div className="text-center p-8 text-gray-500">Yetkisiz erişim.</div>;

  return (
    <div className="space-y-6 sm:space-y-8 px-0 sm:px-0">
      <h1 className="text-xl sm:text-2xl font-bold">Admin Paneli</h1>

      <section>
        <h2 className="text-base sm:text-lg font-semibold mb-3">Onay Bekleyen ({pendingUsers.length})</h2>
        {loadingUsers ? (
          <p className="text-gray-500 text-sm">Yükleniyor...</p>
        ) : pendingUsers.length === 0 ? (
          <p className="text-gray-500 text-sm">Onay bekleyen yok.</p>
        ) : (
          <div className="space-y-2">
            {pendingUsers.map(p => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border rounded-lg p-3 sm:p-3 gap-2">
                <div className="min-w-0">
                  <p className="font-medium text-sm sm:text-base truncate">{p.display_name || 'İsimsiz'}</p>
                  <p className="text-xs sm:text-sm text-gray-500 truncate">{p.email}</p>
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <button onClick={() => updateStatus(p.id, 'approved')} className="flex-1 sm:flex-none bg-green-600 text-white px-3 py-3 sm:py-1 rounded text-sm hover:bg-green-700 min-h-[44px] sm:min-h-0">
                    Onayla
                  </button>
                  <button onClick={() => updateStatus(p.id, 'rejected')} className="flex-1 sm:flex-none bg-red-600 text-white px-3 py-3 sm:py-1 rounded text-sm hover:bg-red-700 min-h-[44px] sm:min-h-0">
                    Reddet
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="text-base sm:text-lg font-semibold mb-3">Onaylı Kullanıcılar ({approvedUsers.length})</h2>
        {approvedUsers.length === 0 ? (
          <p className="text-gray-500 text-sm">Henüz onaylı kullanıcı yok.</p>
        ) : (
          <div className="space-y-2">
              {approvedUsers.map(p => (
                <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between bg-white border rounded-lg p-3 sm:p-3 gap-2">
                  <div className="min-w-0">
                    <p className="font-medium text-sm sm:text-base truncate">{p.display_name || 'İsimsiz'}</p>
                    <p className="text-xs sm:text-sm text-gray-500 truncate">{p.email}</p>
                  </div>
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <select
                      value={p.role}
                      onChange={e => updateRole(p.id, e.target.value as Role)}
                      className="text-sm border rounded px-3 py-3 sm:py-1 bg-white w-full sm:w-auto min-h-[44px] sm:min-h-0"
                    >
                      <option value="guest">Misafir</option>
                      <option value="assistant">Yardımcı</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button onClick={() => deleteUser(p.id)} className="bg-red-600 text-white px-3 py-3 sm:py-1 rounded text-sm hover:bg-red-700 min-h-[44px] sm:min-h-0 whitespace-nowrap">
                      Sil
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </section>
    </div>
  );
}