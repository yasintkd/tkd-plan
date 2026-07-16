'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';

import type { Role } from '@/types';

const LINKS: { href: string; label: string; roles: Role[] }[] = [
  { href: '/programs', label: 'Programlar', roles: ['admin'] },
  { href: '/calendar', label: 'Takvim', roles: ['admin', 'assistant', 'guest'] },
  { href: '/templates', label: 'Şablonlar', roles: ['admin'] },
];

export default function NavLinks() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'guest';
  const visible = LINKS.filter(l => l.roles.includes(role));

  return (
    <>
      {visible.map(l => (
        <Link
          key={l.href}
          href={l.href}
          className="hover:text-blue-200 transition-colors px-2 py-1 rounded active:bg-blue-800"
        >
          {l.label}
        </Link>
      ))}
    </>
  );
}