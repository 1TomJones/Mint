const backendUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;

interface BackendOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  accessToken?: string;
  userId?: string;
}

interface BackendError {
  error?: string;
  message?: string;
}

async function backendRequest<T>(path: string, options: BackendOptions = {}) {
  if (!backendUrl) {
    throw new Error('Missing VITE_BACKEND_URL environment variable.');
  }

  const response = await fetch(`${backendUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      ...(options.userId ? { 'x-user-id': options.userId } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const rawBody = await response.text();
  const hasBody = !!rawBody.trim() && response.headers.get('content-length') !== '0';

  if (!response.ok) {
    if (!hasBody) {
      throw new Error('Backend request failed');
    }

    try {
      const payload = JSON.parse(rawBody) as BackendError;
      throw new Error(payload.error ?? payload.message ?? 'Backend request failed');
    } catch {
      throw new Error(rawBody);
    }
  }

  if (!hasBody) {
    throw new Error('Backend response was empty.');
  }

  return JSON.parse(rawBody) as T;
}

export interface CreateRunResponse {
  runId: string;
  simUrl: string;
}

export function createRunByCode(eventCode: string, userId: string, accessToken?: string) {
  return backendRequest<CreateRunResponse>('/api/runs/create', {
    method: 'POST',
    body: { eventCode, userId },
    userId,
    accessToken,
  });
}

export interface LeaderboardEntry {
  rank: number;
  runId: string;
  createdAt: string;
  trader: string;
  score: number | null;
  pnl: number | null;
  sharpe: number | null;
  max_drawdown: number | null;
  win_rate: number | null;
}

export interface LeaderboardResponse {
  event: {
    code: string;
    name: string;
  };
  rows: LeaderboardEntry[];
}

export function fetchEventLeaderboard(code: string, limit = 20) {
  return backendRequest<LeaderboardResponse>(`/api/events/${encodeURIComponent(code)}/leaderboard?limit=${limit}`);
}

export interface SubmitRunPayload {
  runId: string;
  score: number;
  pnl?: number;
  sharpe?: number;
  max_drawdown?: number;
  win_rate?: number;
  extra?: Record<string, unknown>;
}

export function submitRunResults(payload: SubmitRunPayload) {
  return backendRequest<{ ok: boolean }>('/api/runs/submit', {
    method: 'POST',
    body: payload,
  });
}
