import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = Number(process.env.PORT ?? 4000);
const simAdminToken = process.env.SIM_ADMIN_TOKEN ?? '';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

app.use(cors());
app.use(express.json());

function getUserId(req) {
  const userIdHeader = req.header('x-user-id');
  return req.body?.userId ?? userIdHeader ?? null;
}

function formatTrader(userId) {
  if (!userId) {
    return 'anonymous';
  }

  return `user-${userId.slice(0, 8)}`;
}

async function getAuthenticatedUser(req) {
  const authorization = req.header('authorization') ?? '';
  const token = authorization.startsWith('Bearer ') ? authorization.slice(7) : '';

  if (!token) {
    return null;
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error) {
    throw error;
  }

  return data.user ?? null;
}

async function getAdminStatus(req) {
  const user = await getAuthenticatedUser(req);
  if (!user) {
    return { allowed: false, detail: 'not authenticated' };
  }

  const email = user.email?.trim().toLowerCase() ?? '';
  if (!email) {
    return { allowed: false, detail: 'email missing from auth user' };
  }

  const { data, error } = await supabase
    .from('admin_allowlist')
    .select('email')
    .ilike('email', email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return { allowed: false, detail: 'email not in admin_allowlist' };
  }

  return { allowed: true, detail: null };
}

async function requireAdmin(req, res) {
  try {
    const { allowed, detail } = await getAdminStatus(req);
    if (!allowed) {
      res.status(403).json({ error: 'forbidden', detail });
      return false;
    }

    return true;
  } catch (error) {
    res.status(401).json({ error: error instanceof Error ? error.message : 'Invalid authorization' });
    return false;
  }
}

function isMissingColumnError(error) {
  const message = error?.message ?? '';
  return /column .* does not exist/i.test(message);
}


function withDefaultEventColumns(events, defaults = {}) {
  return (events ?? []).map((event) => ({
    ...event,
    sim_type: defaults.sim_type ?? 'portfolio_sim',
    scenario_id: defaults.scenario_id ?? null,
    duration_minutes: defaults.duration_minutes ?? null,
    state: defaults.state ?? 'draft',
  }));
}


app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/admin/me', async (req, res) => {
  try {
    const { allowed, detail } = await getAdminStatus(req);
    return res.json({ isAdmin: allowed, detail: allowed ? null : detail });
  } catch (error) {
    return res.status(401).json({ error: error instanceof Error ? error.message : 'Invalid authorization' });
  }
});

app.get('/api/admin/events', async (req, res) => {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  try {
    let query = supabase
      .from('events')
      .select('id,code,name,sim_url,sim_type,scenario_id,duration_minutes,state,created_at,starts_at,ends_at,started_at,ended_at')
      .order('created_at', { ascending: false });

    let { data: events, error } = await query;

    if (error && isMissingColumnError(error)) {
      const fallback = await supabase
        .from('events')
        .select('id,code,name,sim_url,created_at,starts_at,ends_at,started_at,ended_at')
        .order('created_at', { ascending: false });
      events = withDefaultEventColumns(fallback.data, { state: 'draft' });
      error = fallback.error;
    }

    if (error) {
      throw error;
    }

    return res.json({ events: events ?? [] });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch events' });
  }
});

app.post('/api/admin/events', async (req, res) => {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  try {
    const payload = {
      code: req.body?.code?.toString().trim().toUpperCase() || req.body?.event_code?.toString().trim().toUpperCase(),
      name: req.body?.name?.toString().trim() || req.body?.event_name?.toString().trim(),
      sim_type: req.body?.simType?.toString().trim() || 'portfolio_sim',
      scenario_id: req.body?.scenarioId?.toString().trim() || null,
      duration_minutes: Number(req.body?.durationMinutes ?? 0) || null,
      state: req.body?.state?.toString().trim() || 'draft',
      sim_url: req.body?.simUrl?.toString().trim() || null,
    };

    if (!payload.code || !payload.name) {
      return res.status(400).json({ error: 'code and name are required' });
    }

    let insertResult = await supabase
      .from('events')
      .insert(payload)
      .select('id,code,name,sim_url,sim_type,scenario_id,duration_minutes,state,created_at,starts_at,ends_at,started_at,ended_at')
      .single();

    if (insertResult.error && isMissingColumnError(insertResult.error)) {
      insertResult = await supabase
        .from('events')
        .insert({ code: payload.code, name: payload.name, sim_url: payload.sim_url })
        .select('id,code,name,sim_url,created_at,starts_at,ends_at,started_at,ended_at')
        .single();
      if (!insertResult.error && insertResult.data) {
        insertResult.data = {
          ...insertResult.data,
          sim_type: payload.sim_type,
          scenario_id: payload.scenario_id,
          duration_minutes: payload.duration_minutes,
          state: payload.state,
        };
      }
    }

    if (insertResult.error) {
      throw insertResult.error;
    }

    return res.status(201).json({ event: insertResult.data });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create event' });
  }
});




