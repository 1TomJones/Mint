import { appEnv } from './env';

const STORAGE_KEY = 'mint.supabase.session';
const supabaseUrl = appEnv.supabaseUrl;
const supabaseAnonKey = appEnv.supabaseAnonKey;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing Supabase env vars: VITE_SUPABASE_URL and/or VITE_SUPABASE_ANON_KEY');
}

interface SupabaseError {
  message?: string;
  detail?: string;
  hint?: string;
  error_description?: string;
  msg?: string;
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  accessToken?: string;
  body?: unknown;
}

export interface AuthUser {
  id: string;
  email?: string;
}

export interface Session {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  user: AuthUser;
}

type AuthListener = (event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED', session: Session | null) => void;
const listeners = new Set<AuthListener>();

function emitAuth(event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED', session: Session | null) {
  listeners.forEach((listener) => listener(event, session));
}

function readStoredSession(): Session | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as Session;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function persistSession(session: Session | null) {
  if (!session) {
    localStorage.removeItem(STORAGE_KEY);
    return;
  }

  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
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
    throw new Error(errorData.detail ?? errorData.message ?? errorData.error_description ?? errorData.hint ?? errorData.msg ?? 'Supabase request failed.');
  }

  if (response.status === 204) {
    return null as T;
  }

  return (await response.json()) as T;
}

interface SignInResponse {
  access_token: string;
  refresh_token?: string;
  expires_at?: number;
  expires_in?: number;
  user: AuthUser;
}

interface QueryResult<T> {
  data: T | null;
  error: Error | null;
}

class SupabaseQueryBuilder<T> implements PromiseLike<QueryResult<T[]>> {
  private readonly params = new URLSearchParams();

  constructor(private readonly table: string) {}

  select(columns: string) {
    this.params.set('select', columns);
    return this;
  }

  eq(column: string, value: string) {
    this.params.set(column, `eq.${value}`);
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    const direction = options?.ascending === false ? 'desc' : 'asc';
    this.params.set('order', `${column}.${direction}`);
    return this;
  }

  limit(count: number) {
    this.params.set('limit', String(count));
    return this;
  }

  async execute(): Promise<QueryResult<T[]>> {
    try {
      const accessToken = await getFreshAccessToken();
      const path = `/rest/v1/${this.table}?${this.params.toString()}`;
      const data = await supabaseRequest<T[]>(path, { accessToken });
      return { data, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }

  then<TResult1 = QueryResult<T[]>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<T[]>) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled ?? undefined, onrejected ?? undefined);
  }
}

interface SignUpResponse {
  user: AuthUser;
  session: Session | null;
}

export const supabase = {
  auth: {
    async getSession() {
      return { data: { session: readStoredSession() }, error: null as Error | null };
    },
    onAuthStateChange(callback: AuthListener) {
      listeners.add(callback);
      return {
        data: {
          subscription: {
            unsubscribe() {
              listeners.delete(callback);
            },
          },
        },
      };
    },
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      try {
        const session = await supabaseRequest<SignInResponse>('/auth/v1/token?grant_type=password', {
          method: 'POST',
          body: { email, password },
        });
        persistSession(session);
        emitAuth('SIGNED_IN', session);
        return { data: { session }, error: null as Error | null };
      } catch (error) {
        return { data: { session: null }, error: error as Error };
      }
    },
    async signUp({ email, password }: { email: string; password: string }) {
      try {
        const result = await supabaseRequest<SignUpResponse>('/auth/v1/signup', {
          method: 'POST',
          body: { email, password },
        });
        if (result.session) {
          persistSession(result.session);
          emitAuth('SIGNED_IN', result.session);
        }
        return { data: result, error: null as Error | null };
      } catch (error) {
        return { data: { user: null, session: null }, error: error as Error };
      }
    },
    async signOut() {
      persistSession(null);
      emitAuth('SIGNED_OUT', null);
      return { error: null as Error | null };
    },
    async refreshSession() {
      const currentSession = readStoredSession();
      if (!currentSession?.refresh_token) {
        return { data: { session: currentSession ?? null }, error: new Error('No refresh token available.') };
      }

      try {
        const refreshedSession = await supabaseRequest<SignInResponse>('/auth/v1/token?grant_type=refresh_token', {
          method: 'POST',
          body: { refresh_token: currentSession.refresh_token },
        });
        persistSession(refreshedSession);
        emitAuth('TOKEN_REFRESHED', refreshedSession);
        return { data: { session: refreshedSession }, error: null as Error | null };
      } catch (error) {
        return { data: { session: currentSession }, error: error as Error };
      }
    },
  },
  from<T = Record<string, unknown>>(table: string) {
    return new SupabaseQueryBuilder<T>(table);
  },
};

export async function getFreshAccessToken() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    throw error;
  }

  const session = data.session;
  if (!session) {
    throw new Error('No active Supabase session.');
  }

  const now = Math.floor(Date.now() / 1000);
  let accessToken = session.access_token;
  if (session.expires_at && session.expires_at < now + 60) {
    const refreshed = await supabase.auth.refreshSession();
    if (refreshed.error) {
      throw refreshed.error;
    }

    accessToken = refreshed.data.session?.access_token ?? accessToken;
  }

  return accessToken;
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
