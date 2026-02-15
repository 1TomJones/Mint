const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

interface SupabaseError {
  message?: string;
  error_description?: string;
  msg?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  accessToken?: string;
  body?: unknown;
}

async function supabaseRequest<T>(path: string, options: RequestOptions = {}) {
  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase environment variables are not configured.');
  }

  const response = await fetch(`${supabaseUrl}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      apikey: supabaseAnonKey,
      'Content-Type': 'application/json',
      ...(options.accessToken ? { Authorization: `Bearer ${options.accessToken}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    const errorData: SupabaseError = await response.json().catch(() => ({}));
    throw new Error(errorData.error_description ?? errorData.message ?? errorData.msg ?? 'Supabase request failed.');
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

export interface SupabaseSession {
  access_token: string;
  refresh_token: string;
  user: {
    id: string;
    email?: string;
  };
}

export function signUpWithEmail(email: string, password: string) {
  return supabaseRequest<SupabaseSession | { user: SupabaseSession['user']; session: null }>('/auth/v1/signup', {
    method: 'POST',
    body: { email, password },
  });
}

export function signInWithEmail(email: string, password: string) {
  return supabaseRequest<SupabaseSession>('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: { email, password },
  });
}

export function getCurrentUser(accessToken: string) {
  return supabaseRequest<SupabaseSession['user']>('/auth/v1/user', {
    accessToken,
  });
}

export interface EventRow {
  id: string;
  code: string;
  name: string;
  sim_url: string;
  starts_at: string | null;
  ends_at: string | null;
}

export interface RunRow {
  id: string;
  created_at: string;
  finished_at: string | null;
  event_id: string;
  events: Pick<EventRow, 'name' | 'code'> | null;
  run_results: {
    score: number | null;
    pnl: number | null;
    sharpe: number | null;
    max_drawdown: number | null;
  }[];
}

export function fetchEvents(accessToken: string) {
  return supabaseRequest<EventRow[]>('/rest/v1/events?select=id,code,name,sim_url,starts_at,ends_at&order=starts_at.desc.nullslast', {
    accessToken,
  });
}

export function findEventByCode(code: string, accessToken: string) {
  return supabaseRequest<EventRow[]>(`/rest/v1/events?select=id,code,name,sim_url&code=eq.${encodeURIComponent(code)}&limit=1`, {
    accessToken,
  });
}

export function createRun(eventId: string, userId: string, accessToken: string) {
  return supabaseRequest<Array<{ id: string; created_at: string }>>('/rest/v1/runs?select=id,created_at', {
    method: 'POST',
    accessToken,
    body: [{ event_id: eventId, user_id: userId }],
  });
}

export function fetchUserRuns(userId: string, accessToken: string) {
  return supabaseRequest<RunRow[]>(`/rest/v1/runs?select=id,created_at,finished_at,event_id,events(name,code),run_results(score,pnl,sharpe,max_drawdown)&user_id=eq.${encodeURIComponent(userId)}&order=created_at.desc`, {
    accessToken,
  });
}

export interface RunDetail {
  id: string;
  created_at: string;
  finished_at: string | null;
  events: EventRow | null;
  run_results: {
    score: number | null;
    pnl: number | null;
    sharpe: number | null;
    max_drawdown: number | null;
    win_rate: number | null;
    extra: Record<string, unknown> | null;
  }[];
}

export function fetchRunDetail(runId: string, accessToken: string) {
  return supabaseRequest<RunDetail[]>(`/rest/v1/runs?select=id,created_at,finished_at,events(id,code,name,sim_url,starts_at,ends_at),run_results(score,pnl,sharpe,max_drawdown,win_rate,extra)&id=eq.${encodeURIComponent(runId)}&limit=1`, {
    accessToken,
  });
}

export interface LeaderboardRow {
  id: string;
  created_at: string;
  user_id?: string;
  run_results: {
    score: number | null;
    pnl: number | null;
    sharpe: number | null;
    max_drawdown: number | null;
  }[];
}

export function fetchEventByCode(code: string, accessToken: string) {
  return supabaseRequest<EventRow[]>(`/rest/v1/events?select=id,code,name,sim_url,starts_at,ends_at&code=eq.${encodeURIComponent(code)}&limit=1`, {
    accessToken,
  });
}

export function fetchLeaderboard(eventId: string, accessToken: string) {
  return supabaseRequest<LeaderboardRow[]>(`/rest/v1/runs?select=id,created_at,user_id,run_results(score,pnl,sharpe,max_drawdown)&event_id=eq.${encodeURIComponent(eventId)}&finished_at=not.is.null`, {
    accessToken,
  });
}
