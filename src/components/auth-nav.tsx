'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';

export default function AuthNav() {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) return <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />;

  if (!user) return (
    <button onClick={signInWithGoogle} className="bg-white text-blue-900 px-3 py-1 rounded text-xs font-semibold hover:bg-blue-50 transition-colors">
      Giriş Yap
    </button>
  );

  const isAdmin = profile?.role === 'admin';
  const isPending = profile?.status === 'pending';

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link href="/admin" className="hover:text-blue-200 transition-colors px-2 py-1 rounded text-xs">
          Admin
        </Link>
      )}
      <span className="text-xs text-blue-200 hidden md:inline">
        {profile?.display_name || user.email?.split('@')[0]}
      </span>
      <button onClick={signOut} className="text-xs hover:text-blue-200 transition-colors px-2 py-1 rounded">
        Çıkış
      </button>
    </div>
  );
}
