const backendUrl = ((import.meta.env.VITE_API_URL as string | undefined) ?? (import.meta.env.VITE_BACKEND_URL as string | undefined))?.replace(/\/$/, '');
const SESSION_STORAGE_KEY = 'mint.supabase.session';

type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface ApiFetchOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: ApiMethod;
  body?: unknown;
  requireAuth?: boolean;
  includeUserIdHeader?: boolean;
}

interface StoredSession {
  user?: {
    id?: string;
  };
}

function readSessionUserId() {
  const raw = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as StoredSession;
    return parsed.user?.id?.trim() || null;
  } catch {
    localStorage.removeItem(SESSION_STORAGE_KEY);
    return null;
  }
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  if (!backendUrl) {
    throw new Error('Missing VITE_API_URL environment variable.');
  }

  const userId = readSessionUserId();
  const requiresAuth = options.requireAuth ?? true;
  const includeUserIdHeader = options.includeUserIdHeader ?? true;
  const hasAuthorizationHeader = new Headers(options.headers).has('Authorization');

  if (requiresAuth && !userId && !hasAuthorizationHeader) {
    throw new Error('Please sign in');
  }

  const headers = new Headers(options.headers);
  headers.set('Content-Type', 'application/json');
  if (includeUserIdHeader && userId) {
    headers.set('x-user-id', userId);
  }

  const { method, body, requireAuth: _ignoredRequireAuth, includeUserIdHeader: _ignoredIncludeUserIdHeader, ...requestInit } = options;

  return fetch(`${backendUrl}${path}`, {
    ...requestInit,
    method: method ?? 'GET',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
