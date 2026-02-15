import 'dotenv/config';
import cors from 'cors';
import express from 'express';
import { createClient } from '@supabase/supabase-js';

const app = express();
const port = Number(process.env.PORT ?? 4000);

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

function maskEmail(email) {
  if (!email) {
    return 'anonymous';
  }

  const [prefix] = email.split('@');
  if (!prefix) {
    return 'anonymous';
  }

  return `${prefix.slice(0, 2)}***`;
}

app.get('/health', (_req, res) => {
  res.json({ ok: true });
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

    const { data: event, error: eventError } = await supabase
      .from('events')
      .select('id,sim_url')
      .eq('code', eventCode)
      .maybeSingle();

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

    const joiner = event.sim_url.includes('?') ? '&' : '?';
    const simUrl = `${event.sim_url}${joiner}run_id=${encodeURIComponent(run.id)}`;

    return res.status(200).json({ runId: run.id, simUrl });
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
      .select('id,created_at,run_results(score,pnl,sharpe,max_drawdown,win_rate),users(display_name,email)')
      .eq('event_id', event.id)
      .not('finished_at', 'is', null);

    if (rowsError) {
      throw rowsError;
    }

    const ranked = (rows ?? [])
      .map((row) => {
        const metrics = row.run_results?.[0] ?? {};
        const displayName = row.users?.display_name || maskEmail(row.users?.email);

        return {
          runId: row.id,
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
