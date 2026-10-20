import { AppConfig, Room, SavedGame, UserProfile } from '../types';

export const ADMIN_EMAIL = (
  (import.meta as any).env?.VITE_ADMIN_EMAIL ||
  'xavier.piza2@gmail.com'
).toLowerCase().trim();
export const USERS_REF = 'users';
export const CONFIG_REF = 'app/config';
export const STATS_REF = 'app/stats';
export const SAVED_REF = 'app/saved';

const API_BASE = '/api';

export interface AuthUser {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
}

// Global internal auth state management
let currentUser: AuthUser | null = null;
const authListeners = new Set<(user: AuthUser | null) => void>();

export function getAuthCurrentUser(): AuthUser | null {
  if (currentUser) return currentUser;
  const saved = lsGet<AuthUser>('piza_auth_user');
  if (saved) {
    currentUser = saved;
    return currentUser;
  }
  return null;
}

export function setAuthCurrentUser(user: AuthUser | null): void {
  currentUser = user;
  if (user) {
    lsSet('piza_auth_user', user);
  } else {
    lsDel('piza_auth_user');
    lsDel('piza_auth_token');
  }
  authListeners.forEach((fn) => {
    try {
      fn(user);
    } catch (e) {
      console.error('[AUTH] Listener error:', e);
    }
  });
}

export function onAuthStateChanged(cb: (user: AuthUser | null) => void): () => void {
  authListeners.add(cb);
  cb(getAuthCurrentUser());
  return () => {
    authListeners.delete(cb);
  };
}

export async function loginWithEmail(email: string, name?: string, avatar?: string): Promise<UserProfile> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, name, avatar }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Connexion échouée');
  }
  const data = await res.json();
  const authUser: AuthUser = {
    uid: data.user.uid,
    email: data.user.email,
    displayName: data.user.name,
    photoURL: data.user.photoURL,
  };
  lsSet('piza_auth_token', data.token);
  setAuthCurrentUser(authUser);
  return data.user;
}

export async function logoutUser(): Promise<void> {
  setAuthCurrentUser(null);
}

// ── LOCAL STORAGE HELPERS ──
export const lsGet = <T = any>(k: string): T | null => {
  try {
    const val = localStorage.getItem(k);
    return val ? JSON.parse(val) : null;
  } catch {
    return null;
  }
};

export const lsSet = (k: string, v: any): void => {
  try {
    localStorage.setItem(k, JSON.stringify(v));
  } catch {}
};

export const lsDel = (k: string): void => {
  try {
    localStorage.removeItem(k);
  } catch {}
};

// ── ATOMIC JSON DATABASE REST API CLIENT ──

export async function dbGet<T = any>(path: string): Promise<T | null> {
  try {
    const clean = path.replace(/^\//, '');

    // /rooms or /rooms/:code
    if (clean === 'rooms') {
      const res = await fetch(`${API_BASE}/rooms`);
      return res.ok ? await res.json() : null;
    }
    if (clean.startsWith('rooms/')) {
      const parts = clean.split('/');
      const code = parts[1];
      const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(code)}`);
      if (!res.ok) return null;
      const room = await res.json();
      if (parts.length === 2) return room as T;
      // Nested property query like rooms/CODE/players
      let val = room;
      for (let i = 2; i < parts.length; i++) {
        val = val?.[parts[i]];
      }
      return (val !== undefined ? val : null) as T;
    }

    // /users or /users/:uid
    if (clean === 'users') {
      const res = await fetch(`${API_BASE}/users`);
      if (!res.ok) return null;
      const arr = await res.json();
      const map: Record<string, UserProfile> = {};
      if (Array.isArray(arr)) {
        arr.forEach((u) => {
          if (u.uid) map[u.uid] = u;
        });
      }
      return map as unknown as T;
    }
    if (clean.startsWith('users/')) {
      const parts = clean.split('/');
      const uid = parts[1];
      const res = await fetch(`${API_BASE}/users/${encodeURIComponent(uid)}`);
      return res.ok ? await res.json() : null;
    }

    // /app/saved
    if (clean.startsWith('app/saved')) {
      const res = await fetch(`${API_BASE}/saved`);
      if (!res.ok) return null;
      const arr = await res.json();
      const map: Record<string, SavedGame> = {};
      if (Array.isArray(arr)) {
        arr.forEach((g) => {
          if (g.id) map[g.id] = g;
        });
      }
      return map as unknown as T;
    }

    // /app/config
    if (clean === 'app/config') {
      const res = await fetch(`${API_BASE}/config`);
      return res.ok ? await res.json() : null;
    }

    // General fallback
    const res = await fetch(`${API_BASE}/${clean}`);
    return res.ok ? await res.json() : null;
  } catch (err) {
    console.error(`[API] dbGet error on ${path}:`, err);
    return null;
  }
}

export async function dbSet(path: string, value: any): Promise<void> {
  try {
    const clean = path.replace(/^\//, '');

    // /rooms/:code
    if (clean.startsWith('rooms/')) {
      const parts = clean.split('/');
      const code = parts[1];

      // Exact room root update: rooms/CODE
      if (parts.length === 2) {
        // Try update, if 404 create
        const res = await fetch(`${API_BASE}/rooms/${encodeURIComponent(code)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        });
        if (res.status === 404) {
          await fetch(`${API_BASE}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, room: value }),
          });
        }
        return;
      }

      // SFX trigger: rooms/CODE/sfxTrigger
      if (parts[2] === 'sfxTrigger') {
        await fetch(`${API_BASE}/rooms/${encodeURIComponent(code)}/sfx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        });
        return;
      }

      // Answers update: rooms/CODE/answers/:round/:playerId
      if (parts[2] === 'answers' && parts.length >= 5) {
        const round = Number(parts[3]);
        const playerId = parts[4];
        await fetch(`${API_BASE}/rooms/${encodeURIComponent(code)}/answer`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ playerId, round, answer: value }),
        });
        return;
      }

      // Nested property update on room
      const current = await dbGet<Room>(`rooms/${code}`);
      if (current) {
        let target: any = current;
        for (let i = 2; i < parts.length - 1; i++) {
          if (!target[parts[i]]) target[parts[i]] = {};
          target = target[parts[i]];
        }
        target[parts[parts.length - 1]] = value;
        await fetch(`${API_BASE}/rooms/${encodeURIComponent(code)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(current),
        });
      }
      return;
    }

    // /users/:uid
    if (clean.startsWith('users/')) {
      const parts = clean.split('/');
      const uid = parts[1];
      if (parts.length === 2) {
        await fetch(`${API_BASE}/users/${encodeURIComponent(uid)}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(value),
        });
      } else {
        const user = await dbGet<UserProfile>(`users/${uid}`);
        if (user) {
          let target: any = user;
          for (let i = 2; i < parts.length - 1; i++) {
            if (!target[parts[i]]) target[parts[i]] = {};
            target = target[parts[i]];
          }
          target[parts[parts.length - 1]] = value;
          await fetch(`${API_BASE}/users/${encodeURIComponent(uid)}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(user),
          });
        }
      }
      return;
    }

    // /app/saved/:id
    if (clean.startsWith('app/saved/')) {
      await fetch(`${API_BASE}/saved`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      });
      return;
    }

    // /app/config
    if (clean === 'app/config') {
      await fetch(`${API_BASE}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value),
      });
      return;
    }
  } catch (err) {
    console.error(`[API] dbSet error on ${path}:`, err);
  }
}

