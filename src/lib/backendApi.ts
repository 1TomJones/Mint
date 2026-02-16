const backendUrl = import.meta.env.VITE_BACKEND_URL as string | undefined;

interface BackendOptions {
  method?: 'GET' | 'POST';
  body?: unknown;
  accessToken?: string;
  userId?: string;
}

interface BackendErrorPayload {
  error?: string;
  message?: string;
  [key: string]: unknown;
}

function toReadableError(rawBody: string) {
  try {
    const payload = JSON.parse(rawBody) as BackendErrorPayload;
    return payload.error ?? payload.message ?? JSON.stringify(payload);
  } catch {
    return rawBody;
  }
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

    throw new Error(toReadableError(rawBody));
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
  userId: string | null;
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

export interface BackendRunDetail {
  id: string;
  created_at: string;
  finished_at: string | null;
  user_id: string | null;
  event_id: string;
  events: {
    id: string;
    code: string;
    name: string;
    sim_url: string;
    starts_at: string | null;
    ends_at: string | null;
  } | null;
  run_results: {
    score: number | null;
    pnl: number | null;
    sharpe: number | null;
    max_drawdown: number | null;
    win_rate: number | null;
    extra: Record<string, unknown> | null;
  }[];
}

export function fetchRunDetailById(runId: string, accessToken?: string, userId?: string) {
  return backendRequest<{ run: BackendRunDetail }>(`/api/runs/${encodeURIComponent(runId)}`, {
    accessToken,
    userId,
  });
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

export interface AdminEvent {
  id: string;
  code: string;
  name: string;
  sim_url: string;
  sim_type: string | null;
  scenario_id: string | null;
  duration_minutes: number | null;
  state: string | null;
  created_at: string;
}

export function fetchAdminStatus(accessToken: string) {
  return backendRequest<{ isAdmin: boolean }>('/api/admin/me', { accessToken });
}

export function fetchAdminEvents(accessToken: string) {
  return backendRequest<{ events: AdminEvent[] }>('/api/admin/events', { accessToken });
}

export interface CreateAdminEventInput {
  code: string;
  name: string;
  simType: string;
  scenarioId: string;
  durationMinutes: number;
  state: 'draft' | 'active';
  simUrl: string;
}

export function createAdminEvent(payload: CreateAdminEventInput, accessToken: string) {
  return backendRequest<{ event: AdminEvent }>('/api/admin/events', {
    method: 'POST',
    body: payload,
    accessToken,
  });
}

export function fetchSimAdminLink(eventCode: string, accessToken: string) {
  return backendRequest<{ adminUrl: string }>(`/api/admin/events/${encodeURIComponent(eventCode)}/sim-admin-link`, {
    accessToken,
  });
}
