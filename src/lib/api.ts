import { appEnv } from './env';

type ApiMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';

interface ApiFetchOptions extends Omit<RequestInit, 'body' | 'method'> {
  method?: ApiMethod;
  body?: unknown;
  requireAuth?: boolean;
}

export async function apiFetch(path: string, options: ApiFetchOptions = {}) {
  if (!appEnv.backendUrl) {
    throw new Error('Missing VITE_BACKEND_URL environment variable.');
  }

  const headers = new Headers(options.headers);
  const hasAuthorizationHeader = headers.has('Authorization');
  const hasUserIdHeader = headers.has('x-user-id');
  const requiresAuth = options.requireAuth ?? false;

  if (requiresAuth && !hasAuthorizationHeader && !hasUserIdHeader) {
    throw new Error('Please sign in first');
  }

  if (options.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const { method, body, requireAuth: _ignoredRequireAuth, ...requestInit } = options;

  return fetch(`${appEnv.backendUrl}${path}`, {
    ...requestInit,
    method: method ?? 'GET',
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}