async function listPublicEvents() {
  let query = supabase
    .from('events')
    .select('id,code,name,sim_url,sim_type,scenario_id,duration_minutes,state,created_at,starts_at,ends_at,started_at,ended_at')
    .in('state', ['active', 'live', 'paused'])
    .order('created_at', { ascending: false });

  let { data: events, error } = await query;

  if (error && isMissingColumnError(error)) {
    const fallback = await supabase
      .from('events')
      .select('id,code,name,sim_url,created_at,starts_at,ends_at,started_at,ended_at')
      .order('created_at', { ascending: false });
    events = withDefaultEventColumns(fallback.data, { sim_type: 'portfolio', state: 'active' });
    error = fallback.error;
  }

  if (error) {
    throw error;
  }

  return events ?? [];
}

async function createEventFromPayload(body) {
  const payload = {
    code: body?.code?.toString().trim().toUpperCase() || body?.event_code?.toString().trim().toUpperCase(),
    name: body?.name?.toString().trim() || body?.event_name?.toString().trim(),
    sim_type: body?.sim_type?.toString().trim() || body?.simType?.toString().trim() || 'portfolio',
    scenario_id: body?.scenario_id?.toString().trim() || body?.scenarioId?.toString().trim() || null,
    duration_minutes: Number(body?.duration_minutes ?? body?.durationMinutes ?? 0) || null,
    state: body?.state?.toString().trim() || 'active',
    sim_url: body?.sim_url?.toString().trim() || body?.simUrl?.toString().trim() || null,
  };

  if (!payload.code || !payload.name) {
    const error = new Error('code and name are required');
    error.status = 400;
    throw error;
  }

  let insertResult = await supabase
    .from('events')
    .insert(payload)
    .select('id,code,name,sim_url,sim_type,scenario_id,duration_minutes,state,created_at,starts_at,ends_at,started_at,ended_at')
    .single();

  if (insertResult.error && isMissingColumnError(insertResult.error)) {
    insertResult = await supabase
      .from('events')
      .insert({ code: payload.code, name: payload.name, sim_url: payload.sim_url })
      .select('id,code,name,sim_url,created_at,starts_at,ends_at')
      .single();
    if (!insertResult.error && insertResult.data) {
      insertResult.data = {
        ...insertResult.data,
        sim_type: payload.sim_type,
        scenario_id: payload.scenario_id,
        duration_minutes: payload.duration_minutes,
        state: payload.state,
        started_at: null,
        ended_at: null,
      };
    }
  }

  if (insertResult.error) {
    throw insertResult.error;
  }

  return insertResult.data;
}

app.get('/api/events', async (_req, res) => {
  try {
    const events = await listPublicEvents();
    return res.json({ events });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch public events' });
  }
});

app.get('/api/events/public', async (_req, res) => {
  try {
    const events = await listPublicEvents();
    return res.json({ events });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to fetch public events' });
  }
});

app.post('/api/events', async (req, res) => {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  try {
    const event = await createEventFromPayload(req.body);
    return res.status(201).json({ event });
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create event' });
  }
});

app.post('/api/events/create', async (req, res) => {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  try {
    const event = await createEventFromPayload(req.body);
    return res.status(201).json({ event });
  } catch (error) {
    if (error instanceof Error && 'status' in error && error.status === 400) {
      return res.status(400).json({ error: error.message });
    }
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to create event' });
  }
});

