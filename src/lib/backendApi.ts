import { apiFetch } from './api';

interface BackendOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  accessToken?: string;
  requireAuth?: boolean;
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
  const response = await apiFetch(path, {
    method: options.method ?? 'GET',
    body: options.body,
    requireAuth: options.requireAuth,
    includeUserIdHeader: !!options.userId,
    headers: {
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
      ...(options.userId ? { 'x-user-id': options.userId } : {}),
    },
  });

  const rawBody = await response.text();
  const hasBody = !!rawBody.trim() && response.headers.get('content-length') !== '0';

  if (!response.ok) {
    if (!hasBody) {
      throw new Error(`Backend request failed (${response.status} ${response.statusText})`);
    }

    throw new Error(toReadableError(rawBody));
  }

  if (!hasBody) {
    throw new Error('Backend response was empty.');
  }

  try {
    return JSON.parse(rawBody) as T;
  } catch {
    throw new Error(`Backend returned a non-JSON response (${response.status} ${response.statusText}).`);
  }
}

export interface ScenarioMetadata {
  id: string;
  title: string;
  description: string;
  default_duration_minutes: number | null;
}

interface ScenarioMetadataResponse {
  scenarios?: Array<{
    id?: string;
    scenario_id?: string;
    name?: string;
    title?: string;
    description?: string;
    default_duration_minutes?: number;
    duration_minutes?: number;
    duration?: number;
  }>;
}

const simBaseUrl = (import.meta.env.VITE_PORTFOLIO_SIM_URL as string | undefined)?.replace(/\/$/, '') ?? '';

function parseScenarioMetadata(payload: ScenarioMetadataResponse) {
  return (payload.scenarios ?? [])
    .map((scenario) => {
      const id = scenario.id?.trim() || scenario.scenario_id?.trim() || '';
      if (!id) {
        return null;
      }

      return {
        id,
        title: scenario.title?.trim() || scenario.name?.trim() || id,
        description: scenario.description?.trim() || 'No description provided.',
        default_duration_minutes: Number(
          scenario.default_duration_minutes ?? scenario.duration_minutes ?? scenario.duration ?? 0,
        ) || null,
      } satisfies ScenarioMetadata;
    })
    .filter((scenario): scenario is ScenarioMetadata => !!scenario);
}

export async function fetchPortfolioScenarioMetadata() {
  if (!simBaseUrl) {
    throw new Error('Missing VITE_PORTFOLIO_SIM_URL');
  }

  const candidates = [`${simBaseUrl}/metadata`, `${simBaseUrl}/metadata.json`];
  let lastError: unknown = null;

  for (const url of candidates) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`${response.status} ${response.statusText}`);
      }

      const payload = (await response.json()) as ScenarioMetadataResponse;
      return parseScenarioMetadata(payload);
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error('Failed to load metadata');
}

export interface CreateRunResponse {
  runId: string;
  launchUrl: string;
}

interface CreateRunApiResponse {
  runId?: string;
  run_id?: string;
  simUrl?: string;
  sim_url?: string;
  launchUrl?: string;
  launch_url?: string;
}

export async function createRunByCode(eventCode: string, accessToken?: string) {
  const response = await backendRequest<CreateRunApiResponse>('/api/runs/create', {
    method: 'POST',
    body: { eventCode },
    accessToken,
  });

  const runId = response.runId ?? response.run_id;
  const launchUrl = response.launchUrl ?? response.launch_url ?? response.simUrl ?? response.sim_url;

  if (!runId || !launchUrl) {
    throw new Error('Backend response missing run_id or launch_url.');
  }

  return {
    runId,
    launchUrl,
  } satisfies CreateRunResponse;
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

export function fetchRunDetailById(runId: string, accessToken?: string) {
  return backendRequest<{ run: BackendRunDetail }>(`/api/runs/${encodeURIComponent(runId)}`, {
    accessToken,
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
  started_at?: string | null;
  ended_at?: string | null;
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
  scenario_id: string;
  duration_minutes: number;
  sim_url: string;
}

export function createAdminEvent(payload: CreateAdminEventInput, accessToken: string, userId?: string) {
  return backendRequest<{ event: AdminEvent }>('/api/events/create', {
    method: 'POST',
    body: payload,
    accessToken,
    userId,
  });
}

export interface PublicEvent {
  id: string;
  code: string;
  name: string;
  sim_url: string;
  sim_type: string | null;
  scenario_id: string | null;
  duration_minutes: number | null;
  state: string | null;
  created_at: string;
  started_at?: string | null;
  ended_at?: string | null;
}

export function fetchPublicEvents() {
  return backendRequest<{ events: PublicEvent[] }>('/api/events/public', {
    requireAuth: false,
  });
}

export function fetchSimAdminLink(eventCode: string, accessToken: string) {
  return backendRequest<{ adminUrl: string }>('/api/admin/sim-admin-link', {
    method: 'POST',
    body: { eventCode },
    accessToken,
  });
}

export function updateAdminEventState(eventCode: string, state: 'draft' | 'active' | 'live' | 'paused' | 'ended', accessToken: string) {
  return backendRequest<{ event: AdminEvent }>(`/api/admin/events/${encodeURIComponent(eventCode)}/state`, {
    method: 'POST',
    body: { state },
    accessToken,
  });
}
