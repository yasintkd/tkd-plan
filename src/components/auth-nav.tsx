'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { LogOut, User, Shield } from 'lucide-react';

export default function AuthNav() {
  const { user, profile, loading, signInWithGoogle, signOut } = useAuth();

  if (loading) return <div className="size-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />;

  if (!user) return (
    <button onClick={signInWithGoogle} className="bg-white text-blue-900 px-3 py-1.5 rounded-lg text-xs font-semibold hover:bg-blue-50 transition-colors shadow-sm">
      Giriş Yap
    </button>
  );

  const isAdmin = profile?.role === 'admin';
  const initial = (profile?.display_name || user.email || '?')[0].toUpperCase();

  return (
    <div className="flex items-center gap-1.5">
      {isAdmin && (
        <Link href="/admin" className="flex items-center gap-1 text-blue-200 hover:text-white transition-colors px-2 py-1.5 rounded-lg text-xs font-medium">
          <Shield className="size-3.5" />
          <span className="hidden md:inline">Admin</span>
        </Link>
      )}
      <div className="flex items-center gap-2 bg-white/10 rounded-full px-3 py-1">
        <div className="size-6 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold shadow-inner">
          {initial}
        </div>
        <span className="text-xs text-blue-100 hidden md:inline max-w-24 truncate">
          {profile?.display_name || user.email?.split('@')[0]}
        </span>
        <button onClick={signOut} className="text-blue-200 hover:text-white transition-colors p-0.5" title="Çıkış">
          <LogOut className="size-3.5" />
        </button>
      </div>
    </div>
  );
}