app.post('/api/admin/events/:code/state', async (req, res) => {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  try {
    const code = req.params.code?.trim().toUpperCase();
    const nextState = req.body?.state?.toString().trim().toLowerCase();

    if (!code || !nextState) {
      return res.status(400).json({ error: 'event code and state are required' });
    }

    const nowIso = new Date().toISOString();
    const updatePayload = { state: nextState };

    if (nextState === 'live') {
      updatePayload.started_at = nowIso;
    }

    if (nextState === 'ended') {
      updatePayload.ended_at = nowIso;
    }

    const { data: event, error } = await supabase
      .from('events')
      .update(updatePayload)
      .eq('code', code)
      .select('id,code,name,sim_url,sim_type,scenario_id,duration_minutes,state,created_at,starts_at,ends_at,started_at,ended_at')
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.json({ event });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to update event state' });
  }
});

app.post('/api/admin/sim-admin-link', async (req, res) => {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  try {
    const eventCode = req.body?.eventCode?.toString().trim().toUpperCase();
    if (!eventCode) {
      return res.status(400).json({ error: 'eventCode is required' });
    }

    const { data: event, error } = await supabase
      .from('events')
      .select('code,sim_url')
      .eq('code', eventCode)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!event?.sim_url) {
      return res.status(404).json({ error: 'Event or sim_url not found' });
    }

    const adminBaseUrl = event.sim_url.endsWith('/') ? `${event.sim_url}admin.html` : `${event.sim_url}/admin.html`;
    const adminUrl = new URL(adminBaseUrl);
    adminUrl.searchParams.set('event_code', eventCode);
    adminUrl.searchParams.set('admin_token', simAdminToken);

    return res.json({ adminUrl: adminUrl.toString() });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate admin link' });
  }
});

app.get('/api/admin/events/:code/sim-admin-link', async (req, res) => {
  if (!(await requireAdmin(req, res))) {
    return;
  }

  try {
    const code = req.params.code?.trim().toUpperCase();
    if (!code) {
      return res.status(400).json({ error: 'event code is required' });
    }

    const { data: event, error } = await supabase
      .from('events')
      .select('code,sim_url')
      .eq('code', code)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (!event?.sim_url) {
      return res.status(404).json({ error: 'Event or sim_url not found' });
    }

    const adminBaseUrl = event.sim_url.endsWith('/') ? `${event.sim_url}admin.html` : `${event.sim_url}/admin.html`;
    const adminUrl = new URL(adminBaseUrl);
    adminUrl.searchParams.set('event_code', code);
    adminUrl.searchParams.set('admin_token', simAdminToken);

    return res.json({ adminUrl: adminUrl.toString() });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to generate admin link' });
  }
});

app.post('/api/runs/create', async (req, res) => {
  try {
    const eventCode = req.body?.eventCode?.toString().trim().toUpperCase();
    const userId = getUserId(req);

    if (!eventCode) {
      return res.status(400).json({ error: 'eventCode is required' });
    }

    if (!userId) {
      return res.status(400).json({ error: 'userId is required for MVP run creation' });
    }

    let { data: event, error: eventError } = await supabase
      .from('events')
      .select('id,code,sim_url,scenario_id')
      .eq('code', eventCode)
      .maybeSingle();

    if (eventError && isMissingColumnError(eventError)) {
      const fallback = await supabase
        .from('events')
        .select('id,code,sim_url')
        .eq('code', eventCode)
        .maybeSingle();
      event = fallback.data ? { ...fallback.data, scenario_id: null } : fallback.data;
      eventError = fallback.error;
    }

    if (eventError) {
      throw eventError;
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found for provided code' });
    }

    const { data: run, error: runError } = await supabase
      .from('runs')
      .insert({ event_id: event.id, user_id: userId })
      .select('id')
      .single();

    if (runError) {
      throw runError;
    }

    const simUrl = new URL(event.sim_url);
    simUrl.searchParams.set('run_id', run.id);
    simUrl.searchParams.set('event_id', event.id);
    simUrl.searchParams.set('event_code', event.code);
    if (event.scenario_id) {
      simUrl.searchParams.set('scenario_id', event.scenario_id);
    }

    return res.status(200).json({ runId: run.id, simUrl: simUrl.toString() });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected error creating run' });
  }
});

