import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

const USER_COLORS = [
  'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-600',
  'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-orange-500', 'bg-cyan-500', 'bg-rose-500', 'bg-lime-500',
  'bg-violet-500', 'bg-fuchsia-500', 'bg-sky-500', 'bg-emerald-500',
  'bg-amber-500', 'bg-slate-700', 'bg-stone-500', 'bg-neutral-700',
];

function hashUserId(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = ((hash << 5) - hash) + id.charCodeAt(i);
    hash |= 0; // convert to 32bit int
  }
  return Math.abs(hash);
}

export function getUserColor(userId: string): string {
  return USER_COLORS[hashUserId(userId) % USER_COLORS.length];
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
