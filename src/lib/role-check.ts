import type { Role } from '@/types';

export function canManage(role?: Role | null): boolean {
  return role === 'admin' || role === 'assistant';
}

export function isAdmin(role?: Role | null): boolean {
  return role === 'admin';
}