app.post('/api/runs/submit', async (req, res) => {
  try {
    const runId = req.body?.runId?.toString().trim();

    if (!runId) {
      return res.status(400).json({ error: 'runId is required' });
    }

    const metrics = {
      score: req.body?.score ?? null,
      pnl: req.body?.pnl ?? null,
      sharpe: req.body?.sharpe ?? null,
      max_drawdown: req.body?.max_drawdown ?? null,
      win_rate: req.body?.win_rate ?? null,
      extra: req.body?.extra ?? null,
    };

    if (typeof metrics.score !== 'number') {
      return res.status(400).json({ error: 'score must be provided as a number' });
    }

    const { data: run, error: runError } = await supabase
      .from('runs')
      .select('id')
      .eq('id', runId)
      .maybeSingle();

    if (runError) {
      throw runError;
    }

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    const { data: existingResult, error: existingResultError } = await supabase
      .from('run_results')
      .select('run_id')
      .eq('run_id', runId)
      .maybeSingle();

    if (existingResultError && existingResultError.code !== 'PGRST116') {
      throw existingResultError;
    }

    if (existingResult) {
      return res.status(409).json({ error: 'Results already submitted for this run' });
    }

    const { error: insertError } = await supabase.from('run_results').insert({ run_id: runId, ...metrics });
    if (insertError) {
      throw insertError;
    }

    const { error: updateError } = await supabase
      .from('runs')
      .update({ finished_at: new Date().toISOString() })
      .eq('id', runId);

    if (updateError) {
      throw updateError;
    }

    return res.json({ ok: true });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected error submitting results' });
  }
});

app.get('/api/runs/:runId', async (req, res) => {
  try {
    const runId = req.params.runId?.trim();

    if (!runId) {
      return res.status(400).json({ error: 'runId is required' });
    }

    const { data: run, error: runError } = await supabase
      .from('runs')
      .select('id,created_at,finished_at,event_id,user_id,events(id,code,name,sim_url,starts_at,ends_at),run_results(score,pnl,sharpe,max_drawdown,win_rate,extra)')
      .eq('id', runId)
      .maybeSingle();

    if (runError) {
      throw runError;
    }

    if (!run) {
      return res.status(404).json({ error: 'Run not found' });
    }

    return res.json({ run });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected run detail error' });
  }
});

app.get('/api/events/:code/leaderboard', async (req, res) => {
  try {
    const code = req.params.code.trim().toUpperCase();
    const limit = Math.max(1, Math.min(100, Number(req.query.limit ?? 20)));

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id,code,name')
      .eq('code', code)
      .maybeSingle();

    if (eventError) {
      throw eventError;
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    const { data: rows, error: rowsError } = await supabase
      .from('runs')
      .select('id,created_at,user_id,run_results(score,pnl,sharpe,max_drawdown,win_rate)')
      .eq('event_id', event.id)
      .not('finished_at', 'is', null);

    if (rowsError) {
      throw rowsError;
    }

    const ranked = (rows ?? [])
      .map((row) => {
        const metrics = row.run_results?.[0] ?? {};
        const displayName = formatTrader(row.user_id);

        return {
          runId: row.id,
          userId: row.user_id ?? null,
          createdAt: row.created_at,
          trader: displayName,
          score: metrics.score ?? null,
          pnl: metrics.pnl ?? null,
          sharpe: metrics.sharpe ?? null,
          max_drawdown: metrics.max_drawdown ?? null,
          win_rate: metrics.win_rate ?? null,
        };
      })
      .sort((a, b) => {
        const aScore = a.score ?? Number.NEGATIVE_INFINITY;
        const bScore = b.score ?? Number.NEGATIVE_INFINITY;
        if (aScore === bScore) {
          return (b.pnl ?? Number.NEGATIVE_INFINITY) - (a.pnl ?? Number.NEGATIVE_INFINITY);
        }

        return bScore - aScore;
      })
      .slice(0, limit)
      .map((row, index) => ({ rank: index + 1, ...row }));

    return res.json({ event: { code: event.code, name: event.name }, rows: ranked });
  } catch (error) {
    return res.status(500).json({ error: error instanceof Error ? error.message : 'Unexpected leaderboard error' });
  }
});

app.listen(port, () => {
  console.log(`Render service listening on port ${port}`);
});
