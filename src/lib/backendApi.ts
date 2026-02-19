import { apiFetch } from './api';
import { appEnv } from './env';

interface BackendOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  accessToken?: string;
  requireAuth?: boolean;
  userId?: string;
}

interface BackendErrorPayload {
  error?: string;
  detail?: string;
  message?: string;
  [key: string]: unknown;
}

interface ScenarioMetadataInput {
  id?: string;
  scenario_id?: string;
  name?: string;
  title?: string;
  description?: string;
  default_duration_minutes?: number;
  duration_minutes?: number;
  durationMinutes?: number;
  duration?: number;
  playerPath?: string;
  player_path?: string;
  adminPath?: string;
  admin_path?: string;
}

interface ScenarioMetadataResponse {
  scenarios?: ScenarioMetadataInput[];
}

function toReadableError(rawBody: string) {
  try {
    const payload = JSON.parse(rawBody) as BackendErrorPayload;
    return payload.detail ?? payload.error ?? payload.message ?? JSON.stringify(payload);
  } catch {
    return rawBody;
  }
}

function mapBackendError(status: number, rawMessage: string) {
  if (status === 404) {
    return `Backend route not deployed. Check backend base path (/api). (HTTP ${status})`;
  }

  return `${rawMessage || 'Backend request failed.'} (HTTP ${status})`;
}

async function backendRequest<T>(path: string, options: BackendOptions = {}) {
  const headers: Record<string, string> = {
    ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    ...(options.userId ? { 'x-user-id': options.userId } : {}),
  };

  const response = await apiFetch(path, {
    method: options.method ?? 'GET',
    body: options.body,
    requireAuth: options.requireAuth,
    headers,
  });

  const rawBody = await response.text();
  const hasBody = !!rawBody.trim() && response.headers.get('content-length') !== '0';

  if (!response.ok) {
    const parsedMessage = hasBody ? toReadableError(rawBody) : response.statusText;
    throw new Error(mapBackendError(response.status, parsedMessage));
  }

  if (!hasBody) {
    throw new Error(`Backend response was empty. (HTTP ${response.status})`);
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
  player_path: string;
  admin_path: string;
}

function parseScenarioMetadata(payload: ScenarioMetadataResponse | ScenarioMetadataInput[]) {
  const list = Array.isArray(payload) ? payload : payload.scenarios ?? [];

  return list
    .map((scenario) => {
      const id = scenario.id?.trim() || scenario.scenario_id?.trim() || '';
      if (!id) {
        return null;
      }

      const playerPath = scenario.playerPath?.trim() || scenario.player_path?.trim() || '/';
      const adminPath = scenario.adminPath?.trim() || scenario.admin_path?.trim() || '/admin.html';

      return {
        id,
        title: scenario.title?.trim() || scenario.name?.trim() || id,
        description: scenario.description?.trim() || 'No description provided.',
        default_duration_minutes: Number(
          scenario.default_duration_minutes ?? scenario.duration_minutes ?? scenario.durationMinutes ?? scenario.duration ?? 0,
        ) || null,
        player_path: playerPath.startsWith('/') ? playerPath : `/${playerPath}`,
        admin_path: adminPath.startsWith('/') ? adminPath : `/${adminPath}`,
      } satisfies ScenarioMetadata;
    })
    .filter((scenario): scenario is ScenarioMetadata => !!scenario);
}

export async function fetchPortfolioScenarioMetadata() {
  if (!appEnv.portfolioSimMetadataUrl) {
    throw new Error('VITE_PORTFOLIO_SIM_METADATA_URL is not configured.');
  }

  const response = await fetch(appEnv.portfolioSimMetadataUrl);
  if (!response.ok) {
    throw new Error(mapBackendError(response.status, `${response.status} ${response.statusText}`));
  }

  const payload = (await response.json()) as ScenarioMetadataResponse | ScenarioMetadataInput[];
  return parseScenarioMetadata(payload);
}

export interface CreateRunResponse {
  runId: string | null;
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

export async function createRunByCode(eventCode: string, userId: string, accessToken?: string) {
  const response = await backendRequest<CreateRunApiResponse>('/api/runs/create', {
    method: 'POST',
    body: { event_code: eventCode },
    accessToken,
    userId,
    requireAuth: true,
  });

  const runId = response.runId ?? response.run_id;
  const launchUrl = response.launchUrl ?? response.launch_url ?? response.simUrl ?? response.sim_url;

  if (!launchUrl) {
    throw new Error('Backend response missing sim_url.');
  }

  return {
    runId: runId ?? null,
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

export async function fetchAdminStatus(accessToken: string) {
  try {
    return await backendRequest<{ isAdmin: boolean }>('/api/admin/me', { accessToken });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Backend route not deployed')) {
      return backendRequest<{ isAdmin: boolean }>('/admin/me', { accessToken });
    }

    throw error;
  }
}

export function fetchAdminEvents(accessToken: string) {
  return backendRequest<{ events: AdminEvent[] }>('/api/admin/events', { accessToken });
}

export interface CreateAdminEventInput {
  code: string;
  name: string;
  description?: string;
  scenario_id: string;
  duration_minutes: number;
  sim_url: string;
}

export function createAdminEvent(payload: CreateAdminEventInput, accessToken: string, userId: string) {
  return backendRequest<{ event: AdminEvent }>('/api/admin/events', {
    method: 'POST',
    body: {
      ...payload,
      state: 'draft',
    },
    accessToken,
    userId,
    requireAuth: true,
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

export function updateAdminEventState(eventCode: string, state: 'draft' | 'active' | 'live' | 'paused' | 'ended', accessToken: string) {
  return backendRequest<{ event: AdminEvent }>(`/api/admin/events/${encodeURIComponent(eventCode)}/state`, {
    method: 'POST',
    body: { state },
    accessToken,
  });
}