export async function dbRemove(path: string): Promise<void> {
  try {
    const clean = path.replace(/^\//, '');
    if (clean.startsWith('rooms/')) {
      const code = clean.split('/')[1];
      await fetch(`${API_BASE}/rooms/${encodeURIComponent(code)}`, { method: 'DELETE' });
      return;
    }
    if (clean.startsWith('users/')) {
      const uid = clean.split('/')[1];
      await fetch(`${API_BASE}/users/${encodeURIComponent(uid)}`, { method: 'DELETE' });
      return;
    }
    if (clean.startsWith('app/saved/')) {
      const id = clean.split('/')[2];
      await fetch(`${API_BASE}/saved/${encodeURIComponent(id)}`, { method: 'DELETE' });
      return;
    }
  } catch (err) {
    console.error(`[API] dbRemove error on ${path}:`, err);
  }
}

// ── REALTIME SERVER-SENT EVENTS (SSE) SUBSCRIBER ──
export interface RealtimeSubscription {
  path: string;
  close: () => void;
}

export function dbOn<T = any>(path: string, cb: (data: T | null) => void): RealtimeSubscription {
  const clean = path.replace(/^\//, '');

  if (clean.startsWith('rooms/')) {
    const code = clean.split('/')[1];
    let eventSource: EventSource | null = null;
    let isClosed = false;

    // Fetch initial state first
    dbGet<T>(path).then((data) => {
      if (!isClosed) cb(data);
    });

    try {
      eventSource = new EventSource(`${API_BASE}/rooms/${encodeURIComponent(code)}/stream`);

      eventSource.addEventListener('room:update', (event: MessageEvent) => {
        if (isClosed) return;
        try {
          const room = JSON.parse(event.data);
          cb(room as T);
        } catch (e) {
          console.warn('[SSE] Failed to parse room:update:', e);
        }
      });

      eventSource.addEventListener('room:deleted', () => {
        if (isClosed) return;
        cb(null);
      });

      eventSource.onerror = (err) => {
        console.warn(`[SSE] Connection error for room ${code}:`, err);
      };
    } catch (err) {
      console.warn(`[SSE] Error connecting to room stream:`, err);
    }

    return {
      path,
      close: () => {
        isClosed = true;
        if (eventSource) {
          eventSource.close();
          eventSource = null;
        }
      },
    };
  }

  // Fallback for non-room paths: initial poll
  dbGet<T>(path).then((data) => cb(data));
  return {
    path,
    close: () => {},
  };
}

export function dbOff(sub: RealtimeSubscription | null): void {
  if (sub && typeof sub.close === 'function') {
    sub.close();
  }
}

// ── USER PHOTO UPLOAD TO LOCAL /data/uploads/ ──
export async function uploadUserPhoto(uid: string, file: File): Promise<string> {
  const formData = new FormData();
  formData.append('photo', file);

  const res = await fetch(`${API_BASE}/users/${encodeURIComponent(uid)}/upload-photo`, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    throw new Error('Échec du téléversement de la photo');
  }

  const data = await res.json();
  return data.photoUrl;
}
