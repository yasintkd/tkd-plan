'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { getSupabase } from './supabase';
import type { Profile, Role, ProfileStatus } from '@/types';

interface AuthState {
  user: import('@supabase/supabase-js').User | null;
  profile: Profile | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true });
  const router = useRouter();

  const fetchProfile = useCallback(async (userId: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return data as Profile | null;
  }, []);

  const ensureProfile = useCallback(async (userId: string, email?: string) => {
    const supabase = getSupabase();
    if (!supabase) return null;
    // upsert: varsa döndür, yoksa create (pending/guest)
    const { data } = await supabase.from('profiles').upsert({
      id: userId,
      email: email ?? '',
      display_name: email?.split('@')[0] ?? '',
      role: 'guest',
      status: 'pending',
    }, { onConflict: 'id', ignoreDuplicates: false }).select().single();
    return data as Profile | null;
  }, []);

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) { setState(s => ({ ...s, loading: false })); return; }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        let profile = await fetchProfile(session.user.id);
        if (!profile) profile = await ensureProfile(session.user.id, session.user.email);
        setState({ user: session.user, profile, loading: false });
      } else {
        setState({ user: null, profile: null, loading: false });
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        let profile = await fetchProfile(session.user.id);
        if (!profile) profile = await ensureProfile(session.user.id, session.user.email);
        setState({ user: session.user, profile, loading: false });
      } else {
        setState({ user: null, profile: null, loading: false });
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile, ensureProfile]);

  const signInWithGoogle = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  }, []);

  const signOut = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    await supabase.auth.signOut();
    setState({ user: null, profile: null, loading: false });
    router.push('/');
  }, [router]);

  const refreshProfile = useCallback(async () => {
    if (!state.user) return;
    const profile = await fetchProfile(state.user.id);
    setState(s => ({ ...s, profile }));
  }, [state.user, fetchProfile]);

  return (
    <AuthContext.Provider value={{ ...state, signInWithGoogle, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}