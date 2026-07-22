'use client';

import { useAuth } from '@/lib/auth';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calendar, LayoutTemplate, Swords, Home, ClipboardList, type LucideIcon } from 'lucide-react';

import type { Role } from '@/types';

type LinkDef = {
  href: string;
  label: string;
  icon: LucideIcon;
  roles: Role[];
};

const LINKS: LinkDef[] = [
  { href: '/dashboard', label: 'Dashboard', icon: Home, roles: ['admin', 'assistant', 'guest'] },
  { href: '/programs', label: 'Programlar', icon: Swords, roles: ['admin', 'assistant'] },
  { href: '/calendar', label: 'Takvim', icon: Calendar, roles: ['admin', 'assistant', 'guest'] },
  { href: '/templates', label: 'Şablonlar', icon: LayoutTemplate, roles: ['admin', 'assistant'] },
  { href: '/sessions/new', label: 'Session', icon: ClipboardList, roles: ['admin', 'assistant'] },
];

function NavLink({ href, label, icon: Icon, mobile }: LinkDef & { mobile?: boolean }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');

  if (mobile) {
    return (
      <Link
        href={href}
        className={`flex flex-col items-center gap-0.5 text-[10px] font-medium transition-colors py-1 px-3 rounded-lg ${
          active ? 'text-blue-600' : 'text-gray-500 hover:text-gray-800'
        }`}
      >
        <Icon className={`size-5 ${active ? 'text-blue-600' : ''}`} />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={`relative px-3 py-1.5 text-sm font-medium rounded-md transition-colors whitespace-nowrap ${
        active
          ? 'text-white bg-white/15'
          : 'text-blue-100 hover:text-white hover:bg-white/10'
      }`}
    >
      {label}
    </Link>
  );
}

export function NavLinks() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'guest';
  const visible = LINKS.filter(l => l.roles.includes(role));

  return (
    <>
      {visible.map(l => (
        <NavLink key={l.href} {...l} />
      ))}
    </>
  );
}

export function MobileNavLinks() {
  const { profile } = useAuth();
  const role = profile?.role ?? 'guest';
  const visible = LINKS.filter(l => l.roles.includes(role));

  return (
    <div className="flex items-center justify-around py-1">
      {visible.map(l => (
        <NavLink key={l.href} {...l} mobile />
      ))}
    </div>
  );
}