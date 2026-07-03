import localforage from 'localforage';

// Initialize IndexedDB stores
const programStore = localforage.createInstance({ name: 'tkd-plan', storeName: 'programs' });
const sessionStore = localforage.createInstance({ name: 'tkd-plan', storeName: 'sessions' });
const syncQueue = localforage.createInstance({ name: 'tkd-plan', storeName: 'sync-queue' });

// Offline data caching
export async function cachePrograms(programs: any[]) {
  await programStore.setItem('all', programs);
}

export async function getCachedPrograms(): Promise<any[]> {
  const data = await programStore.getItem<any[]>('all');
  return data || [];
}

export async function cacheSessions(sessions: any[]) {
  await sessionStore.setItem('all', sessions);
}

export async function getCachedSessions(): Promise<any[]> {
  const data = await sessionStore.getItem<any[]>('all');
  return data || [];
}

// Sync queue for offline writes
interface SyncOperation {
  id: string;
  type: 'update-notes' | 'create-session';
  payload: any;
  timestamp: number;
}

export async function addToSyncQueue(operation: Omit<SyncOperation, 'id' | 'timestamp'>) {
  const queue = await getSyncQueue();
  const newOp: SyncOperation = {
    ...operation,
    id: Math.random().toString(36).substr(2, 9),
    timestamp: Date.now(),
  };
  queue.push(newOp);
  await syncQueue.setItem('queue', queue);
  return newOp;
}

export async function getSyncQueue(): Promise<SyncOperation[]> {
  const queue = await syncQueue.getItem<SyncOperation[]>('queue');
  return queue || [];
}

export async function clearSyncQueue() {
  await syncQueue.setItem('queue', []);
}

export async function processSyncQueue(processFn: (op: SyncOperation) => Promise<boolean>) {
  const queue = await getSyncQueue();
  if (queue.length === 0) return;

  const remaining: SyncOperation[] = [];
  for (const op of queue) {
    const success = await processFn(op);
    if (!success) {
      remaining.push(op);
    }
  }
  await syncQueue.setItem('queue', remaining);
}

// Service worker registration
export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').then(
        (registration) => {
          console.log('SW registered:', registration.scope);
        },
        (err) => {
          console.log('SW registration failed:', err);
        }
      );
    });
  }
}

// Online status helpers
export function isOnline(): boolean {
  return navigator.onLine;
}

export function onOnline(callback: () => void) {
  window.addEventListener('online', callback);
}

export function onOffline(callback: () => void) {
  window.addEventListener('offline', callback);
}