import type { Role } from '@/types';

export function canManage(role?: Role | null): boolean {
  return role === 'admin';
}